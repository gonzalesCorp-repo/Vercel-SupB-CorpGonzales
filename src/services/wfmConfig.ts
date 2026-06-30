import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { registrarLog } from './logger';

export interface ConfigPeticion {
  id: string;
  nombre: string;
  estado_destino: string;
  actualiza_timestamp: boolean;
  penaliza_cola: boolean;
  color: string;
  sede_id?: string | null;
}

import { useAppStore } from '@/store/useAppStore';

export async function obtenerConfigPeticiones(): Promise<ConfigPeticion[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  
  const { data, error } = await supabase
    .from('config_peticiones')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error("Error obteniendo configuraciones WFM:", error);
    return [];
  }
  
  // RLS might return for multiple sedes if user has multiple sedes, 
  // so we filter by current sede (or global)
  const filtered = data.filter((d: any) => !d.sede_id || d.sede_id === sedeId);
  return filtered as ConfigPeticion[];
}

export async function guardarConfigPeticion(config: Partial<ConfigPeticion>): Promise<boolean> {
  const isNew = !config.id;
  
  const payload: any = {
    nombre: config.nombre,
    estado_destino: config.estado_destino || 'DISPONIBLE',
    actualiza_timestamp: config.actualiza_timestamp || false,
    penaliza_cola: config.penaliza_cola || false,
    color: config.color || 'bg-slate-100 text-slate-700'
  };
  
  if (config.sede_id !== undefined) {
    payload.sede_id = config.sede_id;
  }

  let errorResult = null;

  if (isNew) {
    const { error } = await supabase.from('config_peticiones').insert([payload]);
    errorResult = error;
  } else {
    const { error } = await supabase.from('config_peticiones').update(payload).eq('id', config.id);
    errorResult = error;
  }

  if (errorResult) {
    console.error("Error guardando configuracion WFM:", errorResult);
    return false;
  }

  await registrarLog('SISTEMA', `${isNew ? 'Creó' : 'Actualizó'} configuración WFM: ${config.nombre}`);
  return true;
}

export async function eliminarConfigPeticion(id: string, nombre: string): Promise<boolean> {
  const { error } = await supabase.from('config_peticiones').delete().eq('id', id);
  if (error) {
    console.error("Error eliminando configuración:", error);
    return false;
  }
  
  await registrarLog('SISTEMA', `Eliminó configuración WFM: ${nombre}`);
  return true;
}

// -------------------------------------------------------------
// NUEVO: Gestión de Tipos de Demanda (OATC Triggers)
// -------------------------------------------------------------

export interface ConfigDemanda {
  id: string;
  nombre: string;
  estado_disparador: string;
  sede_id?: string | null;
}

export async function obtenerConfigDemandas(): Promise<ConfigDemanda[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  
  const { data, error } = await supabase
    .from('config_demandas')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error("Error obteniendo tipos de demanda:", error);
    return [];
  }
  
  const filtered = data.filter((d: any) => !d.sede_id || d.sede_id === sedeId);
  return filtered as ConfigDemanda[];
}

export async function guardarConfigDemanda(config: Partial<ConfigDemanda>): Promise<boolean> {
  const isNew = !config.id;
  
  const payload: any = {
    nombre: config.nombre,
    estado_disparador: config.estado_disparador || 'ASESORANDO'
  };
  
  if (config.sede_id !== undefined) {
    payload.sede_id = config.sede_id;
  }

  let errorResult = null;

  if (isNew) {
    const { error } = await supabase.from('config_demandas').insert([payload]);
    errorResult = error;
  } else {
    const { error } = await supabase.from('config_demandas').update(payload).eq('id', config.id);
    errorResult = error;
  }

  if (errorResult) {
    console.error("Error guardando tipo de demanda:", errorResult);
    return false;
  }

  await registrarLog('SISTEMA', `${isNew ? 'Creó' : 'Actualizó'} tipo de demanda: ${config.nombre}`);
  return true;
}

export async function eliminarConfigDemanda(id: string, nombre: string): Promise<boolean> {
  const { error } = await supabase.from('config_demandas').delete().eq('id', id);
  if (error) {
    console.error("Error eliminando tipo de demanda:", error);
    return false;
  }
  await registrarLog('SISTEMA', `Eliminó tipo de demanda: ${nombre}`);
  return true;
}

// ----------------------------------------------------
// MOTIVOS DE CANCELACIÓN (NUEVO)
// ----------------------------------------------------

export interface MotivoCancelacion {
  id: string;
  motivo: string;
  activo: boolean;
  created_at?: string;
}

export async function obtenerTodosMotivosCancelacion(): Promise<MotivoCancelacion[]> {
  const { data, error } = await supabase
    .from('motivos_cancelacion')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error("Error obteniendo motivos de cancelación (todos):", error);
    return [];
  }
  return data || [];
}

export async function crearMotivoCancelacion(motivo: string): Promise<boolean> {
  const { error } = await supabase.from('motivos_cancelacion').insert([{
    motivo,
    activo: true
  }]);

  if (error) {
    console.error("Error creando motivo de cancelación:", error);
    return false;
  }
  await registrarLog('SISTEMA', `Creó motivo de cancelación: ${motivo}`);
  return true;
}

export async function actualizarMotivoCancelacion(id: string, motivo: string, activo: boolean): Promise<boolean> {
  const { error } = await supabase.from('motivos_cancelacion').update({
    motivo,
    activo
  }).eq('id', id);

  if (error) {
    console.error("Error actualizando motivo de cancelación:", error);
    return false;
  }
  await registrarLog('SISTEMA', `Actualizó motivo de cancelación (ID: ${id}) - Activo: ${activo}`);
  return true;
}
