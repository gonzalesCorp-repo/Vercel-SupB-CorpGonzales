'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, Sparkles, Heart } from 'lucide-react';
import { reproducirCampanaZen, reproducirChimeInicio } from '@/services/clienteLifestyleService';

interface StitchBreathingTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  minutosIniciales: number;
  instruccionZen?: string;
}

export function StitchBreathingTimerModal({
  isOpen,
  onClose,
  titulo,
  minutosIniciales,
  instruccionZen = 'Respira con calma al ritmo del halo de luz mientras los activos penetran en la cutícula.'
}: StitchBreathingTimerModalProps) {
  const [segundosRestantes, setSegundosRestantes] = useState(minutosIniciales * 60);
  const [activo, setActivo] = useState(false);
  const [faseRespiracion, setFaseRespiracion] = useState<'INHALA' | 'SOSTEN' | 'EXHALA'>('INHALA');
  const [tiempoFase, setTiempoFase] = useState(4);

  // Reiniciar cuando se abre
  useEffect(() => {
    if (isOpen) {
      setSegundosRestantes(minutosIniciales * 60);
      setActivo(true);
      reproducirChimeInicio();
    } else {
      setActivo(false);
    }
  }, [isOpen, minutosIniciales]);

  // Temporizador principal
  useEffect(() => {
    let interval: any = null;
    if (activo && segundosRestantes > 0) {
      interval = setInterval(() => {
        setSegundosRestantes(prev => prev - 1);
      }, 1000);
    } else if (segundosRestantes === 0 && activo) {
      setActivo(false);
      reproducirCampanaZen();
    }
    return () => clearInterval(interval);
  }, [activo, segundosRestantes]);

  // Guía de respiración 4-4-4 (Inhala 4s, Sostén 4s, Exhala 4s)
  useEffect(() => {
    let breathingInterval: any = null;
    if (activo) {
      breathingInterval = setInterval(() => {
        setTiempoFase(prev => {
          if (prev <= 1) {
            setFaseRespiracion(actual => {
              if (actual === 'INHALA') return 'SOSTEN';
              if (actual === 'SOSTEN') return 'EXHALA';
              return 'INHALA';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(breathingInterval);
  }, [activo]);

  if (!isOpen) return null;

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const progresoPorcentaje = ((minutosIniciales * 60 - segundosRestantes) / (minutosIniciales * 60)) * 100;

  const escalaHalo = 
    faseRespiracion === 'INHALA' ? 'scale-115 duration-4000 opacity-90' :
    faseRespiracion === 'SOSTEN' ? 'scale-115 duration-1000 opacity-100' :
    'scale-90 duration-4000 opacity-60';

  const textoRespiracion = 
    faseRespiracion === 'INHALA' ? 'Inhala suavemente...' :
    faseRespiracion === 'SOSTEN' ? 'Sostén con calma...' :
    'Exhala y libera tensión...';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-between p-6 text-white animate-in fade-in duration-300">
      
      {/* Barra superior */}
      <div className="w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">
              Santuario Sensorial
            </h3>
            <p className="text-[10px] text-pink-400 font-bold">Respiración Guiada 4-4-4</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Contenido Central: Anillo Respiratorio Stitch */}
      <div className="flex flex-col items-center justify-center space-y-6 my-auto">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black tracking-tight text-white">{titulo}</h2>
          <p className="text-xs text-slate-400 max-w-xs">{instruccionZen}</p>
        </div>

        {/* Halo de Respiración y Reloj */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Anillos de luz exterior pulsante */}
          <div 
            className={`absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500/30 via-purple-500/20 to-indigo-500/30 blur-2xl transition-transform ease-in-out ${escalaHalo}`}
          />
          <div 
            className={`absolute w-52 h-52 rounded-full border border-pink-500/40 transition-transform ease-in-out ${escalaHalo}`}
          />

          {/* Círculo de cuenta regresiva */}
          <div className="relative z-10 w-44 h-44 rounded-full bg-slate-900/90 border border-white/20 flex flex-col items-center justify-center shadow-2xl backdrop-blur-xl">
            <span className="text-3xl font-black font-mono tracking-tight text-white">
              {String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mt-1">
              {faseRespiracion} ({tiempoFase}s)
            </span>
            <p className="text-[9px] text-slate-400 mt-0.5 text-center px-2">
              {textoRespiracion}
            </p>
          </div>
        </div>

        {/* Sonido Zen Indicador */}
        <button
          type="button"
          onClick={reproducirCampanaZen}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold transition cursor-pointer active:scale-95"
        >
          <Volume2 className="w-3.5 h-3.5 text-pink-400" />
          <span>Sonar Cuenco Tibetano Zen</span>
        </button>
      </div>

      {/* Controles Táctiles Inferiores */}
      <div className="w-full max-w-xs space-y-3 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSegundosRestantes(minutosIniciales * 60);
              setActivo(true);
            }}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer active:scale-95"
            title="Reiniciar"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setActivo(!activo)}
            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 transition cursor-pointer active:scale-95"
          >
            {activo ? (
              <>
                <Pause className="w-4 h-4" /> Pausar Pausa Zen
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Reanudar Autocuidado
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-bold transition cursor-pointer"
        >
          Finalizar y Volver a Mi Santuario
        </button>
      </div>

    </div>
  );
}
