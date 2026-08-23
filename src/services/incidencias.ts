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

// Inicia vacío (0 alertas mock de prueba)
let incidenciasCache: Incidencia[] = [];
const listeners = new Set<(incidencias: Incidencia[]) => void>();

function notifyListeners() {
  listeners.forEach(cb => cb(incidenciasCache));
}

function mapearDesdeSupabase(row: any): Incidencia {
  return {
    id: row.id,
    tipo: row.tipo,
    titulo: row.titulo,
    descripcion: row.descripcion || '',
    fecha: row.fecha || row.created_at || new Date().toISOString(),
    origenAgenteNombre: row.origen_agente_nombre || 'Sistema',
    origenAgenteRol: row.origen_agente_rol || 'STAFF',
    sedeId: row.sede_id || '',
    sedeNombre: row.sede_nombre || '',
    leido: Boolean(row.leido),
    accionSugerida: row.accion_sugerida,
    metadatos: row.metadatos || {}
  };
}

export async function obtenerIncidenciasActivas(sedeId?: string): Promise<Incidencia[]> {
  const supabase = createClient();
  try {
    let query = supabase
      .from('incidencias_operativas')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(30);

    if (sedeId) {
      query = query.eq('sede_id', sedeId);
    }

    const { data, error } = await query;
    if (!error && data) {
      incidenciasCache = data.map(mapearDesdeSupabase);
      notifyListeners();
      return incidenciasCache;
    }
  } catch (e) {
    console.warn('Tabla incidencias_operativas en espera de migración:', e);
  }
  return incidenciasCache;
}

export async function emitirIncidencia(incidencia: Omit<Incidencia, 'id' | 'fecha' | 'leido'>): Promise<Incidencia> {
  const supabase = createClient();
  const nueva: Incidencia = {
    ...incidencia,
    id: `inc_${Date.now()}`,
    fecha: new Date().toISOString(),
    leido: false
  };

  // Optimistic update
  incidenciasCache = [nueva, ...incidenciasCache];
  notifyListeners();

  try {
    const { data, error } = await supabase
      .from('incidencias_operativas')
      .insert([{
        tipo: incidencia.tipo,
        titulo: incidencia.titulo,
        descripcion: incidencia.descripcion,
        fecha: nueva.fecha,
        origen_agente_nombre: incidencia.origenAgenteNombre,
        origen_agente_rol: incidencia.origenAgenteRol,
        sede_id: incidencia.sedeId,
        sede_nombre: incidencia.sedeNombre,
        leido: false,
        accion_sugerida: incidencia.accionSugerida,
        metadatos: incidencia.metadatos || {}
      }])
      .select()
      .single();

    if (!error && data) {
      const real = mapearDesdeSupabase(data);
      incidenciasCache = incidenciasCache.map(i => i.id === nueva.id ? real : i);
      notifyListeners();
      return real;
    }
  } catch (e) {
    console.warn('Error guardando incidencia en DB:', e);
  }

  return nueva;
}

export async function marcarIncidenciaLeida(id: string): Promise<void> {
  incidenciasCache = incidenciasCache.map(i => i.id === id ? { ...i, leido: true } : i);
  notifyListeners();

  const supabase = createClient();
  try {
    await supabase
      .from('incidencias_operativas')
      .update({ leido: true })
      .eq('id', id);
  } catch (e) {
    console.warn('Error actualizando incidencia leída en DB:', e);
  }
}

export function suscribirIncidencias(cb: (incidencias: Incidencia[]) => void, sedeId?: string): () => void {
  listeners.add(cb);
  cb(incidenciasCache);

  // Inicializar lectura en vivo desde Supabase
  obtenerIncidenciasActivas(sedeId).catch(() => {});

  const supabase = createClient();
  const channel = supabase.channel('realtime-incidencias-operativas')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'incidencias_operativas' }, () => {
      obtenerIncidenciasActivas(sedeId).catch(() => {});
    })
    .subscribe();

  return () => {
    listeners.delete(cb);
    supabase.removeChannel(channel);
  };
}
