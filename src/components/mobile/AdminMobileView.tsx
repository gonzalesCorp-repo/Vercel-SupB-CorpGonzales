'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { LayoutDashboard, Users, Trophy, Store, Plus, Gift } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

export default function AdminMobileView({ agente, sedeId }: { agente: any; sedeId: string }) {
  const [tab, setTab] = useState<'dashboard' | 'equipo' | 'retos' | 'market'>('dashboard');
  const [agentes, setAgentes] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [showAddReward, setShowAddReward] = useState(false);
  const [newReward, setNewReward] = useState({ nombre: '', descripcion: '', costo_monedas: 0, tipo_beneficiario: 'TODOS' });
  const supabase = createClient();
  const { showAlert } = useUIStore();

  useEffect(() => {
    if (tab === 'equipo') fetchEquipo();
    if (tab === 'market') fetchRewards();
  }, [tab, sedeId]);

  const fetchEquipo = async () => {
    const { data: agentesData } = await supabase.from('agentes').select('*');
    const { data: perfiles } = await supabase.from('gamification_profiles').select('*');
    
    if (agentesData && perfiles) {
      const merged = agentesData.map((a: any) => {
        const p = perfiles.find((p: any) => p.agente_id === a.id);
        return { ...a, ...p };
      });
      setAgentes(merged);
    }
  };

  const fetchRewards = async () => {
    const { data } = await supabase.from('rewards_catalog').select('*').order('costo_monedas', { ascending: true });
    if (data) setRewards(data);
  };

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('rewards_catalog').insert([newReward]);
    if (error) {
      showAlert('Error al crear recompensa', 'error');
    } else {
      showAlert('Recompensa creada exitosamente', 'success');
      setShowAddReward(false);
      fetchRewards();
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="grid grid-cols-4 bg-slate-900 p-1 rounded-2xl border border-slate-800">
        <button onClick={() => setTab('dashboard')} className={`py-2 text-[10px] font-bold rounded-xl flex flex-col justify-center items-center gap-1 ${tab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><LayoutDashboard className="w-4 h-4" /> Dash</button>
        <button onClick={() => setTab('equipo')} className={`py-2 text-[10px] font-bold rounded-xl flex flex-col justify-center items-center gap-1 ${tab === 'equipo' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Users className="w-4 h-4" /> Equipo</button>
        <button onClick={() => setTab('retos')} className={`py-2 text-[10px] font-bold rounded-xl flex flex-col justify-center items-center gap-1 ${tab === 'retos' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Trophy className="w-4 h-4" /> Retos</button>
        <button onClick={() => setTab('market')} className={`py-2 text-[10px] font-bold rounded-xl flex flex-col justify-center items-center gap-1 ${tab === 'market' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Store className="w-4 h-4" /> Market</button>
      </div>

      {/* Content */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {tab === 'dashboard' && (
          <div className="space-y-3">
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 text-center">
                   <p className="text-[10px] uppercase font-bold text-slate-400">Agentes Activos</p>
                   <p className="text-3xl font-black text-white mt-1">12</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 text-center">
                   <p className="text-[10px] uppercase font-bold text-slate-400">OATCs Hoy</p>
                   <p className="text-3xl font-black text-indigo-400 mt-1">45</p>
                </div>
             </div>
             <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-5 rounded-3xl border border-indigo-500/30 text-white">
                <p className="text-[10px] uppercase font-bold text-indigo-200">Ingresos Hoy (Proyección)</p>
                <p className="text-4xl font-black mt-1">S/ 3,450</p>
             </div>
             <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
                <p className="text-xs uppercase font-bold text-slate-400 mb-2">Gamificación Global</p>
                <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-300">Total XP Entregado</span>
                   <span className="font-bold text-amber-400">14,500 XP</span>
                </div>
             </div>
          </div>
        )}

        {tab === 'equipo' && (
          <div className="space-y-2">
            {agentes.map(a => (
              <div key={a.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex justify-between items-center shadow-lg">
                <div>
                  <p className="font-bold text-white text-sm">{a.nombre || a.email}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{a.rol}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-amber-400">{a.xp_total || 0} XP • Nvl {a.nivel || 1}</p>
                  <p className="text-[10px] text-emerald-400 font-bold">🔥 {a.streak_asistencia || 0} días</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'retos' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center text-slate-400 text-sm">
            Gestor de Retos (en construcción)
          </div>
        )}

        {tab === 'market' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
                <span className="text-xs font-black uppercase text-slate-400">Catálogo de Recompensas</span>
                <button onClick={() => setShowAddReward(!showAddReward)} className="bg-indigo-600/20 text-indigo-400 p-2 rounded-xl">
                   <Plus className="w-4 h-4" />
                </button>
             </div>

             {showAddReward && (
                <form onSubmit={handleAddReward} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                   <input type="text" placeholder="Nombre" value={newReward.nombre} onChange={e => setNewReward({...newReward, nombre: e.target.value})} required className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm text-white" />
                   <textarea placeholder="Descripción" value={newReward.descripcion} onChange={e => setNewReward({...newReward, descripcion: e.target.value})} required className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm text-white" />
                   <div className="flex gap-2">
                      <input type="number" placeholder="Monedas" value={newReward.costo_monedas || ''} onChange={e => setNewReward({...newReward, costo_monedas: parseInt(e.target.value)})} required className="w-1/2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm text-white" />
                      <select value={newReward.tipo_beneficiario} onChange={e => setNewReward({...newReward, tipo_beneficiario: e.target.value})} className="w-1/2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm text-white">
                         <option value="TODOS">TODOS</option>
                         <option value="STAFF">STAFF</option>
                         <option value="CLIENTE">CLIENTE</option>
                      </select>
                   </div>
                   <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm">Guardar</button>
                </form>
             )}

             <div className="grid grid-cols-2 gap-3">
                {rewards.map(r => (
                   <div key={r.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 relative">
                      <Gift className="w-6 h-6 text-amber-400 mb-2" />
                      <p className="font-bold text-sm text-white mb-1">{r.nombre}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-2">{r.descripcion}</p>
                      <div className="mt-3 flex justify-between items-center">
                         <span className="text-xs font-black text-amber-400 flex items-center gap-1">🪙 {r.costo_monedas}</span>
                         <span className="text-[9px] uppercase bg-slate-800 px-2 py-1 rounded-md">{r.tipo_beneficiario}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
