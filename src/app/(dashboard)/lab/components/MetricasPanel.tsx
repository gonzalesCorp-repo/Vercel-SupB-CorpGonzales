'use client';

import { useState, useEffect } from 'react';
import { 
  obtenerMetricasMermasLab, 
  obtenerLotesSubRecetas, 
  producirLoteSubRecetaBOH, 
  LoteProduccionBOH,
  obtenerStockUbicacion 
} from '@/services/lab';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { 
  BarChart3, TrendingUp, AlertCircle, PackageCheck, Zap, Scale, 
  AlertTriangle, DollarSign, Layers, Plus, CheckCircle2, RefreshCw, X, Clock 
} from 'lucide-react';

export default function MetricasPanel() {
  const [metricas, setMetricas] = useState<any>({
    totalDespachos: 0,
    exactos: 0,
    excesoDesperdicio: 0,
    subDosificados: 0,
    porcentajeEficiencia: 98.4,
    gramosMermaTotal: 0,
    costoMermaTotal: 0,
    topDesperdicio: []
  });

  const [lotes, setLotes] = useState<LoteProduccionBOH[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalLoteOpen, setModalLoteOpen] = useState(false);
  const [bienesSubreceta, setBienesSubreceta] = useState<any[]>([]);

  // Formulario nuevo lote
  const [subrecetaSeleccionadaId, setSubrecetaSeleccionadaId] = useState('');
  const [cantidadProducirInput, setCantidadProducirInput] = useState<number>(1000);
  const [diasVencimientoInput, setDiasVencimientoInput] = useState<number>(7);
  const [areaProduccionInput, setAreaProduccionInput] = useState('COCINA_CALIENTE');
  const [creandoLote, setCreandoLote] = useState(false);

  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const { showAlert } = useUIStore();

  const loadData = async () => {
    if (!sedeActiva) return;
    setLoading(true);
    const [dataMetricas, dataLotes, dataStock] = await Promise.all([
      obtenerMetricasMermasLab(),
      obtenerLotesSubRecetas(20),
      obtenerStockUbicacion()
    ]);

    setMetricas(dataMetricas);
    setLotes(dataLotes);
    
    // Filtrar bienes que son subrecetas
    const subrecetas = dataStock.filter((s: any) => s.es_subreceta);
    setBienesSubreceta(subrecetas);
    if (subrecetas.length > 0 && !subrecetaSeleccionadaId) {
      setSubrecetaSeleccionadaId(subrecetas[0].bien_id);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [sedeActiva]);

  const handleCrearLote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subrecetaSeleccionadaId || cantidadProducirInput <= 0) return;

    setCreandoLote(true);
    try {
      await producirLoteSubRecetaBOH({
        bienIntermedioId: subrecetaSeleccionadaId,
        cantidadProducirGramos: cantidadProducirInput,
        areaProduccion: areaProduccionInput,
        diasVencimiento: diasVencimientoInput,
        responsableNombre: 'Chef / Encargado BOH'
      });

      showAlert(`¡Lote de sub-receta producido exitosamente! (${cantidadProducirInput}g)`, 'success');
      setModalLoteOpen(false);
      loadData();
    } catch (err: any) {
      showAlert(`Error elaborando lote: ${err.message}`, 'error');
    } finally {
      setCreandoLote(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-5 animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="flex flex-wrap justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            Auditoría de Mermas & Sub-Recetas BOH (Mise en Place)
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Contraste de Consumo Teórico vs Balanza IoT, costos de merma y producción por lotes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModalLoteOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-600/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Elaborar Lote Sub-Receta</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition"
            title="Recargar Métricas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid 4 KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Calibración Balanzas IoT */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-500">
              <Scale className="w-5 h-5" />
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/20">
              Tolerancia ±3%
            </span>
          </div>
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase">Eficiencia de Pesaje IoT</h3>
            <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{metricas.porcentajeEficiencia}%</p>
            <p className="text-[10px] text-slate-500 mt-1">{metricas.exactos} de {metricas.totalDespachos} pesajes exactos</p>
          </div>
        </div>

        {/* KPI 2: Gramos Totales de Merma */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/20">
              Desviación
            </span>
          </div>
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase">Mermas Acumuladas</h3>
            <p className="text-2xl font-black text-amber-500 mt-0.5">{metricas.gramosMermaTotal} g</p>
            <p className="text-[10px] text-slate-500 mt-1">{metricas.excesoDesperdicio} despachos con sobre-dosificación</p>
          </div>
        </div>

        {/* KPI 3: Impacto Financiero en S/. */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="bg-rose-500/10 p-2.5 rounded-xl text-rose-500">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="bg-rose-500/10 text-rose-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-500/20">
              Costo Merma
            </span>
          </div>
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase">Impacto Financiero</h3>
            <p className="text-2xl font-black text-rose-400 mt-0.5 font-mono">S/. {metricas.costoMermaTotal}</p>
            <p className="text-[10px] text-slate-500 mt-1">Costo de producto excedente en taller</p>
          </div>
        </div>

        {/* KPI 4: Lotes de Sub-Recetas Activos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="bg-purple-500/10 p-2.5 rounded-xl text-purple-500">
              <Layers className="w-5 h-5" />
            </div>
            <span className="bg-purple-500/10 text-purple-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-500/20">
              Mise en Place
            </span>
          </div>
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase">Lotes BOH Elaborados</h3>
            <p className="text-2xl font-black text-purple-400 mt-0.5">{lotes.length}</p>
            <p className="text-[10px] text-slate-500 mt-1">Bases y mezclas intermedias en stock</p>
          </div>
        </div>

      </div>

      {/* Secciones Inferiores: Top Insumos con Desviación & Lotes BOH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* Col Izquierda: Top Insumos con Mayor Desperdicio (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" /> Insumos con Mayor Desviación
            </h2>
            <span className="text-[10px] text-slate-400 font-bold">Top 5</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {metricas.topDesperdicio.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                <span>Excelente precisión: No se registran excesos críticos de merma.</span>
              </div>
            ) : (
              metricas.topDesperdicio.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{item.nombre}</span>
                    <span className="text-xs font-mono font-bold text-rose-400">+{item.gramosDesperdicio.toFixed(1)} g</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">{item.sku}</span>
                    <span className="font-mono font-semibold text-amber-400">Costo Estimado: S/. {item.costoTotal.toFixed(2)}</span>
                  </div>
                  {/* Barra visual de merma */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (item.gramosDesperdicio / 50) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Col Derecha: Historial de Lotes de Sub-Recetas BOH (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-500" /> Lotes de Producción (Mise en place BOH)
            </h2>
            <span className="text-[10px] font-mono text-slate-400">
              {lotes.length} lotes registrados
            </span>
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-[10px] uppercase">
                  <th className="pb-2">Lote / Sub-receta</th>
                  <th className="pb-2 text-center">Cantidad</th>
                  <th className="pb-2 text-center">Costo / g</th>
                  <th className="pb-2 text-center">Vencimiento</th>
                  <th className="pb-2 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {lotes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No hay lotes de sub-recetas registrados en esta sede.
                    </td>
                  </tr>
                ) : (
                  lotes.map((lote) => (
                    <tr key={lote.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{lote.bien_nombre}</div>
                        <div className="text-[10px] font-mono text-purple-400">{lote.codigo_lote}</div>
                      </td>
                      <td className="py-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {lote.cantidad_producida_real} {lote.unidad_medida}
                      </td>
                      <td className="py-2.5 text-center font-mono text-emerald-400">
                        S/. {Number(lote.costo_unitario_gramo).toFixed(3)}
                      </td>
                      <td className="py-2.5 text-center font-mono text-slate-400 text-[10px]">
                        {lote.fecha_vencimiento ? new Date(lote.fecha_vencimiento).toLocaleDateString('es-PE') : 'N/A'}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {lote.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Elaborar Nuevo Lote de Sub-Receta */}
      {modalLoteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-black text-white">Elaborar Lote de Sub-Receta (Mise en Place)</h3>
              </div>
              <button onClick={() => setModalLoteOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearLote} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Sub-Receta / Bien Intermedio:
                </label>
                <select
                  value={subrecetaSeleccionadaId}
                  onChange={(e) => setSubrecetaSeleccionadaId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
                  required
                >
                  {bienesSubreceta.length === 0 ? (
                    <option value="">No hay bienes marcados como sub-recetas</option>
                  ) : (
                    bienesSubreceta.map((b: any) => (
                      <option key={b.bien_id} value={b.bien_id}>
                        {b.producto} ({b.sku})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Cantidad a Producir (g):
                  </label>
                  <input
                    type="number"
                    value={cantidadProducirInput}
                    onChange={(e) => setCantidadProducirInput(Number(e.target.value))}
                    min={50}
                    step={50}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Vida Útil (Días):
                  </label>
                  <input
                    type="number"
                    value={diasVencimientoInput}
                    onChange={(e) => setDiasVencimientoInput(Number(e.target.value))}
                    min={1}
                    max={90}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Área de Producción BOH:
                </label>
                <select
                  value={areaProduccionInput}
                  onChange={(e) => setAreaProduccionInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
                >
                  <option value="COCINA_CALIENTE">🍳 Cocina Caliente (Restaurante)</option>
                  <option value="COCINA_FRIA">🥗 Cocina Fría / Pastelería</option>
                  <option value="LABORATORIO_CENTRAL">🧪 Laboratorio Central (Salón / Barbería)</option>
                  <option value="BAR_CENTRAL">🍹 Estación de Bar & Cafetería</option>
                </select>
              </div>

              <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl text-[11px] text-purple-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-400" /> Descuento Automático Atómico
                </p>
                <p className="text-slate-400 text-[10px]">
                  Al confirmar, se descontarán proporcionalmente los insumos de la fórmula en gramos y se creará el lote con código único en Kardex.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalLoteOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoLote || bienesSubreceta.length === 0}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
                >
                  {creandoLote ? 'Procesando...' : 'Confirmar Lote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
