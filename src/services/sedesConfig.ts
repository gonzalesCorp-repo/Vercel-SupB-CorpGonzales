// ============================================================================
// sedesConfig.ts - Servicio de Permisos Quirúrgicos por Sede (Feature Toggles)
// Resuelve DEUDA-ADMIN-002: Flexibilidad multi-industria sin hardcoding
// ============================================================================

import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';

const supabase = createClient();

export interface SedeFeatureToggles {
  moduloLaboratorioGramos: boolean;
  habilitarBalanzasIot?: boolean;
  usarComisionesEscalonadas: boolean;
  modoEstaciones: 'AUTOMATICO_IOT' | 'SEMI_AUTOMATICO_BUZON' | 'MANUAL';
  kioskoAutoservicioHabilitado: boolean;
  kioskTheme?: 'lumina' | 'eva-01' | 'cyberpunk' | 'luxury';
  pluginLuminaHqActivo?: boolean;
  // Automatizaciones & Cronjobs Fuera de Horario
  cronAutoAprobacionNfc?: boolean;
  cronAutoCierreOatcFueraHorario?: boolean;
  autoResetDiarioNocturno?: boolean;
  autoImpresionTermicaTickets?: boolean;
  balanzaIotLecturaExacta?: boolean;
  sunatRuc?: string;
  sunatRazonSocial?: string;
  sunatSerieBoleta?: string;
  sunatSerieFactura?: string;
  sunatApiToken?: string;
}

const DEFAULT_TOGGLES: SedeFeatureToggles = {
  moduloLaboratorioGramos: true,
  habilitarBalanzasIot: true,
  usarComisionesEscalonadas: true,
  modoEstaciones: 'SEMI_AUTOMATICO_BUZON',
  kioskoAutoservicioHabilitado: true,
  kioskTheme: 'lumina',
  pluginLuminaHqActivo: false,
  cronAutoAprobacionNfc: true,
  cronAutoCierreOatcFueraHorario: true,
  autoResetDiarioNocturno: true,
  autoImpresionTermicaTickets: true,
  balanzaIotLecturaExacta: true,
  sunatSerieBoleta: 'B001',
  sunatSerieFactura: 'F001'
};

export async function obtenerConfiguracionSede(sedeId?: string): Promise<SedeFeatureToggles> {
  const activeSedeId = sedeId || useAppStore.getState().sedeActiva?.id;

  try {
    if (activeSedeId) {
      const { data, error } = await supabase
        .from('sedes')
        .select('id, nombre, atributos')
        .eq('id', activeSedeId)
        .maybeSingle();

      if (!error && data) {
        if (data.atributos?.toggles) {
          return { ...DEFAULT_TOGGLES, ...data.atributos.toggles };
        }
        return DEFAULT_TOGGLES;
      }
    }

    // Auto-sanación: Si no hay sedeId o el sedeId almacenado ya no existe en la BD
    const { data: defaultSede } = await supabase
      .from('sedes')
      .select('id, nombre, atributos')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (defaultSede) {
      useAppStore.getState().setSedeActiva({
        id: defaultSede.id,
        nombre: defaultSede.nombre
      });

      if (defaultSede.atributos?.toggles) {
        return { ...DEFAULT_TOGGLES, ...defaultSede.atributos.toggles };
      }
    }

    return DEFAULT_TOGGLES;
  } catch (err) {
    console.warn('[sedesConfig] Error obteniendo configuracion de sede:', err);
    return DEFAULT_TOGGLES;
  }
}

export async function guardarConfiguracionSede(toggles: SedeFeatureToggles, sedeId?: string): Promise<boolean> {
  const activeSedeId = sedeId || useAppStore.getState().sedeActiva?.id;
  if (!activeSedeId) return false;

  try {
    const { data: currentSede } = await supabase
      .from('sedes')
      .select('atributos')
      .eq('id', activeSedeId)
      .maybeSingle();

    const atributosActuales = currentSede?.atributos || {};
    const nuevosAtributos = {
      ...atributosActuales,
      toggles
    };

    const { error } = await supabase
      .from('sedes')
      .update({ atributos: nuevosAtributos })
      .eq('id', activeSedeId);

    if (error) {
      console.error('[sedesConfig] Error guardando configuracion:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[sedesConfig] Error en guardarConfiguracionSede:', err);
    return false;
  }
}
