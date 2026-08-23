// ============================================================================
// permisos.ts - Servicio de Gestión de Permisos y Delegación Quirúrgica
// Maneja la tabla agente_herramientas para otorgar herramientas al rol SOPORTE y JEFE_OPERACIONES
// Con fallback resiliente para Sandbox / Modo Offline
// ============================================================================

import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { registrarLog } from './logger';

const supabase = createClient();

export interface HerramientaDefinicion {
  key: string;
  nombre: string;
  descripcion: string;
  categoria: 'WORKSPACE' | 'CRM' | 'FINANZAS' | 'LOGISTICA' | 'OPERACIONES' | 'SISTEMA';
  ruta: string;
  icono: string;
}

// Catálogo maestro de herramientas delegables
export const CATALOGO_HERRAMIENTAS: HerramientaDefinicion[] = [
  // WORKSPACE
  { key: 'ws_recepcion', nombre: 'Workspace Recepción', descripcion: 'Atención en recepción y buzón de autorizaciones', categoria: 'WORKSPACE', ruta: '/recepcion', icono: 'Inbox' },
  { key: 'ws_caja', nombre: 'Workspace Venta', descripcion: 'Punto de venta omnicanal, cobro y facturación SUNAT', categoria: 'WORKSPACE', ruta: '/caja', icono: 'CreditCard' },
  { key: 'ws_despacho', nombre: 'Workspace Taller', descripcion: 'Despacho de insumos, fórmulas dinámicas y pesaje IoT', categoria: 'WORKSPACE', ruta: '/lab/despacho', icono: 'Beaker' },
  { key: 'kiosk_dual', nombre: 'Kiosko Táctil Dual', descripcion: 'Autoservicio para Clientes y marcación rápida para Staff', categoria: 'WORKSPACE', ruta: '/kiosk', icono: 'Sparkles' },

  // OPERACIONES & SUPERVISIÓN DE PISO
  { key: 'jefe_piso_panel', nombre: 'Panel Jefe Operativo', descripcion: 'Supervisión de piso, SLA de demoras y reasignaciones', categoria: 'OPERACIONES', ruta: '/operaciones/jefe', icono: 'Shield' },
  { key: 'wfm_turnos', nombre: 'Control de Turnos y Peticiones', descripcion: 'Monitoreo de agentes y descansos WFM', categoria: 'OPERACIONES', ruta: '/wfm/turnos', icono: 'Activity' },
  { key: 'wfm_comisiones', nombre: 'Comisiones en Tiempo Real', descripcion: 'Cálculo de comisiones por agente', categoria: 'OPERACIONES', ruta: '/wfm/comisiones', icono: 'Award' },

  // CRM & FRONT
  { key: 'crm_agenda', nombre: 'Agenda y Citas', descripcion: 'Visualización y reserva de citas', categoria: 'CRM', ruta: '/recepcion/agenda', icono: 'Calendar' },
  { key: 'crm_clientes', nombre: 'Directorio CRM & Clientes', descripcion: 'Búsqueda, insignias ganadas y segmentación de cartera', categoria: 'CRM', ruta: '/recepcion/crm', icono: 'Users' },
  { key: 'crm_oatc_historial', nombre: 'Historial de OATCs', descripcion: 'Consulta de órdenes pasadas', categoria: 'CRM', ruta: '/recepcion/historial', icono: 'FileText' },

  // FINANZAS
  { key: 'finanzas_tesoreria', nombre: 'Finanzas, Tesorería & Bancos', descripcion: 'Control de cuentas bancarias, caja chica, egresos y transferencias', categoria: 'FINANZAS', ruta: '/finanzas', icono: 'Landmark' },
  { key: 'finanzas_liquidaciones_staff', nombre: 'Liquidaciones Staff (Caja / Piso)', descripcion: 'Gestión y pago de liquidaciones de estilistas, comisiones y vouchers', categoria: 'FINANZAS', ruta: '/finanzas/liquidaciones-staff', icono: 'Scissors' },
  { key: 'finanzas_liquidaciones_soporte', nombre: 'Liquidaciones Soporte (Admin)', descripcion: 'Gestión de sueldos base, quincenas y pagos de personal administrativo', categoria: 'FINANZAS', ruta: '/finanzas/liquidaciones-soporte', icono: 'ShieldCheck' },
  { key: 'caja_arqueo', nombre: 'Arqueo Ciego de Caja', descripcion: 'Conteo físico de billetes y vouchers', categoria: 'FINANZAS', ruta: '/caja/arqueo', icono: 'Calculator' },
  { key: 'caja_reportes', nombre: 'Reportes de Facturación', descripcion: 'Resumen financiero por sede', categoria: 'FINANZAS', ruta: '/caja/reportes', icono: 'BarChart3' },

  // LOGÍSTICA
  { key: 'lab_almacen', nombre: 'Almacén Principal (WMS)', descripcion: 'Control de stock central por sede', categoria: 'LOGISTICA', ruta: '/lab/almacen', icono: 'PackageSearch' },
  { key: 'lab_kardex', nombre: 'Kardex de Movimientos', descripcion: 'Trazabilidad de entradas y salidas', categoria: 'LOGISTICA', ruta: '/lab/kardex', icono: 'Layers' },

  // SISTEMA
  { key: 'admin_config', nombre: 'Configuración de Sede', descripcion: 'Feature toggles y datos fiscales SUNAT', categoria: 'SISTEMA', ruta: '/admin/config', icono: 'Sliders' },
  { key: 'admin_reglas_clientes', nombre: 'Reglas de Clientes & Insignias', descripcion: 'Gestión de umbrales y categorías VIP/Retail', categoria: 'SISTEMA', ruta: '/admin/reglas-clientes', icono: 'Award' }
];

export interface PermisoAgente {
  id: string;
  agente_id: string;
  herramienta_key: string;
  habilitado_por: string | null;
  created_at: string;
}

/**
 * Obtiene las claves de herramientas asignadas a un agente de forma resiliente
 */
export async function obtenerHerramientasAgente(agenteId: string): Promise<string[]> {
  if (!agenteId) return [];

  try {
    const { data, error } = await supabase
      .from('agente_herramientas')
      .select('herramienta_key')
      .eq('agente_id', agenteId);

    if (error) {
      // Si la tabla no existe aún en Supabase, usamos fallback de almacenamiento local
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`vaikuntha_permisos_${agenteId}`);
        if (local) {
          try { return JSON.parse(local); } catch {}
        }
      }
      return [];
    }

    const keys = (data || []).map((p: { herramienta_key: string }) => p.herramienta_key);
    
    // Guardar en caché local
    if (typeof window !== 'undefined' && keys.length > 0) {
      localStorage.setItem(`vaikuntha_permisos_${agenteId}`, JSON.stringify(keys));
    }

    return keys;
  } catch (e) {
    return [];
  }
}

/**
 * Concede una herramienta específica a un agente
 */
export async function concederHerramienta(agenteId: string, herramientaKey: string): Promise<boolean> {
  const adminEmail = useAppStore.getState().userEmail;
  
  let adminId: string | null = null;
  if (adminEmail) {
    try {
      const { data: adminAgente } = await supabase
        .from('agentes')
        .select('id')
        .ilike('email', adminEmail.trim())
        .maybeSingle();
      adminId = adminAgente?.id || null;
    } catch {}
  }

  try {
    const { error } = await supabase
      .from('agente_herramientas')
      .insert([
        {
          agente_id: agenteId,
          herramienta_key: herramientaKey,
          habilitado_por: adminId
        }
      ]);

    // Fallback local para Sandbox / Offline
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(`vaikuntha_permisos_${agenteId}`);
      const list: string[] = local ? JSON.parse(local) : [];
      if (!list.includes(herramientaKey)) {
        list.push(herramientaKey);
        localStorage.setItem(`vaikuntha_permisos_${agenteId}`, JSON.stringify(list));
      }
    }

    if (error) {
      console.warn('[Permisos - Fallback Local] Guardado en caché local para el agente.');
    }

    await registrarLog('SISTEMA', `Concedió herramienta ${herramientaKey}`, { agente_id: agenteId });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Revoca una herramienta específica a un agente
 */
export async function revocarHerramienta(agenteId: string, herramientaKey: string): Promise<boolean> {
  try {
    await supabase
      .from('agente_herramientas')
      .delete()
      .eq('agente_id', agenteId)
      .eq('herramienta_key', herramientaKey);

    // Actualizar caché local
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(`vaikuntha_permisos_${agenteId}`);
      if (local) {
        const list: string[] = JSON.parse(local);
        const filtered = list.filter(k => k !== herramientaKey);
        localStorage.setItem(`vaikuntha_permisos_${agenteId}`, JSON.stringify(filtered));
      }
    }

    await registrarLog('SISTEMA', `Revocó herramienta ${herramientaKey}`, { agente_id: agenteId });
    return true;
  } catch (e) {
    return false;
  }
}
