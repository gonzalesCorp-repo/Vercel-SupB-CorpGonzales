import { createClient } from '@/lib/supabase/client';

export type TipoIncidencia = 'COBERTURA_AGENDA' | 'VARIACION_INSUMO_LAB' | 'URGENCIA_PISO';

export interface Incidencia {
  id: string;
  tipo: TipoIncidencia;
  titulo: string;
  descripcion: string;
  fecha: string;
  origenAgenteNombre: string;
  origenAgenteRol?: string;
  sedeId: string;
  sedeNombre?: string;
  leido: boolean;
  accionSugerida?: string;
  metadatos?: Record<string, any>;
}

// In-memory bus con persistencia local
const INCIDENCIAS_INICIALES: Incidencia[] = [
  {
    id: 'inc_1',
    tipo: 'COBERTURA_AGENDA',
    titulo: 'Bloqueo por Capacitación Técnica',
    descripcion: 'Demócrito Staff ha bloqueado su disponibilidad hoy de 04:00 PM a 06:00 PM.',
    fecha: new Date().toISOString(),
    origenAgenteNombre: 'Demócrito Staff',
    origenAgenteRol: 'STAFF',
    sedeId: 'sede_sandbox_01',
    sedeNombre: 'Unidad de Prueba (Sandbox)',
    leido: false,
    accionSugerida: 'Rebalancear Estaciones / Convocar Refuerzo Freelance',
    metadatos: { motivo: 'Capacitación L’Oréal Balayage', duracionHoras: 2 }
  },
  {
    id: 'inc_2',
    tipo: 'VARIACION_INSUMO_LAB',
    titulo: 'Discrepancia en Despacho de Decolorante',
    descripcion: 'Solicitado: 45g | Despachado en Balanza: 30g (Stock bajo en laboratorio).',
    fecha: new Date(Date.now() - 3600000).toISOString(),
    origenAgenteNombre: 'Demócrito Staff',
    origenAgenteRol: 'STAFF',
    sedeId: 'sede_sandbox_01',
    sedeNombre: 'Unidad de Prueba (Sandbox)',
    leido: false,
    accionSugerida: 'Registrar Orden de Compra / Auditoría de Calidad',
    metadatos: { insumo: 'Decolorante Blond Studio 9', solicitadoGramos: 45, despachadoGramos: 30 }
  }
];

let incidenciasCache = [...INCIDENCIAS_INICIALES];
const listeners = new Set<(incidencias: Incidencia[]) => void>();

export function obtenerIncidenciasActivas(): Incidencia[] {
  return incidenciasCache;
}

export function emitirIncidencia(incidencia: Omit<Incidencia, 'id' | 'fecha' | 'leido'>): Incidencia {
  const nueva: Incidencia = {
    ...incidencia,
    id: `inc_${Date.now()}`,
    fecha: new Date().toISOString(),
    leido: false
  };

  incidenciasCache = [nueva, ...incidenciasCache];
  listeners.forEach(cb => cb(incidenciasCache));
  return nueva;
}

export function marcarIncidenciaLeida(id: string): void {
  incidenciasCache = incidenciasCache.map(i => i.id === id ? { ...i, leido: true } : i);
  listeners.forEach(cb => cb(incidenciasCache));
}

export function suscribirIncidencias(cb: (incidencias: Incidencia[]) => void): () => void {
  listeners.add(cb);
  cb(incidenciasCache);
  return () => {
    listeners.delete(cb);
  };
}
