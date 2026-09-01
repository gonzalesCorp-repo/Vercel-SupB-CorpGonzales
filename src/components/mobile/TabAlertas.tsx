'use client';

import React, { useState } from 'react';
import { Wifi, Clock, CheckCircle2, AlertTriangle, Play, Pause, Power, Check } from 'lucide-react';
import { ModalNfcScan } from './ModalNfcScan';
import { createClient } from '@/lib/supabase/client';
import { validarYRegistrarAsistenciaNfc, TipoMovimientoAsistencia } from '@/services/asistencias';

interface TabAlertasProps {
  agenteId: string;
  agenteNombre: string;
  estadoActual: string;
  onEstadoCambiado: (nuevoEstado: string) => void;
}

export function TabAlertas({ agenteId, agenteNombre, estadoActual, onEstadoCambiado }: TabAlertasProps) {
  const [alertaPendiente, setAlertaPendiente] = useState<string | null>(null);
  const [modalNfcOpen, setModalNfcOpen] = useState(false);
  const [tipoMovimientoActual, setTipoMovimientoActual] = useState<TipoMovimientoAsistencia>('ENTRADA');
  const [tipoAlertaNfcLabel, setTipoAlertaNfcLabel] = useState('Inicio de Turno');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');

  const supabase = createClient();

  const handleDispararAlerta = (tipoMov: TipoMovimientoAsistencia, label: string) => {
    setTipoMovimientoActual(tipoMov);
    setTipoAlertaNfcLabel(label);
    setModalNfcOpen(true);
  };

  const handleNfcExitoso = async (tag: any) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setAlertaPendiente(null);

    const tipoMov = tipoMovimientoActual;
    let nuevoEstado = 'DISPONIBLE';

    if (tipoMov === 'INICIO_REFRIGERIO') {
      nuevoEstado = 'EN_REFRIGERIO';
    } else if (tipoMov === 'SALIDA') {
      nuevoEstado = 'INACTIVO';
    } else if (tipoMov === 'FIN_REFRIGERIO' || tipoMov === 'ENTRADA') {
      nuevoEstado = 'DISPONIBLE';
    }

    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Mobile Web';
    const isIPhone = /iPhone|iPad|iPod/i.test(userAgent);
    const isAndroid = /Android/i.test(userAgent);
    const dispositivoNombre = tag.metodoMarcacion === 'DIGITAL_1TAP'
      ? (isIPhone ? 'Apple iPhone (Solicitud Local)' : isAndroid ? 'Motorola / Android (Solicitud Local)' : 'Móvil (Solicitud Local)')
      : (isAndroid ? 'Motorola Moto G53 (Sensor Web NFC)' : 'Dispositivo Móvil (NFC)');

    if (tag.metodoMarcacion === 'DIGITAL_1TAP') {
      const { useAppStore } = await import('@/store/useAppStore');
      const { crearSolicitudAsistenciaCola } = await import('@/services/asistencias');
      const activeSedeId = useAppStore.getState().sedeActiva?.id || tag.id || '';
      const activeSedeNombre = useAppStore.getState().sedeActiva?.nombre || tag.nombre || 'Sede Operativa';

      const resCola = await crearSolicitudAsistenciaCola({
        agenteId: agenteId || '',
        agenteNombre: agenteNombre || 'Colaborador',
        sedeId: activeSedeId,
        sedeNombre: activeSedeNombre,
        tipoMovimiento: tipoMov,
        dispositivo: dispositivoNombre
      });

      setFeedback(resCola.mensaje);
      setIsProcessing(false);
      setTimeout(() => setFeedback(''), 10000);
      return;
    }

    // 1. Validar reglas de negocio y registrar en Supabase asistencias_turnos para Web NFC físico
    const { useAppStore } = await import('@/store/useAppStore');
    const activeSede = useAppStore.getState().sedeActiva;

    const res = await validarYRegistrarAsistenciaNfc({
      agente_id: agenteId || '',
      agente_nombre: agenteNombre || 'Colaborador',
      sede_id: tag.id || activeSede?.id || '',
      sede_nombre: tag.nombre || activeSede?.nombre || 'Sede Operativa',
      tipo_movimiento: tipoMov,
      nfc_tag_id: tag.serialNumber,
      nfc_tag_raw: tag.raw,
      punto_acceso: tag.nombre || 'Puerta Principal',
      dispositivo: dispositivoNombre,
      metadatos: {
        metodo: 'WEB_NFC',
        hardware_serial: tag.serialNumber,
        punto: tag.nombre || 'Puerta Principal',
        dispositivo_detectado: dispositivoNombre,
        user_agent: userAgent,
        hora_lima: new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima' })
      }
    });

    if (res.estadoSugerido) {
      nuevoEstado = res.estadoSugerido;
    }

    try {
      // Actualizar último cambio de timestamp en la ficha del agente
      if (agenteId) {
        await supabase.from('agentes').update({
          ultimo_cambio_estado: new Date().toISOString()
        }).eq('id', agenteId);
      }
    } catch (e) {
      console.warn('Fallback offline para timestamp de agente:', e);
    }

    onEstadoCambiado(nuevoEstado);
    setFeedback(res.mensaje);
    setIsProcessing(false);
    setTimeout(() => setFeedback(''), 5000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Cabecera */}
      <div className="text-center py-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          WFM & Control Horario
        </span>
        <h3 className="text-sm font-black text-slate-900 dark:text-white mt-2">Botonera de Asistencia y Turno</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Valida con el Tag NFC de la sede para registrar tu estado en tiempo real.</p>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Grid de 4 Estados Principales */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* 1. Ya Llegué */}
        <button onClick={() => handleDispararAlerta('ENTRADA', 'Ya llegué (Inicio de Turno)')}
          className="bg-white dark:bg-slate-900 hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-md group relative min-h-[95px]"
        >
          <span className="text-3xl group-hover:scale-110 transition-transform">👋</span>
          <span className="text-xs font-black uppercase tracking-wide text-slate-900 dark:text-slate-200 group-hover:text-emerald-400">
            Ya llegué
          </span>
          <span className="text-[9px] text-slate-500 font-semibold">Inicio de Turno</span>
        </button>

        {/* 2. Voy a Comer */}
        <button onClick={() => handleDispararAlerta('INICIO_REFRIGERIO', 'Voy a comer (Inicio Refrigerio)')}
          className="bg-white dark:bg-slate-900 hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-md group relative min-h-[95px]"
        >
          <span className="text-3xl group-hover:scale-110 transition-transform">🍕</span>
          <span className="text-xs font-black uppercase tracking-wide text-slate-900 dark:text-slate-200 group-hover:text-amber-400">
            Voy a comer
          </span>
          <span className="text-[9px] text-slate-500 font-semibold">Pausa Refrigerio</span>
        </button>

        {/* 3. Regresé */}
        <button onClick={() => handleDispararAlerta('FIN_REFRIGERIO', 'Regresé de comer (Fin Refrigerio)')}
          className="bg-white dark:bg-slate-900 hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-md group relative min-h-[95px]"
        >
          <span className="text-3xl group-hover:scale-110 transition-transform">🔄</span>
          <span className="text-xs font-black uppercase tracking-wide text-slate-900 dark:text-slate-200 group-hover:text-indigo-400">
            Regresé
          </span>
          <span className="text-[9px] text-slate-500 font-semibold">Fin de Refrigerio</span>
        </button>

        {/* 4. Acabó mi Día */}
        <button onClick={() => handleDispararAlerta('SALIDA', 'Acabó mi día (Salida)')}
          className="bg-white dark:bg-slate-900 hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-md group relative min-h-[95px]"
        >
          <span className="text-3xl group-hover:scale-110 transition-transform">🏁</span>
          <span className="text-xs font-black uppercase tracking-wide text-slate-900 dark:text-slate-200 group-hover:text-rose-400">
            Acabó mi día
          </span>
          <span className="text-[9px] text-slate-500 font-semibold">Fin de Jornada</span>
        </button>

      </div>

      {/* Modal Lector NFC con single-fire lock */}
      <ModalNfcScan
        isOpen={modalNfcOpen}
        tipoAccion={tipoAlertaNfcLabel}
        onClose={() => setModalNfcOpen(false)}
        onSuccess={handleNfcExitoso}
      />
    </div>
  );
}
