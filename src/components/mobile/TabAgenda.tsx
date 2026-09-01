'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Plus, ShieldAlert, Sparkles, 
  CheckCircle2, X, User, Search, Filter, ChevronRight
} from 'lucide-react';
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
  fecha?: string;
}

interface TabAgendaProps {
  agenteNombre: string;
  agenteRol: string;
  onBloqueoRegistrado?: (motivo: string) => void;
}

export function TabAgenda({ agenteNombre, agenteRol, onBloqueoRegistrado }: TabAgendaProps) {
  const [citas, setCitas] = useState<CitaAgenda[]>([]);
  const [filtroTemporal, setFiltroTemporal] = useState<'hoy' | 'proximas' | 'pasadas'>('hoy');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [tipoRegistro, setTipoRegistro] = useState<'CITA' | 'BLOQUEO'>('CITA');
  
  // Form fields con alto contraste
  const [nombreCliente, setNombreCliente] = useState('');
  const [servicioNombre, setServicioNombre] = useState('Corte & Peinado');
  const [horaSeleccionada, setHoraSeleccionada] = useState('06:00 PM');
  const [motivoBloqueo, setMotivoBloqueo] = useState('Capacitación Técnica L’Oréal');
  const [feedback, setFeedback] = useState('');

  const supabase = createClient();
  const sedeId = useAppStore((state) => state.sedeActiva?.id) || '';

  const cargarCitas = async () => {
    setLoading(true);
    const hoy = new Date().toISOString().split('T')[0];
    
    if (!sedeId) {
      setCitas([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('citas')
      .select('*')
      .eq('sede_id', sedeId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const mapeadas: CitaAgenda[] = data.map((c: any) => ({
        id: c.id,
        clienteNombre: c.cliente_nombre || 'Cliente Agendado',
        servicio: c.servicio_solicitado || c.notas || 'Servicio Integral',
        hora: c.hora_inicio || (c.inicio_iso ? new Date(c.inicio_iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Flexible'),
        duracionMin: 60,
        tipo: (c.notas && c.notas.includes('Bloqueo')) ? 'BLOQUEO_CAPACITACION' : 'CITA_CLIENTE',
        estado: (c.estado as any) || 'PROGRAMADO',
        fecha: c.fecha || (c.created_at ? c.created_at.split('T')[0] : hoy)
      }));
      setCitas(mapeadas);
    } else {
      setCitas([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarCitas();
  }, [sedeId, agenteNombre]);

  const hoyStr = new Date().toISOString().split('T')[0];

  const citasFiltradas = citas.filter(c => {
    // 1. Filtro de búsqueda
    const matchesSearch = !searchQuery || 
      c.clienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.servicio.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Filtro temporal
    if (filtroTemporal === 'hoy') {
      return !c.fecha || c.fecha === hoyStr;
    } else if (filtroTemporal === 'proximas') {
      return c.fecha && c.fecha > hoyStr;
    } else {
      return c.fecha && c.fecha < hoyStr;
    }
  });

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const hoy = new Date().toISOString().split('T')[0];

    if (tipoRegistro === 'CITA') {
      const nuevaCita: CitaAgenda = {
        id: `cita_${Date.now()}`,
        clienteNombre: nombreCliente.trim() || 'Cliente Agendado',
        servicio: servicioNombre,
        hora: horaSeleccionada,
        duracionMin: 60,
        tipo: 'CITA_CLIENTE',
        estado: 'PROGRAMADO',
        fecha: hoy
      };
      setCitas(prev => [nuevaCita, ...prev]);

      await supabase.from('citas').insert([{
        sede_id: sedeId,
        cliente_nombre: nombreCliente.trim() || 'Cliente Agendado',
        agente_nombre: agenteNombre,
        servicio_solicitado: servicioNombre,
        hora_inicio: horaSeleccionada,
        fecha: hoy,
        inicio_iso: `${hoy}T18:00:00.000Z`,
        estado: 'PROGRAMADO',
        notas: `Cita registrada por ${agenteNombre}`
      }]);

      setFeedback('¡Cita registrada exitosamente en tu agenda!');
    } else {
      const nuevoBloqueo: CitaAgenda = {
        id: `bloqueo_${Date.now()}`,
        clienteNombre: `🛡️ Bloqueo: ${motivoBloqueo}`,
        servicio: 'Disponibilidad Pausada',
        hora: horaSeleccionada,
        duracionMin: 120,
        tipo: motivoBloqueo.includes('Vacaciones') ? 'BLOQUEO_VACACIONES' : 'BLOQUEO_CAPACITACION',
        estado: 'PROGRAMADO',
        fecha: hoy
      };
      setCitas(prev => [nuevoBloqueo, ...prev]);

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
      setFeedback('¡Bloqueo registrado y notificado al buzón!');
    }

    setModalNuevoOpen(false);
    setNombreCliente('');
    setTimeout(() => setFeedback(''), 4000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 w-full">
      
      {/* Header Agenda */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Agenda Personal
          </span>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Citas & Bloqueos de Horario</h3>
        </div>

        <button onClick={() => setModalNuevoOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Nueva Cita</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in zoom-in-95 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Buscador de Citas */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por cliente o servicio..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-medium shadow-xs"
        />
      </div>

      {/* Segmented Control de Filtro Temporal */}
      <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs w-full">
        <button
          type="button"
          onClick={() => setFiltroTemporal('hoy')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            filtroTemporal === 'hoy'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          ☀️ Hoy
        </button>
        <button
          type="button"
          onClick={() => setFiltroTemporal('proximas')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            filtroTemporal === 'proximas'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          📅 Próximas
        </button>
        <button
          type="button"
          onClick={() => setFiltroTemporal('pasadas')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            filtroTemporal === 'pasadas'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          📜 Pasadas
        </button>
      </div>

      {/* Lista de Citas */}
      {loading ? (
        <div className="text-center py-10 text-xs text-slate-500 font-bold">
          Consultando tu agenda personal...
        </div>
      ) : citasFiltradas.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl mx-auto font-black">
            📅
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">Sin citas en este período</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              {searchQuery 
                ? 'No hay registros que coincidan con tu búsqueda.' 
                : `No tienes citas ni bloqueos programados para ${filtroTemporal === 'hoy' ? 'el turno de hoy' : filtroTemporal === 'proximas' ? 'fechas futuras' : 'fechas anteriores'}.`}
            </p>
          </div>
          <button
            onClick={() => setModalNuevoOpen(true)}
            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-500/30 transition cursor-pointer"
          >
            + Registrar Cita
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {citasFiltradas.map((item) => {
            const isBloqueo = item.tipo.startsWith('BLOQUEO');
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition shadow-xs ${
                  isBloqueo
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200'
                    : item.estado === 'EN_CURSO'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-500/40 text-slate-900 dark:text-white'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isBloqueo ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}`}>
                    {isBloqueo ? <ShieldAlert className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{item.clienteNombre}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.servicio}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-200">{item.hora}</span>
                  <span className={`block text-[9px] font-black uppercase tracking-wider mt-0.5 ${
                    item.estado === 'EN_CURSO' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                  }`}>
                    {item.estado}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nuevo Registro con Placeholders Nítidos */}
      {modalNuevoOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Nuevo Registro en Agenda</h3>
              <button onClick={() => setModalNuevoOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector Tipo */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button type="button"
                onClick={() => setTipoRegistro('CITA')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  tipoRegistro === 'CITA' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                📅 Cita con Cliente
              </button>
              <button type="button"
                onClick={() => setTipoRegistro('BLOQUEO')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  tipoRegistro === 'BLOQUEO' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                🛡️ Bloqueo / Pausa
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-3">
              {tipoRegistro === 'CITA' ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Nombre del Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombreCliente}
                      onChange={(e) => setNombreCliente(e.target.value)}
                      placeholder="Ej. Valeria Mendoza"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Servicio Solicitado
                    </label>
                    <input
                      type="text"
                      value={servicioNombre}
                      onChange={(e) => setServicioNombre(e.target.value)}
                      placeholder="Ej. Balayage & Corte"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Motivo de Bloqueo
                  </label>
                  <select
                    value={motivoBloqueo}
                    onChange={(e) => setMotivoBloqueo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="Capacitación Técnica L’Oréal">🎓 Capacitación Técnica</option>
                    <option value="Reunión de Coordinación Staff">👥 Reunión de Salón</option>
                    <option value="Permiso Médico / Personal">🏥 Permiso Personal</option>
                    <option value="Período de Vacaciones">🏖️ Vacaciones</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Hora Programada
                </label>
                <input
                  type="text"
                  value={horaSeleccionada}
                  onChange={(e) => setHoraSeleccionada(e.target.value)}
                  placeholder="Ej. 06:00 PM"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-3.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs shadow-md active:scale-95 transition cursor-pointer"
                >
                  Guardar en Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
