'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { createClient } from '@/lib/supabase/client';
import { Users, CreditCard, Beaker, LogOut, ShieldCheck, Sparkles, Building2, Bell, RefreshCw } from 'lucide-react';
import RecepcionMobileView from '@/components/mobile/RecepcionMobileView';
import CajaMobileView from '@/components/mobile/CajaMobileView';
import DespachoMobileView from '@/components/mobile/DespachoMobileView';
import { MobileAccessibilityCard } from '@/components/mobile/MobileAccessibilityCard';
import { obtenerHerramientasAgente } from '@/services/permisos';

type SoporteTab = 'recepcion' | 'caja' | 'despacho' | 'ajustes';

export default function MobileSoportePage() {
  const router = useRouter();
  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const clearSede = useAppStore((state) => state.clearSede);
  const [activeTab, setActiveTab] = useState<SoporteTab>('recepcion');
  const [herramientas, setHerramientas] = useState<string[]>(['recepcion', 'caja', 'despacho']);
  const [agente, setAgente] = useState<any>({
    id: '',
    nombre: 'Colaborador de Soporte',
    rol: 'SOPORTE',
    email: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSoporte = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email) {
        const { data: agenteDb } = await supabase
          .from('agentes')
          .select('*')
          .ilike('email', user.email.trim())
          .maybeSingle();

        if (agenteDb) {
          setAgente(agenteDb);
          const keys = await obtenerHerramientasAgente(agenteDb.id);
          if (keys && keys.length > 0) {
            setHerramientas(keys);
            if (!keys.includes(activeTab)) {
              if (keys.includes('recepcion')) setActiveTab('recepcion');
              else if (keys.includes('caja')) setActiveTab('caja');
              else if (keys.includes('despacho')) setActiveTab('despacho');
            }
          }
        }
      }
      setLoading(false);
    };

    initSoporte();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    clearSede();
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vaikuntha_user_email');
      localStorage.removeItem('vaikuntha_user_role');
      localStorage.removeItem('vaikuntha_user_name');
    }
    router.push('/login');
  };

  const sedeId = sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 pb-24 font-sans selection:bg-indigo-500/30 transition-colors duration-200">
      
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl mb-4 backdrop-blur-md shadow-lg transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-black text-white text-sm shadow-md">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-black text-slate-900 dark:text-white">{agente.nombre}</h1>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-500/30">
                SOPORTE
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              {sedeActiva?.nombre || 'Unidad de Prueba (Sandbox)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/mobile/soporte')}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Recargar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl transition cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selector de Herramientas de Soporte (Segmented Control) */}
      <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 shadow-md">
        {herramientas.includes('recepcion') && (
          <button
            onClick={() => setActiveTab('recepcion')}
            className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'recepcion'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="text-[11px]">Recepción</span>
          </button>
        )}

        {herramientas.includes('caja') && (
          <button
            onClick={() => setActiveTab('caja')}
            className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'caja'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="text-[11px]">Caja</span>
          </button>
        )}

        {herramientas.includes('despacho') && (
          <button
            onClick={() => setActiveTab('despacho')}
            className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'despacho'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Beaker className="w-3.5 h-3.5" />
            <span className="text-[11px]">Despacho</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('ajustes')}
          className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'ajustes'
              ? 'bg-pink-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[11px]">Ajustes</span>
        </button>
      </div>

      {/* Vistas Dinámicas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <p className="text-xs font-bold">Cargando herramientas de soporte...</p>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          {activeTab === 'recepcion' && (
            <RecepcionMobileView agente={agente} sedeId={sedeId} />
          )}

          {activeTab === 'caja' && (
            <CajaMobileView agente={agente} sedeId={sedeId} />
          )}

          {activeTab === 'despacho' && (
            <DespachoMobileView agente={agente} sedeId={sedeId} />
          )}

          {activeTab === 'ajustes' && (
            <div className="space-y-4">
              <MobileAccessibilityCard userId={agente?.id} />
            </div>
          )}
        </div>
      )}

    </div>
  );
}
