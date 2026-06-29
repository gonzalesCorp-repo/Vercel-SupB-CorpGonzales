import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { registrarLog } from './logger';

const supabase = createClient();

export interface Cliente {
  id: string;
  nombre: string;
  dni: string | null;
  celular: string | null;
}

export interface Bien {
  id: string;
  nombre: string;
  tipo_bien: 'servicio' | 'producto';
  categoria: string;
  precio_venta: number;
  atributos_producto?: any;
  atributos_servicio?: any;
}

export interface Agente {
  id: string;
  nombre: string;
  estado: string;
  rol?: string;
  especialidad?: string;
  badge?: string;
  created_at?: string;
  ultimo_cambio_estado?: string;
}

export interface OATC {
  id?: string;
  cliente_id?: string;
  cliente_nombre: string;
  agente_id?: string;
  agente_nombre?: string;
  punto_partida: any[];
  estado_proceso?: string;
  estado_pago?: string;
  tipo_demanda?: string;
  cambios_pendientes?: any;
  created_at?: string;
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
  
  return data as Cliente[];
}

export async function obtenerCatalogo(tipo: 'servicio' | 'producto'): Promise<Bien[]> {
  const { data, error } = await supabase
    .from('bienes')
    .select('*')
    .eq('tipo_bien', tipo);
    
  if (error) {
    console.error(`Error obteniendo catálogo de ${tipo}:`, error);
  }
  
  // MOCK FALLBACK SI LA BD ESTÁ VACÍA (Para propósitos de demostración/mockup)
  if (!data || data.length === 0) {
    if (tipo === 'servicio') {
      return [
        { id: 's1', nombre: 'Corte Clásico', tipo_bien: 'servicio', categoria: 'Barbería', precio_venta: 35, atributos_servicio: { tiempo_estimado_min: 30 } },
        { id: 's2', nombre: 'Tinte Completo', tipo_bien: 'servicio', categoria: 'Colorimetría', precio_venta: 120, atributos_servicio: { tiempo_estimado_min: 90 } },
        { id: 's3', nombre: 'Manicure Gel', tipo_bien: 'servicio', categoria: 'Manos y Pies', precio_venta: 45, atributos_servicio: { tiempo_estimado_min: 45 } },
        { id: 's4', nombre: 'Corte Fade', tipo_bien: 'servicio', categoria: 'Barbería', precio_venta: 40, atributos_servicio: { tiempo_estimado_min: 40 } },
        { id: 's5', nombre: 'Lavado Especial', tipo_bien: 'servicio', categoria: 'Cuidado Capilar', precio_venta: 25, atributos_servicio: { tiempo_estimado_min: 20 } },
      ];
    } else {
      return [
        { id: 'p1', nombre: 'Cera para cabello', tipo_bien: 'producto', categoria: 'Styling', precio_venta: 50, atributos_producto: { marca: 'Suavecito' } },
        { id: 'p2', nombre: 'Shampoo Matizador', tipo_bien: 'producto', categoria: 'Cuidado Capilar', precio_venta: 85, atributos_producto: { marca: 'Loreal' } },
        { id: 'p3', nombre: 'Aceite de Argán', tipo_bien: 'producto', categoria: 'Cuidado Capilar', precio_venta: 65, atributos_producto: { marca: 'Moroccanoil' } },
      ];
    }
  }
  
  return data as Bien[];
}

export async function obtenerAgentesDisponibles(): Promise<Agente[]> {
  let sedeId = useAppStore.getState().sedeActiva?.id;
  
  if (!sedeId) {
    // Si no hay sede en el store (ej. entrando directo a Operaciones), buscar la sede del usuario logeado
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { data: agente } = await supabase.from('agentes').select('id').eq('email', user.email).single();
      if (agente) {
        const { data: su } = await supabase.from('sedes_usuarios').select('sede_id').eq('agente_id', agente.id).limit(1);
        if (su && su.length > 0) {
          sedeId = su[0].sede_id;
        }
      }
    }
  }

  if (!sedeId) return [];

  // Hacer fetch normal y filtrar en cliente
  const { data, error } = await supabase
    .from('agentes')
    .select('id, nombre, estado, rol, especialidad, ultimo_cambio_estado, created_at, sedes_usuarios(sede_id)');
    
  if (error) {
    console.error("Error obteniendo agentes:", error);
    return [];
  }
  
  const filtered = data.filter((agente: any) => 
    agente.sedes_usuarios && agente.sedes_usuarios.some((su: any) => su.sede_id === sedeId)
  );
  
  return filtered as Agente[];
}

export async function crearOatc(
  clienteId: string | null,
  clienteNombre: string,
  agenteId: string | null,
  agenteNombre: string,
  puntoPartida: any[],
  tipoDemanda: string = 'Cliente',
  estadoProceso: string = 'ASESORIA'
) {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  
  const { data, error } = await supabase
    .from('oatc')
    .insert([{
      cliente_id: clienteId,
      cliente_nombre: clienteNombre,
      agente_id: agenteId,
      agente_nombre: agenteNombre,
      punto_partida: puntoPartida,
      tipo_demanda: tipoDemanda,
      estado_proceso: estadoProceso,
      sede_id: sedeId
    }])
    .select();
    
  if (error) {
    console.error("Error creando OATC:", error);
    throw new Error(error.message);
  }
  
  // Registrar en Logs
  await registrarLog('RECEPCION', `Generó orden para el cliente ${clienteNombre}`, { 
    servicios: puntoPartida.map(p => p.nombre).join(', '),
    agenteAsignado: agenteNombre
  });
  
  return data;
}

export async function obtenerOatcsActivosDelDia(): Promise<OATC[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  // Nota: Al ejecutarse en el cliente (Browser), setHours asume la zona horaria local de la sede.
  // toISOString() lo convierte a UTC para comparar correctamente con 'timestamptz' en Supabase.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('oatc')
    .select('*')
    .eq('sede_id', sedeId)
    .gte('created_at', startOfDay.toISOString())
    .neq('estado_proceso', 'FINALIZADO')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error obteniendo OATCs del día:", error);
    return [];
  }

  return data as OATC[];
}

export async function obtenerAutorizacionesPendientes(): Promise<OATC[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  const { data, error } = await supabase
    .from('oatc')
    .select('*')
    .eq('sede_id', sedeId)
    .eq('estado_proceso', 'PENDIENTE_CONFIRMACION')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error obteniendo autorizaciones pendientes:", error);
    return [];
  }
  return data as OATC[];
}

export async function resolverAutorizacion(oatcId: string, aprobar: boolean): Promise<boolean> {
  // Obtener la OATC actual
  const { data: oatc, error: errOatc } = await supabase
    .from('oatc')
    .select('*')
    .eq('id', oatcId)
    .single();

  if (errOatc || !oatc || !oatc.cambios_pendientes) return false;

  let updatePayload: any = {};

  if (aprobar) {
    const cambios = oatc.cambios_pendientes;
    const puntoPartidaActual = oatc.punto_partida || [];
    
    // Agregar nuevos servicios
    if (cambios.nuevos_servicios && cambios.nuevos_servicios.length > 0) {
      for (const nuevo of cambios.nuevos_servicios) {
        const existingIndex = puntoPartidaActual.findIndex((p: any) => p.servicio_id === nuevo.servicio_id);
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
      estado_proceso: 'PRE_COBRADO' // O el estado disparador, pero usar 'PRE_COBRADO' o 'TRABAJANDO' (por ahora hardcodeado o sacado de la config)
    };

    // Actualizar estado del agente
    const { data: dem } = await supabase.from('config_demandas').select('estado_disparador').eq('nombre', updatePayload.tipo_demanda).single();
    if (dem && oatc.agente_id) {
       updatePayload.estado_proceso = dem.estado_disparador;
       await supabase.from('agentes').update({ estado: dem.estado_disparador }).eq('id', oatc.agente_id);
    } else {
       updatePayload.estado_proceso = 'TRABAJANDO';
    }

  } else {
    // Rechazar
    updatePayload = {
      cambios_pendientes: null,
      estado_proceso: oatc.cambios_pendientes.estado_anterior || 'ASESORANDO'
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
