import { createClient } from '@/lib/supabase/client';
import { OATC } from './recepcion';

const supabase = createClient();

export interface ReporteRecepcion {
  atencionesOk: number;
  atencionesFallas: number;
  efectividad: number;
  
  personalPorEspecialidad: { especialidad: string; cantidad: number }[];
  
  flujoGlobal: {
    total: number;
    clientes: number;
    turnos: number;
    asesorias: number;
  };
  
  reclamos: OATC[];
  
  rankingAgentes: {
    agente_nombre: string;
    total: number;
    clientes: number;
    turnos: number;
  }[];
}

export async function obtenerDatosReporteRecepcion(sedeId: string, fecha: string): Promise<ReporteRecepcion> {
  const inicioDia = new Date(`${fecha}T00:00:00.000Z`).toISOString();
  const finDia = new Date(`${fecha}T23:59:59.999Z`).toISOString();

  // 1. Obtener OATC del día en esa sede
  const { data: oatcData, error: oatcError } = await supabase
    .from('oatc')
    .select('*')
    .eq('sede_id', sedeId)
    .gte('created_at', inicioDia)
    .lte('created_at', finDia);

  if (oatcError) {
    console.error("Error fetching OATC para reporte:", oatcError);
  }

  const ordenes = (oatcData || []) as OATC[];

  // 2. Procesar Balance de Atenciones
  const fallas = ordenes.filter(o => o.estado_proceso === 'CANCELADO' || o.estado_proceso === 'FALLIDO' || o.tipo_demanda === 'Error/Corrección');
  const ok = ordenes.filter(o => !fallas.includes(o));
  
  const atencionesOk = ok.length;
  const atencionesFallas = fallas.length;
  const totalAtenciones = atencionesOk + atencionesFallas;
  const efectividad = totalAtenciones > 0 ? Math.round((atencionesOk / totalAtenciones) * 100) : 0;

  // 3. Procesar Flujo Global
  const clientes = ordenes.filter(o => o.tipo_demanda?.toLowerCase().includes('cliente')).length;
  const turnos = ordenes.filter(o => o.tipo_demanda?.toLowerCase().includes('turno')).length;
  const asesorias = ordenes.filter(o => o.tipo_demanda?.toLowerCase().includes('asesor')).length;

  const flujoGlobal = {
    total: ordenes.length,
    clientes,
    turnos,
    asesorias
  };

  // 4. Reclamos (Auditoría)
  const reclamos = ordenes.filter(o => o.tipo_demanda === 'Error/Corrección' || o.tipo_demanda === 'Reclamo' || o.estado_proceso === 'FALLIDO');

  // 5. Ranking de Agentes
  const agentesMap: Record<string, { total: number, clientes: number, turnos: number }> = {};
  
  ordenes.forEach(o => {
    if (!o.agente_nombre) return;
    const nombre = o.agente_nombre;
    if (!agentesMap[nombre]) {
      agentesMap[nombre] = { total: 0, clientes: 0, turnos: 0 };
    }
    agentesMap[nombre].total++;
    
    if (o.tipo_demanda?.toLowerCase().includes('cliente')) {
      agentesMap[nombre].clientes++;
    } else if (o.tipo_demanda?.toLowerCase().includes('turno')) {
      agentesMap[nombre].turnos++;
    }
  });

  const rankingAgentes = Object.entries(agentesMap)
    .map(([agente_nombre, stats]) => ({
      agente_nombre,
      ...stats
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10); // Top 10

  // 6. Personal en Sala por Especialidad (Mockeado con Agentes activos en esa sede si existiese, 
  // pero por ahora contamos a los agentes que tuvieron transacciones hoy, si no hay BD de sesiones).
  // Podríamos hacer una query a 'sedes_usuarios' o 'agentes'. Para el MVP, usaremos la tabla agentes global,
  // O podemos derivarlo de los agentes que operaron hoy:
  
  // Vamos a obtener a todos los agentes que están en el ranking y agrupar (esto es un hack temporal, 
  // idealmente esto se lee de control de asistencia).
  const personalPorEspecialidad = [
    { especialidad: 'Estilismo', cantidad: Math.max(1, Math.floor(rankingAgentes.length * 0.7)) },
    { especialidad: 'Cosmiatría', cantidad: Math.max(0, Math.floor(rankingAgentes.length * 0.2)) },
    { especialidad: 'Administración', cantidad: Math.max(1, Math.floor(rankingAgentes.length * 0.1)) }
  ];

  return {
    atencionesOk,
    atencionesFallas,
    efectividad,
    personalPorEspecialidad,
    flujoGlobal,
    reclamos,
    rankingAgentes
  };
}
