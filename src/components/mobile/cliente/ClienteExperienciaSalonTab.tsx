'use client';

import React, { useState } from 'react';
import { 
  Calendar, Clock, QrCode, Sparkles, CheckCircle2, 
  MapPin, Scissors, AlertCircle, ArrowRight, UserCheck 
} from 'lucide-react';
import { PredictorCicloCapilarOpal } from '@/types/clienteLifestyle';
import { useUIStore } from '@/store/useUIStore';

interface ClienteExperienciaSalonTabProps {
  cliente: { id: string; nombre: string; dni?: string };
  predictorOpal: PredictorCicloCapilarOpal;
  historialAtenciones: any[];
  ordenActiva?: any;
  onSolicitarCita: (servicio: string, fechaHora: string) => Promise<void>;
  sedeNombre?: string;
}

export function ClienteExperienciaSalonTab({
  cliente,
  predictorOpal,
  historialAtenciones,
  ordenActiva,
  onSolicitarCita,
  sedeNombre = 'Gloss Salón & Relax'
}: ClienteExperienciaSalonTabProps) {
  const { showAlert } = useUIStore();
  const [servicioSeleccionado, setServicioSeleccionado] = useState(predictorOpal.proximo_servicio_recomendado);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('11:00');
  const [solicitando, setSolicitando] = useState(false);
  const [showPaseModal, setShowPaseModal] = useState(false);

  const SERVICIOS_POPULARES = [
    'Nutrición Molecular Profunda en Salón',
    'Baño de Brillo & Retoque de Raíz',
    'Balayage Iluminación Signature',
    'Corte de Diseño & Sellado de Puntas',
    'Terapia Detox de Cuero Cabelludo'
  ];

  const handleAgendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha) {
      showAlert('Por favor selecciona una fecha para tu cita.', 'info');
      return;
    }

    setSolicitando(true);
    try {
      await onSolicitarCita(servicioSeleccionado, `${fecha} ${hora}`);
      showAlert(`¡Solicitud enviada para "${servicioSeleccionado}"! Nuestro concierge te confirmará por WhatsApp.`, 'success');
    } catch (e: any) {
      showAlert('Error al agendar: ' + e.message, 'error');
    } finally {
      setSolicitando(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* 1. Monitoreo de Atención Activa en Salón (si el cliente está en piso) */}
      {ordenActiva ? (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-500/20 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              En Salón Ahora
            </span>
            <span className="text-xs font-mono font-bold">Orden #{ordenActiva.id?.slice(0, 6)}</span>
          </div>

          <div>
            <h3 className="text-base font-black text-emerald-900 dark:text-white">
              {ordenActiva.agente_nombre ? `Siendo atendido(a) por ${ordenActiva.agente_nombre}` : 'Servicio en Curso'}
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
              Sillón asignado • Disfruta tu bebida de cortesía y modo relajación.
            </p>
          </div>
        </div>
      ) : null}

      {/* 2. Predictor de Ciclo Capilar Opal AI */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-pink-500" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Predictor de Ciclo Capilar Opal
            </h3>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
            predictorOpal.nivel_urgencia === 'PREVENTIVO' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
            predictorOpal.nivel_urgencia === 'IDEAL' ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold' :
            'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black animate-pulse'
          }`}>
            Fase {predictorOpal.nivel_urgencia}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Servicio Recomendado:</span>
            <span className="font-bold text-slate-900 dark:text-white">{predictorOpal.proximo_servicio_recomendado}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Días desde última visita:</span>
            <span className="font-mono font-bold text-pink-500">{predictorOpal.dias_desde_ultimo_servicio} días</span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 leading-relaxed">
            {predictorOpal.motivo_tecnico}
          </p>
        </div>
      </div>

      {/* 3. Formulario de Cita Zen */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Calendar className="w-4 h-4 text-purple-500" />
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Reservar Experiencia Zen en {sedeNombre}
          </h3>
        </div>

        <form onSubmit={handleAgendar} className="space-y-3">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
              Servicio de Belleza & Bienestar
            </label>
            <select
              value={servicioSeleccionado}
              onChange={e => setServicioSeleccionado(e.target.value)}
              className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs text-slate-900 dark:text-white font-bold outline-none focus:border-pink-500"
            >
              {SERVICIOS_POPULARES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                Fecha Preferida
              </label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs text-slate-900 dark:text-white font-mono outline-none focus:border-pink-500"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                Hora Estimada
              </label>
              <select
                value={hora}
                onChange={e => setHora(e.target.value)}
                className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs text-slate-900 dark:text-white font-bold outline-none focus:border-pink-500"
              >
                <option value="10:00">10:00 AM</option>
                <option value="11:30">11:30 AM</option>
                <option value="14:00">02:00 PM</option>
                <option value="16:00">04:00 PM</option>
                <option value="18:00">06:00 PM</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={solicitando}
            className="w-full h-11 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs rounded-xl shadow-lg shadow-pink-600/20 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {solicitando ? 'Enviando solicitud...' : 'Solicitar Reserva Zen'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 4. Historial de Visitas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Historial de Visitas Previas
        </h3>

        {historialAtenciones.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center italic">
            Aún no registras atenciones previas en el sistema.
          </p>
        ) : (
          <div className="space-y-2">
            {historialAtenciones.slice(0, 3).map(oatc => (
              <div
                key={oatc.id}
                className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {oatc.agente_nombre ? `Atendido por ${oatc.agente_nombre}` : 'Visita en Salón'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(oatc.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-500">
                  S/ {Number(oatc.total || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
