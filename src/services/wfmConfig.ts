import { supabase } from '@/lib/supabase';
import { registrarLog } from './logger';

export interface ConfigPeticion {
  id: string;
  nombre: string;
  estado_destino: string;
  actualiza_timestamp: boolean;
  penaliza_cola: boolean;
  color: string;
}

export async function obtenerConfigPeticiones(): Promise<ConfigPeticion[]> {
  const { data, error } = await supabase
    .from('config_peticiones')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error("Error obteniendo configuraciones WFM:", error);
    return [];
  }
  return data as ConfigPeticion[];
}

export async function guardarConfigPeticion(config: Partial<ConfigPeticion>): Promise<boolean> {
  const isNew = !config.id;
  
  const payload = {
    nombre: config.nombre,
    estado_destino: config.estado_destino || 'DISPONIBLE',
    actualiza_timestamp: config.actualiza_timestamp || false,
    penaliza_cola: config.penaliza_cola || false,
    color: config.color || 'bg-slate-100 text-slate-700'
  };

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
}

export async function obtenerConfigDemandas(): Promise<ConfigDemanda[]> {
  const { data, error } = await supabase
    .from('config_demandas')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error("Error obteniendo tipos de demanda:", error);
    return [];
  }
  return data as ConfigDemanda[];
}

export async function guardarConfigDemanda(config: Partial<ConfigDemanda>): Promise<boolean> {
  const isNew = !config.id;
  
  const payload = {
    nombre: config.nombre,
    estado_disparador: config.estado_disparador || 'ASESORANDO'
  };

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
