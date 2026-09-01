'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Wifi, X, Smartphone, CheckCircle2, AlertCircle, Sparkles, Radio, Zap, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export interface NfcPayloadParsed {
  raw: string;
  serialNumber?: string;
  tipo?: 'ESTACION' | 'SEDE' | 'STAFF' | 'DESCONOCIDO';
  id?: string;
  nombre?: string;
  metodoMarcacion?: 'WEB_NFC' | 'DIGITAL_1TAP';
}

interface ModalNfcScanProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (resultado: NfcPayloadParsed) => void;
  tipoAccion?: string;
}

export function ModalNfcScan({ isOpen, onClose, onSuccess, tipoAccion = 'Validación Web NFC' }: ModalNfcScanProps) {
  const [segundos, setSegundos] = useState(30);
  const [debugMsg, setDebugMsg] = useState('Iniciando antena Web NFC...');
  const [isSupported, setIsSupported] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [tagDetectado, setTagDetectado] = useState<NfcPayloadParsed | null>(null);

  const isCapturedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const iniciarEscanerNfc = useCallback(async () => {
    if (typeof window === 'undefined') return;

    if (!('NDEFReader' in window)) {
      setIsSupported(false);
      setDebugMsg('ℹ️ Web NFC no activo en este navegador/modelo. Puedes usar la Marcación Digital 1-Tap.');
      return;
    }

    setIsSupported(true);
    isCapturedRef.current = false;

    // Crear nuevo AbortController para cancelar el scan tras 1 disparo
    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch (e) {}
    }
    abortControllerRef.current = new AbortController();

    try {
      setDebugMsg('Conectando a la antena NFC...');
      const ndef = new (window as any).NDEFReader();
      await ndef.scan({ signal: abortControllerRef.current.signal });
      setIsScanning(true);
      setDebugMsg('📡 Antena activa. Acerca tu teléfono al Tag NFC.');

      ndef.onreading = (event: any) => {
        // Candado estricto anti-rebote: Si ya se capturó un tag, ignorar cualquier ráfaga posterior
        if (isCapturedRef.current) return;
        isCapturedRef.current = true;

        // Cancelar antena inmediatamente para evitar lecturas duplicadas
        if (abortControllerRef.current) {
          try { abortControllerRef.current.abort(); } catch (e) {}
        }

        const serial = event.serialNumber || `TAG_${Date.now()}`;
        let rawText = '';

        if (event.message && event.message.records) {
          for (const record of event.message.records) {
            try {
              if (record.recordType === 'text') {
                const textDecoder = new TextDecoder(record.encoding || 'utf-8');
                rawText = textDecoder.decode(record.data);
              } else {
                const textDecoder = new TextDecoder('utf-8');
                rawText = textDecoder.decode(record.data);
              }
            } catch (e) {
              console.warn('Error decodificando registro NFC:', e);
            }
          }
        }

        let parsed: NfcPayloadParsed = {
          raw: rawText || serial,
          serialNumber: serial,
          metodoMarcacion: 'WEB_NFC'
        };

        if (rawText.startsWith('VKN:')) {
          const parts = rawText.split(':');
          parsed.tipo = parts[1] as any || 'DESCONOCIDO';
          parsed.id = parts[2] || serial;
          const rawNombre = parts[3] || parts[2] || 'Punto de Control';
          if (rawNombre === 'Puerta_1' || rawNombre === 'Puerta 1') {
            parsed.nombre = 'Puerta Principal';
          } else {
            parsed.nombre = rawNombre.replace(/_/g, ' ');
          }
        } else if (rawText.startsWith('{') && rawText.endsWith('}')) {
          try {
            const jsonObj = JSON.parse(rawText);
            parsed = { ...parsed, ...jsonObj, metodoMarcacion: 'WEB_NFC' };
          } catch (e) {
            parsed.nombre = rawText;
          }
        } else if (rawText) {
          parsed.nombre = rawText === 'Puerta_1' ? 'Puerta Principal' : rawText.replace(/_/g, ' ');
        } else {
          parsed.nombre = `Punto de Control (${serial.slice(-5)})`;
        }

        setTagDetectado(parsed);
        setDebugMsg(`✅ ¡Punto validado! ${parsed.nombre}`);

        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }

        // Ejecutar callback de éxito una sola vez
        onSuccess(parsed);

        setTimeout(() => {
          onClose();
        }, 500);
      };

      ndef.onreadingerror = () => {
        setDebugMsg('❌ Error de lectura. Mantén el tag pegado al teléfono.');
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.warn('Error al iniciar scan NFC:', err);
      setIsScanning(false);
      setDebugMsg(
        err?.name === 'NotAllowedError'
          ? '⚠️ Toca el radar circular para activar el permiso NFC.'
          : '⚠️ Sensor NFC en espera o no disponible.'
      );
    }
  }, [onSuccess, onClose]);

  // Marcación Digital Directa de Respaldo (para iPhone, Moto G50, Moto G9 Plus)
  const handleMarcacionDigital = () => {
    if (isCapturedRef.current) return;
    isCapturedRef.current = true;

    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch (e) {}
    }

    const parsed: NfcPayloadParsed = {
      raw: 'DIGITAL_1TAP_OVERRIDE',
      serialNumber: `DIGITAL_${Date.now()}`,
      tipo: 'SEDE',
      id: 'punto_control_digital',
      nombre: 'Punto de Control Digital (Sede)',
      metodoMarcacion: 'DIGITAL_1TAP'
    };

    setTagDetectado(parsed);
    setDebugMsg('✅ ¡Marcación confirmada exitosamente!');

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    onSuccess(parsed);

    setTimeout(() => {
      onClose();
    }, 400);
  };

  useEffect(() => {
    if (!isOpen) {
      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort(); } catch (e) {}
      }
      return;
    }

    setSegundos(30);
    setTagDetectado(null);
    iniciarEscanerNfc();

    const timer = setInterval(() => {
      setSegundos((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort(); } catch (e) {}
      }
    };
  }, [isOpen, iniciarEscanerNfc]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-50 dark:bg-slate-950/80 dark:bg-black/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-2xl relative select-none"
      >
        <button onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-full bg-slate-100 dark:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Radar NFC Animado / Botón Táctil de Activación */}
        <button type="button"
          onClick={isSupported ? iniciarEscanerNfc : handleMarcacionDigital}
          className="relative w-24 h-24 mx-auto flex items-center justify-center pt-2 group outline-none cursor-pointer"
        >
          <div className={`absolute inset-0 rounded-full ${isSupported ? 'bg-indigo-500/20' : 'bg-emerald-500/20'} ${isScanning ? 'animate-ping' : ''}`} />
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl shadow-lg relative z-10 group-active:scale-95 transition-transform ${
            isSupported 
              ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-indigo-500/40' 
              : 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/40'
          }`}>
            {isSupported ? (
              <Wifi className="w-10 h-10 animate-pulse" />
            ) : (
              <Zap className="w-10 h-10 text-white" />
            )}
          </div>
        </button>

        <div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
            isSupported 
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {tipoAccion} • {isSupported ? 'Sensor NFC' : 'Modo Digital'}
          </span>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
            {isSupported ? 'Aproxime el Tag NFC' : 'Confirmar Marcación Digital'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isSupported 
              ? 'Acerque su teléfono al Tag o presione el botón de validación inmediata.'
              : 'Dispositivo compatible con Marcación Digital 1-Tap (iPhone / Android).'}
          </p>
        </div>

        {/* Botón Principal de Envío de Solicitud de Asistencia al Local */}
        <button type="button"
          onClick={handleMarcacionDigital}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current text-amber-300" />
          <span>📨 Enviar Solicitud al Local (PIN / Tótem)</span>
        </button>

        {/* Temporizador Regresivo (Si NFC está activo) */}
        {isSupported && (
          <div className="bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-300 dark:border-slate-700/60 flex items-center justify-center gap-3">
            <span className="text-xl font-black font-mono text-indigo-400">
              {segundos}s
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 text-left leading-tight">
              Esperando lectura física NFC...
            </span>
          </div>
        )}

        {/* Mensaje de Diagnóstico en Tiempo Real */}
        <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-mono leading-tight break-all text-left space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] text-indigo-400 uppercase tracking-wider font-bold">
            <Sparkles className="w-3 h-3" /> Estado:
          </div>
          <p>{debugMsg}</p>
          {tagDetectado && (
            <div className="mt-1 pt-1 border-t border-indigo-500/30 text-emerald-400 text-[10px] font-bold">
              Confirmado: {tagDetectado.nombre}
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
}
