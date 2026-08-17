import { createClient } from '@/lib/supabase/client';
import { registrarLog } from './logger';

export interface CriteriosReglaCliente {
  min_visitas_30d?: number;
  min_consumo_total_30d?: number;
  min_atenciones_historicas?: number;
  min_compras_retail_30d?: number;
  min_consumo_retail_30d?: number;
  min_atenciones_mismo_staff?: number;
}

export interface ReglaEtiquetaCliente {
  id: string;
  nombre: string;
  codigo_slug: string;
  descripcion?: string;
  icono: string;
  color_badge: string;
  prioridad: number;
  activo: boolean;
  criterios: CriteriosReglaCliente;
  created_at?: string;
}

export interface MetricasCliente {
  clienteId: string;
  atencionesHistoricas: number;
  visitas30d: number;
  consumoTotal30d: number;
  consumoTotalHistorico: number;
  comprasRetail30d: number;
  consumoRetail30d: number;
  staffFavorito?: { agenteId?: string; agenteNombre: string; atenciones: number } | null;
  ultimaVisita?: string | null;
}

/**
 * Obtiene todas las reglas de etiquetas registradas
 */
export async function obtenerReglasEtiquetas(soloActivas = false): Promise<ReglaEtiquetaCliente[]> {
  const supabase = createClient();
  let query = supabase
    .from('reglas_etiquetas_clientes')
    .select('*')
    .order('prioridad', { ascending: false });

  if (soloActivas) {
    query = query.eq('activo', true);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error obteniendo reglas de etiquetas de clientes:', error);
    return [];
  }
  return (data || []) as ReglaEtiquetaCliente[];
}

/**
 * Guarda o actualiza una regla de etiqueta
 */
export async function guardarReglaEtiqueta(regla: Partial<ReglaEtiquetaCliente>): Promise<ReglaEtiquetaCliente | null> {
  const supabase = createClient();
  
  if (regla.id) {
    const { data, error } = await supabase
      .from('reglas_etiquetas_clientes')
      .update({
        nombre: regla.nombre,
        codigo_slug: regla.codigo_slug,
        descripcion: regla.descripcion,
        icono: regla.icono || 'Sparkles',
        color_badge: regla.color_badge || 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        prioridad: regla.prioridad ?? 1,
        activo: regla.activo ?? true,
        criterios: regla.criterios || {}
      })
      .eq('id', regla.id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando regla de etiqueta:', error);
      return null;
    }
    await registrarLog('REGLA_CLIENTE_ACTUALIZADA', `Regla "${regla.nombre}" actualizada.`);
    return data as ReglaEtiquetaCliente;
  } else {
    const slug = regla.codigo_slug || (regla.nombre || 'regla').toLowerCase().replace(/\s+/g, '_');
    const { data, error } = await supabase
      .from('reglas_etiquetas_clientes')
      .insert([{
        nombre: regla.nombre,
        codigo_slug: slug,
        descripcion: regla.descripcion,
        icono: regla.icono || 'Sparkles',
        color_badge: regla.color_badge || 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        prioridad: regla.prioridad ?? 1,
        activo: regla.activo ?? true,
        criterios: regla.criterios || {}
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creando regla de etiqueta:', error);
      return null;
    }
    await registrarLog('REGLA_CLIENTE_CREADA', `Nueva regla "${regla.nombre}" creada.`);
    return data as ReglaEtiquetaCliente;
  }
}

/**
 * Elimina una regla de etiqueta
 */
export async function eliminarReglaEtiqueta(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('reglas_etiquetas_clientes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando regla de etiqueta:', error);
    return false;
  }
  await registrarLog('REGLA_CLIENTE_ELIMINADA', `Regla #${id} eliminada.`);
  return true;
}

/**
 * Calcula las métricas transaccionales reales de un cliente
 */
export async function calcularMetricasCliente(clienteId: string, clienteNombre?: string, clienteDni?: string): Promise<MetricasCliente> {
  const supabase = createClient();
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  const fecha30dIso = hace30Dias.toISOString();

  // Consultar OATCs del cliente (consultando columnas válidas existentes en public.oatc)
  let queryOatc = supabase.from('oatc').select('id, created_at, estado_proceso, agente_id, agente_nombre, punto_partida');
  
  if (clienteId && !clienteId.startsWith('cli_')) {
    queryOatc = queryOatc.eq('cliente_id', clienteId);
  } else if (clienteDni) {
    queryOatc = queryOatc.eq('cliente_dni', clienteDni);
  } else if (clienteNombre) {
    queryOatc = queryOatc.ilike('cliente_nombre', `%${clienteNombre}%`);
  }

  const { data: oatcs, error: errOatc } = await queryOatc;
  if (errOatc) {
    console.error(`[reglasClientes] Error consultando OATCs para cliente ${clienteId}:`, errOatc);
  }
  const listaOatcs = oatcs || [];
  const oatcIds = listaOatcs.map((o: any) => o.id);

  // Consultar tickets asociados a esas OATCs
  let tickets: any[] = [];
  if (oatcIds.length > 0) {
    const { data: dataTickets } = await supabase
      .from('oatc_tickets')
      .select('*')
      .in('oatc_id', oatcIds);
    tickets = dataTickets || [];
  }

  // Cálculos agregados
  const atencionesHistoricas = listaOatcs.length;
  let visitas30d = 0;
  let consumoTotal30d = 0;
  let consumoTotalHistorico = 0;
  let comprasRetail30d = 0;
  let consumoRetail30d = 0;
  const staffCounts: Record<string, { agenteId?: string; count: number }> = {};
  let ultimaVisita: string | null = null;

  listaOatcs.forEach((o: any) => {
    const esReciente = o.created_at && o.created_at >= fecha30dIso;
    if (esReciente) visitas30d++;

    if (!ultimaVisita || (o.created_at && o.created_at > ultimaVisita)) {
      ultimaVisita = o.created_at;
    }

    // Calcular monto de la OATC directa (por punto_partida o total)
    let montoOatc = Number(o.total || o.total_estimado || 0);
    if (montoOatc === 0 && Array.isArray(o.punto_partida)) {
      montoOatc = o.punto_partida.reduce((acc: number, p: any) => acc + Number(p.precio || 0), 0);
    }
    
    consumoTotalHistorico += montoOatc;
    if (esReciente) {
      consumoTotal30d += montoOatc;
    }

    // Evaluar compras retail en punto_partida
    if (Array.isArray(o.punto_partida)) {
      o.punto_partida.forEach((p: any) => {
        if (p.tipo_bien === 'producto' || p.tipo === 'producto') {
          if (esReciente) {
            comprasRetail30d += Number(p.cantidad || 1);
            consumoRetail30d += Number(p.precio || 0) * Number(p.cantidad || 1);
          }
        }
      });
    }

    if (o.agente_nombre) {
      if (!staffCounts[o.agente_nombre]) {
        staffCounts[o.agente_nombre] = { agenteId: o.agente_id, count: 0 };
      }
      staffCounts[o.agente_nombre].count++;
    }
  });

  // Si hay tickets adicionales en oatc_tickets, sumar los que no dupliquen
  if (tickets.length > 0) {
    tickets.forEach(t => {
      const monto = Number(t.monto_total || 0);
      const tFecha = t.created_at || (listaOatcs.find((o: any) => o.id === t.oatc_id)?.created_at);
      const esReciente = tFecha && tFecha >= fecha30dIso;

      // Evaluar compras retail en tickets
      if (t.tipo_ticket === 'producto' || (t.items || []).some((i: any) => i.tipo === 'producto')) {
        (t.items || []).forEach((item: any) => {
          if (item.tipo === 'producto') {
            if (esReciente) {
              comprasRetail30d += Number(item.cantidad || 1);
              consumoRetail30d += Number(item.precio_final || item.precio_base || 0) * Number(item.cantidad || 1);
            }
          }
        });
      }
    });
  }

  // Determinar staff favorito
  let staffFavorito: MetricasCliente['staffFavorito'] = null;
  let maxAtenciones = 0;
  for (const [nombre, info] of Object.entries(staffCounts)) {
    if (info.count > maxAtenciones) {
      maxAtenciones = info.count;
      staffFavorito = {
        agenteNombre: nombre,
        agenteId: info.agenteId,
        atenciones: info.count
      };
    }
  }

  return {
    clienteId,
    atencionesHistoricas,
    visitas30d,
    consumoTotal30d,
    consumoTotalHistorico,
    comprasRetail30d,
    consumoRetail30d,
    staffFavorito,
    ultimaVisita
  };
}

/**
 * Evalúa qué insignias/etiquetas ha ganado el cliente según sus métricas
 */
export function evaluarEtiquetas(metricas: MetricasCliente, reglas: ReglaEtiquetaCliente[]): ReglaEtiquetaCliente[] {
  const ganadas: ReglaEtiquetaCliente[] = [];

  for (const regla of reglas) {
    if (!regla.activo) continue;
    const c = regla.criterios || {};
    let cumple = true;

    // 1. Visitas últimos 30 días
    if (c.min_visitas_30d !== undefined && metricas.visitas30d < c.min_visitas_30d) {
      cumple = false;
    }

    // 2. Consumo total últimos 30 días
    if (c.min_consumo_total_30d !== undefined && metricas.consumoTotal30d < c.min_consumo_total_30d) {
      cumple = false;
    }

    // 3. Atenciones históricas acumuladas
    if (c.min_atenciones_historicas !== undefined && metricas.atencionesHistoricas < c.min_atenciones_historicas) {
      cumple = false;
    }

    // 4. Compras retail últimos 30 días
    if (c.min_compras_retail_30d !== undefined && metricas.comprasRetail30d < c.min_compras_retail_30d) {
      cumple = false;
    }

    // 5. Consumo retail últimos 30 días
    if (c.min_consumo_retail_30d !== undefined && metricas.consumoRetail30d < c.min_consumo_retail_30d) {
      cumple = false;
    }

    // 6. Atenciones con el mismo staff (Fidelización)
    if (c.min_atenciones_mismo_staff !== undefined) {
      const maxMismoStaff = metricas.staffFavorito?.atenciones || 0;
      if (maxMismoStaff < c.min_atenciones_mismo_staff) {
        cumple = false;
      }
    }

    if (cumple) {
      ganadas.push(regla);
    }
  }

  // Ordenar por prioridad descendente
  return ganadas.sort((a, b) => (b.prioridad || 0) - (a.prioridad || 0));
}

/**
 * Función de conveniencia: Obtiene las reglas activas, calcula métricas del cliente y devuelve las etiquetas ganadas
 */
export async function calcularEtiquetasCliente(clienteId: string, clienteNombre?: string, clienteDni?: string): Promise<ReglaEtiquetaCliente[]> {
  const [metricas, reglas] = await Promise.all([
    calcularMetricasCliente(clienteId, clienteNombre, clienteDni),
    obtenerReglasEtiquetas(true)
  ]);
  return evaluarEtiquetas(metricas, reglas);
}

