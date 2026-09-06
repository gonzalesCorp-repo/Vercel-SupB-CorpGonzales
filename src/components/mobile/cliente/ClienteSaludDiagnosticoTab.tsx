'use client';

import React, { useState } from 'react';
import { 
  Sparkles, Dna, ShieldCheck, Heart, Coffee, VolumeX, Volume2, 
  AlertTriangle, Send, Bot, User, Check, RefreshCw, Layers 
} from 'lucide-react';
import { 
  PreferenciaSensorialCliente, 
  LuminaHqPluginConfig, 
  MensajeLuminaCopilot,
  MetaSaludCapilar,
  TipoCabello,
  FrecuenciaLavado,
  ExposicionCalor,
  ModoInteraccionSalon
} from '@/types/clienteLifestyle';
import { StitchToneScaleSelector } from './StitchToneScaleSelector';
import { procesarDiagnosticoCapilarOpal } from '@/services/opalService';
import { procesarLuminaCopilotChatOpal } from '@/services/clienteLifestyleService';
import { EvaluacionCapilarInput, OpalWorkflowOutputPayload } from '@/types/opal';
import { useUIStore } from '@/store/useUIStore';

interface ClienteSaludDiagnosticoTabProps {
  cliente: { id: string; nombre: string };
  preferencias: PreferenciaSensorialCliente;
  pluginLumina: LuminaHqPluginConfig;
  onGuardarPreferencias: (nuevas: PreferenciaSensorialCliente) => Promise<void>;
}

export function ClienteSaludDiagnosticoTab({
  cliente,
  preferencias,
  pluginLumina,
  onGuardarPreferencias
}: ClienteSaludDiagnosticoTabProps) {
  const { showAlert } = useUIStore();

  // Estados de Ficha Sensorial (Marca Blanca)
  const [modoInteraccion, setModoInteraccion] = useState<ModoInteraccionSalon>(preferencias.modo_interaccion);
  const [bebida, setBebida] = useState(preferencias.bebida_preferida);
  const [meta, setMeta] = useState<MetaSaludCapilar>(preferencias.meta_principal);
  const [tipoCabello, setTipoCabello] = useState<TipoCabello>(preferencias.tipo_cabello);
  const [lavado, setLavado] = useState<FrecuenciaLavado>(preferencias.frecuencia_lavado);
  const [calor, setCalor] = useState<ExposicionCalor>(preferencias.exposicion_calor);
  const [alergias, setAlergias] = useState<string[]>(preferencias.sensibilidades_alergias);
  const [guardando, setGuardando] = useState(false);

  // Estados de Scanner Biométrico (+ LuminaHQ)
  const [tonoBase, setTonoBase] = useState('4');
  const [tonoDeseado, setTonoDeseado] = useState('8');
  const [porosidad, setPorosidad] = useState<'BAJA' | 'MEDIA' | 'ALTA'>('MEDIA');
  const [elasticidad, setElasticidad] = useState<'BUENA' | 'REGULAR' | 'DANADA'>('BUENA');
  const [cueroCabelludo, setCueroCabelludo] = useState<'NORMAL' | 'GRASO' | 'SENSIBLE' | 'IRRITADO'>('SENSIBLE');
  const [analizandoOpal, setAnalizandoOpal] = useState(false);
  const [resultadoOpal, setResultadoOpal] = useState<OpalWorkflowOutputPayload | null>(null);

  // Estados de Copilot Chat (+ LuminaHQ)
  const [chatMensajes, setChatMensajes] = useState<MensajeLuminaCopilot[]>([
    {
      id: 'lumina-welcome',
      emisor: 'LUMINA_AI',
      texto: `¡Hola, ${cliente.nombre.split(' ')[0]}! Soy tu Copiloto Biotecnológico LuminaHQ. Pregúntame sobre ingredientes limpios, transiciones capilares o el cuidado ideal para tu cuero cabelludo.`,
      timestamp: 'Ahora'
    }
  ]);
  const [inputChat, setInputChat] = useState('');

  const BEBIDAS_DISPONIBLES = [
    'Café de especialidad americano',
    'Capuchino de avellana',
    'Infusión relajante de menta & manzanilla',
    'Copa de espumante brut',
    'Agua con gas, limón y hierbabuena'
  ];

  const ALERGIAS_DISPONIBLES = [
    'Cuero cabelludo reactivo',
    'Preferencia sin sulfatos / sin siliconas',
    'Sensibilidad al amoniaco / decolorante',
    'Piel atópica'
  ];

  const handleToggleAlergia = (al: string) => {
    setAlergias(prev => 
      prev.includes(al) ? prev.filter(a => a !== al) : [...prev, al]
    );
  };

  const handleGuardarFicha = async () => {
    setGuardando(true);
    try {
      const actualizadas: PreferenciaSensorialCliente = {
        modo_interaccion: modoInteraccion,
        bebida_preferida: bebida,
        sensibilidades_alergias: alergias,
        tipo_cabello: tipoCabello,
        frecuencia_lavado: lavado,
        exposicion_calor: calor,
        meta_principal: meta,
        notas_personales: preferencias.notas_personales
      };
      await onGuardarPreferencias(actualizadas);
      showAlert('Ficha de bienestar y preferencias guardada con éxito 🌿', 'success');
    } catch (e: any) {
      showAlert('Error al guardar: ' + e.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const ejecutarScannerOpal = async () => {
    setAnalizandoOpal(true);
    try {
      const evaluacion: EvaluacionCapilarInput = {
        porosidad,
        elasticidad,
        tono_base: tonoBase,
        tono_deseado: tonoDeseado,
        tipo_cuero_cabelludo: cueroCabelludo,
        observaciones_estilista: `Evaluación autónoma del cliente en Suite Móvil. Meta: ${meta}.`
      };

      const payload = {
        workflow_id: 'wf_diagnostico_capilar_v1',
        entorno: 'PROD' as const,
        timestamp: new Date().toISOString(),
        contexto: {
          cliente: {
            id: cliente.id,
            nombre: cliente.nombre
          },
          evaluacion_actual: evaluacion
        }
      };

      const res = await procesarDiagnosticoCapilarOpal(payload);
      setResultadoOpal(res);
      showAlert('Diagnóstico biométrico procesado por Opal AI ✨', 'success');
    } catch (err: any) {
      showAlert('Error en diagnóstico Opal: ' + err.message, 'error');
    } finally {
      setAnalizandoOpal(false);
    }
  };

  const handleEnviarChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim()) return;

    const userMsg: MensajeLuminaCopilot = {
      id: `user-${Date.now()}`,
      emisor: 'USER',
      texto: inputChat.trim(),
      timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    };

    const nuevos = [...chatMensajes, userMsg];
    setChatMensajes(nuevos);
    setInputChat('');

    setTimeout(() => {
      const respuestaAi = procesarLuminaCopilotChatOpal(nuevos, userMsg.texto);
      setChatMensajes(prev => [...prev, respuestaAi]);
    }, 400);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* ==================================================== */}
      {/* 🏷️ CAPA 1: FICHA HOLÍSTICA SENSORIAL (MARCA BLANCA)   */}
      {/* ==================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Ficha de Bienestar & Preferencias Sensoriales
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Marca Blanca</span>
        </div>

        {/* Modo de Interacción en Salón */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
            Preferencia de Atención en Salón
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setModoInteraccion('ZEN_SILENCIO')}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer active:scale-95 ${
                modoInteraccion === 'ZEN_SILENCIO'
                  ? 'bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300 font-black shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <VolumeX className="w-4 h-4 mb-1 text-purple-500" />
              <span className="text-xs block font-bold">Modo Silencio & Zen</span>
              <span className="text-[10px] block opacity-80">Deseo descansar y desconectar</span>
            </button>

            <button
              type="button"
              onClick={() => setModoInteraccion('CONVERSACIONAL')}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer active:scale-95 ${
                modoInteraccion === 'CONVERSACIONAL'
                  ? 'bg-pink-500/10 border-pink-500 text-pink-700 dark:text-pink-300 font-black shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Volume2 className="w-4 h-4 mb-1 text-pink-500" />
              <span className="text-xs block font-bold">Modo Conversacional</span>
              <span className="text-[10px] block opacity-80">Me gusta charlar y compartir</span>
            </button>
          </div>
        </div>

        {/* Bebida de Cortesía Favorita */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
            Bebida de Cortesía Preferida
          </label>
          <div className="space-y-1.5">
            {BEBIDAS_DISPONIBLES.map(b => (
              <div
                key={b}
                onClick={() => setBebida(b)}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                  bebida === b
                    ? 'bg-pink-500/10 border-pink-500 text-pink-700 dark:text-pink-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Coffee className="w-3.5 h-3.5 text-pink-500" />
                  <span>{b}</span>
                </div>
                {bebida === b && <Check className="w-3.5 h-3.5 text-pink-500" />}
              </div>
            ))}
          </div>
        </div>

        {/* Sensibilidades & Alergias */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
            Sensibilidades & Preferencias de Ingredientes
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ALERGIAS_DISPONIBLES.map(al => {
              const active = alergias.includes(al);
              return (
                <button
                  key={al}
                  type="button"
                  onClick={() => handleToggleAlergia(al)}
                  className={`p-2 rounded-xl border text-[11px] text-left transition cursor-pointer active:scale-95 ${
                    active
                      ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {al}
                </button>
              );
            })}
          </div>
        </div>

        {/* Botón Guardar Ficha */}
        <button
          type="button"
          disabled={guardando}
          onClick={handleGuardarFicha}
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Actualizar Mi Ficha de Bienestar'}
        </button>
      </div>

      {/* ==================================================== */}
      {/* 🧬 CAPA 2: SCANNER BIOMÉTRICO & COPILOT (+ LUMINA HQ) */}
      {/* ==================================================== */}
      {pluginLumina.activo ? (
        <div className="space-y-4 animate-in fade-in">
          
          {/* Banner Plug-in Activo */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 border border-purple-500/30 text-white shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Dna className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 block">
                  Plug-in LuminaHQ Activo
                </span>
                <p className="text-xs font-bold text-slate-200">
                  Scanner Biométrico Capilar & Copilot AI
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2.5 py-0.5 rounded-full font-mono">
              v{pluginLumina.version}
            </span>
          </div>

          {/* Scanner Biométrico Capilar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Dna className="w-4 h-4 text-purple-500" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Scanner Biométrico Capilar
                </h3>
              </div>
              <span className="text-[10px] text-purple-500 font-bold">Opal AI Engine</span>
            </div>

            {/* Selectores de Altura de Tono Stitch */}
            <StitchToneScaleSelector
              label="Altura de Tono Actual (Base)"
              descripcion="Selecciona el tono natural o tinturado actual de tu raíz y medios."
              valorSeleccionado={tonoBase}
              onSeleccionar={setTonoBase}
            />

            <StitchToneScaleSelector
              label="Altura de Tono Deseada (Objetivo)"
              descripcion="Tono o nivel de luminosidad al que aspiras llegar."
              valorSeleccionado={tonoDeseado}
              onSeleccionar={setTonoDeseado}
            />

            {/* Porosidad y Elasticidad */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  Porosidad de la Hebra
                </label>
                <select
                  value={porosidad}
                  onChange={e => setPorosidad(e.target.value as any)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs text-slate-800 dark:text-white font-bold outline-none"
                >
                  <option value="BAJA">Baja (Cutícula compacta)</option>
                  <option value="MEDIA">Media (Cutícula normal)</option>
                  <option value="ALTA">Alta (Cutícula abierta/daño)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  Elasticidad
                </label>
                <select
                  value={elasticidad}
                  onChange={e => setElasticidad(e.target.value as any)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs text-slate-800 dark:text-white font-bold outline-none"
                >
                  <option value="BUENA">Buena (Resistente)</option>
                  <option value="REGULAR">Regular (Estiramiento moderado)</option>
                  <option value="DANADA">Dañada (Frágil / Quiebre)</option>
                </select>
              </div>
            </div>

            {/* Botón Ejecutar Diagnóstico */}
            <button
              type="button"
              disabled={analizandoOpal}
              onClick={ejecutarScannerOpal}
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {analizandoOpal ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analizando fibra con Opal AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Procesar Scanner Biométrico Opal</span>
                </>
              )}
            </button>

            {/* Resultado Opal AI */}
            {resultadoOpal && (
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 dark:text-purple-300">
                    Dictamen Técnico Opal AI
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                    resultadoOpal.riesgo_quimico === 'BAJO' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                    resultadoOpal.riesgo_quimico === 'MODERADO' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                    'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}>
                    Riesgo {resultadoOpal.riesgo_quimico}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {resultadoOpal.diagnostico_resumen}
                </p>

                {resultadoOpal.receta_sugerida?.recomendacion_cuidado_posterior && (
                  <div className="space-y-1 pt-1 border-t border-purple-500/10 text-[11px] text-slate-600 dark:text-slate-400">
                    {resultadoOpal.receta_sugerida.recomendacion_cuidado_posterior.slice(0, 2).map((r: string, i: number) => (
                      <p key={i}>• {r}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Copiloto Conversacional LuminaHQ AI */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-500" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Lumina Copilot AI
                </h3>
              </div>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> En línea
              </span>
            </div>

            {/* Chat Box */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {chatMensajes.map(m => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.emisor === 'USER' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                    m.emisor === 'USER'
                      ? 'bg-purple-600 text-white rounded-tr-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-200 dark:border-slate-700'
                  }`}>
                    {m.texto}
                  </div>
                  <span className="text-[9px] text-slate-400 px-1 mt-0.5 font-mono">{m.timestamp}</span>
                </div>
              ))}
            </div>

            {/* Input Chat */}
            <form onSubmit={handleEnviarChat} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Pregunta sobre sulfatos, decoloración, frizz..."
                value={inputChat}
                onChange={e => setInputChat(e.target.value)}
                className="flex-1 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs text-slate-800 dark:text-white outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      ) : (
        /* Tarjeta Sugerencia de Desbloqueo de LuminaHQ */
        <div className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
          <Dna className="w-8 h-8 text-purple-400 mx-auto" />
          <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
            ¿Deseas activar el Plug-in Biotecnológico LuminaHQ?
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Desbloquea el Scanner Biométrico Capilar, el cálculo de daño con Opal AI y el Copiloto conversacional de salón.
          </p>
        </div>
      )}

    </div>
  );
}
