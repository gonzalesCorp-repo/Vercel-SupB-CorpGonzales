'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import GamificationHeader from '@/components/mobile/GamificationHeader';
import CajaMobileView from '@/components/mobile/CajaMobileView';
import RecepcionMobileView from '@/components/mobile/RecepcionMobileView';
import DespachoMobileView from '@/components/mobile/DespachoMobileView';
import AdminMobileView from '@/components/mobile/AdminMobileView';
import StaffMobileView from '@/components/mobile/StaffMobileView';

export default function DedicatedMobileViewPage() {
  const [agente, setAgente] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();
  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const { profile: gamProfile, loadProfile: loadGamProfile } = useGamificationStore();

  const cargarDatosAgente = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      router.push('/login');
      return;
    }

    const { data: agenteData } = await supabase
      .from('agentes')
      .select('*')
      .ilike('email', user.email.trim())
      .single();

    if (agenteData) {
      setAgente(agenteData);
      await loadGamProfile(agenteData.id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    cargarDatosAgente();

    const channel = supabase.channel('realtime-mobile-agente')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agentes' }, () => cargarDatosAgente())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-28 select-none font-sans">
      <GamificationHeader
        agente={agente}
        profile={gamProfile ? {
          xp_total: gamProfile.xp_total,
          nivel: gamProfile.nivel,
          titulo: gamProfile.titulo,
          streak_asistencia: gamProfile.streak_asistencia,
          monedas: gamProfile.monedas
        } : { xp_total: 0, nivel: 1, titulo: 'Novato', streak_asistencia: 0, monedas: 0 }}
        sedeNombre={sedeActiva?.nombre || 'Sede'}
        onLogout={async () => {
          await supabase.auth.signOut();
          router.push('/login');
        }}
      />

      {(!agente?.rol || agente?.rol === 'STAFF') ? (
        <StaffMobileView agente={agente} sedeId={sedeActiva?.id || ''} />
      ) : (
        <main className="flex-1 p-4 max-w-md mx-auto w-full">
          {agente.rol === 'CAJA' && <CajaMobileView agente={agente} sedeId={sedeActiva?.id || ''} />}
          {agente.rol === 'RECEPCION' && <RecepcionMobileView agente={agente} sedeId={sedeActiva?.id || ''} />}
          {agente.rol === 'DESPACHO' && <DespachoMobileView agente={agente} sedeId={sedeActiva?.id || ''} />}
          {(agente.rol === 'ADMIN' || agente.rol === 'SUPERADMIN') && <AdminMobileView agente={agente} sedeId={sedeActiva?.id || ''} />}
        </main>
      )}
    </div>
  );
}
