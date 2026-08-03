'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Package, Archive, ClipboardList, Leaf, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function DespachoMobileView({ agente, sedeId }: { agente: any; sedeId: string }) {
  const [tab, setTab] = useState<'prep' | 'stock' | 'kardex'>('prep');
  const [oatcs, setOatcs] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchPrep();
  }, [sedeId]);

  const fetchPrep = async () => {
    const { data } = await supabase
      .from('oatc')
      .select('id, cliente_nombre, punto_partida, agente_id')
      .eq('sede_id', sedeId)
      .eq('estado_proceso', 'EN_CURSO');
    if (data) setOatcs(data);
  };

  return (
    <div className="space-y-4">
      {/* Gamification Elements */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl mb-4">
        <div className="flex justify-between items-center mb-2">
           <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300">Eco-Warrior (Zero Waste)</span>
           </div>
           <span className="text-[10px] font-black text-emerald-400">85%</span>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full">
           <div className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full" style={{ width: '85%' }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-indigo-900/40 border border-indigo-500/30 p-3 rounded-2xl flex items-center gap-2">
          <ShieldAlert className="text-indigo-400 w-6 h-6" />
          <div>
            <p className="text-[10px] text-indigo-200 uppercase font-bold">Stock Sentinel</p>
            <p className="text-xs font-black text-white">Nivel 2</p>
          </div>
        </div>
        <div className="bg-red-900/40 border border-red-500/30 p-3 rounded-2xl flex items-center gap-2 relative overflow-hidden">
          <AlertTriangle className="text-red-400 w-6 h-6" />
          <div>
            <p className="text-[10px] text-red-200 uppercase font-bold">Alerta Crítica</p>
            <p className="text-xs font-medium text-red-100">Shampoo Quedan 2</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 bg-slate-900 p-1 rounded-2xl border border-slate-800">
        <button onClick={() => setTab('prep')} className={`py-2 text-xs font-bold rounded-xl flex justify-center items-center gap-2 ${tab === 'prep' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}><Package className="w-4 h-4" /> Prep</button>
        <button onClick={() => setTab('stock')} className={`py-2 text-xs font-bold rounded-xl flex justify-center items-center gap-2 ${tab === 'stock' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}><Archive className="w-4 h-4" /> Stock</button>
        <button onClick={() => setTab('kardex')} className={`py-2 text-xs font-bold rounded-xl flex justify-center items-center gap-2 ${tab === 'kardex' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}><ClipboardList className="w-4 h-4" /> Kardex</button>
      </div>

      {/* Content */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {tab === 'prep' && (
          <div className="space-y-3">
            {oatcs.map((o) => (
              <div key={o.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-white text-sm">Operario ID: {o.agente_id?.slice(0,6) || 'Desconocido'}</p>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold">EN CURSO</span>
                </div>
                <div className="space-y-1">
                  {o.punto_partida?.map((srv: any, idx: number) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> {srv.nombre}
                    </div>
                  ))}
                </div>
                <button className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition">
                   Marcar Preparado
                </button>
              </div>
            ))}
            {oatcs.length === 0 && <div className="text-center text-slate-400 py-4">No hay preparaciones pendientes</div>}
          </div>
        )}

        {tab === 'stock' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center text-slate-400 text-sm">
            Cuadrícula de Stock (en construcción)
          </div>
        )}

        {tab === 'kardex' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center text-slate-400 text-sm">
            Historial de Movimientos (en construcción)
          </div>
        )}
      </motion.div>
    </div>
  );
}
