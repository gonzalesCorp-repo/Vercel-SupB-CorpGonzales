'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, X, Users, Scissors, Sparkles, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface StaffMetricasViewProps {
  agente: any;
  onClose?: () => void;
}

export default function StaffMetricasView({ agente, onClose }: StaffMetricasViewProps) {
  const [loading, setLoading] = useState(true);
  const [totalAtenciones, setTotalAtenciones] = useState(0);
  const [clientesUnicos, setClientesUnicos] = useState(0);
  const [desglose, setDesglose] = useState<{ [key: string]: number }>({});

  const supabase = createClient();

  useEffect(() => {
    async function loadMetricas() {
      if (!agente?.id) {
        setLoading(false);
        return;
      }

      try {
        const primerDiaMes = new Date();
        primerDiaMes.setDate(1);
        primerDiaMes.setHours(0, 0, 0, 0);

        const { data: oatcs } = await supabase
          .from('oatc')
          .select('id, cliente_nombre, punto_partida, created_at, estado_proceso')
          .or(`agente_id.eq.${agente.id},agente_nombre.ilike.%${agente.nombre}%`)
          .eq('estado_proceso', 'FINALIZADO')
          .gte('created_at', primerDiaMes.toISOString());

        if (oatcs && oatcs.length > 0) {
          setTotalAtenciones(oatcs.length);
          const clientesSet = new Set(oatcs.map((o: any) => o.cliente_nombre).filter(Boolean));
          setClientesUnicos(clientesSet.size);

          const categorias: { [key: string]: number } = {};
          oatcs.forEach((o: any) => {
            const srvs = Array.isArray(o.punto_partida) ? o.punto_partida : (o.punto_partida?.servicios || []);
            srvs.forEach((s: any) => {
              const nombre = s.nombre || 'Servicio General';
              categorias[nombre] = (categorias[nombre] || 0) + 1;
            });
          });
          setDesglose(categorias);
        } else {
          setTotalAtenciones(0);
          setClientesUnicos(0);
          setDesglose({});
        }
      } catch (e) {
        console.error('Error cargando métricas reales de staff:', e);
      } finally {
        setLoading(false);
      }
    }

    loadMetricas();
  }, [agente?.id, agente?.nombre]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-xl transition-colors">
        <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-purple-400" /> MÉTRICAS Y DESEMPEÑO DEL MES
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Summary Banner Blue Gradient */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-6 text-white shadow-2xl space-y-4 relative overflow-hidden">
        <div className="space-y-1">
          <span className="text-[10px] font-black tracking-widest uppercase text-indigo-200">PRODUCCIÓN DEL MES ACTIVO</span>
          <h3 className="text-4xl font-black tracking-tight">{loading ? '...' : totalAtenciones}</h3>
          <p className="text-xs text-indigo-100 font-medium">Atenciones Finalizadas</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-indigo-100 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> CLIENTES ÚNICOS</span>
            <p className="text-xl font-black mt-0.5">{loading ? '...' : clientesUnicos}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-indigo-100 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> ESTADO</span>
            <p className="text-xs font-bold text-indigo-200 mt-1">En vivo</p>
          </div>
        </div>
      </div>

      {/* Desglose de Servicios */}
      <div className="space-y-3 pt-1">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">DESGLOSE DE SERVICIOS</span>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 animate-pulse">Cargando métricas de producción...</div>
        ) : Object.keys(desglose).length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl text-center space-y-2">
            <Scissors className="w-8 h-8 text-slate-500 dark:text-slate-400 mx-auto opacity-50" />
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">Sin atenciones registradas este mes</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Las órdenes completadas en tu estación aparecerán automáticamente aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(desglose).map(([nombre, count]) => (
              <div key={nombre} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-xl transition-colors">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 line-clamp-1">{nombre}</span>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{count}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
