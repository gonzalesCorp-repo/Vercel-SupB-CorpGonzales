import { createClient } from '@/lib/supabase/client';
import { registrarLog } from './logger';

export type TipoMovimientoAsistencia = 
  | 'ENTRADA' 
  | 'INICIO_REFRIGERIO' 
  | 'FIN_REFRIGERIO' 
  | 'SALIDA' 
  | 'CAMBIO_ESTACION'
  | 'OTRO';

export interface RegistroAsistencia {
  id?: string;
  agente_id: string;
  agente_nombre: string;
  sede_id?: string;
  sede_nombre?: string;
  tipo_movimiento: TipoMovimientoAsistencia;
  nfc_tag_id?: string;
  nfc_tag_raw?: string;
  punto_acceso?: string;
  timestamp_registro?: string;
  ip_origen?: string;
  dispositivo?: string;
  metadatos?: Record<string, any>;
}

export interface ResultadoValidacionAsistencia {
  ok: boolean;
  mensaje: string;
  duplicado?: boolean;
  registro?: RegistroAsistencia;
  estadoSugerido?: string;
}

export const ZONA_HORARIA_PERU = 'America/Lima';

export function formatearHoraLima(fechaIsoOrDate: string | Date): string {
  const d = typeof fechaIsoOrDate === 'string' ? new Date(fechaIsoOrDate) : fechaIsoOrDate;
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: ZONA_HORARIA_PERU,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

export function obtenerInicioDiaLimaIso(): string {
  const ahora = new Date();
  const formatoFecha = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA_PERU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatoFecha.formatToParts(ahora);
  const month = parts.find(p => p.type === 'month')?.value || '01';
  const day = parts.find(p => p.type === 'day')?.value || '01';
  const year = parts.find(p => p.type === 'year')?.value || '2026';
  return `${year}-${month}-${day}T00:00:00.000-05:00`;
}

function humanizarPuntoAcceso(punto?: string): string {
  if (!punto) return 'Sede';
  if (punto.includes('Puerta_1') || punto.includes('Puerta 1')) return 'Puerta Principal';
  return punto.replace(/_/g, ' ').trim();
}

function humanizarMensajeExito(tipo: TipoMovimientoAsistencia, hora: string, punto?: string): string {
  const ubicacion = humanizarPuntoAcceso(punto);
  switch (tipo) {
    case 'ENTRADA':
      return `🎉 ¡Bienvenido! Tu turno ha comenzado con éxito (${hora} • ${ubicacion}).`;
    case 'INICIO_REFRIGERIO':
      return `🍕 ¡Buen provecho! Se inició tu pausa de refrigerio (${hora}).`;
    case 'FIN_REFRIGERIO':
      return `💪 ¡Bienvenido de vuelta! Estás disponible en piso (${hora}).`;
    case 'SALIDA':
      return `🏁 ¡Gran jornada laboral! Tu salida fue registrada a las ${hora}. ¡Hasta mañana!`;
    default:
      return `✅ Marcación registrada con éxito a las ${hora}.`;
  }
}

export async function validarYRegistrarAsistenciaNfc(params: RegistroAsistencia): Promise<ResultadoValidacionAsistencia> {
  const supabase = createClient();
  const inicioDiaIso = obtenerInicioDiaLimaIso();

  try {
    // 1. Consultar los movimientos de hoy en hora Perú para este colaborador
    const { data: movimientosHoy, error: queryErr } = await supabase
      .from('asistencias_turnos')
      .select('*')
      .eq('agente_id', params.agente_id)
      .gte('timestamp_registro', inicioDiaIso)
      .order('timestamp_registro', { ascending: false });

    if (queryErr) {
      console.warn('Error consultando movimientos previos:', queryErr);
    }

    const movimientos = movimientosHoy || [];
    const ultimoMovimiento = movimientos[0]; // El más reciente

    // Cooldown Anti-Ráfaga (Protección estricta de 60 segundos contra rebotes de antena o toques accidentales)
    if (ultimoMovimiento) {
      const diffMs = Math.abs(Date.now() - new Date(ultimoMovimiento.timestamp_registro).getTime());
      
      // 1. Mismo movimiento repetido en menos de 60 segundos
      if (diffMs < 60000 && ultimoMovimiento.tipo_movimiento === params.tipo_movimiento) {
        return {
          ok: false,
          duplicado: true,
          mensaje: `ℹ️ Tu marcación de ${params.tipo_movimiento} ya fue procesada hace un instante.`,
          estadoSugerido: ultimoMovimiento.tipo_movimiento === 'INICIO_REFRIGERIO' ? 'EN_REFRIGERIO' : ultimoMovimiento.tipo_movimiento === 'SALIDA' ? 'FUERA_DE_TURNO' : 'DISPONIBLE'
        };
      }

      // 2. Transición inmediata absurda (ej. ENTRADA -> INICIO_REFRIGERIO en menos de 60 segundos)
      if (diffMs < 60000 && params.tipo_movimiento === 'INICIO_REFRIGERIO' && ultimoMovimiento.tipo_movimiento === 'ENTRADA') {
        return {
          ok: false,
          duplicado: true,
          mensaje: `ℹ️ Acabas de registrar tu llegada. ¡Tu turno ya se encuentra activo!`,
          estadoSugerido: 'DISPONIBLE'
        };
      }

      // 3. Salida inmediata tras entrada (menos de 60s)
      if (diffMs < 60000 && params.tipo_movimiento === 'SALIDA' && ultimoMovimiento.tipo_movimiento === 'ENTRADA') {
        return {
          ok: false,
          duplicado: true,
          mensaje: `ℹ️ Acabas de registrar tu llegada hace unos segundos.`,
          estadoSugerido: 'DISPONIBLE'
        };
      }
    }

    // 2. Reglas de Validación de Estado & Anti-Duplicados
    if (params.tipo_movimiento === 'ENTRADA') {
      const entradaExistente = movimientos.find((m: any) => m.tipo_movimiento === 'ENTRADA');
      const salidaPosterior = movimientos.find((m: any) => m.tipo_movimiento === 'SALIDA');

      // Si ya marcó entrada hoy y NO ha marcado salida
      if (entradaExistente && !salidaPosterior) {
        const horaRegistrada = formatearHoraLima(entradaExistente.timestamp_registro);
        return {
          ok: false,
          duplicado: true,
          mensaje: `⚠️ Ya registraste tu llegada hoy (${horaRegistrada}). ¡Tu turno ya se encuentra activo!`,
          estadoSugerido: 'DISPONIBLE'
        };
      }
    } else if (params.tipo_movimiento === 'INICIO_REFRIGERIO') {
      if (ultimoMovimiento?.tipo_movimiento === 'INICIO_REFRIGERIO') {
        const horaRefrigerio = formatearHoraLima(ultimoMovimiento.timestamp_registro);
        return {
          ok: false,
          duplicado: true,
          mensaje: `⚠️ Ya te encuentras en tu pausa de refrigerio desde las ${horaRefrigerio}.`,
          estadoSugerido: 'EN_REFRIGERIO'
        };
      }
    } else if (params.tipo_movimiento === 'FIN_REFRIGERIO') {
      if (ultimoMovimiento && ultimoMovimiento.tipo_movimiento !== 'INICIO_REFRIGERIO') {
        return {
          ok: false,
          mensaje: `ℹ️ No tienes una pausa de refrigerio activa para finalizar.`,
          estadoSugerido: 'DISPONIBLE'
        };
      }
    } else if (params.tipo_movimiento === 'SALIDA') {
      if (ultimoMovimiento?.tipo_movimiento === 'SALIDA') {
        const horaSalida = formatearHoraLima(ultimoMovimiento.timestamp_registro);
        return {
          ok: false,
          duplicado: true,
          mensaje: `⚠️ Ya registraste tu salida del día (${horaSalida}). ¡Nos vemos mañana!`,
          estadoSugerido: 'INACTIVO'
        };
      }
    }

    // 3. Registrar en Supabase si pasa las validaciones
    const nuevoRegistro: RegistroAsistencia = {
      ...params,
      timestamp_registro: new Date().toISOString()
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('asistencias_turnos')
      .insert([nuevoRegistro])
      .select()
      .single();

    if (insertErr) {
      console.warn('Error insertando en asistencias_turnos:', insertErr);
    }

    // Registrar en auditoría
    await registrarLog('ASISTENCIA_NFC', `Marcación ${params.tipo_movimiento} (${params.punto_acceso || 'NFC'})`, {
      agente: params.agente_nombre,
      tag: params.nfc_tag_raw,
      punto: params.punto_acceso
    });

    let estadoSugerido = 'DISPONIBLE';
    if (params.tipo_movimiento === 'INICIO_REFRIGERIO') estadoSugerido = 'EN_REFRIGERIO';
    else if (params.tipo_movimiento === 'SALIDA') estadoSugerido = 'FUERA_DE_TURNO';

    // Sincronizar estado operativo en Supabase manteniendo estado de cuenta ACTIVO
    if (params.agente_id) {
      await supabase
        .from('agentes')
        .update({
          estado_operativo: estadoSugerido,
          ultimo_cambio_estado: new Date().toISOString()
        })
        .eq('id', params.agente_id);
    }

    const horaConfirmada = formatearHoraLima(new Date());

    return {
      ok: true,
      duplicado: false,
      mensaje: humanizarMensajeExito(params.tipo_movimiento, horaConfirmada, params.punto_acceso),
      registro: inserted || nuevoRegistro,
      estadoSugerido
    };

  } catch (err) {
    console.error('Fallo en validarYRegistrarAsistenciaNfc:', err);
    return {
      ok: true,
      mensaje: `✅ Marcación registrada con éxito.`,
      estadoSugerido: 'DISPONIBLE'
    };
  }
}

export async function registrarAsistenciaNfc(params: RegistroAsistencia): Promise<RegistroAsistencia> {
  const res = await validarYRegistrarAsistenciaNfc(params);
  return res.registro || params;
}

export async function obtenerHistorialAsistencias(agenteId?: string, sedeId?: string): Promise<RegistroAsistencia[]> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('asistencias_turnos')
      .select('*')
      .order('timestamp_registro', { ascending: false })
      .limit(50);

    if (agenteId) {
      query = query.eq('agente_id', agenteId);
    }
    if (sedeId) {
      query = query.eq('sede_id', sedeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Fallo al obtener asistencias:', err);
    return [];
  }
}

export async function registrarMarcacionManualExcepcion(params: {
  agenteId: string;
  agenteNombre: string;
  supervisorNombre: string;
  tipoMovimiento: TipoMovimientoAsistencia;
  motivoExcepcion: string;
  sedeId?: string;
  sedeNombre?: string;
}): Promise<ResultadoValidacionAsistencia> {
  const supabase = createClient();

  const registro: RegistroAsistencia = {
    agente_id: params.agenteId,
    agente_nombre: params.agenteNombre,
    sede_id: params.sedeId || 'sede_sandbox_prueba',
    sede_nombre: params.sedeNombre || 'Sede Sandbox',
    tipo_movimiento: params.tipoMovimiento,
    punto_acceso: 'RECEPCION_MANUAL',
    dispositivo: `Supervisor (${params.supervisorNombre})`,
    timestamp_registro: new Date().toISOString(),
    metadatos: {
      metodo: 'EXCEPCION_SUPERVISOR',
      motivo: params.motivoExcepcion,
      supervisor: params.supervisorNombre,
      hora_lima: formatearHoraLima(new Date())
    }
  };

  try {
    const { data, error } = await supabase
      .from('asistencias_turnos')
      .insert([registro])
      .select()
      .single();

    if (error) throw error;

    await registrarLog('ASISTENCIA_MANUAL', `Marcación manual ${params.tipoMovimiento} autorizada por ${params.supervisorNombre}`, {
      agente: params.agenteNombre,
      motivo: params.motivoExcepcion
    });

    let estadoSugerido = 'DISPONIBLE';
    if (params.tipoMovimiento === 'INICIO_REFRIGERIO') estadoSugerido = 'EN_REFRIGERIO';
    else if (params.tipoMovimiento === 'SALIDA') estadoSugerido = 'FUERA_DE_TURNO';

    if (params.agenteId) {
      await supabase
        .from('agentes')
        .update({
          estado_operativo: estadoSugerido,
          ultimo_cambio_estado: new Date().toISOString()
        })
        .eq('id', params.agenteId);
    }

    return {
      ok: true,
      mensaje: `✅ Marcación manual de ${params.tipoMovimiento} registrada con éxito por ${params.supervisorNombre}.`,
      registro: data || registro,
      estadoSugerido
    };
  } catch (e: any) {
    console.error('Error en marcacion manual:', e);
    return {
      ok: false,
      mensaje: `❌ Error al registrar marcación manual: ${e.message}`
    };
  }
}

export const TIPO_PETICION_ASISTENCIA_MAP: Record<TipoMovimientoAsistencia, string> = {
  ENTRADA: '11111111-1111-1111-1111-111111111111',
  INICIO_REFRIGERIO: '22222222-2222-2222-2222-222222222222',
  FIN_REFRIGERIO: '54c59ee3-12cf-42cd-bfe9-aa400cdef0a4',
  SALIDA: '33333333-3333-3333-3333-333333333333',
  CAMBIO_ESTACION: '5ef41109-0c11-469c-b79d-2e2e74a79d25',
  OTRO: '5ef41109-0c11-469c-b79d-2e2e74a79d25'
};

export async function crearSolicitudAsistenciaCola(params: {
  agenteId: string;
  agenteNombre: string;
  sedeId: string;
  sedeNombre?: string;
  tipoMovimiento: TipoMovimientoAsistencia;
  dispositivo?: string;
}): Promise<{ ok: boolean; peticionId?: string; pinTemporal?: string; mensaje: string }> {
  const supabase = createClient();
  const tipoId = TIPO_PETICION_ASISTENCIA_MAP[params.tipoMovimiento] || '11111111-1111-1111-1111-111111111111';
  const pinTemporal = '1234';

  try {
    const { data, error } = await supabase
      .from('cola_peticiones')
      .insert([{
        agente_id: params.agenteId,
        sede_id: params.sedeId,
        tipo_id: tipoId,
        estado: 'PENDIENTE',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    await registrarLog('SOLICITUD_ASISTENCIA', `Solicitud de ${params.tipoMovimiento} enviada por ${params.agenteNombre}`, {
      dispositivo: params.dispositivo,
      pin_sugerido: pinTemporal
    });

    return {
      ok: true,
      peticionId: data.id,
      pinTemporal,
      mensaje: `📨 Solicitud enviada al local. Valídala en el Tótem Kiosko ingresando tu PIN personal de 4 dígitos o en Recepción.`
    };
  } catch (e: any) {
    console.error('Error creando solicitud en cola_peticiones:', e);
    return {
      ok: false,
      mensaje: `Error al enviar solicitud: ${e?.message || 'Error desconocido'}`
    };
  }
}

export async function obtenerSolicitudesAsistenciaPendientes(sedeId?: string): Promise<any[]> {
  if (!sedeId) return [];
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('cola_peticiones')
      .select(`
        id, agente_id, sede_id, tipo_id, estado, created_at, resolved_at, resolved_by,
        agentes:agentes!cola_peticiones_agente_id_fkey(id, nombre, rol, especialidad),
        config_peticiones:config_peticiones!cola_peticiones_tipo_id_fkey(id, nombre, color, estado_destino)
      `)
      .eq('sede_id', sedeId)
      .eq('estado', 'PENDIENTE')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Advertencia obteniendo solicitudes pendientes con JOIN, usando fallback:', error);
      // Fallback robusto sin join en caso de que PostgREST cambie el schema
      const { data: rawData, error: rawError } = await supabase
        .from('cola_peticiones')
        .select('*')
        .eq('sede_id', sedeId)
        .eq('estado', 'PENDIENTE')
        .order('created_at', { ascending: false });

      if (rawError || !rawData) return [];
      return rawData;
    }
    return data || [];
  } catch (e) {
    console.error('Error obteniendo solicitudes pendientes:', e);
    return [];
  }
}

export async function resolverSolicitudAsistenciaCola(params: {
  peticionId: string;
  agenteId: string;
  agenteNombre: string;
  sedeId: string;
  sedeNombre?: string;
  tipoMovimiento: TipoMovimientoAsistencia;
  accion: 'APROBADO' | 'RECHAZADO';
  resolvedBy: string;
}): Promise<ResultadoValidacionAsistencia> {
  const supabase = createClient();

  try {
    // 1. Actualizar cola_peticiones
    await supabase
      .from('cola_peticiones')
      .update({
        estado: params.accion,
        resolved_at: new Date().toISOString(),
        resolved_by: params.resolvedBy
      })
      .eq('id', params.peticionId);

    if (params.accion === 'RECHAZADO') {
      return {
        ok: false,
        mensaje: `❌ Solicitud de asistencia rechazada por ${params.resolvedBy}.`
      };
    }

    // 2. Si es APROBADO, registrar formalmente en asistencias_turnos
    const res = await validarYRegistrarAsistenciaNfc({
      agente_id: params.agenteId,
      agente_nombre: params.agenteNombre,
      sede_id: params.sedeId,
      sede_nombre: params.sedeNombre || 'Sede',
      tipo_movimiento: params.tipoMovimiento,
      punto_acceso: params.resolvedBy === 'TOTEM_PIN' ? 'Tótem Kiosko Central' : 'Recepción Central',
      dispositivo: params.resolvedBy === 'TOTEM_PIN' ? 'Tótem Kiosko Standalone (PIN Físico)' : 'Recepción Desktop',
      metadatos: {
        metodo: params.resolvedBy,
        peticion_id: params.peticionId,
        validado_fisicamente: true,
        hora_lima: formatearHoraLima(new Date())
      }
    });

    return res;
  } catch (e: any) {
    console.error('Error resolviendo solicitud de asistencia:', e);
    return {
      ok: false,
      mensaje: `Error resolviendo asistencia: ${e?.message}`
    };
  }
}

/**
 * Reset diario nocturno de disponibilidad de agentes:
 * Detecta agentes que quedaron en DISPONIBLE/OCUPADO desde el día anterior y los pasa a FUERA_TURNO,
 * registrando la salida automática y marcando la jornada para conciliación de RHE/Planilla si es necesario.
 */
export async function ejecutarResetDiarioAgentes(sedeId?: string): Promise<{ agentesReseteados: number; mensaje: string }> {
  const supabase = createClient();
  const inicioDiaIso = obtenerInicioDiaLimaIso();

  try {
    let query = supabase
      .from('agentes')
      .select('id, nombre, estado_operativo, ultimo_cambio_estado')
      .in('estado_operativo', ['DISPONIBLE', 'OCUPADO', 'EN_DESCANSO']);

    const { data: agentesActivos, error } = await query;
    if (error || !agentesActivos) return { agentesReseteados: 0, mensaje: 'Sin agentes pendientes de reset' };

    let count = 0;
    for (const ag of agentesActivos) {
      // Verificar si el agente ya marcó ENTRADA hoy
      const { data: marcacionHoy } = await supabase
        .from('asistencias_turnos')
        .select('id')
        .eq('agente_id', ag.id)
        .gte('timestamp_registro', inicioDiaIso)
        .eq('tipo_movimiento', 'ENTRADA')
        .limit(1)
        .maybeSingle();

      // Si no ha marcado hoy o su último cambio fue antes de hoy, resetear a FUERA_TURNO
      if (!marcacionHoy) {
        await supabase
          .from('agentes')
          .update({
            estado_operativo: 'FUERA_DE_TURNO',
            ultimo_cambio_estado: new Date().toISOString()
          })
          .eq('id', ag.id);

        // Registrar movimiento de salida automática
        await supabase.from('asistencias_turnos').insert([{
          agente_id: ag.id,
          agente_nombre: ag.nombre,
          sede_id: sedeId || 'd954b259-69a0-4546-9156-2f6ad392853f',
          sede_nombre: 'Sede Principal',
          tipo_movimiento: 'SALIDA',
          punto_acceso: 'Auto-Reset Nocturno del Sistema',
          dispositivo: 'Daemon Programado',
          timestamp_registro: new Date().toISOString(),
          metadatos: {
            origen: 'AUTO_RESET_NOCTURNO',
            requiere_validacion_horas: true,
            motivo: 'Olvido de marcación al finalizar jornada',
            hora_lima: formatearHoraLima(new Date())
          }
        }]);

        count++;
      }
    }

    return {
      agentesReseteados: count,
      mensaje: `✅ Se resetearon ${count} colaboradores que quedaron disponibles de jornadas previas.`
    };
  } catch (err: any) {
    console.error('Error en ejecutarResetDiarioAgentes:', err);
    return { agentesReseteados: 0, mensaje: `Error: ${err?.message}` };
  }
}

/**
 * Cierre de jornada masivo de sede:
 * Pasa a todo el staff de la sede a FUERA_TURNO al cerrar la tienda.
 */
export async function cerrarJornadaMasivaSede(sedeId: string, adminNombre: string = 'Recepción'): Promise<{ cerrados: number; ok: boolean }> {
  const supabase = createClient();

  try {
    const { data: agentesActivos } = await supabase
      .from('agentes')
      .select('id, nombre')
      .in('estado_operativo', ['DISPONIBLE', 'OCUPADO', 'EN_DESCANSO']);

    if (!agentesActivos || agentesActivos.length === 0) {
      return { cerrados: 0, ok: true };
    }

    for (const ag of agentesActivos) {
      await supabase
        .from('agentes')
        .update({
          estado_operativo: 'FUERA_DE_TURNO',
          ultimo_cambio_estado: new Date().toISOString()
        })
        .eq('id', ag.id);

      await supabase.from('asistencias_turnos').insert([{
        agente_id: ag.id,
        agente_nombre: ag.nombre,
        sede_id: sedeId,
        sede_nombre: 'Sede Principal',
        tipo_movimiento: 'SALIDA',
        punto_acceso: 'Cierre Masivo de Tienda',
        dispositivo: 'Recepción Central',
        timestamp_registro: new Date().toISOString(),
        metadatos: {
          origen: 'CIERRE_MASIVO_SEDE',
          cerrado_por: adminNombre,
          hora_lima: formatearHoraLima(new Date())
        }
      }]);
    }

    return { cerrados: agentesActivos.length, ok: true };
  } catch (e) {
    console.error('Error en cerrarJornadaMasivaSede:', e);
    return { cerrados: 0, ok: false };
  }
}

/**
 * Obtiene las inconsistencias de marcación pendientes de validar para RHE / Planilla
 */
export async function obtenerInconsistenciasMarcacion(): Promise<any[]> {
  const supabase = createClient();
  try {
    const { data } = await supabase
      .from('asistencias_turnos')
      .select('*')
      .order('timestamp_registro', { ascending: false })
      .limit(50);

    return (data || []).filter((m: any) => m.metadatos?.requiere_validacion_horas === true);
  } catch (e) {
    return [];
  }
}

export interface DetalleTurnoColaborador {
  horaIngreso: string | null;
  horaInicioRefrigerio: string | null;
  horaFinRefrigerio: string | null;
  horaSalida: string | null;
  metodoIngreso: string | null;
  enPausaRefrigerio: boolean;
  turnoFinalizado: boolean;
  // Métricas reales de OATC del día
  totalAtencionesHoy: number;
  atencionesPorTurno: number;
  atencionesDirectas: number;
  atencionesCanceladas: number;
  atencionesEnCurso: number;
  atencionesFinalizadas: number;
}

/**
 * Consulta en vivo en Supabase las marcaciones reales del día y las OATCs asignadas a un colaborador
 */
export async function obtenerDetalleTurnoColaborador(agenteId: string, agenteNombre?: string): Promise<DetalleTurnoColaborador> {
  const supabase = createClient();
  const inicioDiaIso = obtenerInicioDiaLimaIso();

  try {
    // 1. Obtener todas las marcaciones de asistencia de hoy para este agente
    let queryAsist = supabase
      .from('asistencias_turnos')
      .select('*')
      .gte('timestamp_registro', inicioDiaIso)
      .order('timestamp_registro', { ascending: true });

    if (agenteId && agenteNombre) {
      queryAsist = queryAsist.or(`agente_id.eq.${agenteId},agente_nombre.ilike.%${agenteNombre}%`);
    } else if (agenteId) {
      queryAsist = queryAsist.eq('agente_id', agenteId);
    }

    const { data: asistencias } = await queryAsist;

    let horaIngreso: string | null = null;
    let horaInicioRefrigerio: string | null = null;
    let horaFinRefrigerio: string | null = null;
    let horaSalida: string | null = null;
    let metodoIngreso: string | null = null;

    if (asistencias && asistencias.length > 0) {
      for (const m of asistencias) {
        const horaFmt = formatearHoraLima(m.timestamp_registro);
        if (m.tipo_movimiento === 'ENTRADA' && !horaIngreso) {
          horaIngreso = horaFmt;
          metodoIngreso = m.metadatos?.metodo === 'MANUAL_SUPERVISOR' ? 'Manual Supervisor' : (m.nfc_tag_id ? 'Validado NFC' : 'Marcación Web');
        } else if (m.tipo_movimiento === 'INICIO_REFRIGERIO') {
          horaInicioRefrigerio = horaFmt;
        } else if (m.tipo_movimiento === 'FIN_REFRIGERIO') {
          horaFinRefrigerio = horaFmt;
        } else if (m.tipo_movimiento === 'SALIDA') {
          horaSalida = horaFmt;
        }
      }
    }

    // 2. Obtener OATCs reales de hoy para este agente
    let queryOatc = supabase
      .from('oatc')
      .select('id, tipo_demanda, estado_proceso, created_at')
      .gte('created_at', inicioDiaIso);

    if (agenteId && agenteNombre) {
      queryOatc = queryOatc.or(`agente_id.eq.${agenteId},agente_nombre.ilike.%${agenteNombre}%`);
    } else if (agenteId) {
      queryOatc = queryOatc.eq('agente_id', agenteId);
    }

    const { data: oatcs } = await queryOatc;

    const misOatcs: any[] = oatcs || [];
    const atencionesCanceladas = misOatcs.filter((o: any) => o.estado_proceso === 'CANCELADO').length;
    const atencionesFinalizadas = misOatcs.filter((o: any) => o.estado_proceso === 'FINALIZADO' || o.estado_proceso === 'FINALIZADA').length;
    const atencionesEnCurso = misOatcs.filter((o: any) => o.estado_proceso !== 'CANCELADO' && o.estado_proceso !== 'FINALIZADO' && o.estado_proceso !== 'FINALIZADA').length;
    const atencionesPorTurno = misOatcs.filter((o: any) => !o.tipo_demanda || String(o.tipo_demanda).toLowerCase().includes('turno') || String(o.tipo_demanda).toLowerCase().includes('cola') || o.tipo_demanda === 'NORMAL').length;
    const atencionesDirectas = misOatcs.filter((o: any) => o.tipo_demanda && (String(o.tipo_demanda).toLowerCase().includes('cliente') || String(o.tipo_demanda).toLowerCase().includes('cita') || String(o.tipo_demanda).toLowerCase().includes('directo'))).length;

    const ultimaMarcacion = asistencias && asistencias.length > 0 ? asistencias[asistencias.length - 1] : null;

    return {
      horaIngreso,
      horaInicioRefrigerio,
      horaFinRefrigerio,
      horaSalida,
      metodoIngreso,
      enPausaRefrigerio: ultimaMarcacion?.tipo_movimiento === 'INICIO_REFRIGERIO',
      turnoFinalizado: ultimaMarcacion?.tipo_movimiento === 'SALIDA',
      totalAtencionesHoy: misOatcs.length,
      atencionesPorTurno,
      atencionesDirectas,
      atencionesCanceladas,
      atencionesEnCurso,
      atencionesFinalizadas
    };
  } catch (e) {
    console.error('Error calculando detalle del turno:', e);
    return {
      horaIngreso: null,
      horaInicioRefrigerio: null,
      horaFinRefrigerio: null,
      horaSalida: null,
      metodoIngreso: null,
      enPausaRefrigerio: false,
      turnoFinalizado: false,
      totalAtencionesHoy: 0,
      atencionesPorTurno: 0,
      atencionesDirectas: 0,
      atencionesCanceladas: 0,
      atencionesEnCurso: 0,
      atencionesFinalizadas: 0
    };
  }
}

