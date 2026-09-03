'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign, RefreshCw, User, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import StaffLiquidacionesTab from '@/components/mobile/staff/StaffLiquidacionesTab';
import { MobileAppleNav, MainHubTab } from '@/components/mobile/MobileAppleNav';

export default function MobileLiquidacionPage() {
  const router = useRouter();
  const { sedeActiva } = useAppStore();
  const [agente, setAgente] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function initUser() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const email = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('vaikuntha_user_email') : null);
        const storedId = typeof window !== 'undefined' ? localStorage.getItem('vaikuntha_user_id') : null;

        if (!email && !storedId) {
          router.replace('/login');
          return;
        }

        let foundAgente: any = null;

        if (email) {
          const { data } = await supabase
            .from('agentes')
            .select('*')
            .ilike('email', email.trim())
            .maybeSingle();
          if (data) foundAgente = data;
        }

        if (!foundAgente && storedId) {
          const { data } = await supabase
            .from('agentes')
            .select('*')
            .eq('id', storedId)
            .maybeSingle();
          if (data) foundAgente = data;
        }

        if (isMounted) {
          if (foundAgente) {
            setAgente(foundAgente);
          } else {
            setAgente({
              id: storedId || user?.id || '',
              nombre: (typeof window !== 'undefined' ? localStorage.getItem('vaikuntha_user_name') : null) || user?.user_metadata?.nombre || 'Colaborador',
              rol: (typeof window !== 'undefined' ? localStorage.getItem('vaikuntha_user_rol') : null) || 'STAFF',
              email: email || ''
            });
          }
        }
      } catch (err) {
        console.error('Error inicializando agente en mobile/liquidacion:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initUser();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const handleSelectNavHub = (hub: MainHubTab) => {
    if (hub === 'liquidacion') return;
    if (hub === 'cuenta') {
      router.push('/mobile/cuenta');
    } else {
      router.push('/mobile/operacion');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200">
      {/* 📱 Header Superior Móvil Adaptativo Edge-to-Edge */}
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/mobile/operacion"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-600 dark:text-slate-300"
            title="Volver a Operación"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Liquidaciones & Turno</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {agente?.nombre || 'Colaborador'} • {agente?.rol || 'Staff'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sedeActiva && (
            <span className="hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {sedeActiva.nombre}
            </span>
          )}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>En Línea</span>
          </span>
        </div>
      </header>

      {/* 📦 Área Principal de Liquidaciones */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-4 pb-28">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cargando tus liquidaciones...</p>
          </div>
        ) : (
          <StaffLiquidacionesTab agente={agente} sedeId={sedeActiva?.id} />
        )}
      </main>

      {/* 📱 Barra de Navegación Móvil Inferior */}
      <MobileAppleNav
        activeHub="liquidacion"
        onSelectHub={handleSelectNavHub}
        mostrarCartera={agente?.rol === 'SUPERADMIN' || agente?.rol === 'ADMIN' || agente?.rol === 'SOPORTE'}
      />
    </div>
  );
}
