'use client';

import React, { useState } from 'react';
import { 
  Sparkles, Zap, Smartphone, Check, Coffee, Utensils, 
  Beaker, Scissors, Flame, Droplets, Layers, Plus 
} from 'lucide-react';

export interface RecetaPreset {
  id: string;
  nombre: string;
  categoria: 'COLOR' | 'DECOLORACION' | 'TRATAMIENTO' | 'COCINA_BOH' | 'BAR_BOH';
  icono: string;
  insumos: Array<{
    bienId?: string;
    sku: string;
    nombre: string;
    pesoTeoricoG: number;
    taraEnvaseG: number;
    densidad?: number;
  }>;
}

export const RECETAS_FRECUENTES_PRESETS: RecetaPreset[] = [
  {
    id: 'rec_1',
    nombre: 'Tinte 7.1 Cenizo Clásico',
    categoria: 'COLOR',
    icono: '🎨',
    insumos: [
      { sku: 'SKU-COL-TIN71', nombre: 'Tinte Majirel 7.1 Rubio Cenizo', pesoTeoricoG: 45, taraEnvaseG: 14.5, densidad: 1.0 },
      { sku: 'SKU-OXI-20VOL', nombre: 'Oxigenta 20 Vol (6%)', pesoTeoricoG: 60, taraEnvaseG: 65.0, densidad: 1.02 }
    ]
  },
  {
    id: 'rec_2',
    nombre: 'Balayage Signature Plex',
    categoria: 'DECOLORACION',
    icono: '⚡',
    insumos: [
      { sku: 'SKU-DEC-BLOND9', nombre: 'Polvo Decolorante Blond Studio 9', pesoTeoricoG: 30, taraEnvaseG: 22.0, densidad: 1.0 },
      { sku: 'SKU-OXI-30VOL', nombre: 'Oxigenta 30 Vol (9%)', pesoTeoricoG: 60, taraEnvaseG: 65.0, densidad: 1.02 },
      { sku: 'SKU-TRA-PLEX01', nombre: 'Aditivo Protector Smartbond Plex', pesoTeoricoG: 4, taraEnvaseG: 8.0, densidad: 1.05 }
    ]
  },
  {
    id: 'rec_3',
    nombre: 'Tratamiento Fusio-Dose',
    categoria: 'TRATAMIENTO',
    icono: '💧',
    insumos: [
      { sku: 'SKU-TRA-FUSIO-CONC', nombre: 'Concentré Fusio-Dose Reconstructeur', pesoTeoricoG: 12, taraEnvaseG: 12.0, densidad: 1.0 },
      { sku: 'SKU-TRA-FUSIO-BOOST', nombre: 'Booster Nutrition Kérastase', pesoTeoricoG: 6, taraEnvaseG: 10.0, densidad: 1.0 }
    ]
  },
  {
    id: 'rec_4',
    nombre: 'Salsa Pomodoro Madre (Mise 2kg)',
    categoria: 'COCINA_BOH',
    icono: '🍅',
    insumos: [
      { sku: 'SKU-ING-TOMATE-SM', nombre: 'Tomate San Marzano Triturado', pesoTeoricoG: 1800, taraEnvaseG: 120.0, densidad: 1.1 },
      { sku: 'SKU-ING-ACEITE-OLIVA', nombre: 'Aceite de Oliva Extra Virgen', pesoTeoricoG: 150, taraEnvaseG: 45.0, densidad: 0.92 },
      { sku: 'SKU-ING-ALBAHACA', nombre: 'Albahaca Fresca Orgánica', pesoTeoricoG: 50, taraEnvaseG: 10.0, densidad: 1.0 }
    ]
  },
  {
    id: 'rec_5',
    nombre: 'Masa Napolitana (Mise 5kg)',
    categoria: 'COCINA_BOH',
    icono: '🍕',
    insumos: [
      { sku: 'SKU-ING-HARINA-00', nombre: 'Harina de Trigo Tipo 00', pesoTeoricoG: 3100, taraEnvaseG: 80.0, densidad: 1.0 },
      { sku: 'SKU-ING-AGUA-FILT', nombre: 'Agua Filtrada Fría (60%)', pesoTeoricoG: 1850, taraEnvaseG: 50.0, densidad: 1.0 },
      { sku: 'SKU-ING-SAL-MARINA', nombre: 'Sal Marina Fina', pesoTeoricoG: 45, taraEnvaseG: 10.0, densidad: 1.0 },
      { sku: 'SKU-ING-LEVADURA', nombre: 'Levadura Fresca', pesoTeoricoG: 5, taraEnvaseG: 5.0, densidad: 1.0 }
    ]
  },
  {
    id: 'rec_6',
    nombre: 'Cold Brew Tonic Bar',
    categoria: 'BAR_BOH',
    icono: '🍹',
    insumos: [
      { sku: 'SKU-BAR-COLDBREW', nombre: 'Extracto Cold Brew Artesanal', pesoTeoricoG: 60, taraEnvaseG: 30.0, densidad: 1.01 },
      { sku: 'SKU-BAR-AGUA-TONICA', nombre: 'Agua Tónica Botánica', pesoTeoricoG: 150, taraEnvaseG: 110.0, densidad: 1.0 },
      { sku: 'SKU-BAR-SIROPE-CIT', nombre: 'Sirope Cítrico de Romero', pesoTeoricoG: 15, taraEnvaseG: 20.0, densidad: 1.2 }
    ]
  }
];

interface OneTapRecipeGridProps {
  onSeleccionarReceta: (receta: RecetaPreset) => void;
  onNfcScanned?: (tagUid: string, taraGramos: number) => void;
}

export function OneTapRecipeGrid({
  onSeleccionarReceta,
  onNfcScanned
}: OneTapRecipeGridProps) {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [nfcEscaneando, setNfcEscaneando] = useState(false);

  const filtradas = RECETAS_FRECUENTES_PRESETS.filter(r => 
    categoriaFiltro === 'TODAS' || r.categoria === categoriaFiltro
  );

  const handleSimularNfcBowl = () => {
    setNfcEscaneando(true);
    setTimeout(() => {
      setNfcEscaneando(false);
      // Simular lectura de bowl de mezcla con tara conocida 145g
      if (onNfcScanned) {
        onNfcScanned('NFC_BOWL_COLOR_#04', 145.0);
      }
    }, 1200);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
      
      {/* Header Botonera */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Botonera 1-Tap: Fórmulas & Sub-Recetas Rápidas
            </h3>
            <p className="text-[10px] text-slate-400">
              Toca cualquier botón para precargar instantáneamente todos los ingredientes y taras en la balanza.
            </p>
          </div>
        </div>

        {/* Botón Lector NFC */}
        <button
          type="button"
          onClick={handleSimularNfcBowl}
          disabled={nfcEscaneando}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Smartphone className={`w-3.5 h-3.5 ${nfcEscaneando ? 'animate-bounce text-sky-300' : ''}`} />
          <span>{nfcEscaneando ? 'Leyendo Tag NFC...' : '📱 Escanear Tag NFC Bowl'}</span>
        </button>
      </div>

      {/* Filtro por Categorías */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {['TODAS', 'COLOR', 'DECOLORACION', 'TRATAMIENTO', 'COCINA_BOH', 'BAR_BOH'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoriaFiltro(cat)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition whitespace-nowrap ${
              categoriaFiltro === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat === 'TODAS' ? '⭐ Todas' :
             cat === 'COLOR' ? '🎨 Color' :
             cat === 'DECOLORACION' ? '⚡ Decoloración' :
             cat === 'TRATAMIENTO' ? '💧 Tratamiento' :
             cat === 'COCINA_BOH' ? '🍳 Cocina Mise' : '🍹 Bar'}
          </button>
        ))}
      </div>

      {/* Grid de Botones 1-Tap */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {filtradas.map((preset) => {
          const totalGramos = preset.insumos.reduce((acc, i) => acc + i.pesoTeoricoG, 0);

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSeleccionarReceta(preset)}
              className="p-3 bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 rounded-2xl text-left transition-all active:scale-95 group shadow-sm flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xl group-hover:scale-110 transition-transform">{preset.icono}</span>
                <span className="text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                  {totalGramos}g
                </span>
              </div>

              <div>
                <h4 className="font-bold text-[11px] text-white leading-tight group-hover:text-indigo-300 transition-colors">
                  {preset.nombre}
                </h4>
                <p className="text-[9px] text-slate-500 mt-1">
                  {preset.insumos.length} ingredientes
                </p>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}
