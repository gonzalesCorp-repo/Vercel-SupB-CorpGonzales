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

export interface PermisosCacheEstructura {
  keys: string[];
  timestamp: number;
}

export const PERMISOS_CACHE_TTL_MS = 300_000; // 5 minutos (300,000 ms)

/**
 * Lee y valida la caché de permisos en localStorage usando TTL de 5 minutos (SEC-008).
 * Si ha expirado o está corrupta, purga la entrada y retorna null para refrescar desde Supabase.
 */
export function leerPermisosCacheLocal(agenteId: string): string[] | null {
  if (typeof window === 'undefined') return null;
  const storageKey = `vaikuntha_permisos_${agenteId}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    // Estructura válida con TTL: { keys: string[], timestamp: number }
    if (
      parsed &&
      typeof parsed === 'object' &&
      'keys' in parsed &&
      'timestamp' in parsed
    ) {
      const data = parsed as PermisosCacheEstructura;
      const ahora = Date.now();
      const tiempoTranscurrido = ahora - data.timestamp;

      if (tiempoTranscurrido > PERMISOS_CACHE_TTL_MS) {
        console.warn(
          `[Permisos] TTL de caché expirado para el agente ${agenteId} (${tiempoTranscurrido}ms > ${PERMISOS_CACHE_TTL_MS}ms). Purgando y retornando null para refrescar desde Supabase.`
        );
        localStorage.removeItem(storageKey);
        return null;
      }

      if (Array.isArray(data.keys)) {
        return data.keys;
      }
    }

    // Compatibilidad: Si detectamos formato legacy (array directo), lo purgamos y devolvemos null para migrar
    if (Array.isArray(parsed)) {
      console.warn(`[Permisos] Formato legacy de permisos detectado para ${agenteId}. Purgando para renovar con TTL.`);
      localStorage.removeItem(storageKey);
      return null;
    }

    localStorage.removeItem(storageKey);
    return null;
  } catch (err: unknown) {
    console.warn(`[Permisos] Error al leer o deserializar la caché local para el agente ${agenteId}:`, err);
    try {
      localStorage.removeItem(storageKey);
    } catch (e: unknown) {
      console.warn('[Permisos] Error al purgar clave dañada de localStorage:', e);
    }
    return null;
  }
}

/**
 * Guarda los permisos en localStorage con estructura { keys: string[], timestamp: number } (SEC-008).
 */
export function guardarPermisosCacheLocal(agenteId: string, keys: string[]): void {
  if (typeof window === 'undefined') return;
  const storageKey = `vaikuntha_permisos_${agenteId}`;
  try {
    const payload: PermisosCacheEstructura = {
      keys,
      timestamp: Date.now()
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (err: unknown) {
    console.warn(`[Permisos] Error al persistir permisos en localStorage para el agente ${agenteId}:`, err);
  }
}

/**
 * Obtiene las claves de herramientas asignadas a un agente de forma resiliente
 */
export async function obtenerHerramientasAgente(agenteId: string): Promise<string[]> {
  if (!agenteId) return [];

  // 1. Intentar obtener desde caché local validando el TTL de 5 minutos
  const cached = leerPermisosCacheLocal(agenteId);
  if (cached !== null) {
    return cached;
  }

  // 2. Si no hay caché o expiró (retornó null), refrescar desde Supabase
  try {
    const { data, error } = await supabase
      .from('agente_herramientas')
      .select('herramienta_key')
      .eq('agente_id', agenteId);

    if (error) {
      // Si la tabla no existe aún en Supabase o falla la red
      console.warn('[Permisos] Error consultando agente_herramientas en Supabase:', error);
      return [];
    }

    const keys = (data || []).map((p: { herramienta_key: string }) => p.herramienta_key);
    
    // Guardar en caché local con estructura { keys, timestamp }
    if (keys.length > 0) {
      guardarPermisosCacheLocal(agenteId, keys);
    }

    return keys;
  } catch (err: unknown) {
    console.warn('[Permisos] Excepción capturada en obtenerHerramientasAgente:', err);
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
    } catch (err: unknown) {
      console.warn('[Permisos] Error al resolver ID del agente administrador por email:', err);
    }
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
      const cached = leerPermisosCacheLocal(agenteId) || [];
      if (!cached.includes(herramientaKey)) {
        const list = [...cached, herramientaKey];
        guardarPermisosCacheLocal(agenteId, list);
      }
    }

    if (error) {
      console.warn('[Permisos - Fallback Local] Guardado en caché local para el agente:', error);
    }

    await registrarLog('SISTEMA', `Concedió herramienta ${herramientaKey}`, { agente_id: agenteId });
    return true;
  } catch (err: unknown) {
    console.warn('[Permisos] Error capturado al conceder herramienta:', err);
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
      const cached = leerPermisosCacheLocal(agenteId);
      if (cached) {
        const filtered = cached.filter(k => k !== herramientaKey);
        guardarPermisosCacheLocal(agenteId, filtered);
      }
    }

    await registrarLog('SISTEMA', `Revocó herramienta ${herramientaKey}`, { agente_id: agenteId });
    return true;
  } catch (err: unknown) {
    console.warn('[Permisos] Error capturado al revocar herramienta:', err);
    return false;
  }
}
