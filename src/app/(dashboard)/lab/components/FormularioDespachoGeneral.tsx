'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  obtenerPlantillaInsumosConfig, 
  calcularInsumosComplementariosPorReglas,
  PlantillaInsumosConfig,
  PLANTILLA_INSUMOS_DEFAULT 
} from '@/services/plantillasInsumos';
import { 
  PackageSearch, Zap, Plus, Scale, Sparkles, AlertCircle, 
  Check, CheckCircle2, ChevronRight, Barcode, Trash2, Printer 
} from 'lucide-react';
import { ModalOneTapRecipes } from './ModalOneTapRecipes';
import { RecetaPreset } from './OneTapRecipeGrid';

interface InsumoFila {
  bienId: string;
  sku: string;
  nombre: string;
  pesoTeoricoG: number;
  taraEnvaseG: number;
  pesoBrutoG: number;
  pesoNetoG: number;
  densidad: number;
  toleranciaPorc: number;
  pesado: boolean;
  motivoRegla?: string;
}

interface FormularioDespachoGeneralProps {
  bienesInsumos: any[];
  habilitarBalanzasIot: boolean;
  pesoBalanzaActual: number;
  balanzaEstable: boolean;
  onSimularPesaje: (index: number) => void;
  onCapturarBalanza: (index: number) => void;
  onDespachar: (filas: InsumoFila[]) => void;
  pedidoOatc?: any;
}

export function FormularioDespachoGeneral({
  bienesInsumos,
  habilitarBalanzasIot,
  pesoBalanzaActual,
  balanzaEstable,
  onSimularPesaje,
  onCapturarBalanza,
  onDespachar,
  pedidoOatc
}: FormularioDespachoGeneralProps) {
  const [plantilla, setPlantilla] = useState<PlantillaInsumosConfig>(PLANTILLA_INSUMOS_DEFAULT);
  const [modalOneTapOpen, setModalOneTapOpen] = useState(false);

  // Insumo principal seleccionado
  const [insumoPrincipalId, setInsumoPrincipalId] = useState<string>('');
  const [gramosPrincipal, setGramosPrincipal] = useState<number>(45);
  const [valoresAtributos, setValoresAtributos] = useState<Record<string, any>>({
    marca: 'L’Oréal Professionnel',
    linea: 'Majirel Cool Inforced',
    ratio_oxigenta: '1:1.5 (Tinte x 1.5 Estándar)',
    volumen_oxigenta: '20 Vol (6% Estándar)',
    requiere_plex_protector: false
  });

  // Lista multicomponente activa
  const [filas, setFilas] = useState<InsumoFila[]>([]);
  const [filaActivaIdx, setFilaActivaIdx] = useState<number>(0);

  useEffect(() => {
    obtenerPlantillaInsumosConfig().then(setPlantilla);
  }, []);

  // Inicializar insumo principal al cargar bienes
  useEffect(() => {
    if (bienesInsumos.length > 0 && !insumoPrincipalId) {
      const primero = bienesInsumos[0];
      setInsumoPrincipalId(primero.bien_id || primero.id);
    }
  }, [bienesInsumos, insumoPrincipalId]);

  // Recalcular componentes al cambiar insumo principal, cantidad o atributos
  useEffect(() => {
    const principal = bienesInsumos.find(b => (b.bien_id || b.id) === insumoPrincipalId);
    const nombrePrincipal = principal?.producto || principal?.nombre || 'Tinte 7.1 Rubio Cenizo';
    const skuPrincipal = principal?.sku || 'SKU-COL-TIN71';
    const taraPrincipal = Number(principal?.tara_gramos || principal?.peso_envase_tara_gramos || 14.5);

    const filaPral: InsumoFila = {
      bienId: insumoPrincipalId,
      sku: skuPrincipal,
      nombre: nombrePrincipal,
      pesoTeoricoG: Number(gramosPrincipal || 45),
      taraEnvaseG: taraPrincipal,
      pesoBrutoG: 0,
      pesoNetoG: 0,
      densidad: 1.0,
      toleranciaPorc: 3.0,
      pesado: false
    };

    // Ejecutar reglas de cálculo dinámicas de la plantilla
    const complementarios = calcularInsumosComplementariosPorReglas(
      nombrePrincipal,
      gramosPrincipal,
      valoresAtributos,
      plantilla.reglas
    );

    const filasCompl: InsumoFila[] = complementarios.map((c, idx) => ({
      bienId: `auto_${idx}`,
      sku: c.sku,
      nombre: c.nombre,
      pesoTeoricoG: c.pesoTeoricoG,
      taraEnvaseG: c.taraEnvaseG,
      pesoBrutoG: 0,
      pesoNetoG: 0,
      densidad: 1.0,
      toleranciaPorc: 3.0,
      pesado: false,
      motivoRegla: c.motivoRegla
    }));

    setFilas([filaPral, ...filasCompl]);
    setFilaActivaIdx(0);
  }, [insumoPrincipalId, gramosPrincipal, valoresAtributos, plantilla]);

  // Carga desde preset 1-Tap
  const handleCargarPreset = (preset: RecetaPreset) => {
    const nuevasFilas: InsumoFila[] = preset.insumos.map((i, idx) => ({
      bienId: i.bienId || `preset_${idx}`,
      sku: i.sku,
      nombre: i.nombre,
      pesoTeoricoG: i.pesoTeoricoG,
      taraEnvaseG: i.taraEnvaseG,
      pesoBrutoG: 0,
      pesoNetoG: 0,
      densidad: i.densidad || 1.0,
      toleranciaPorc: 3.0,
      pesado: false
    }));

    setFilas(nuevasFilas);
    setFilaActivaIdx(0);
  };

  const totalGramosFormula = filas.reduce((acc, f) => acc + (f.pesoNetoG > 0 ? f.pesoNetoG : f.pesoTeoricoG), 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-5">
      
      {/* Header Formulario */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
            Formulario General de Despacho
          </span>
          <h2 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
            <PackageSearch className="w-4 h-4 text-indigo-500" />
            Configuración & Cálculo Dinámico de Insumos
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setModalOneTapOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:to-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>⚡ Fórmulas Rápidas 1-Tap</span>
        </button>
      </div>

      {/* Grid de Configuración de Plantilla */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-2xl">
        
        {/* Insumo Base */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            Insumo Principal (Catálogo):
          </label>
          <select
            value={insumoPrincipalId}
            onChange={(e) => setInsumoPrincipalId(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
          >
            {bienesInsumos.map((b) => (
              <option key={b.bien_id || b.id} value={b.bien_id || b.id}>
                {b.producto || b.nombre} ({b.sku})
              </option>
            ))}
          </select>
        </div>

        {/* Gramos / Dosis */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            Gramos Requeridos (Base):
          </label>
          <div className="relative">
            <input
              type="number"
              value={gramosPrincipal}
              onChange={(e) => setGramosPrincipal(Math.max(1, Number(e.target.value)))}
              min={1}
              step={5}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-mono font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] font-bold text-slate-400 absolute right-3 top-2.5">gramos</span>
          </div>
        </div>

        {/* Ratio de Mezcla */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            Ratio de Mezcla Dinámico:
          </label>
          <select
            value={valoresAtributos.ratio_oxigenta}
            onChange={(e) => setValoresAtributos(prev => ({ ...prev, ratio_oxigenta: e.target.value }))}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-semibold text-indigo-600 dark:text-indigo-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="1:1 (Tinte x 1.0)">1:1 (Tinte x 1.0)</option>
            <option value="1:1.5 (Tinte x 1.5 Estándar)">1:1.5 (Tinte x 1.5 Estándar)</option>
            <option value="1:2 (Tinte x 2.0 Superaclarante)">1:2 (Tinte x 2.0 Superaclarante)</option>
          </select>
        </div>

      </div>

      {/* Reglas de Cálculo Automáticas Activadas */}
      {filas.some(f => f.motivoRegla) && (
        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl space-y-1 text-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Reglas de Cálculo Automático Aplicadas
          </p>
          {filas.filter(f => f.motivoRegla).map((f, i) => (
            <p key={i} className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              • <strong>{f.nombre}</strong>: {f.motivoRegla}
            </p>
          ))}
        </div>
      )}

      {/* Si Balanzas IoT están Habilitadas ➔ Mesa Multicomponente con Balanza */}
      {habilitarBalanzasIot ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Mesa de Pesaje Multicomponente (Balanza IoT Sincronizada)
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Hardware Activo
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-[10px] uppercase">
                  <th className="pb-2">SKU / Insumo</th>
                  <th className="pb-2 text-center">Teórico</th>
                  <th className="pb-2 text-center">Tara</th>
                  <th className="pb-2 text-center">Bruto Balanza</th>
                  <th className="pb-2 text-center">Neto Real</th>
                  <th className="pb-2 text-center">Tolerancia</th>
                  <th className="pb-2 text-right">Acción Balanza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filas.map((fila, idx) => {
                  const isActiva = idx === filaActivaIdx;
                  const delta = Math.abs(fila.pesoNetoG - fila.pesoTeoricoG);
                  const dentroTolerancia = fila.pesado && (delta / (fila.pesoTeoricoG || 1)) * 100 <= fila.toleranciaPorc;

                  return (
                    <tr
                      key={idx}
                      onClick={() => setFilaActivaIdx(idx)}
                      className={`cursor-pointer transition-colors ${
                        isActiva ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="py-2.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{fila.nombre}</div>
                        <div className="text-[10px] font-mono text-indigo-500">{fila.sku}</div>
                      </td>

                      <td className="py-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {fila.pesoTeoricoG} g
                      </td>

                      <td className="py-2.5 text-center font-mono text-slate-400">
                        -{fila.taraEnvaseG} g
                      </td>

                      <td className="py-2.5 text-center font-mono font-bold text-slate-800 dark:text-white">
                        {fila.pesoBrutoG > 0 ? `${fila.pesoBrutoG} g` : '-'}
                      </td>

                      <td className="py-2.5 text-center font-mono font-black text-emerald-500">
                        {fila.pesoNetoG > 0 ? `${fila.pesoNetoG} g` : `${fila.pesoTeoricoG} g`}
                      </td>

                      <td className="py-2.5 text-center">
                        {fila.pesado ? (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            dentroTolerancia 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {dentroTolerancia ? 'Exacto' : 'Desviación'}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                            Por Pesar
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onSimularPesaje(idx); }}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-bold transition"
                            title="Simular pesaje con balanza IoT"
                          >
                            <Scale className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onCapturarBalanza(idx); }}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-300 rounded-lg text-xs font-bold transition"
                            title="Capturar peso de la balanza"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Modo Convencional sin Balanza */
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Resumen de Insumos a Despachar (Modo Manual Convencional)
          </h3>
          <div className="space-y-2">
            {filas.map((f, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{f.nombre}</span>
                  <span className="block text-[10px] font-mono text-slate-400">{f.sku}</span>
                </div>
                <span className="font-mono font-black text-indigo-500">{f.pesoTeoricoG} g</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer de Despacho */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Total Fórmula:{' '}
          <strong className="text-slate-800 dark:text-white font-mono font-black text-sm">
            {totalGramosFormula.toFixed(1)} g
          </strong>
        </div>

        <button
          type="button"
          onClick={() => onDespachar(filas)}
          disabled={filas.length === 0}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Printer className="w-4 h-4" /> Despachar Insumos & Imprimir ODI
        </button>
      </div>

      {/* Modal 1-Tap bajo demanda */}
      <ModalOneTapRecipes
        isOpen={modalOneTapOpen}
        onClose={() => setModalOneTapOpen(false)}
        onSeleccionarReceta={handleCargarPreset}
      />

    </div>
  );
}
