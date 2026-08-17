import { createClient } from '@/lib/supabase/client';
import { registrarLog } from './logger';
import { differenceInMinutes } from 'date-fns';

export type TipoEstacionPiso = 'SILLON' | 'LAVADERO' | 'MANICURA' | 'CABINA' | 'SALA_ESPERA' | 'PARED' | 'OTRO';
export type ZonaPiso = 'ESTILISMO' | 'HEAD_SPA' | 'MANICURA' | 'COSMIATRIA' | 'LOUNGE' | 'ESTRUCTURA';
export type EstadoOcupacionEstacion = 'LIBRE' | 'ASESORIA' | 'SERVICIO' | 'ESPERA' | 'MANTENIMIENTO' | 'OCUPADO';

export interface EstacionPiso {
  id: string;
  sede_id?: string | null;
  nombre: string;
  tipo_estacion: TipoEstacionPiso;
  zona: ZonaPiso;
  posicion_x: number;
  posicion_y: number;
  estado_ocupacion: EstadoOcupacionEstacion;
  piso?: number;
  nivel_nombre?: string;
  oatc_id_actual?: string | null;
  agente_id_actual?: string | null;
  agente_nombre_actual?: string | null;
  cliente_nombre_actual?: string | null;
  tag_nfc_id?: string | null;
  fase_proceso?: string | null;
  es_foh?: boolean;
  created_at?: string;
}

export interface NivelPisoInfo {
  piso: number;
  nombre: string;
  totalEstaciones: number;
}

export async function obtenerEstacionesPiso(sedeId?: string, piso?: number): Promise<EstacionPiso[]> {
  const supabase = createClient();
  let query = supabase
    .from('estaciones_piso')
    .select('*')
    .order('piso', { ascending: true })
    .order('posicion_y', { ascending: true })
    .order('posicion_x', { ascending: true });

  if (sedeId) {
    query = query.or(`sede_id.eq.${sedeId},sede_id.is.null`);
  }

  if (piso !== undefined) {
    query = query.eq('piso', piso);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error('Error obteniendo estaciones_piso:', error);
    return [];
  }
  return data as EstacionPiso[];
}

export async function obtenerNivelesPisos(sedeId?: string): Promise<NivelPisoInfo[]> {
  const todas = await obtenerEstacionesPiso(sedeId);
  const mapa = new Map<number, { nombre: string; count: number }>();

  // Si no hay estaciones, garantizar al menos Piso 1
  if (todas.length === 0) {
    return [{ piso: 1, nombre: 'Piso 1: Salón Principal', totalEstaciones: 0 }];
  }

  todas.forEach(est => {
    const p = est.piso || 1;
    const n = est.nivel_nombre || `Piso ${p}`;
    const actual = mapa.get(p) || { nombre: n, count: 0 };
    actual.count += 1;
    if (est.nivel_nombre) actual.nombre = est.nivel_nombre;
    mapa.set(p, actual);
  });

  const niveles: NivelPisoInfo[] = [];
  mapa.forEach((val, p) => {
    niveles.push({ piso: p, nombre: val.nombre, totalEstaciones: val.count });
  });

  niveles.sort((a, b) => a.piso - b.piso);
  return niveles;
}

export async function guardarLayoutEstacionesCompleto(params: {
  items: EstacionPiso[];
  eliminadosIds?: string[];
  sedeId?: string | null;
  pisoActivo: number;
  nivelNombreActivo: string;
}): Promise<boolean> {
  const { items, eliminadosIds = [], sedeId, pisoActivo, nivelNombreActivo } = params;
  const supabase = createClient();

  try {
    // 1. Eliminar estaciones removidas en el editor
    if (eliminadosIds.length > 0) {
      // Filtrar sólo UUIDs reales (evitar temps)
      const uuidsAEliminar = eliminadosIds.filter(id => !id.startsWith('temp-') && !id.startsWith('new-'));
      if (uuidsAEliminar.length > 0) {
        const { error: errDelete } = await supabase
          .from('estaciones_piso')
          .delete()
          .in('id', uuidsAEliminar);

        if (errDelete) {
          console.error('Error eliminando estaciones de layout:', errDelete);
        }
      }
    }

    // 2. Preparar payload de upsert
    const payload = items.map(item => {
      const isNew = item.id.startsWith('temp-') || item.id.startsWith('new-');
      const row: any = {
        nombre: item.nombre,
        tipo_estacion: item.tipo_estacion,
        zona: item.zona || 'ESTILISMO',
        posicion_x: item.posicion_x,
        posicion_y: item.posicion_y,
        estado_ocupacion: item.estado_ocupacion || 'LIBRE',
        piso: pisoActivo || item.piso || 1,
        nivel_nombre: nivelNombreActivo || item.nivel_nombre || `Piso ${pisoActivo || 1}`,
        sede_id: sedeId || item.sede_id || null
      };

      if (!isNew) {
        row.id = item.id;
      }

      return row;
    });

    if (payload.length > 0) {
      const { error: errUpsert } = await supabase
        .from('estaciones_piso')
        .upsert(payload, { onConflict: 'id' });

      if (errUpsert) {
        console.error('Error en upsert de estaciones_piso:', errUpsert);
        return false;
      }
    }

    await registrarLog('WFM_LAYOUT_GUARDADO', `Layout de ${nivelNombreActivo} (Piso ${pisoActivo}) guardado con ${items.length} módulos.`);
    return true;
  } catch (err) {
    console.error('Error guardando layout de estaciones:', err);
    return false;
  }
}

export async function asignarOatcAEstacion(params: {
  estacionId: string;
  oatcId: string;
  clienteNombre: string;
  agenteId?: string;
  agenteNombre?: string;
  estadoOcupacion?: EstadoOcupacionEstacion;
}): Promise<boolean> {
  const supabase = createClient();
  const { estacionId, oatcId, clienteNombre, agenteId, agenteNombre, estadoOcupacion } = params;

  const { error } = await supabase
    .from('estaciones_piso')
    .update({
      estado_ocupacion: estadoOcupacion || 'SERVICIO',
      oatc_id_actual: oatcId,
      agente_id_actual: agenteId || null,
      agente_nombre_actual: agenteNombre || null,
      cliente_nombre_actual: clienteNombre
    })
    .eq('id', estacionId);

  if (error) {
    console.error('Error asignando estación:', error);
    return false;
  }

  await registrarLog('WFM_ESTACION_ASIGNADA', `Estación ${estacionId} ocupada por ${clienteNombre} con ${agenteNombre}`);
  return true;
}

export async function liberarEstacionPiso(estacionId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('estaciones_piso')
    .update({
      estado_ocupacion: 'LIBRE',
      oatc_id_actual: null,
      agente_id_actual: null,
      agente_nombre_actual: null,
      cliente_nombre_actual: null
    })
    .eq('id', estacionId);

  if (error) {
    console.error('Error liberando estación:', error);
    return false;
  }

  return true;
}

// -------------------------------------------------------------
// Supervisión en Vivo con SLA Real para Jefe Operativo / Piso
// -------------------------------------------------------------

export interface EstacionSLAInfo extends EstacionPiso {
  tiempoMinutos: number;
  slaMaxMinutos: number;
  alertaColor: 'VERDE' | 'AMARILLO' | 'ROJO';
  progresoPorcentaje: number;
}

export async function obtenerEstacionesConSLA(sedeId?: string): Promise<EstacionSLAInfo[]> {
  const supabase = createClient();
  const [estaciones, { data: oatcs }] = await Promise.all([
    obtenerEstacionesPiso(sedeId),
    supabase
      .from('oatc')
      .select('id, cliente_nombre, agente_nombre, hora_inicio_atencion, created_at, estado_proceso')
      .in('estado_proceso', ['ASESORIA', 'EN_PROCESO', 'PRE_COBRADO'])
  ]);

  const oatcMap = new Map<string, any>();
  (oatcs || []).forEach((o: any) => oatcMap.set(o.id, o));

  const ahora = new Date();

  return estaciones
    .filter(e => e.tipo_estacion !== 'PARED')
    .map(est => {
      const oatc = est.oatc_id_actual ? oatcMap.get(est.oatc_id_actual) : null;
      let tiempoMinutos = 0;
      const slaMaxMinutos = est.tipo_estacion === 'CABINA' ? 60 : est.tipo_estacion === 'LAVADERO' ? 30 : 45;

      if (oatc) {
        const inicio = new Date(oatc.hora_inicio_atencion || oatc.created_at);
        tiempoMinutos = Math.max(0, differenceInMinutes(ahora, inicio));
      }

      const progreso = Math.min(100, Math.round((tiempoMinutos / slaMaxMinutos) * 100));
      let alerta: 'VERDE' | 'AMARILLO' | 'ROJO' = 'VERDE';

      if (tiempoMinutos > slaMaxMinutos) {
        alerta = 'ROJO';
      } else if (tiempoMinutos > slaMaxMinutos * 0.75) {
        alerta = 'AMARILLO';
      }

      return {
        ...est,
        cliente_nombre_actual: oatc?.cliente_nombre || est.cliente_nombre_actual,
        agente_nombre_actual: oatc?.agente_nombre || est.agente_nombre_actual,
        tiempoMinutos,
        slaMaxMinutos,
        alertaColor: alerta,
        progresoPorcentaje: progreso
      };
    });
}
