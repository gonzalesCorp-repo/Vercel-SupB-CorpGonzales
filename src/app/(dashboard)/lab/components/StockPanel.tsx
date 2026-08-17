'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { obtenerStockUbicacion, transferirAlmacen } from '@/services/lab';
import { 
  Layers, AlertTriangle, CheckCircle2, Box, Search, 
  ArrowRightLeft, Plus, RefreshCw, X, Loader2, Sparkles, 
  Check, ArrowRight 
} from 'lucide-react';
import { BulkUploader } from '@/components/ui/BulkUploader';
import { MetricCard } from '@/components/ui/watermelon-patterns/metric-card';
import { AnimatePresence, motion } from 'framer-motion';

export default function StockPanel() {
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  
  // Modal de Traslado Rápido a Laboratorio
  const [transferModalItem, setTransferModalItem] = useState<any | null>(null);
  const [transferQty, setTransferQty] = useState<number>(1);
  const [isTransferring, setIsTransferring] = useState(false);

  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const { showAlert } = useUIStore();

  const loadStock = async () => {
    if (!sedeActiva) return;
    setLoading(true);
    try {
      const data = await obtenerStockUbicacion();
      setStock(data);
    } catch (e) {
      console.error('Error cargando stock:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, [sedeActiva]);

  // Categorías Únicas
  const categories = useMemo(() => {
    const set = new Set<string>();
    stock.forEach((item) => {
      if (item.categoria) set.add(item.categoria);
    });
    return ['TODOS', ...Array.from(set)];
  }, [stock]);

  // Filtrado Reactivo
  const filteredStock = useMemo(() => {
    return stock.filter((item) => {
      const matchSearch =
        !search ||
        item.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        item.sku?.toLowerCase().includes(search.toLowerCase()) ||
        item.marca?.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === 'TODOS' || item.categoria === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [stock, search, selectedCategory]);

  // Cálculos de KPIs
  const totalCentral = useMemo(() => stock.reduce((acc, it) => acc + (it.stock_central || 0), 0), [stock]);
  const totalLab = useMemo(() => stock.reduce((acc, it) => acc + (it.stock_lab || 0), 0), [stock]);
  const totalCriticos = useMemo(() => stock.filter((it) => (it.stock_central || 0) + (it.stock_lab || 0) < (it.stock_minimo || 10)).length, [stock]);

  const handleOpenTransfer = (item: any) => {
    setTransferModalItem(item);
    setTransferQty(Math.min(10, Math.max(1, Math.floor((item.stock_central || 0) / 2)) || 1));
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalItem || transferQty <= 0) return;

    if (transferQty > transferModalItem.stock_central) {
      showAlert(`Solo hay ${transferModalItem.stock_central} unidades disponibles en Almacén Central`, 'warning');
      return;
    }

    setIsTransferring(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      await transferirAlmacen(
        [{ bien_id: transferModalItem.bien_id, cantidad_mover: transferQty }],
        user?.id || 'sistema'
      );

      showAlert(`¡Traslado exitoso! ${transferQty} unidades enviadas a Laboratorio`, 'success');
      setTransferModalItem(null);
      await loadStock();
    } catch (err: any) {
      showAlert(`Error en el traslado: ${err.message}`, 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 font-sans">
      
      {/* HEADER & ACCIONES */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Layers className="w-7 h-7 text-indigo-500" />
            Stock & Ubicación
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Visión global del inventario distribuido entre Almacén Central y Laboratorio de Colorimetría.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <BulkUploader 
            tableName="almacen_principal" 
            title="Importar Stock" 
            injectSedeId={true}
            buttonClassName="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-2 rounded-xl hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition font-bold shadow-xs cursor-pointer"
          />
          <button
            type="button"
            onClick={loadStock}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Recargar inventario"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 📊 FILA DE KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Stock Almacén Central"
          value={totalCentral}
          icon={<Box className="w-4 h-4 text-indigo-500" />}
          badge="Principal"
          badgeColor="bg-indigo-500/10 text-indigo-500 border-indigo-500/30"
        />
        <MetricCard
          title="Stock en Laboratorio"
          value={totalLab}
          icon={<Layers className="w-4 h-4 text-emerald-500" />}
          badge="En Piso / Taller"
          badgeColor="bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
        />
        <MetricCard
          title="Insumos en Nivel Crítico"
          value={totalCriticos}
          icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
          badge={totalCriticos > 0 ? 'Reposición Urgente' : 'Stock Saludable'}
          badgeColor={totalCriticos > 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'}
        />
      </div>

      {/* CONTENEDOR PRINCIPAL: BUSCADOR + TABLA */}
      <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col flex-1 min-h-0 backdrop-blur-xl space-y-4">
        
        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Nombre, SKU o Marca..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Selector de Categorías */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla de Stock */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex-1 flex flex-col shadow-inner">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Producto / Insumo</th>
                  <th className="px-5 py-3.5 text-center">SKU</th>
                  <th className="px-5 py-3.5 text-center">Central</th>
                  <th className="px-5 py-3.5 text-center">Laboratorio</th>
                  <th className="px-5 py-3.5 text-center">Total Físico</th>
                  <th className="px-5 py-3.5 text-center">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acción Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3"></div>
                        <span className="font-bold text-xs">Cargando inventario de sede...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                      <Box className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No se encontraron productos</p>
                      <p className="text-xs text-slate-400 mt-1">Prueba con otro término de búsqueda o importa stock.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item, idx) => {
                    const total = (item.stock_central || 0) + (item.stock_lab || 0);
                    const isCritico = total < (item.stock_minimo || 10);
                    
                    return (
                      <tr key={item.id || item.bien_id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 border border-indigo-500/20">
                              {item.nombre?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white leading-tight">
                                {item.nombre}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{item.categoria}</span>
                                {item.marca ? ` • ${item.marca}` : ''}
                                {item.presentacion ? ` • ${item.presentacion}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center text-slate-500 dark:text-slate-400 font-mono text-[11px] font-bold">
                          {item.sku || '-'}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-xl font-black border border-slate-200 dark:border-slate-700">
                            {item.stock_central || 0}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-block px-3 py-1 rounded-xl font-black border ${
                            (item.stock_lab || 0) > 0 
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          }`}>
                            {item.stock_lab || 0}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="font-black text-slate-900 dark:text-white text-sm">{total}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {isCritico ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <AlertTriangle className="w-3 h-3" /> Crítico
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Óptimo
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenTransfer(item)}
                            disabled={item.stock_central <= 0}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-[11px] transition shadow-xs disabled:opacity-40 disabled:pointer-events-none cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Mover a Lab</span>
                          </button>
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

      {/* MODAL DE TRASLADO RÁPIDO EN 1-CLICK */}
      <AnimatePresence>
        {transferModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTransferModalItem(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-5 font-sans"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Traslado Rápido a Laboratorio
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Mueve unidades desde Central hacia la barra de color / taller.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTransferModalItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Detalle del Insumo */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                  {transferModalItem.categoria}
                </span>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {transferModalItem.nombre}
                </h4>
                <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                  <span>Disponible en Central: <strong className="text-slate-800 dark:text-slate-200">{transferModalItem.stock_central}</strong></span>
                  <span>Actualmente en Lab: <strong className="text-indigo-600 dark:text-indigo-400">{transferModalItem.stock_lab}</strong></span>
                </div>
              </div>

              <form onSubmit={handleExecuteTransfer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cantidad a Trasladar a Laboratorio
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={transferModalItem.stock_central}
                      value={transferQty}
                      onChange={(e) => setTransferQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-lg text-slate-900 dark:text-white font-black text-center outline-none focus:border-indigo-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setTransferQty(transferModalItem.stock_central)}
                      className="px-3 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Máximo ({transferModalItem.stock_central})
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isTransferring || transferQty <= 0}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs shadow-lg transition active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isTransferring ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirmar Traslado a Laboratorio</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
