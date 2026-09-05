'use client';

import { useState, useEffect } from 'react';
import { obtenerKardex, MovimientoKardex } from '@/services/lab';
import { useAppStore } from '@/store/useAppStore';
import { 
  Activity, ArrowDownRight, ArrowUpRight, Filter, Scale, 
  AlertTriangle, CheckCircle2, Search, RefreshCw, Layers, ShieldCheck, Download 
} from 'lucide-react';

export default function KardexPanel() {
  const [movimientos, setMovimientos] = useState<MovimientoKardex[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstadoMerma, setFiltroEstadoMerma] = useState<string>('TODOS');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const sedeActiva = useAppStore((state) => state.sedeActiva);

  const loadData = async () => {
    if (!sedeActiva) return;
    setLoading(true);
    const data = await obtenerKardex(250);
    setMovimientos(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [sedeActiva]);

  const filtrados = movimientos.filter((m) => {
    const matchTexto = !filtroTexto || 
      (m.bienes?.nombre && m.bienes.nombre.toLowerCase().includes(filtroTexto.toLowerCase())) ||
      (m.bienes?.sku && m.bienes.sku.toLowerCase().includes(filtroTexto.toLowerCase())) ||
      (m.descripcion && m.descripcion.toLowerCase().includes(filtroTexto.toLowerCase())) ||
      (m.lote_produccion && m.lote_produccion.toLowerCase().includes(filtroTexto.toLowerCase()));

    const matchMerma = filtroEstadoMerma === 'TODOS' || m.estado_merma === filtroEstadoMerma;
    const matchTipo = filtroTipo === 'TODOS' || m.tipo_movimiento === filtroTipo;

    return matchTexto && matchMerma && matchTipo;
  });

  // Métricas rápidas del Kardex
  const totalDespachosIot = movimientos.filter(m => m.tipo_movimiento === 'DESPACHO_ODI_IOT').length;
  const totalConDesviacion = movimientos.filter(m => m.estado_merma === 'EXCESO_DESPERDICIO' || m.estado_merma === 'SUB_DOSIFICACION').length;
  const totalSubRecetas = movimientos.filter(m => m.es_produccion_subreceta).length;

  return (
    <div className="flex flex-col h-full gap-5 animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="flex flex-wrap justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-indigo-500" />
            Kardex de Precisión & Auditoría de Mermas IoT
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Trazabilidad inmutable gramo a gramo, contraste Teórico vs Real y lotes de sub-recetas BOH.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition"
            title="Recargar Kardex"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Pesajes Balanza IoT</span>
            <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{totalDespachosIot}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Alertas de Desviación</span>
            <p className="text-2xl font-black text-amber-500 mt-0.5">{totalConDesviacion}</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Lotes Sub-Recetas BOH</span>
            <p className="text-2xl font-black text-emerald-500 mt-0.5">{totalSubRecetas}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col flex-1 min-h-0 space-y-4">
        
        {/* Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <label htmlFor="kardex-filtro-busqueda" className="sr-only">Buscar por SKU, insumo o lote</label>
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="kardex-filtro-busqueda"
                name="filtro_busqueda"
                type="text"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                placeholder="Buscar por SKU, insumo o lote..."
                className="pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs w-64 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label htmlFor="kardex-filtro-tipo" className="sr-only">Tipo de Movimiento</label>
              <select
                id="kardex-filtro-tipo"
                name="filtro_tipo"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
              >
                <option value="TODOS">Todos los Tipos</option>
                <option value="DESPACHO_ODI_IOT">⚖️ Despachos Balanza IoT</option>
                <option value="INGRESO_PRODUCCION_LOTE">🧪 Lotes Sub-Recetas (Entrada)</option>
                <option value="CONSUMO_PRODUCCION_LOTE">🥗 Insumos de Sub-Recetas (Salida)</option>
                <option value="INGRESO">📦 Ingresos Central</option>
                <option value="TRANSFERENCIA">🔄 Traslados a Lab</option>
              </select>
            </div>

            <div>
              <label htmlFor="kardex-filtro-estado-merma" className="sr-only">Tolerancia de Merma</label>
              <select
                id="kardex-filtro-estado-merma"
                name="filtro_estado_merma"
                value={filtroEstadoMerma}
                onChange={(e) => setFiltroEstadoMerma(e.target.value)}
                className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
              >
                <option value="TODOS">Todas las Tolerancias</option>
                <option value="DENTRO_TOLERANCIA">✅ Calibrado Exacto (≤ ±3%)</option>
                <option value="EXCESO_DESPERDICIO">⚠️ Exceso / Desperdicio (&gt; +3%)</option>
                <option value="SUB_DOSIFICACION">📉 Sub-dosificación (&lt; -3%)</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            {filtrados.length} movimientos
          </div>
        </div>

        {/* Contenedor Tabla */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Fecha / Hora</th>
                <th className="px-4 py-3">Movimiento</th>
                <th className="px-4 py-3">Insumo / SKU</th>
                <th className="px-4 py-3 text-center">Teórico (g)</th>
                <th className="px-4 py-3 text-center">Real IoT (g)</th>
                <th className="px-4 py-3 text-center">Delta Merma</th>
                <th className="px-4 py-3 text-center">Tolerancia</th>
                <th className="px-4 py-3">Lote / Destino</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto mb-2"></div>
                    Cargando kardex de precisión...
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No se encontraron transacciones con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtrados.map((mov) => {
                  const isIngreso = mov.tipo_movimiento === 'INGRESO' || mov.tipo_movimiento === 'INGRESO_PRODUCCION_LOTE';
                  const isIot = mov.tipo_movimiento === 'DESPACHO_ODI_IOT';
                  const delta = Number(mov.merma_delta_gramos || 0);
                  const deltaPorc = Number(mov.merma_delta_porcentaje || 0);

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono whitespace-nowrap">
                        {mov.fecha_hora ? new Date(mov.fecha_hora).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isIngreso
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : mov.tipo_movimiento === 'TRANSFERENCIA'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : mov.tipo_movimiento === 'CONSUMO_PRODUCCION_LOTE'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {isIngreso ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {mov.tipo_movimiento}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{mov.bienes?.nombre || 'Insumo'}</div>
                        <div className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400">{mov.bienes?.sku || mov.bien_id.slice(0, 8)}</div>
                      </td>

                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                        {mov.cantidad_teorica ? `${mov.cantidad_teorica} g` : `${mov.cantidad} g`}
                      </td>

                      <td className="px-4 py-3 text-center font-mono font-black text-slate-800 dark:text-white">
                        {mov.cantidad_real ? `${mov.cantidad_real} g` : `${mov.cantidad} g`}
                      </td>

                      <td className="px-4 py-3 text-center font-mono font-bold">
                        {isIot ? (
                          <span className={`${
                            delta === 0 ? 'text-slate-400' : delta > 0 ? 'text-rose-400' : 'text-amber-400'
                          }`}>
                            {delta > 0 ? `+${delta}g` : `${delta}g`} ({deltaPorc > 0 ? `+${deltaPorc}%` : `${deltaPorc}%`})
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {mov.estado_merma === 'DENTRO_TOLERANCIA' ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Exacto
                          </span>
                        ) : mov.estado_merma === 'EXCESO_DESPERDICIO' ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Desperdicio
                          </span>
                        ) : mov.estado_merma === 'SUB_DOSIFICACION' ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Sub-dosis
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-400">N/A</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px]">
                        {mov.lote_produccion ? (
                          <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                            {mov.lote_produccion}
                          </span>
                        ) : (
                          mov.destino || mov.descripcion
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
