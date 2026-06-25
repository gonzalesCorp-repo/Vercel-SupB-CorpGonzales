import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';

const supabase = createClient();

export interface Ubicacion {
  id: string;
  nombre: string;
  tipo: 'lavadero' | 'tocador' | 'silla' | 'cabina' | 'sillón' | 'en_espera';
  estado: string;
}

export interface MapaSalonData {
  ubicacion: Ubicacion;
  agente_nombre?: string;
  cliente_nombre?: string;
  hora_inicio_atencion?: string;
  tiempo_estimado_min?: number;
}

export async function obtenerMapaSalon(): Promise<MapaSalonData[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  // 1. Obtener ubicaciones
  const { data: ubicaciones, error: uError } = await supabase
    .from('ubicaciones')
    .select('*')
    .eq('sede_id', sedeId)
    .order('nombre');

  if (uError) {
    console.error("Error obteniendo ubicaciones:", uError);
    return [];
  }

  // 2. Obtener OATCs activos (ASESORANDO) para cruzar con ubicaciones
  const { data: oatcs, error: oError } = await supabase
    .from('oatc')
    .select('*')
    .eq('estado_proceso', 'ASESORANDO')
    .eq('sede_id', sedeId);

  if (oError) {
    console.error("Error obteniendo oatcs activos para WFM:", oError);
  }

  // 3. Mapear datos
  const mapa = (ubicaciones as Ubicacion[]).map(ubi => {
    // Buscar si hay un OATC en esta ubicacion
    const ocupante = (oatcs || []).find((o: any) => o.ubicacion_id === ubi.id);
    
    // Calcular tiempo estimado total del punto de partida
    let tiempo_estimado = 0;
    if (ocupante && ocupante.punto_partida) {
      ocupante.punto_partida.forEach((item: any) => {
        if (item.atributos_servicio?.tiempo_estimado_min) {
          tiempo_estimado += item.atributos_servicio.tiempo_estimado_min;
        } else {
           // Default fallback por servicio si no tiene
           tiempo_estimado += 30;
        }
      });
    }

    return {
      ubicacion: ubi,
      agente_nombre: ocupante?.agente_nombre,
      cliente_nombre: ocupante?.cliente_nombre,
      hora_inicio_atencion: ocupante?.hora_inicio_atencion || ocupante?.created_at,
      tiempo_estimado_min: tiempo_estimado
    } as MapaSalonData;
  });

  return mapa;
}
