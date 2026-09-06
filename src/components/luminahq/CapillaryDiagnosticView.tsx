'use client';

import React, { useState } from 'react';
import { 
  Sparkles, Activity, ShieldAlert, CheckCircle2, AlertTriangle, 
  FlaskConical, Clock, Layers, ArrowRight, RefreshCw, Send, Check, Heart
} from 'lucide-react';
import { 
  EvaluacionCapilarInput, 
  OpalWorkflowInputPayload, 
  OpalWorkflowOutputPayload 
} from '@/types/opal';
import { procesarDiagnosticoCapilarOpal } from '@/services/opalService';

const ALTURAS_TONO = [
  { valor: '1', nombre: '1. Negro Profundo', hex: '#111827' },
  { valor: '2', nombre: '2. Moreno', hex: '#1f2937' },
  { valor: '3', nombre: '3. Castaño Oscuro', hex: '#37271e' },
  { valor: '4', nombre: '4. Castaño Medio', hex: '#4a3528' },
  { valor: '5', nombre: '5. Castaño Claro', hex: '#5c4333' },
  { valor: '6', nombre: '6. Rubio Oscuro', hex: '#7a5a40' },
  { valor: '7', nombre: '7. Rubio Medio', hex: '#a17c52' },
  { valor: '8', nombre: '8. Rubio Claro', hex: '#cbb082' },
  { valor: '9', nombre: '9. Rubio Muy Claro', hex: '#e8d4a9' },
  { valor: '10', nombre: '10. Rubio Platino', hex: '#faebd7' }
];

export function CapillaryDiagnosticView() {
  const [nombreCliente, setNombreCliente] = useState('Valeria Mendoza');
  const [evaluacion, setEvaluacion] = useState<EvaluacionCapilarInput>({
    porosidad: 'MEDIA',
    elasticidad: 'BUENA',
    tono_base: '4',
    tono_deseado: '8',
    tipo_cuero_cabelludo: 'NORMAL',
    observaciones_estilista: 'Cliente solicita balayage con acabado cenizo perlado.'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [resultadoOpal, setResultadoOpal] = useState<OpalWorkflowOutputPayload | null>(null);
  const [despachado, setDespachado] = useState(false);

  // Estimación visual preliminar de riesgo
  const baseNum = parseInt(evaluacion.tono_base) || 4;
  const deseadoNum = parseInt(evaluacion.tono_deseado) || 8;
  const saltoNiveles = Math.max(0, deseadoNum - baseNum);

  const riesgoEstimado = 
    (evaluacion.elasticidad === 'DANADA' || evaluacion.tipo_cuero_cabelludo === 'IRRITADO' || (saltoNiveles >= 4 && evaluacion.porosidad === 'ALTA'))
      ? 'CRITICO'
      : (evaluacion.elasticidad === 'REGULAR' || evaluacion.porosidad === 'ALTA' || saltoNiveles >= 3)
        ? 'MODERADO'
        : 'BAJO';

  const ejecutarDiagnostico = async () => {
    setIsLoading(true);
    setDespachado(false);

    try {
      const payload: OpalWorkflowInputPayload = {
        workflow_id: 'wf_diagnostico_capilar_v1',
        entorno: 'PROD',
        timestamp: new Date().toISOString(),
        contexto: {
          cliente: {
            nombre: nombreCliente
          },
          evaluacion_actual: evaluacion
        }
      };

      const resultado = await procesarDiagnosticoCapilarOpal(payload);
      setResultadoOpal(resultado);
    } catch (err) {
      console.error('Error procesando diagnóstico con Opal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDespacharLab = () => {
    setDespachado(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Principal Generativo (Stitch Design) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/25 text-indigo-300 border border-indigo-500/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Stitch UI + Google Opal AI</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Diagnóstico Capilar & Formulación Química
            </h1>
            <p className="text-xs md:text-sm text-slate-300">
              Generación de recetas químicas asistidas por modelos de lenguaje en tiempo real con validación de salud de fibra capilar y stock de Laboratorio.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Riesgo Preliminar</span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                riesgoEstimado === 'CRITICO' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                riesgoEstimado === 'MODERADO' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {riesgoEstimado} ({saltoNiveles} niveles)
              </span>
            </div>
            <Activity className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Grid de Formulario Táctil & Parámetros */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Parámetros del Diagnóstico (Stitch Ergonomics) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          
          {/* Nombre del Cliente */}
          <div>
            <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Cliente / Ficha
            </label>
            <input 
              type="text"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              placeholder="Nombre del cliente..."
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* Selector de Tono Base vs Tono Deseado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                1. Tono Base Actual
              </label>
              <select 
                value={evaluacion.tono_base}
                onChange={(e) => setEvaluacion(prev => ({ ...prev, tono_base: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                {ALTURAS_TONO.map(t => (
                  <option key={t.valor} value={t.valor}>{t.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                2. Tono Deseado (Objetivo)
              </label>
              <select 
                value={evaluacion.tono_deseado}
                onChange={(e) => setEvaluacion(prev => ({ ...prev, tono_deseado: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                {ALTURAS_TONO.map(t => (
                  <option key={t.valor} value={t.valor}>{t.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Porosidad Capilar */}
          <div>
            <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              3. Porosidad de la Cutícula
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'BAJA', label: 'Baja (Cutícula Cerrada)', desc: 'Resistente a absorción' },
                { key: 'MEDIA', label: 'Media (Saludable)', desc: 'Absorción normal' },
                { key: 'ALTA', label: 'Alta (Porosa / Abierta)', desc: 'Absorción ultra rápida' }
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setEvaluacion(prev => ({ ...prev, porosidad: item.key as any }))}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    evaluacion.porosidad === item.key
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-black block">{item.label}</span>
                  <span className="text-[10px] opacity-75 block mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Elasticidad Capilar */}
          <div>
            <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              4. Elasticidad & Resistencia de la Hebra
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'BUENA', label: 'Buena', desc: 'Retorna sin romperse' },
                { key: 'REGULAR', label: 'Regular', desc: 'Leve estiramiento' },
                { key: 'DANADA', label: 'Dañada / Chicle', desc: 'Se quiebra o sobreextiende' }
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setEvaluacion(prev => ({ ...prev, elasticidad: item.key as any }))}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    evaluacion.elasticidad === item.key
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-black block">{item.label}</span>
                  <span className="text-[10px] opacity-75 block mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cuero Cabelludo */}
          <div>
            <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              5. Estado del Cuero Cabelludo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'NORMAL', label: 'Normal' },
                { key: 'GRASO', label: 'Graso' },
                { key: 'SENSIBLE', label: 'Sensible' },
                { key: 'IRRITADO', label: 'Irritado' }
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setEvaluacion(prev => ({ ...prev, tipo_cuero_cabelludo: item.key as any }))}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                    evaluacion.tipo_cuero_cabelludo === item.key
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botón de Ejecución Opal */}
          <button
            type="button"
            disabled={isLoading}
            onClick={ejecutarDiagnostico}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Razonando con Google Opal AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Ejecutar Diagnóstico & Generar Receta Química</span>
              </>
            )}
          </button>

        </div>

        {/* Columna Derecha: Resultado & Receta Química (Opal AI Output) */}
        <div className="lg:col-span-5 space-y-4">
          
          {!resultadoOpal && !isLoading && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center">
                <FlaskConical className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
                Esperando Evaluación
              </h3>
              <p className="text-xs max-w-xs leading-relaxed">
                Selecciona los parámetros capilares del cliente en el panel táctil y presiona &quot;Ejecutar Diagnóstico&quot; para orquestar la receta técnica con Opal AI.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  Orquestando Nodos en Google Opal
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Validando compatibilidad química, volumen de oxidante y stock en Laboratorio...
                </p>
              </div>
            </div>
          )}

          {resultadoOpal && !isLoading && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 animate-in fade-in duration-300">
              
              {/* Header de Resultados */}
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Protocolo Recomendado
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Receta Química #OPAL-{Math.floor(Math.random() * 9000 + 1000)}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block">Salud Fibra</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1 justify-end">
                    <Heart className="w-3.5 h-3.5 fill-current text-rose-500" />
                    {resultadoOpal.score_salud_fibra}/100
                  </span>
                </div>
              </div>

              {/* Diagnóstico Resumen */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 font-medium leading-relaxed">
                {resultadoOpal.diagnostico_resumen}
              </div>

              {/* Pasos de la Receta */}
              <div className="space-y-3">
                <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                  Pasos de Aplicación en Laboratorio
                </span>

                {resultadoOpal.receta_sugerida.pasos.map((paso) => (
                  <div 
                    key={paso.orden}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                          {paso.orden}
                        </span>
                        {paso.accion}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {paso.tiempo_exposicion_minutos} min
                      </span>
                    </div>

                    {/* Insumos */}
                    <div className="space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {paso.insumos.map((ins, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                          <span>{ins.nombre}</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{ins.cantidad_gramos}g</span>
                        </div>
                      ))}
                    </div>

                    {/* Precauciones */}
                    {paso.precauciones && paso.precauciones.length > 0 && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-300 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>{paso.precauciones.join('. ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Costo Estimado & Acciones */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Costo Teórico Insumos</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    S/ {resultadoOpal.receta_sugerida.costo_estimado_insumos.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDespacharLab}
                  disabled={despachado}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    despachado 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                  }`}
                >
                  {despachado ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Despachado a Laboratorio</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar a Laboratorio (Kardex)</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
