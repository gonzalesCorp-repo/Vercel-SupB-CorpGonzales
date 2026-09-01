'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, ShieldAlert, Sparkles, CheckCircle2, X, User, BookOpen } from 'lucide-react';
import { emitirIncidencia } from '@/services/incidencias';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';

interface CitaAgenda {
  id: string;
  clienteNombre: string;
  servicio: string;
  hora: string;
  duracionMin: number;
  tipo: 'CITA_CLIENTE' | 'BLOQUEO_CAPACITACION' | 'BLOQUEO_VACACIONES' | 'BLOQUEO_PERMISO';
  estado: 'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO';
}

interface TabAgendaProps {
  agenteNombre: string;
  agenteRol: string;
  onBloqueoRegistrado?: (motivo: string) => void;
}

export function TabAgenda({ agenteNombre, agenteRol, onBloqueoRegistrado }: TabAgendaProps) {
  const [citas, setCitas] = useState<CitaAgenda[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [tipoRegistro, setTipoRegistro] = useState<'CITA' | 'BLOQUEO'>('CITA');
  
  // Form fields
  const [nombreCliente, setNombreCliente] = useState('');
  const [servicioNombre, setServicioNombre] = useState('Corte & Peinado');
  const [horaSeleccionada, setHoraSeleccionada] = useState('06:00 PM');
  const [motivoBloqueo, setMotivoBloqueo] = useState('Capacitación Técnica L’Oréal');
  const [feedback, setFeedback] = useState('');

  const supabase = createClient();
  const sedeId = useAppStore((state) => state.sedeActiva?.id) || 'd954b259-69a0-4546-9156-2f6ad392853f';

  const cargarCitas = async () => {
    setLoading(true);
    const hoy = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('citas')
      .select('*')
      .eq('sede_id', sedeId)
      .gte('created_at', `${hoy}T00:00:00`)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      const mapeadas: CitaAgenda[] = data.map((c: any) => ({
        id: c.id,
        clienteNombre: c.cliente_nombre || 'Cliente Agendado',
        servicio: c.servicio_solicitado || c.notas || 'Servicio Integral',
        hora: c.hora_inicio || (c.inicio_iso ? new Date(c.inicio_iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Flexible'),
        duracionMin: 60,
        tipo: (c.notas && c.notas.includes('Bloqueo')) ? 'BLOQUEO_CAPACITACION' : 'CITA_CLIENTE',
        estado: (c.estado as any) || 'PROGRAMADO'
      }));
      setCitas(mapeadas);
    } else {
      // Fallback predeterminado de muestra si el día recién inicia
      setCitas([
        { id: '1', clienteNombre: 'Luciana Ramos', servicio: 'Alisado Orgánico + Tratamiento', hora: '03:15 PM', duracionMin: 90, tipo: 'CITA_CLIENTE', estado: 'EN_CURSO' },
        { id: '2', clienteNombre: 'Andrea Silva', servicio: 'Balayage Premium', hora: '05:30 PM', duracionMin: 120, tipo: 'CITA_CLIENTE', estado: 'PROGRAMADO' }
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarCitas();
  }, [sedeId, agenteNombre]);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const hoy = new Date().toISOString().split('T')[0];

    if (tipoRegistro === 'CITA') {
      const nuevaCita: CitaAgenda = {
        id: `cita_${Date.now()}`,
        clienteNombre: nombreCliente || 'Cliente Agendado',
        servicio: servicioNombre,
        hora: horaSeleccionada,
        duracionMin: 60,
        tipo: 'CITA_CLIENTE',
        estado: 'PROGRAMADO'
      };
      setCitas(prev => [...prev, nuevaCita]);

      // Persistir en Supabase citas
      await supabase.from('citas').insert([{
        sede_id: sedeId,
        cliente_nombre: nombreCliente || 'Cliente Agendado',
        agente_nombre: agenteNombre,
        servicio_solicitado: servicioNombre,
        hora_inicio: horaSeleccionada,
        fecha: hoy,
        inicio_iso: `${hoy}T18:00:00.000Z`,
        estado: 'PROGRAMADO',
        notas: `Cita registrada por ${agenteNombre}`
      }]);

      setFeedback('¡Cita registrada exitosamente en tu agenda y sincronizada con Recepción!');
    } else {
      const nuevoBloqueo: CitaAgenda = {
        id: `bloqueo_${Date.now()}`,
        clienteNombre: `🛡️ Bloqueo: ${motivoBloqueo}`,
        servicio: 'Disponibilidad Pausada',
        hora: horaSeleccionada,
        duracionMin: 120,
        tipo: motivoBloqueo.includes('Vacaciones') ? 'BLOQUEO_VACACIONES' : 'BLOQUEO_CAPACITACION',
        estado: 'PROGRAMADO'
      };
      setCitas(prev => [...prev, nuevoBloqueo]);

      // Persistir en Supabase citas como Bloqueo
      await supabase.from('citas').insert([{
        sede_id: sedeId,
        cliente_nombre: `🛡️ Bloqueo: ${motivoBloqueo}`,
        agente_nombre: agenteNombre,
        servicio_solicitado: 'Disponibilidad Pausada',
        hora_inicio: horaSeleccionada,
        fecha: hoy,
        inicio_iso: `${hoy}T18:00:00.000Z`,
        estado: 'BLOQUEADO',
        notas: `Bloqueo de horario: ${motivoBloqueo}`
      }]);

      // Emitir incidencia en tiempo real hacia Recepción y Jefe Operativo
      emitirIncidencia({
        tipo: 'COBERTURA_AGENDA',
        titulo: `Bloqueo de Agenda: ${motivoBloqueo}`,
        descripcion: `${agenteNombre} ha bloqueado su horario a las ${horaSeleccionada} (${motivoBloqueo}).`,
        origenAgenteNombre: agenteNombre,
        origenAgenteRol: agenteRol,
        sedeId: sedeId,
        accionSugerida: 'Rebalancear Estaciones / Convocar Refuerzo Freelance'
      });

      if (onBloqueoRegistrado) onBloqueoRegistrado(motivoBloqueo);
      setFeedback('¡Bloqueo registrado y notificado al buzón de Recepción/Admin!');
    }

    setModalNuevoOpen(false);
    setNombreCliente('');
    setTimeout(() => setFeedback(''), 4000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Header Agenda */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
            Agenda Personal
          </span>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Citas & Bloqueos de Horario</h3>
        </div>

        <button
          onClick={() => setModalNuevoOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Cita / Bloqueo</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Lista de Citas */}
      <div className="space-y-2.5">
        {citas.map((item) => {
          const isBloqueo = item.tipo.startsWith('BLOQUEO');
          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                isBloqueo
                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                  : item.estado === 'EN_CURSO'
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-white shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isBloqueo ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-indigo-400'}`}>
                  {isBloqueo ? <ShieldAlert className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">{item.clienteNombre}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.servicio}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-xs font-black text-slate-200">{item.hora}</span>
                <span className={`block text-[9px] font-black uppercase tracking-wider mt-0.5 ${
                  item.estado === 'EN_CURSO' ? 'text-indigo-400' : 'text-slate-500'
                }`}>
                  {item.estado}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nuevo Registro */}
      {modalNuevoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Nuevo Registro en Agenda</h3>
              <button onClick={() => setModalNuevoOpen(false)} className="text-slate-500 dark:text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector Tipo */}
            <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTipoRegistro('CITA')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  tipoRegistro === 'CITA' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                📅 Cita con Cliente
              </button>
              <button
                type="button"
                onClick={() => setTipoRegistro('BLOQUEO')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  tipoRegistro === 'BLOQUEO' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                🛡️ Bloqueo / Pausa
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-3">
              {tipoRegistro === 'CITA' ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Nombre del Cliente</label>
                    <input
                      type="text"
                      placeholder="Ej. Valeria Mendoza"
                      value={nombreCliente}
                      onChange={(e) => setNombreCliente(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Servicio Solicitado</label>
                    <input
                      type="text"
                      value={servicioNombre}
                      onChange={(e) => setServicioNombre(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Motivo del Bloqueo</label>
                  <select
                    value={motivoBloqueo}
                    onChange={(e) => setMotivoBloqueo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Capacitación Técnica L’Oréal">🎓 Capacitación Técnica / Taller</option>
                    <option value="Permiso Médico / Trámite Personal">🩺 Permiso Médico / Trámite</option>
                    <option value="Almuerzo Extendido / Coaching">☕ Reunión / Coaching</option>
                    <option value="Vacaciones Programadas">🌴 Vacaciones / Descanso</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Hora de Inicio</label>
                <input
                  type="text"
                  value={horaSeleccionada}
                  onChange={(e) => setHoraSeleccionada(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition ${
                    tipoRegistro === 'CITA'
                      ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                      : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  }`}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
