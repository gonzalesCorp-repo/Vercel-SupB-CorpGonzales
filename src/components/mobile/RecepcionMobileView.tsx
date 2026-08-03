'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, Calendar, Bell, Target, CalendarDays, Zap } from 'lucide-react';

export default function RecepcionMobileView({ agente, sedeId }: { agente: any; sedeId: string }) {
  const [tab, setTab] = useState<'cola' | 'clientes' | 'agenda' | 'alertas'>('cola');
  const [agentes, setAgentes] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchCola();
  }, [sedeId]);

  const fetchCola = async () => {
    const { data } = await supabase
      .from('agentes')
      .select('*')
      .neq('estado', 'INACTIVO')
      .order('updated_at', { ascending: true });
    if (data) setAgentes(data);
  };

  return (
    <div className="space-y-4">
      {/* Gamification Elements */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 shadow-lg text-white mb-4">
        <div className="flex items-center gap-3">
          <Target className="w-8 h-8 text-blue-200" />
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase text-blue-200">Misión del Día</p>
            <p className="text-sm font-bold">Mantener tiempo de espera bajo 10 min</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-2">
          <CalendarDays className="text-pink-400 w-6 h-6" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Re-booking</p>
            <p className="text-sm font-black text-white">3 Seguidos</p>
          </div>
        </div>
        <div className="bg-amber-900/40 border border-amber-500/30 p-3 rounded-2xl flex items-center gap-2 relative overflow-hidden">
          <Zap className="text-amber-400 w-6 h-6" />
          <div>
            <p className="text-[10px] text-amber-200 uppercase font-bold">Flash Quest</p>
            <p className="text-xs font-medium text-amber-100">Cupo 4PM libre!</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 bg-slate-900 p-1 rounded-2xl border border-slate-800">
        <button onClick={() => setTab('cola')} className={`py-2 text-[10px] font-bold rounded-xl flex flex-col justify-center items-center gap-1 ${tab === 'cola' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Users className="w-4 h-4" /> Cola</button>
        <button onClick={() => setTab('clientes')} className={`py-2 text-[10px] font-bold rounded-xl flex flex-col justify-center items-center gap-1 ${tab === 'clientes' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Search className="w-4 h-4" /> Clientes</button>
        <button onClick={() => setTab('agenda')} className={`py-2 text-[10px] font-bold rounded-xl flex flex-col justify-center items-center gap-1 ${tab === 'agenda' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Calendar className="w-4 h-4" /> Agenda</button>
        <button onClick={() => setTab('alertas')} className={`py-2 text-[10px] font-bold rounded-xl flex flex-col justify-center items-center gap-1 ${tab === 'alertas' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Bell className="w-4 h-4" /> Alertas</button>
      </div>

      {/* Content */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {tab === 'cola' && (
          <div className="space-y-2">
            {agentes.map((a, i) => (
              <div key={a.id} className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-500">#{i+1}</span>
                  <span className="font-bold text-sm text-white">{a.nombre}</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${a.estado === 'DISPONIBLE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {a.estado}
                </span>
              </div>
            ))}
            {agentes.length === 0 && <div className="text-center text-slate-400 py-4">No hay operarios activos</div>}
          </div>
        )}

        {tab === 'clientes' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
             <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Buscar cliente..." className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 text-sm" />
             </div>
             <p className="text-center text-xs text-slate-500">Búsqueda rápida de clientes</p>
          </div>
        )}

        {tab === 'agenda' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center text-slate-400 text-sm">
            Gestión de citas (en construcción)
          </div>
        )}

        {tab === 'alertas' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center text-slate-400 text-sm">
            Bandeja de peticiones WFM vacía
          </div>
        )}
      </motion.div>
    </div>
  );
}
