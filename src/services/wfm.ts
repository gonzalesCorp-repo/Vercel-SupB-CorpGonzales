import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';

const supabase = createClient();

export interface Ubicacion {
  id: string;
  nombre: string;
  tipo: 'lavadero' | 'tocador' | 'silla' | 'cabina' | 'sillón' | 'en_espera' | 'pared' | 'ruta';
  estado: string;
  grid_x?: number;
  grid_y?: number;
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
  }

  // 2. MOCK FALLBACK SI LA BD ESTÁ VACÍA (Para propósitos de demostración/mockup)
  let ubicacionesReales = ubicaciones || [];
  if (ubicacionesReales.length === 0) {
    ubicacionesReales = [
      { id: 'u1', nombre: 'Lavadero 1', tipo: 'lavadero', estado: 'OCUPADO', grid_x: 2, grid_y: 2 },
      { id: 'u2', nombre: 'Lavadero 2', tipo: 'lavadero', estado: 'DISPONIBLE', grid_x: 3, grid_y: 2 },
      { id: 'u3', nombre: 'Tocador 1', tipo: 'tocador', estado: 'OCUPADO', grid_x: 5, grid_y: 4 },
      { id: 'u4', nombre: 'Tocador 2', tipo: 'tocador', estado: 'DISPONIBLE', grid_x: 6, grid_y: 4 },
      { id: 'u5', nombre: 'Cabina VIP', tipo: 'cabina', estado: 'DISPONIBLE', grid_x: 8, grid_y: 2 },
      // Paredes simuladas
      { id: 'p1', nombre: 'Pared', tipo: 'pared', estado: 'ESTATICO', grid_x: 4, grid_y: 1 },
      { id: 'p2', nombre: 'Pared', tipo: 'pared', estado: 'ESTATICO', grid_x: 4, grid_y: 2 },
      { id: 'p3', nombre: 'Pared', tipo: 'pared', estado: 'ESTATICO', grid_x: 4, grid_y: 3 },
    ] as Ubicacion[];
  }

  // 3. Obtener OATCs activos (ASESORANDO) para cruzar con ubicaciones
  const { data: oatcs, error: oError } = await supabase
    .from('oatc')
    .select('*')
    .eq('estado_proceso', 'ASESORANDO')
    .eq('sede_id', sedeId);

  if (oError) {
    console.error("Error obteniendo oatcs activos para WFM:", oError);
  }

  // MOCK FALLBACK OATCs si DB vacía
  let oatcsReales = oatcs || [];
  if (oatcsReales.length === 0) {
    oatcsReales = [
      { ubicacion_id: 'u1', agente_nombre: 'Carlos', cliente_nombre: 'Ana M.', hora_inicio_atencion: new Date(Date.now() - 15 * 60000).toISOString(), punto_partida: [{atributos_servicio: {tiempo_estimado_min: 30}}] },
      { ubicacion_id: 'u3', agente_nombre: 'Lucía', cliente_nombre: 'Pedro', hora_inicio_atencion: new Date(Date.now() - 40 * 60000).toISOString(), punto_partida: [{atributos_servicio: {tiempo_estimado_min: 45}}] },
    ];
  }

  // 4. Mapear datos
  const mapa = (ubicacionesReales as Ubicacion[]).map((ubi: Ubicacion) => {
    // Buscar si hay un OATC en esta ubicacion
    const ocupante = oatcsReales.find((o: any) => o.ubicacion_id === ubi.id);
    
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
