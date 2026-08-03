'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { CreditCard, History, Calculator, CheckCircle2, ShieldCheck, Sparkles, PlusCircle } from 'lucide-react';
import { useGamificationStore } from '@/store/useGamificationStore';
import { XP_REWARDS } from '@/lib/gamification/config';
import { otorgarXP } from '@/lib/gamification/engine';
import { useUIStore } from '@/store/useUIStore';

export default function CajaMobileView({ agente, sedeId }: { agente: any; sedeId: string }) {
  const [tab, setTab] = useState<'cobros' | 'arqueo' | 'historial'>('cobros');
  const [oatcs, setOatcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { showAlert } = useUIStore();
  const { addXP } = useGamificationStore();

  useEffect(() => {
    fetchData();
  }, [sedeId]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('oatc')
      .select('*')
      .eq('sede_id', sedeId)
      .in('estado_proceso', ['POR_COBRAR', 'PRE_COBRADO']);
    
    if (data) setOatcs(data);
    setLoading(false);
  };

  const handleCobrar = async (id: string) => {
    // Process mock
    await supabase.from('oatc').update({ estado_proceso: 'CERRADO' }).eq('id', id);
    showAlert('Cobro exitoso', 'success');
    fetchData();
    // Gamification
    addXP(10);
    if (agente?.id) {
      otorgarXP(agente.id, 10, 'COBRO_RAPIDO', { oatc_id: id });
    }
  };

  return (
    <div className="space-y-4">
      {/* Gamification CD2 & CD7 Elements */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-indigo-900/40 border border-indigo-500/30 p-3 rounded-2xl flex items-center gap-2">
          <ShieldCheck className="text-emerald-400 w-6 h-6" />
          <div>
            <p className="text-[10px] text-indigo-200 uppercase font-bold">Perfect Balance</p>
            <p className="text-sm font-black text-white">5 Días</p>
          </div>
        </div>
        <div className="bg-amber-900/40 border border-amber-500/30 p-3 rounded-2xl flex items-center gap-2 relative overflow-hidden">
          <Sparkles className="text-amber-400 w-6 h-6" />
          <div>
            <p className="text-[10px] text-amber-200 uppercase font-bold">Express Checkouts</p>
            <div className="w-full bg-black/50 h-1.5 rounded-full mt-1">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 p-4 rounded-2xl border border-dashed border-purple-500/50 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <PlusCircle className="text-purple-400 w-5 h-5" />
            <span className="text-xs text-slate-300">Sugiere un tratamiento hidratante.</span>
         </div>
         <button className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">Omitir</button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 bg-slate-900 p-1 rounded-2xl border border-slate-800">
        <button onClick={() => setTab('cobros')} className={`py-2 text-xs font-bold rounded-xl flex justify-center items-center gap-2 ${tab === 'cobros' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><CreditCard className="w-4 h-4" /> Cobros</button>
        <button onClick={() => setTab('arqueo')} className={`py-2 text-xs font-bold rounded-xl flex justify-center items-center gap-2 ${tab === 'arqueo' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Calculator className="w-4 h-4" /> Arqueo</button>
        <button onClick={() => setTab('historial')} className={`py-2 text-xs font-bold rounded-xl flex justify-center items-center gap-2 ${tab === 'historial' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><History className="w-4 h-4" /> Historial</button>
      </div>

      {/* Content */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {tab === 'cobros' && (
          loading ? <div className="text-center text-slate-400 py-4">Cargando...</div> :
          oatcs.length === 0 ? <div className="text-center text-slate-400 py-4">No hay cobros pendientes</div> :
          oatcs.map(o => (
            <div key={o.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex justify-between items-center shadow-lg">
              <div>
                <p className="text-xs text-slate-400 font-mono">{o.codigo_ticket || o.id.slice(0,8)}</p>
                <p className="font-bold text-white text-sm">{o.cliente_nombre || 'Cliente'}</p>
                <p className="text-emerald-400 font-black text-lg">S/ {o.monto_total || '0.00'}</p>
              </div>
              <button onClick={() => handleCobrar(o.id)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2">
                Cobrar <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
        
        {tab === 'arqueo' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-center text-slate-400 text-xs font-black uppercase">Resumen del Día</h3>
            <div className="text-center">
              <p className="text-4xl font-black text-white">S/ 1,250.00</p>
              <p className="text-sm text-emerald-400 mt-1">14 Transacciones</p>
            </div>
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Efectivo</span><span className="font-bold text-white">S/ 450.00</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Tarjeta</span><span className="font-bold text-white">S/ 500.00</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Yape/Plin</span><span className="font-bold text-white">S/ 300.00</span></div>
            </div>
          </div>
        )}

        {tab === 'historial' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center text-slate-400 text-sm">
            Historial de pagos del día (en construcción)
          </div>
        )}
      </motion.div>
    </div>
  );
}
