'use client';

import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, RefreshCw, Box, Tag, DollarSign, Database } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function CatalogoMasterPage() {
  const [bienes, setBienes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'insumo' | 'producto' | 'servicio'>('todos');

  const supabase = createClient();

  const cargarBienes = async () => {
    setIsLoading(true);
    let query = supabase.from('bienes').select('*').order('created_at', { ascending: false }).limit(500);
    
    if (filtroTipo !== 'todos') {
      query = query.eq('tipo_bien', filtroTipo);
    }
    
    const { data, error } = await query;
    if (!error && data) {
      setBienes(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    cargarBienes();
  }, [filtroTipo]);

  const bienesFiltrados = bienes.filter(b => 
    b.nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) || 
    b.atributos_producto?.sku?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
    b.categoria?.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-600 p-1.5 bg-indigo-50 rounded-lg" />
            Catálogo Maestro
          </h1>
          <p className="text-gray-500 font-medium mt-1">Gestión centralizada de insumos, retail y servicios.</p>
        </div>
        <button 
          onClick={cargarBienes}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="flex gap-2 w-full md:w-auto p-1 bg-gray-100 rounded-xl">
            {['todos', 'insumo', 'producto', 'servicio'].map(tipo => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo as any)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-all ${
                  filtroTipo === tipo 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, SKU o línea..." 
              value={filtroTexto}
              onChange={e => setFiltroTexto(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white text-gray-500 border-b border-gray-100">
                <th className="py-4 px-6 font-bold">SKU</th>
                <th className="py-4 px-6 font-bold">Ítem / Presentación</th>
                <th className="py-4 px-6 font-bold">Marca / Línea</th>
                <th className="py-4 px-6 font-bold text-center">Tipo</th>
                <th className="py-4 px-6 font-bold text-right">Precios</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Cargando catálogo...
                  </td>
                </tr>
              ) : bienesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 font-medium flex flex-col items-center">
                    <Package className="w-12 h-12 text-gray-300 mb-3" />
                    No se encontraron resultados en el catálogo.
                  </td>
                </tr>
              ) : (
                bienesFiltrados.map(bien => (
                  <tr key={bien.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="py-3 px-6">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                        {bien.atributos_producto?.sku || '---'}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <div className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {bien.nombre}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Box className="w-3 h-3" />
                        {bien.atributos_producto?.presentacion || 'Unidad'}
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="font-bold text-gray-700">
                        {bien.atributos_producto?.marca || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Tag className="w-3 h-3" />
                        {bien.categoria || bien.atributos_producto?.linea || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                        bien.tipo_bien === 'insumo' ? 'bg-amber-100 text-amber-700' :
                        bien.tipo_bien === 'producto' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {bien.tipo_bien}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex flex-col items-end gap-1">
                        {bien.precio_venta != null && (
                          <div className="flex items-center gap-1 text-emerald-600 font-black">
                            <DollarSign className="w-3 h-3" />
                            {bien.precio_venta.toFixed(2)}
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-50 px-1 rounded">PVP</span>
                          </div>
                        )}
                        {bien.atributos_producto?.costo_unitario != null && (
                          <div className="flex items-center gap-1 text-gray-500 font-bold text-xs">
                            <DollarSign className="w-3 h-3" />
                            {parseFloat(bien.atributos_producto.costo_unitario).toFixed(2)}
                            <span className="text-[10px] bg-gray-100 px-1 rounded">COSTO</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoading && bienesFiltrados.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs font-bold text-gray-500 text-right">
            Mostrando {bienesFiltrados.length} ítems.
          </div>
        )}
      </div>
    </div>
  );
}
