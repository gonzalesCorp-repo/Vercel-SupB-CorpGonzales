import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { OATC } from './recepcion';

const supabase = createClient();

// Tipos
export interface InsumoPrincipal {
  id: string;
  bien_id: string;
  bienes?: {
    nombre: string;
    categoria: string;
    tipo_bien: string;
    sku?: string;
    peso_envase_tara_gramos?: number;
    peso_neto_total_gramos?: number;
    factor_densidad?: number;
    merma_tolerancia_porcentaje?: number;
  };
  proveedor: string;
  marca: string;
  linea: string;
  presentacion: string;
  stock: number;
  stock_minimo: number;
  costo_unitario: number;
  ubicacion: string;
}

export interface InsumoLaboratorio {
  id: string;
  bien_id: string;
  almacen_principal?: InsumoPrincipal;
  stock_actual: number;
  stock_en_uso: number;
}

export interface ItemPesajeIoT {
  bien_id: string;
  sku?: string;
  nombre: string;
  peso_bruto_balanza_g: number;
  tara_envase_g: number;
  peso_neto_real_g: number;
  densidad: number;
  volumen_neto_ml: number;
  tolerancia_merma_porc: number;
}

export interface MovimientoKardex {
  id: string;
  fecha_hora: string;
  tipo_movimiento: string;
  bien_id: string;
  bienes?: { nombre: string; sku?: string; costo_base?: number };
  descripcion: string;
  cantidad: number;
  cantidad_teorica?: number;
  cantidad_real?: number;
  merma_delta_gramos?: number;
  merma_delta_porcentaje?: number;
  estado_merma?: 'DENTRO_TOLERANCIA' | 'EXCESO_DESPERDICIO' | 'SUB_DOSIFICACION' | 'NO_APLICA';
  es_produccion_subreceta?: boolean;
  lote_produccion?: string;
  origen?: string;
  destino?: string;
  agente_id?: string;
  agentes?: { nombre: string };
  costo_unitario?: number;
}

export interface LoteProduccionBOH {
  id: string;
  sede_id: string;
  codigo_lote: string;
  bien_intermedio_id: string;
  bien_nombre: string;
  area_produccion: string;
  cantidad_producida_teorica: number;
  cantidad_producida_real: number;
  unidad_medida: string;
  costo_total_lote: number;
  costo_unitario_gramo: number;
  fecha_elaboracion: string;
  fecha_vencimiento?: string;
  insumos_utilizados: Array<{ bien_id: string; nombre: string; cantidad: number; unidad: string }>;
  estado: string;
  responsable_nombre?: string;
}

// 1. Obtener Órdenes de Servicio (OATC) y Solicitudes de Insumos Pendientes
export async function obtenerPedidosPendientesLab() {
  const sedeId = useAppStore.getState().sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';

  try {
    const [resLab, resInsumos, resOatc] = await Promise.all([
      supabase
        .from('lab_pedidos')
        .select('*, oatc(*)')
        .eq('estado', 'PENDIENTE')
        .eq('sede_id', sedeId)
        .order('created_at', { ascending: false }),
      supabase
        .from('pedidos_insumos')
        .select('*')
        .eq('estado', 'PENDIENTE')
        .eq('sede_id', sedeId)
        .order('created_at', { ascending: false }),
      supabase
        .from('oatc')
        .select('*')
        .in('estado_proceso', ['EN_PROCESO', 'ASESORIA', 'EN_ESPERA', 'EN_EXPOSICION'])
        .eq('sede_id', sedeId)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    const lista: any[] = [];

    // 1. Solicitudes explícitas de insumos de piso
    (resInsumos.data || []).forEach((pi: any) => {
      lista.push({
        id: `solicitud_${pi.id}`,
        tipo: 'SOLICITUD_PISO',
        solicitud_id: pi.id,
        origen: 'Estación de Piso',
        agente_nombre: pi.agente_nombre || 'Especialista',
        insumo_solicitado: pi.insumo_solicitado,
        created_at: pi.created_at,
        oatc: {
          cliente_nombre: 'Solicitud Rápida de Piso',
          agente_nombre: pi.agente_nombre,
          secuencia: 'PISO'
        }
      });
    });

    // 2. Pedidos formales de laboratorio
    (resLab.data || []).forEach((lp: any) => {
      lista.push({
        id: lp.id,
        tipo: 'LAB_PEDIDO',
        ...lp
      });
    });

    // 3. OATCs activas en piso con potencial despacho (si no tienen ya un lab_pedido pendiente)
    const idsConPedido = new Set((resLab.data || []).map((p: any) => p.oatc_id));
    (resOatc.data || []).forEach((o: any) => {
      if (!idsConPedido.has(o.id)) {
        lista.push({
          id: `oatc_potencial_${o.id}`,
          tipo: 'OATC_POTENCIAL',
          oatc_id: o.id,
          oatc: o,
          created_at: o.created_at
        });
      }
    });

    return lista;
  } catch (err) {
    console.error("Error obteniendo pedidos pendientes lab:", err);
    return [];
  }
}

// 2. Obtener Stock Completo optimizado O(N) con Map lookup
export async function obtenerStockUbicacion() {
  const sedeId = useAppStore.getState().sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';

  try {
    const [resPrincipal, resLab] = await Promise.all([
      supabase
        .from('almacen_principal')
        .select('id, bien_id, marca, linea, presentacion, ubicacion, stock, stock_minimo, costo_unitario, bienes(id, nombre, categoria, tipo_bien, sku, peso_envase_tara_gramos, peso_neto_total_gramos, factor_densidad, es_intermedio_subreceta)')
        .eq('sede_id', sedeId),
      supabase
        .from('almacen_laboratorio')
        .select('id, bien_id, stock_actual, stock_en_uso')
        .eq('sede_id', sedeId)
    ]);

    if (resPrincipal.error || resLab.error) {
      console.warn("[WMS Lab] Advertencia consultando stock:", resPrincipal.error?.message || resLab.error?.message);
      return [];
    }

    const labMap = new Map<string, { stock_actual: number; stock_en_uso: number }>();
    (resLab.data || []).forEach((item: any) => {
      if (item.bien_id) {
        labMap.set(item.bien_id, {
          stock_actual: Number(item.stock_actual || 0),
          stock_en_uso: Number(item.stock_en_uso || 0)
        });
      }
    });

    return (resPrincipal.data || []).map((p: any) => {
      const labInfo = labMap.get(p.bien_id);
      const bienData = p.bienes;
      const nombreItem = bienData?.nombre || p.marca || 'Insumo sin nombre';
      const categoriaItem = bienData?.categoria || 'General';
      const tipoBienItem = bienData?.tipo_bien || 'producto';

      return {
        id: p.id,
        bien_id: p.bien_id,
        nombre: nombreItem,
        producto: nombreItem,
        categoria: categoriaItem,
        tipo_bien: tipoBienItem,
        sku: bienData?.sku || p.sku || '',
        es_subreceta: bienData?.es_intermedio_subreceta || false,
        tara_gramos: bienData?.peso_envase_tara_gramos || 0,
        factor_densidad: bienData?.factor_densidad || 1.0,
        marca: p.marca || '',
        linea: p.linea || '',
        presentacion: p.presentacion || 'Unidad',
        ubicacion: p.ubicacion || 'RACK CENTRAL',
        stock_central: Number(p.stock || 0),
        stock_lab: Number(labInfo?.stock_actual || 0),
        stock_en_uso: Number(labInfo?.stock_en_uso || 0),
        stock_minimo: Number(p.stock_minimo || 10),
        costo_unitario: Number(p.costo_unitario || 0)
      };
    });
  } catch (e) {
    console.error("Error en obtenerStockUbicacion:", e);
    return [];
  }
}

// 3. Buscar bien por SKU o Código de Barras
export async function buscarBienPorSkuOCodigoBarras(codigo: string) {
  if (!codigo || !codigo.trim()) return null;
  const term = codigo.trim();

  const { data, error } = await supabase
    .from('bienes')
    .select('*')
    .or(`sku.eq.${term},codigo_barras.eq.${term},id.eq.${term}`)
    .maybeSingle();

  if (error || !data) {
    const { data: fallback } = await supabase
      .from('bienes')
      .select('*')
      .ilike('nombre', `%${term}%`)
      .limit(1)
      .maybeSingle();
    return fallback;
  }
  return data;
}

// 4. Despacho Asistido por Balanza IoT con Deducción de Tara & Auditoría de Mermas
export async function despacharInsumoConBalanzaIoT(params: {
  bienId: string;
  pesoBrutoMedidoGramos: number;
  pesoTeoricoRecetaGramos?: number;
  oatcId?: string;
  agenteId?: string;
  agenteNombre?: string;
  notas?: string;
}) {
  const sedeId = useAppStore.getState().sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';
  
  const { data: bien } = await supabase
    .from('bienes')
    .select('id, nombre, sku, costo_base, peso_envase_tara_gramos, factor_densidad, merma_tolerancia_porcentaje')
    .eq('id', params.bienId)
    .single();

  if (!bien) throw new Error('Insumo no encontrado');

  const tara = Number(bien.peso_envase_tara_gramos || 0);
  const densidad = Number(bien.factor_densidad || 1.0);
  const pesoNetoGramos = Math.max(0, params.pesoBrutoMedidoGramos - tara);
  const volumenNetoMl = Number((pesoNetoGramos / densidad).toFixed(2));
  const pesoTeorico = params.pesoTeoricoRecetaGramos || pesoNetoGramos;

  // Cálculo de Mermas Teórico vs Real
  const deltaGramos = Number((pesoNetoGramos - pesoTeorico).toFixed(1));
  const deltaPorcentaje = pesoTeorico > 0 ? Number(((deltaGramos / pesoTeorico) * 100).toFixed(1)) : 0;
  const tolerancia = Number(bien.merma_tolerancia_porcentaje || 3.0);

  let estadoMerma: 'DENTRO_TOLERANCIA' | 'EXCESO_DESPERDICIO' | 'SUB_DOSIFICACION' = 'DENTRO_TOLERANCIA';
  if (deltaPorcentaje > tolerancia) {
    estadoMerma = 'EXCESO_DESPERDICIO';
  } else if (deltaPorcentaje < -tolerancia) {
    estadoMerma = 'SUB_DOSIFICACION';
  }

  // Descontar stock de laboratorio
  const { data: labStock } = await supabase
    .from('almacen_laboratorio')
    .select('id, stock_actual')
    .eq('sede_id', sedeId)
    .eq('bien_id', params.bienId)
    .maybeSingle();

  if (labStock) {
    const nuevoStock = Math.max(0, Number(labStock.stock_actual) - pesoNetoGramos);
    await supabase
      .from('almacen_laboratorio')
      .update({ stock_actual: nuevoStock, updated_at: new Date().toISOString() })
      .eq('id', labStock.id);
  }

  // Registrar en Kardex con Auditoría de Mermas
  await supabase.from('inventario_movimientos').insert([{
    sede_id: sedeId,
    tipo_movimiento: 'DESPACHO_ODI_IOT',
    bien_id: params.bienId,
    descripcion: `Pesaje IoT: Teórico ${pesoTeorico}g vs Real ${pesoNetoGramos}g (Delta: ${deltaGramos > 0 ? '+' : ''}${deltaGramos}g / ${deltaPorcentaje}%)`,
    cantidad: pesoNetoGramos,
    cantidad_teorica: pesoTeorico,
    cantidad_real: pesoNetoGramos,
    merma_delta_gramos: deltaGramos,
    merma_delta_porcentaje: deltaPorcentaje,
    estado_merma: estadoMerma,
    costo_unitario: bien.costo_base || 0,
    origen: 'LABORATORIO',
    destino: params.oatcId ? `OATC: ${params.oatcId.slice(0, 8)}` : 'ESTACION_PISO',
    agente_id: params.agenteId || null,
    metadata_iot: {
      peso_bruto: params.pesoBrutoMedidoGramos,
      tara_envase: tara,
      densidad,
      volumen_ml: volumenNetoMl,
      tolerancia_porcentaje: tolerancia
    }
  }]);

  return {
    bien,
    pesoBruto: params.pesoBrutoMedidoGramos,
    tara,
    pesoNetoGramos,
    volumenNetoMl,
    deltaGramos,
    deltaPorcentaje,
    estadoMerma
  };
}

// 5. Producción por Lote de Sub-Recetas (Mise en place BOH)
export async function producirLoteSubRecetaBOH(params: {
  bienIntermedioId: string;
  cantidadProducirGramos: number;
  areaProduccion?: string;
  responsableNombre?: string;
  responsableId?: string;
  diasVencimiento?: number;
}) {
  const sedeId = useAppStore.getState().sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';

  // 1. Obtener bien intermedio y su receta
  const { data: bienIntermedio } = await supabase
    .from('bienes')
    .select('id, nombre, sku, receta_insumos, costo_base')
    .eq('id', params.bienIntermedioId)
    .single();

  if (!bienIntermedio) throw new Error('Sub-receta / Bien intermedio no encontrado');

  const receta = Array.isArray(bienIntermedio.receta_insumos) ? bienIntermedio.receta_insumos : [];
  const codigoLote = `LOT-MISE-${Date.now().toString().slice(-6)}`;
  let costoTotalLote = 0;

  // 2. Descontar materias primas proporcionales del laboratorio
  for (const insumo of receta) {
    const cantNecesaria = (Number(insumo.cantidad || 0) * params.cantidadProducirGramos) / 100;

    const { data: matStock } = await supabase
      .from('almacen_laboratorio')
      .select('id, stock_actual')
      .eq('sede_id', sedeId)
      .eq('bien_id', insumo.bien_id)
      .maybeSingle();

    if (matStock) {
      await supabase
        .from('almacen_laboratorio')
        .update({ stock_actual: Math.max(0, Number(matStock.stock_actual) - cantNecesaria) })
        .eq('id', matStock.id);
    }

    // Kardex de consumo de insumo
    await supabase.from('inventario_movimientos').insert([{
      sede_id: sedeId,
      tipo_movimiento: 'CONSUMO_PRODUCCION_LOTE',
      bien_id: insumo.bien_id,
      descripcion: `Insumo para Lote ${codigoLote} (${bienIntermedio.nombre})`,
      cantidad: cantNecesaria,
      cantidad_teorica: cantNecesaria,
      cantidad_real: cantNecesaria,
      es_produccion_subreceta: true,
      lote_produccion: codigoLote,
      origen: 'LABORATORIO',
      destino: 'PRODUCCION_BOH'
    }]);

    costoTotalLote += (Number(insumo.costo_unitario || 0.15) * cantNecesaria);
  }

  // 3. Incrementar stock del bien intermedio elaborado en laboratorio
  const { data: stockIntermedio } = await supabase
    .from('almacen_laboratorio')
    .select('id, stock_actual')
    .eq('sede_id', sedeId)
    .eq('bien_id', params.bienIntermedioId)
    .maybeSingle();

  if (stockIntermedio) {
    await supabase
      .from('almacen_laboratorio')
      .update({ stock_actual: Number(stockIntermedio.stock_actual) + params.cantidadProducirGramos })
      .eq('id', stockIntermedio.id);
  } else {
    await supabase.from('almacen_laboratorio').insert([{
      sede_id: sedeId,
      bien_id: params.bienIntermedioId,
      stock_actual: params.cantidadProducirGramos,
      stock_en_uso: 0
    }]);
  }

  // 4. Registrar lote en lotes_produccion_boh
  const fechaVenc = new Date();
  fechaVenc.setDate(fechaVenc.getDate() + (params.diasVencimiento || 5));

  const { data: lote } = await supabase.from('lotes_produccion_boh').insert([{
    sede_id: sedeId,
    codigo_lote: codigoLote,
    bien_intermedio_id: params.bienIntermedioId,
    bien_nombre: bienIntermedio.nombre,
    area_produccion: params.areaProduccion || 'LABORATORIO_CENTRAL',
    cantidad_producida_teorica: params.cantidadProducirGramos,
    cantidad_producida_real: params.cantidadProducirGramos,
    unidad_medida: 'g',
    costo_total_lote: costoTotalLote,
    costo_unitario_gramo: Number((costoTotalLote / (params.cantidadProducirGramos || 1)).toFixed(4)),
    fecha_vencimiento: fechaVenc.toISOString(),
    insumos_utilizados: receta,
    estado: 'FINALIZADO',
    responsable_nombre: params.responsableNombre || 'Chef / Jefe de Taller',
    responsable_id: params.responsableId || null
  }]).select().single();

  // Kardex de entrada de lote
  await supabase.from('inventario_movimientos').insert([{
    sede_id: sedeId,
    tipo_movimiento: 'INGRESO_PRODUCCION_LOTE',
    bien_id: params.bienIntermedioId,
    descripcion: `Entrada Lote Elaborado ${codigoLote}: ${params.cantidadProducirGramos}g`,
    cantidad: params.cantidadProducirGramos,
    cantidad_teorica: params.cantidadProducirGramos,
    cantidad_real: params.cantidadProducirGramos,
    es_produccion_subreceta: true,
    lote_produccion: codigoLote,
    origen: 'PRODUCCION_BOH',
    destino: 'LABORATORIO'
  }]);

  return lote;
}

// 6. Obtener Lotes de Sub-Recetas
export async function obtenerLotesSubRecetas(limite: number = 30): Promise<LoteProduccionBOH[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';

  const { data, error } = await supabase
    .from('lotes_produccion_boh')
    .select('*')
    .eq('sede_id', sedeId)
    .order('fecha_elaboracion', { ascending: false })
    .limit(limite);

  if (error) {
    console.error('Error obteniendo lotes sub-recetas:', error);
    return [];
  }
  return (data || []) as LoteProduccionBOH[];
}

// 7. Obtener Kardex con Auditoría de Mermas
export async function obtenerKardex(limite: number = 100): Promise<MovimientoKardex[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';

  const { data, error } = await supabase
    .from('inventario_movimientos')
    .select('*, bienes(nombre, sku, costo_base), agentes(nombre)')
    .eq('sede_id', sedeId)
    .order('fecha_hora', { ascending: false })
    .limit(limite);

  if (error) {
    console.error("Error kardex:", error);
    return [];
  }
  return (data || []) as MovimientoKardex[];
}

// 8. Obtener Métricas Globales de Mermas y Eficiencia IoT
export async function obtenerMetricasMermasLab() {
  const sedeId = useAppStore.getState().sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';
  const hoy = new Date().toISOString().split('T')[0];

  const { data: despachos } = await supabase
    .from('inventario_movimientos')
    .select('*, bienes(nombre, sku, costo_base)')
    .eq('sede_id', sedeId)
    .eq('tipo_movimiento', 'DESPACHO_ODI_IOT')
    .order('fecha_hora', { ascending: false })
    .limit(300);

  const totalDespachos = despachos?.length || 0;
  let exactos = 0;
  let excesoDesperdicio = 0;
  let subDosificados = 0;
  let gramosMermaTotal = 0;
  let costoMermaTotal = 0;

  const mermasPorBien = new Map<string, { nombre: string; sku: string; gramosDesperdicio: number; costoTotal: number }>();

  (despachos || []).forEach((d: any) => {
    const deltaG = Number(d.merma_delta_gramos || 0);
    const costoBaseG = Number(d.bienes?.costo_base || 0.18);

    if (d.estado_merma === 'DENTRO_TOLERANCIA') {
      exactos++;
    } else if (d.estado_merma === 'EXCESO_DESPERDICIO') {
      excesoDesperdicio++;
      if (deltaG > 0) {
        gramosMermaTotal += deltaG;
        const costo = deltaG * costoBaseG;
        costoMermaTotal += costo;

        const bienKey = d.bien_id;
        const actual = mermasPorBien.get(bienKey) || {
          nombre: d.bienes?.nombre || 'Insumo',
          sku: d.bienes?.sku || 'SKU-GEN',
          gramosDesperdicio: 0,
          costoTotal: 0
        };
        actual.gramosDesperdicio += deltaG;
        actual.costoTotal += costo;
        mermasPorBien.set(bienKey, actual);
      }
    } else if (d.estado_merma === 'SUB_DOSIFICACION') {
      subDosificados++;
    }
  });

  const porcentajeEficiencia = totalDespachos > 0 ? Number(((exactos / totalDespachos) * 100).toFixed(1)) : 98.4;
  const topDesperdicio = Array.from(mermasPorBien.values())
    .sort((a, b) => b.gramosDesperdicio - a.gramosDesperdicio)
    .slice(0, 5);

  return {
    totalDespachos,
    exactos,
    excesoDesperdicio,
    subDosificados,
    porcentajeEficiencia,
    gramosMermaTotal: Number(gramosMermaTotal.toFixed(1)),
    costoMermaTotal: Number(costoMermaTotal.toFixed(2)),
    topDesperdicio
  };
}

// 9. Ingreso Central
export async function registrarIngresoCentral(items: any[], referenciaDocumento: string, usuarioId: string) {
  const sedeId = useAppStore.getState().sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';

  for (const item of items) {
    const { data: exists } = await supabase
      .from('almacen_principal')
      .select('id, stock')
      .eq('sede_id', sedeId)
      .eq('bien_id', item.bien_id)
      .maybeSingle();

    if (exists) {
      await supabase.from('almacen_principal').update({ 
        stock: Number(exists.stock) + Number(item.cantidad),
        costo_unitario: item.costo_unitario,
        updated_at: new Date().toISOString()
      }).eq('id', exists.id);
    } else {
      await supabase.from('almacen_principal').insert([{
        sede_id: sedeId,
        bien_id: item.bien_id,
        proveedor: 'Ingreso Directo',
        marca: item.marca || '',
        linea: item.linea || '',
        presentacion: item.presentacion || 'Unidad',
        stock: Number(item.cantidad),
        costo_unitario: item.costo_unitario,
        ubicacion: 'RACK PRINCIPAL'
      }]);
    }

    await supabase.from('inventario_movimientos').insert([{
      sede_id: sedeId,
      tipo_movimiento: 'INGRESO',
      bien_id: item.bien_id,
      descripcion: `Doc: ${referenciaDocumento}`,
      cantidad: Number(item.cantidad),
      cantidad_teorica: Number(item.cantidad),
      cantidad_real: Number(item.cantidad),
      origen: 'EXTERNO',
      destino: 'ALMACEN CENTRAL',
      costo_unitario: item.costo_unitario,
      agente_id: usuarioId
    }]);
  }
}

// 10. Transferencia Masiva a Lab
export async function transferirAlmacen(items: any[], usuarioId: string) {
  const sedeId = useAppStore.getState().sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';

  for (const item of items) {
    const cantMover = Number(item.cantidad_mover);
    if (cantMover <= 0) continue;

    const { data: princ } = await supabase.from('almacen_principal').select('id, stock, costo_unitario').eq('sede_id', sedeId).eq('bien_id', item.bien_id).single();
    if (princ) {
      await supabase.from('almacen_principal').update({
        stock: Number(princ.stock) - cantMover
      }).eq('id', princ.id);
    }

    const { data: labExists } = await supabase.from('almacen_laboratorio').select('id, stock_actual').eq('sede_id', sedeId).eq('bien_id', item.bien_id).maybeSingle();
    if (labExists) {
      await supabase.from('almacen_laboratorio').update({
        stock_actual: Number(labExists.stock_actual) + cantMover
      }).eq('id', labExists.id);
    } else {
      await supabase.from('almacen_laboratorio').insert([{
        sede_id: sedeId,
        bien_id: item.bien_id,
        stock_actual: cantMover,
        stock_en_uso: 0
      }]);
    }

    await supabase.from('inventario_movimientos').insert([{
      sede_id: sedeId,
      tipo_movimiento: 'TRANSFERENCIA',
      bien_id: item.bien_id,
      descripcion: 'Traslado interno a Laboratorio',
      cantidad: cantMover,
      cantidad_teorica: cantMover,
      cantidad_real: cantMover,
      origen: 'ALMACEN CENTRAL',
      destino: 'LABORATORIO',
      costo_unitario: princ?.costo_unitario || 0,
      agente_id: usuarioId
    }]);
  }
}
