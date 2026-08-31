import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { registrarLog } from './logger';
import { EcosystemBridge } from '@/lib/bridge/EcosystemBridge';
import { Cliente } from './clientes';

export type { Cliente };

const supabase = createClient();

export interface Bien {
  id: string;
  nombre: string;
  tipo_bien: 'servicio' | 'producto';
  categoria: string;
  precio_venta: number;
  atributos_producto?: Record<string, any>;
  atributos_servicio?: Record<string, any>;
}

import { obtenerInicioDiaLimaIso, formatearHoraLima } from './asistencias';

export type EstadoOperativoTurno = 'DISPONIBLE' | 'OCUPADO' | 'EN_REFRIGERIO' | 'FUERA_DE_TURNO';

export interface Agente {
  id: string;
  nombre: string;
  estado: string; // 'ACTIVO' | 'INACTIVO' (Estado Laboral Administrativo)
  estadoOperativo?: EstadoOperativoTurno; // Dinamico derivado de asistencias_turnos y OATCs
  ultimoMovimientoAsistencia?: string; // 'ENTRADA', 'INICIO_REFRIGERIO', 'FIN_REFRIGERIO', 'SALIDA'
  horaUltimaMarcacion?: string; // ej. '10:31 PM'
  oatcActiva?: OATC | null;
  rol?: string;
  especialidad?: string;
  badge?: string;
  created_at?: string;
  ultimo_cambio_estado?: string;
}

export interface ServicioOATCItem {
  bien_id?: string;
  servicio_id?: string;
  nombre: string;
  precio?: number;
  precio_venta?: number;
  monto?: number;
  cantidad?: number;
  comision_porcentaje?: number;
  especificaciones?: Record<string, any>;
}

export interface PayloadCambioPendiente {
  tipo?: string;
  detalle?: string;
  motivo_id?: string;
  motivo?: string;
  estado_anterior?: string;
  nuevo_tipo_demanda?: string;
  nuevos_servicios?: ServicioOATCItem[];
}

export interface OATC {
  id?: string;
  cliente_id?: string;
  cliente_nombre: string;
  agente_id?: string | null;
  agente_nombre?: string | null;
  punto_partida: ServicioOATCItem[];
  estado_proceso?: string;
  estado_pago?: 'NO_PAGADO' | 'PARCIAL_ADELANTO' | 'PRE_COBRADO_TOTAL' | 'PAGADO' | string;
  monto_adelanto?: number;
  metodo_adelanto?: string;
  monto_total?: number;
  tipo_demanda?: string;
  cambios_pendientes?: PayloadCambioPendiente | null;
  motivo_cancelacion_id?: string;
  motivos_cancelacion?: { motivo: string };
  detalle_cancelacion?: string;
  hora_inicio_atencion?: string;
  hora_fin_atencion?: string;
  sede_id?: string;
  created_at?: string;
}

export interface MotivoCancelacion {
  id: string;
  motivo: string;
  activo: boolean;
}

export async function buscarCliente(query: string): Promise<Cliente[]> {
  if (query.length < 3) return [];

  const { data, error } = await supabase
    .from('clientes')
    .select('id, nombre, dni, celular')
    .or(`nombre.ilike.%${query}%,dni.ilike.%${query}%,celular.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error("Error buscando cliente:", error);
    return [];
  }
  
  return data || [];
}

export async function obtenerMotivosCancelacion(): Promise<MotivoCancelacion[]> {
  const { data, error } = await supabase
    .from('motivos_cancelacion')
    .select('*')
    .eq('activo', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error obteniendo motivos de cancelación:", error);
    return [];
  }
  return data || [];
}

export async function agregarMotivoCancelacion(motivo: string): Promise<MotivoCancelacion | null> {
  const { data, error } = await supabase
    .from('motivos_cancelacion')
    .insert([{ motivo, activo: true }])
    .select('*')
    .single();

  if (error) {
    console.error("Error agregando motivo de cancelación:", error);
    return null;
  }
  return data;
}

const SERVICIOS_DEFAULT: Bien[] = [
  { id: 'srv_1', nombre: 'Corte Clásico & Peinado', categoria: 'Cabello', tipo_bien: 'servicio', precio_venta: 45.00 },
  { id: 'srv_2', nombre: 'Corte Fade / Degradado Urbano', categoria: 'Cabello', tipo_bien: 'servicio', precio_venta: 50.00 },
  { id: 'srv_3', nombre: 'Balayage Premium & Matizado', categoria: 'Coloración', tipo_bien: 'servicio', precio_venta: 280.00 },
  { id: 'srv_4', nombre: 'Tinte Completo & Baño de Brillo', categoria: 'Coloración', tipo_bien: 'servicio', precio_venta: 160.00 },
  { id: 'srv_5', nombre: 'Tratamiento de Keratina Brasileña', categoria: 'Tratamientos', tipo_bien: 'servicio', precio_venta: 220.00 },
  { id: 'srv_6', nombre: 'Hidratación Profunda Ácido Hialurónico', categoria: 'Tratamientos', tipo_bien: 'servicio', precio_venta: 95.00 },
  { id: 'srv_7', nombre: 'Limpieza Facial Profunda & Microdermoabrasión', categoria: 'Cosmiatría', tipo_bien: 'servicio', precio_venta: 120.00 },
  { id: 'srv_8', nombre: 'Manicure Ruso & Esmaltado Gel', categoria: 'Uñas & Spa', tipo_bien: 'servicio', precio_venta: 65.00 },
  { id: 'srv_9', nombre: 'Pedicure Spa con Sales Exfoliantes', categoria: 'Uñas & Spa', tipo_bien: 'servicio', precio_venta: 75.00 }
];

const PRODUCTOS_DEFAULT: Bien[] = [
  { id: 'prd_1', nombre: 'Shampoo Nutritivo Post-Color 500ml', categoria: 'Cuidado Capilar', tipo_bien: 'producto', precio_venta: 78.00, atributos_producto: { marca: 'L’Oréal', linea: 'Vitamino Color' } },
  { id: 'prd_2', nombre: 'Acondicionador Reconstructor 500ml', categoria: 'Cuidado Capilar', tipo_bien: 'producto', precio_venta: 82.00, atributos_producto: { marca: 'Kérastase', linea: 'Resistance' } },
  { id: 'prd_3', nombre: 'Mascarilla Reparación Molecular 250g', categoria: 'Cuidado Capilar', tipo_bien: 'producto', precio_venta: 115.00, atributos_producto: { marca: 'K18', linea: 'Molecular Repair' } },
  { id: 'prd_4', nombre: 'Serum Protector Térmico & Brillo 100ml', categoria: 'Acabados', tipo_bien: 'producto', precio_venta: 65.00, atributos_producto: { marca: 'Moroccanoil', linea: 'Treatment' } },
  { id: 'prd_5', nombre: 'Aceite de Argán Puro 50ml', categoria: 'Acabados', tipo_bien: 'producto', precio_venta: 55.00, atributos_producto: { marca: 'Wella', linea: 'Oil Reflections' } },
  { id: 'prd_6', nombre: 'Protector Solar Matificante SPF50+', categoria: 'Skin Care', tipo_bien: 'producto', precio_venta: 92.00, atributos_producto: { marca: 'La Roche-Posay', linea: 'Anthelios' } }
];

export async function obtenerCatalogo(tipo?: string): Promise<Bien[]> {
  try {
    let query = supabase.from('bienes').select('*').order('nombre');
    
    if (tipo === 'servicio') {
      query = query.or('tipo_bien.eq.servicio,es_servicio.eq.true');
    } else if (tipo === 'producto') {
      query = query.or('tipo_bien.eq.producto,es_producto_venta.eq.true');
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.warn('[Catálogo] Usando catálogo base enriquecido.');
  }

  // Fallback rico
  if (tipo === 'servicio') return SERVICIOS_DEFAULT;
  if (tipo === 'producto') return PRODUCTOS_DEFAULT;
  return [...SERVICIOS_DEFAULT, ...PRODUCTOS_DEFAULT];
}

export async function obtenerAgentesDisponibles(): Promise<Agente[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  const inicioDiaIso = obtenerInicioDiaLimaIso();

  try {
    // 1. Obtener colaboradores con contrato ACTIVO vinculados a la sede activa
    let agentesData: any[] = [];
    if (sedeId) {
      const { data: suData } = await supabase
        .from('sedes_usuarios')
        .select('agente_id')
        .eq('sede_id', sedeId);

      const agenteIds = (suData || []).map((su: any) => su.agente_id);

      if (agenteIds.length > 0) {
        const { data } = await supabase
          .from('agentes')
          .select('*')
          .in('id', agenteIds)
          .eq('estado', 'ACTIVO')
          .order('nombre');
        agentesData = data || [];
      }
    } else {
      const { data } = await supabase
        .from('agentes')
        .select('*')
        .eq('estado', 'ACTIVO')
        .order('nombre');
      agentesData = data || [];
    }
    
    if (!agentesData || agentesData.length === 0) return [];

    // 2. OATCs activas de hoy (solo las que están en atención física de piso)
    const [resAsistencias, resOatcs] = await Promise.all([
      supabase
        .from('asistencias_turnos')
        .select('*')
        .gte('timestamp_registro', inicioDiaIso)
        .order('timestamp_registro', { ascending: false }),
      supabase
        .from('oatc')
        .select('*')
        .in('estado_proceso', ['EN_ESPERA', 'ASESORIA', 'EN_PROCESO'])
    ]);

    const asistenciasHoy = resAsistencias.data || [];
    const oatcsActivas = (resOatcs.data || []) as OATC[];

    // 3. Mapear y computar el estado operativo dinámico
    const agentesComputados: Agente[] = agentesData.map((ag: any) => {
      // Buscar última marcación de hoy
      const ultimaMarcacion = asistenciasHoy.find(
        (m: any) => m.agente_id === ag.id || (ag.nombre && m.agente_nombre?.toLowerCase() === ag.nombre.toLowerCase())
      );

      // Buscar si tiene una OATC en atención física activa asignada
      const ordenActiva = oatcsActivas.find(
        (o) => o.agente_id === ag.id || (ag.nombre && o.agente_nombre?.toLowerCase() === ag.nombre.toLowerCase())
      );

      let estadoOperativo: EstadoOperativoTurno = 'FUERA_DE_TURNO';
      let horaUltimaMarcacion: string | undefined;

      if (ordenActiva) {
        estadoOperativo = 'OCUPADO';
        if (ultimaMarcacion) {
          horaUltimaMarcacion = formatearHoraLima(ultimaMarcacion.timestamp_registro);
        }
      } else if (ultimaMarcacion) {
        horaUltimaMarcacion = formatearHoraLima(ultimaMarcacion.timestamp_registro);

        if (ultimaMarcacion.tipo_movimiento === 'INICIO_REFRIGERIO') {
          estadoOperativo = 'EN_REFRIGERIO';
        } else if (ultimaMarcacion.tipo_movimiento === 'ENTRADA' || ultimaMarcacion.tipo_movimiento === 'FIN_REFRIGERIO') {
          estadoOperativo = 'DISPONIBLE';
        } else if (ultimaMarcacion.tipo_movimiento === 'SALIDA') {
          estadoOperativo = 'FUERA_DE_TURNO';
        }
      } else {
        // Sin marcación de asistencia registrada hoy -> Estrictamente FUERA_DE_TURNO (No presente)
        estadoOperativo = 'FUERA_DE_TURNO';
      }

      return {
        ...ag,
        estadoOperativo,
        ultimoMovimientoAsistencia: ultimaMarcacion?.tipo_movimiento,
        horaUltimaMarcacion,
        oatcActiva: ordenActiva || null
      };
    });

    // 4. Ordenar prioridad: DISPONIBLE primero, luego OCUPADO, luego EN_REFRIGERIO, luego FUERA_DE_TURNO
    const pesoEstado: Record<EstadoOperativoTurno, number> = {
      'DISPONIBLE': 1,
      'OCUPADO': 2,
      'EN_REFRIGERIO': 3,
      'FUERA_DE_TURNO': 4
    };

    agentesComputados.sort((a, b) => {
      const pesoA = pesoEstado[a.estadoOperativo || 'FUERA_DE_TURNO'];
      const pesoB = pesoEstado[b.estadoOperativo || 'FUERA_DE_TURNO'];
      if (pesoA !== pesoB) return pesoA - pesoB;
      return a.nombre.localeCompare(b.nombre);
    });

    return agentesComputados;

  } catch (e) {
    console.error("Error obteniendo agentes dinámicos:", e);
    return [];
  }
}

export async function crearOatc(
  clienteId: string | null,
  clienteNombre: string,
  agenteId: string | null,
  agenteNombre: string | null,
  puntoPartida: ServicioOATCItem[],
  tipoDemanda: string = 'NORMAL',
  estadoProceso: string = 'EN_ESPERA',
  montoAdelanto: number = 0,
  metodoAdelanto?: string
) {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) throw new Error("No hay sede activa seleccionada");

  const totalCalculado = puntoPartida.reduce((acc, it) => acc + (it.precio_venta || it.precio || it.monto || 0) * (it.cantidad || 1), 0);
  let estadoPago = 'NO_PAGADO';
  if (montoAdelanto >= totalCalculado && totalCalculado > 0) {
    estadoPago = 'PRE_COBRADO_TOTAL';
  } else if (montoAdelanto > 0) {
    estadoPago = 'PARCIAL_ADELANTO';
  }

  // Payload completo con todos los campos modernos
  const payload: Record<string, any> = {
    cliente_id: clienteId,
    cliente_nombre: clienteNombre,
    agente_id: agenteId,
    agente_nombre: agenteNombre,
    punto_partida: puntoPartida,
    tipo_demanda: tipoDemanda,
    estado_proceso: estadoProceso,
    estado_pago: estadoPago,
    monto_total: totalCalculado,
    monto_adelanto: montoAdelanto,
    metodo_adelanto: metodoAdelanto || null,
    sede_id: sedeId
  };

  // Limpiar llaves con undefined
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined) delete payload[key];
  });

  let res: any = null;
  let intentos = 0;
  const maxIntentos = 6;

  // Bucle de auto-adaptación: remueve automáticamente cualquier columna que no exista en el schema de Supabase
  while (intentos < maxIntentos) {
    res = await supabase.from('oatc').insert([payload]).select();
    
    if (!res.error) break;

    // Detectar si el error es de columna faltante en schema cache (PGRST204)
    const match = res.error.message.match(/Could not find the '([^']+)' column/i);
    if (match && match[1] && payload[match[1]] !== undefined) {
      const missingCol = match[1];
      console.warn(`[crearOatc] Columna '${missingCol}' no existe en la tabla remota 'oatc'. Removiendo del payload para compatibilidad.`);
      delete payload[missingCol];
      intentos++;
    } else {
      // Si el error no es por columna faltante, salir del bucle
      break;
    }
  }

  if (res.error) {
    console.error("Error creando OATC:", res.error);
    throw new Error(res.error.message);
  }

  const data = res.data;

  if (agenteId) {
    await supabase.from('agentes').update({ estado_operativo: 'OCUPADO' }).eq('id', agenteId);
  }

  await registrarLog('RECEPCION', `Generó orden para el cliente ${clienteNombre}`, {
    servicios: puntoPartida.map(p => p.nombre).join(', '),
    agenteAsignado: agenteNombre
  });

  return data;
}

export async function obtenerOatcsActivosDelDia(): Promise<OATC[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  const inicioDiaIso = obtenerInicioDiaLimaIso();

  const { data, error } = await supabase
    .from('oatc')
    .select('*')
    .eq('sede_id', sedeId)
    .gte('created_at', inicioDiaIso)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error obteniendo OATCs del día:", error);
    return [];
  }

  return data as OATC[];
}

export async function obtenerHistorialOatcs(
  fechaInicio?: string,
  fechaFin?: string,
  page: number = 1,
  limit: number = 50
): Promise<{ data: OATC[], total: number }> {
  const sedeId = useAppStore.getState().sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';

  let query = supabase
    .from('oatc')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (sedeId) {
    query = query.eq('sede_id', sedeId);
  }

  if (fechaInicio) query = query.gte('created_at', fechaInicio);
  if (fechaFin) query = query.lte('created_at', fechaFin);

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) {
    console.error("Error obteniendo historial OATCs:", error);
    return { data: [], total: 0 };
  }

  return { data: (data as OATC[]) || [], total: count || 0 };
}

export async function obtenerAutorizacionesPendientes(): Promise<OATC[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  const { data, error } = await supabase
    .from('oatc')
    .select('*')
    .eq('sede_id', sedeId)
    .not('cambios_pendientes', 'is', null);

  if (error) {
    console.error("Error obteniendo autorizaciones pendientes:", error);
    return [];
  }

  return (data as OATC[]) || [];
}

export async function resolverAutorizacion(oatcId: string, aprobar: boolean): Promise<boolean> {
  const { data: oatc, error: errOatc } = await supabase
    .from('oatc')
    .select('*')
    .eq('id', oatcId)
    .single();

  if (errOatc || !oatc || !oatc.cambios_pendientes) return false;

  let updatePayload: any = {};

  if (aprobar) {
    const cambios = oatc.cambios_pendientes as PayloadCambioPendiente;
    const puntoPartidaActual = (oatc.punto_partida || []) as ServicioOATCItem[];

    if (cambios.nuevos_servicios && cambios.nuevos_servicios.length > 0) {
      for (const nuevo of cambios.nuevos_servicios) {
        const existingIndex = puntoPartidaActual.findIndex((p) => (p.servicio_id || p.bien_id) === (nuevo.servicio_id || nuevo.bien_id));
        if (existingIndex >= 0) {
          puntoPartidaActual[existingIndex].cantidad = (puntoPartidaActual[existingIndex].cantidad || 1) + (nuevo.cantidad || 1);
        } else {
          puntoPartidaActual.push(nuevo);
        }
      }
    }

    updatePayload = {
      punto_partida: puntoPartidaActual,
      cambios_pendientes: null,
      tipo_demanda: cambios.nuevo_tipo_demanda || oatc.tipo_demanda,
      estado_proceso: 'TRABAJANDO'
    };

    const { data: dem } = await supabase.from('config_demandas').select('estado_disparador').eq('nombre', updatePayload.tipo_demanda).single();
    if (dem && oatc.agente_id) {
       updatePayload.estado_proceso = dem.estado_disparador;
       await supabase.from('agentes').update({ estado_operativo: dem.estado_disparador }).eq('id', oatc.agente_id);
    }

    EcosystemBridge.emit('RECOMPENSA_ASIGNADA', {
      tipoTrigger: 'UPSELL_APPROVED',
      oatcId,
      agenteId: oatc.agente_id,
      agenteNombre: oatc.agente_nombre,
      clienteNombre: oatc.cliente_nombre,
      nuevosServicios: cambios.nuevos_servicios
    }, 'VAIKUNTHA_ERP');

  } else {
    updatePayload = {
      cambios_pendientes: null,
      estado_proceso: oatc.cambios_pendientes?.estado_anterior || 'ASESORANDO'
    };
  }

  const { error } = await supabase
    .from('oatc')
    .update(updatePayload)
    .eq('id', oatcId);

  if (error) {
    console.error("Error resolviendo autorización:", error);
    return false;
  }

  await registrarLog('RECEPCION', aprobar ? `Autorizó upselling OATC` : `Rechazó upselling OATC`, { oatc_id: oatcId });
  return true;
}
