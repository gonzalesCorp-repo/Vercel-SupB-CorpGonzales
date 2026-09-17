'use client';

import React from 'react';
import { NodoBienCanvasData } from '@/types/catalogoCanvas';
import { 
  Scissors, Package, Beaker, TrendingUp, AlertTriangle, 
  DollarSign, Plus, Trash2, Scale, Percent 
} from 'lucide-react';

interface NodeBienRecetaProps {
  data: NodoBienCanvasData;
  seleccionado: boolean;
  onSelect: () => void;
  onActualizarPrecio: (id: string, nuevoPrecio: number) => void;
  onActualizarComision: (id: string, nuevaComision: number) => void;
  onRemoverInsumoReceta: (bienId: string, insumoId: string) => void;
}

export function NodeBienReceta({
  data,
  seleccionado,
  onSelect,
  onActualizarPrecio,
  onActualizarComision,
  onRemoverInsumoReceta
}: NodeBienRecetaProps) {
  const esServicio = data.tipo_bien === 'servicio';
  const esInsumo = data.tipo_bien === 'insumo';
  const esProducto = data.tipo_bien === 'producto';

  const costoTotalInsumos = data.receta_insumos.reduce(
    (acc, i) => acc + (i.cantidad_gramos * i.costo_gramo), 0
  );

  const costoEfectivo = esServicio ? costoTotalInsumos : data.costo_base;
  const montoComision = (data.precio_venta * (data.comision_porcentaje || 0)) / 100;
  const margenBrutoSoles = data.precio_venta - costoEfectivo - montoComision;
  const margenPorcentaje = data.precio_venta > 0 
    ? Math.round((margenBrutoSoles / data.precio_venta) * 100) 
    : 0;

  const esMargenCritico = margenPorcentaje < 25;
  const esMargenNegativo = margenBrutoSoles < 0;

  return (
    <div
      onClick={onSelect}
      className={`relative w-80 rounded-3xl p-4 transition-all duration-200 cursor-pointer select-none backdrop-blur-xl border ${
        seleccionado
          ? 'bg-slate-900/95 border-purple-500 shadow-2xl shadow-purple-500/20 scale-[1.02]'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-lg'
      }`}
    >
      {/* Cabecera del Bien */}
      <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            {esServicio ? (
              <Scissors className="w-4 h-4 text-purple-400" />
            ) : esInsumo ? (
              <Beaker className="w-4 h-4 text-amber-400" />
            ) : (
              <Package className="w-4 h-4 text-sky-400" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block truncate">
              {data.categoria} {data.linea ? `• ${data.linea}` : ''}
            </span>
            <h4 className="text-xs font-black text-white truncate max-w-[170px]" title={data.nombre}>
              {data.nombre}
            </h4>
          </div>
        </div>

        {/* Badge Tipo */}
        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${
          esServicio 
            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
            : esInsumo 
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
            : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
        }`}>
          {data.tipo_bien}
        </span>
      </div>

      {/* Contenido / Métricas de Rentabilidad y Fórmula */}
      <div className="py-2.5 space-y-2.5">
        
        {/* Precio Venta & Costo Base */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Precio Venta</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs font-black text-white font-mono">
                S/ {data.precio_venta.toFixed(2)}
              </span>
              <input
                type="number"
                value={data.precio_venta}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onActualizarPrecio(data.id, Number(e.target.value))}
                className="w-12 bg-slate-800 text-[10px] text-right text-purple-300 font-mono rounded px-1 py-0.5 border border-slate-700"
              />
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">
              {esServicio ? 'Costo Receta BOH' : 'Costo Base'}
            </span>
            <span className="text-xs font-black text-slate-300 font-mono block mt-0.5">
              S/ {costoEfectivo.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Semáforo Visual de Margen Bruto */}
        <div className={`p-2 rounded-xl border flex items-center justify-between ${
          esMargenNegativo 
            ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' 
            : esMargenCritico 
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' 
            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
        }`}>
          <div className="flex items-center gap-1.5">
            {esMargenNegativo ? (
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {esMargenNegativo ? 'Margen Negativo' : esMargenCritico ? 'Margen Ajustado' : 'Margen Saludable'}
            </span>
          </div>
          <span className="text-xs font-black font-mono">
            {margenPorcentaje}% (S/ {margenBrutoSoles.toFixed(2)})
          </span>
        </div>

        {/* Receta de Insumos Químicos BOH (Para Servicios) */}
        {esServicio && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Beaker className="w-3 h-3 text-amber-400" />
                Fórmula de Insumos ({data.receta_insumos.length})
              </span>
              <span className="text-slate-500">Arrastra insumo aquí</span>
            </div>

            {data.receta_insumos.length === 0 ? (
              <div className="p-2 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-[10px] text-slate-500">
                Sin insumos pesados asignados.
              </div>
            ) : (
              <div className="space-y-1">
                {data.receta_insumos.map((ins, idx) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[10px]">
                    <span className="text-slate-300 font-medium truncate max-w-[140px]">
                      {ins.nombre}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-amber-400 font-bold">
                        {ins.cantidad_gramos}g
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoverInsumoReceta(data.id, ins.insumo_id);
                        }}
                        className="text-slate-600 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Metrología IoT Balanza (Para Insumos) */}
        {esInsumo && (
          <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1 text-[10px]">
            <div className="flex items-center justify-between text-amber-400 font-bold">
              <span className="flex items-center gap-1">
                <Scale className="w-3 h-3" /> Metrología Balanza IoT
              </span>
            </div>
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Tara Envase: <strong className="text-white">{data.tara_gramos || 12}g</strong></span>
              <span>Neto Sellado: <strong className="text-white">{data.peso_neto_gramos || 60}g</strong></span>
            </div>
          </div>
        )}

      </div>

      {/* Conectores */}
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-800 border-2 border-purple-500 shadow-md flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
      </div>
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      </div>
    </div>
  );
}
