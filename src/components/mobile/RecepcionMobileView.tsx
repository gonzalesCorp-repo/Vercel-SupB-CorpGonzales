'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, Calendar, Bell, Target, CalendarDays, Zap, PlusCircle, CheckCircle2, Phone, UserPlus, Clock, Sparkles } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

export default function RecepcionMobileView({ agente, sedeId }: { agente: any; sedeId: string }) {
  const [tab, setTab] = useState<'cola' | 'clientes' | 'agenda' | 'alertas'>('cola');
  const [agentes, setAgentes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { showAlert } = useUIStore();

  useEffect(() => {
    if (tab === 'cola') fetchCola();
    if (tab === 'clientes') fetchClientes(busquedaCliente);
    if (tab === 'agenda') fetchAgenda();
    if (tab === 'alertas') fetchAlertas();
  }, [tab, sedeId]);

  const fetchCola = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('agentes')
      .select('id, nombre, rol, especialidad, estado, estado_operativo, updated_at')
      .eq('estado', 'ACTIVO')
      .order('nombre', { ascending: true });
    if (data) setAgentes(data);
    setLoading(false);
  };

  const fetchClientes = async (term: string) => {
    setLoading(true);
    let query = supabase
      .from('clientes')
      .select('id, nombre, apellido, celular, dni, metadata_crm, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (term.trim()) {
      query = query.or(`nombre.ilike.%${term}%,apellido.ilike.%${term}%,celular.ilike.%${term}%,dni.ilike.%${term}%`);
    }

    const { data } = await query;
    if (data) setClientes(data);
    setLoading(false);
  };

  const fetchAgenda = async () => {
    setLoading(true);
    const hoy = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('citas')
      .select('*')
      .eq('sede_id', sedeId)
      .gte('inicio_iso', `${hoy}T00:00:00`)
      .lte('inicio_iso', `${hoy}T23:59:59`)
      .order('inicio_iso', { ascending: true });
    if (data) setCitas(data);
    setLoading(false);
  };

  const fetchAlertas = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('cola_peticiones')
      .select('*')
      .eq('sede_id', sedeId)
      .in('estado', ['PENDIENTE', 'EN_PROCESO'])
      .order('created_at', { ascending: false });
    if (data) setAlertas(data);
    setLoading(false);
  };

  const handleResolverAlerta = async (id: string) => {
    await supabase.from('cola_peticiones').update({ estado: 'COMPLETADO', updated_at: new Date().toISOString() }).eq('id', id);
    showAlert('Petición marcada como completada', 'success');
    fetchAlertas();
  };

  return (
    <div className="space-y-4">
      {/* Gamification / KPI Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 shadow-lg text-white mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-200" />
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase text-blue-200">Recepción & Anfitrionaje</p>
              <p className="text-sm font-bold">Gestión de flujo, citas y cola de piso</p>
            </div>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-bold">
            {agentes.filter(a => (a.estado_operativo || 'DISPONIBLE') === 'DISPONIBLE').length} Libres
          </span>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="grid grid-cols-4 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-md">
        <button onClick={() => setTab('cola')} className={`py-2 text-[10px] font-bold rounded-xl flex flex-col justify-center items-center gap-1 transition ${tab === 'cola' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>
          <Users className="w-4 h-4" /> Cola ({agentes.length})
        </button>
        <button onClick={() => setTab('clientes')} className={`py-2 text-[10px] font-bold rounded-xl flex flex-col justify-center items-center gap-1 transition ${tab === 'clientes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>
          <Search className="w-4 h-4" /> Clientes
        </button>
        <button onClick={() => setTab('agenda')} className={`py-2 text-[10px] font-bold rounded-xl flex flex-col justify-center items-center gap-1 transition ${tab === 'agenda' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>
          <Calendar className="w-4 h-4" /> Citas ({citas.length})
        </button>
        <button onClick={() => setTab('alertas')} className={`py-2 text-[10px] font-bold rounded-xl flex flex-col justify-center items-center gap-1 transition ${tab === 'alertas' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>
          <Bell className="w-4 h-4" /> Peticiones ({alertas.length})
        </button>
      </div>

      {/* Content */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        
        {/* TAB 1: COLA DE ESPECIALISTAS */}
        {tab === 'cola' && (
          <div className="space-y-2.5">
            {loading ? (
              <div className="text-center text-slate-500 py-8 text-xs font-bold">Cargando cola de piso...</div>
            ) : agentes.length === 0 ? (
              <div className="text-center text-slate-400 py-8 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs">
                No hay colaboradores activos en esta sede
              </div>
            ) : (
              agentes.map((a, i) => {
                const opStatus = a.estado_operativo || 'DISPONIBLE';
                const isLibre = opStatus === 'DISPONIBLE';
                const isOcupado = opStatus === 'OCUPADO';
                return (
                  <div key={a.id} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-slate-500 font-bold">#{i + 1}</span>
                      <div>
                        <p className="font-bold text-xs text-white">{a.nombre}</p>
                        <p className="text-[10px] text-slate-400">{a.especialidad || a.rol}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                      isLibre ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      isOcupado ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {opStatus}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: CLIENTES & CRM */}
        {tab === 'clientes' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, DNI o celular..."
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value);
                  fetchClientes(e.target.value);
                }}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl py-3 pl-10 pr-4 text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>

            {loading ? (
              <div className="text-center text-slate-500 py-6 text-xs font-bold">Buscando clientes...</div>
            ) : clientes.length === 0 ? (
              <div className="text-center text-slate-400 py-8 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs">
                No se encontraron clientes registrados
              </div>
            ) : (
              clientes.map((c) => (
                <div key={c.id} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-xs text-white">{c.nombre} {c.apellido || ''}</p>
                      {c.metadata_crm?.vip && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                          👑 VIP
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                      {c.celular && <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {c.celular}</span>}
                      {c.dni && <span>DNI: {c.dni}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-indigo-400">
                      {c.metadata_crm?.puntos || 0} VP 💎
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: CITAS DE HOY */}
        {tab === 'agenda' && (
          <div className="space-y-2.5">
            {loading ? (
              <div className="text-center text-slate-500 py-8 text-xs font-bold">Cargando agenda del día...</div>
            ) : citas.length === 0 ? (
              <div className="text-center text-slate-400 py-8 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs">
                No hay citas agendadas para hoy
              </div>
            ) : (
              citas.map((cita) => (
                <div key={cita.id} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 shadow-md">
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-xs font-bold text-white">
                        {cita.inicio_iso ? new Date(cita.inicio_iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hora flexible'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                      {cita.estado || 'CONFIRMADA'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-200">{cita.cliente_nombre || 'Cliente agendado'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Especialista: {cita.agente_nombre || 'Por asignar'}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: PETICIONES EN PISO */}
        {tab === 'alertas' && (
          <div className="space-y-2.5">
            {loading ? (
              <div className="text-center text-slate-500 py-8 text-xs font-bold">Cargando peticiones de piso...</div>
            ) : alertas.length === 0 ? (
              <div className="text-center text-slate-400 py-8 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs">
                No hay peticiones pendientes en este momento
              </div>
            ) : (
              alertas.map((alerta) => (
                <div key={alerta.id} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded">
                        {alerta.tipo || 'ASISTENCIA'}
                      </span>
                      <p className="text-xs font-bold text-white">{alerta.solicitante_nombre || 'Staff'}</p>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">{alerta.mensaje || alerta.detalle || 'Solicita apoyo en estación'}</p>
                  </div>
                  <button
                    onClick={() => handleResolverAlerta(alerta.id)}
                    className="p-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl border border-emerald-500/30 transition text-xs font-bold flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Atendido
                  </button>
                </div>
              ))
            )}
          </div>
        )}

      </motion.div>
    </div>
  );
}
