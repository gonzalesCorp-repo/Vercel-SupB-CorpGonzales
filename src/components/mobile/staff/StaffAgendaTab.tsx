'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles, CalendarPlus, X, Calendar, Clock, User, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface StaffAgendaTabProps {
  agente?: any;
  isLoading?: boolean;
  cargarDatosMobile?: () => void;
  showAddCitaModal?: boolean;
  setShowAddCitaModal?: (b: boolean) => void;
  newCitaForm?: any;
  setNewCitaForm?: (f: any) => void;
  handleCrearCita?: (e: React.FormEvent) => void;
}

export default function StaffAgendaTab({
  agente,
  isLoading: propLoading,
  cargarDatosMobile,
  showAddCitaModal: propShowAdd,
  setShowAddCitaModal: propSetShowAdd,
  newCitaForm: propNewForm,
  setNewCitaForm: propSetNewForm,
  handleCrearCita: propHandleCrear
}: StaffAgendaTabProps) {
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [localShowAdd, setLocalShowAdd] = useState(false);
  const [localNewForm, setLocalNewForm] = useState({
    clienteNombre: '',
    servicio: 'Corte y Diseño',
    fecha: new Date().toISOString().split('T')[0],
    hora: '10:00'
  });

  const showAddCitaModal = propShowAdd !== undefined ? propShowAdd : localShowAdd;
  const setShowAddCitaModal = propSetShowAdd || setLocalShowAdd;
  const newCitaForm = propNewForm || localNewForm;
  const setNewCitaForm = propSetNewForm || setLocalNewForm;

  const supabase = createClient();

  const cargarCitas = async () => {
    setLoading(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      let query = supabase
        .from('citas')
        .select('*')
        .gte('fecha', hoy)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

      if (agente?.id) {
        query = query.or(`agente_id.eq.${agente.id},especialista_id.eq.${agente.id},agente_nombre.ilike.%${agente.nombre}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        setCitas(data);
      } else {
        // Fallback a buscar en oatc programadas
        const { data: oatcs } = await supabase
          .from('oatc')
          .select('*')
          .gte('created_at', `${hoy}T00:00:00`)
          .in('estado_proceso', ['EN_ESPERA', 'ASESORIA'])
          .order('created_at', { ascending: true });
        setCitas(oatcs || []);
      }
    } catch (e) {
      console.warn('Error cargando citas de staff:', e);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCitas();
  }, [agente?.id]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (propHandleCrear) {
      propHandleCrear(e);
      return;
    }

    try {
      await supabase.from('citas').insert([{
        cliente_nombre: newCitaForm.clienteNombre,
        servicio: newCitaForm.servicio,
        fecha: newCitaForm.fecha,
        hora: newCitaForm.hora,
        agente_id: agente?.id,
        agente_nombre: agente?.nombre,
        estado: 'CONFIRMADA'
      }]);
      setShowAddCitaModal(false);
      cargarCitas();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          CITAS AGENDADAS: <span className="text-purple-600 dark:text-purple-400">{citas.length}</span>
        </span>
        <button 
          onClick={() => { cargarCitas(); if (cargarDatosMobile) cargarDatosMobile(); }}
          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refrescar
        </button>
      </div>

      <button 
        onClick={() => setShowAddCitaModal(true)}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Sparkles className="w-4 h-4" /> Agendar Nueva Cita
      </button>

      <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 block pt-1">
        AGENDA PRÓXIMA
      </span>

      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 animate-pulse">Cargando agenda de citas...</div>
        ) : citas.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2 shadow-xs transition-colors">
            <Calendar className="w-8 h-8 text-slate-500 dark:text-slate-400 mx-auto opacity-50" />
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">Sin citas agendadas</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Las citas registradas para tu estación aparecerán automáticamente aquí.</p>
          </div>
        ) : (
          citas.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-md transition-colors">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-purple-500" /> {c.fecha || 'Hoy'}
                </span>
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2.5 py-1 rounded-full uppercase">
                  {c.estado || 'CONFIRMADA'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    👤 Cliente: <span className="font-black">{c.cliente_nombre || 'Cliente'}</span>
                  </p>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-500/20">
                    {c.hora || '10:00 AM'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">💼 {c.servicio || 'Servicio de Salón'}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Registrar Cita */}
      <AnimatePresence>
        {showAddCitaModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-slate-900 dark:text-slate-100"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4 text-purple-500" /> Agendar Nueva Cita
                </h3>
                <button onClick={() => setShowAddCitaModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCrear} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Nombre del Cliente *</label>
                  <input 
                    type="text"
                    required
                    value={newCitaForm.clienteNombre}
                    onChange={e => setNewCitaForm({ ...newCitaForm, clienteNombre: e.target.value })}
                    placeholder="Nombre completo"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Servicio Solicitado</label>
                  <select 
                    value={newCitaForm.servicio}
                    onChange={e => setNewCitaForm({ ...newCitaForm, servicio: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-bold"
                  >
                    <option value="Colorimetria">Colorimetría</option>
                    <option value="Corte y Diseño">Corte y Diseño</option>
                    <option value="Peinados y Cepillados">Peinados y Cepillados</option>
                    <option value="Manicure">Manicure</option>
                    <option value="Tratamiento Capilar">Tratamiento Capilar</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Fecha</label>
                    <input 
                      type="date" 
                      value={newCitaForm.fecha}
                      onChange={e => setNewCitaForm({ ...newCitaForm, fecha: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Hora</label>
                    <input 
                      type="time" 
                      value={newCitaForm.hora}
                      onChange={e => setNewCitaForm({ ...newCitaForm, hora: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition-all mt-2 cursor-pointer"
                >
                  Confirmar y Agendar
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
