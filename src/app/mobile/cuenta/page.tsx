'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { createClient } from '@/lib/supabase/client';
import StaffPerfilView from '@/components/mobile/staff/StaffPerfilView';
import ClientePerfilView from '@/components/mobile/cliente/ClientePerfilView';
import Link from 'next/link';
import { ArrowLeft, User, Smartphone, Shield, Sparkles } from 'lucide-react';
import MiPerfilPage from '@/app/(dashboard)/perfil/page';

export default function MobileCuentaPage() {
  const { userRol } = useAppStore();
  const [agente, setAgente] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('vaikuntha_user_email') : null);

      if (userEmail) {
        const { data } = await supabase.from('agentes').select('*').eq('email', userEmail).maybeSingle();
        if (data) {
          setAgente(data);
        } else {
          setAgente({
            id: 'admin-fallback',
            nombre: localStorage.getItem('vaikuntha_user_name') || 'Usuario Staff',
            email: userEmail,
            rol: userRol || 'STAFF'
          });
        }
      }

      // Check client session
      const clientSaved = typeof window !== 'undefined' ? localStorage.getItem('vaikuntha_cliente_sesion') : null;
      if (clientSaved) {
        try {
          setCliente(JSON.parse(clientSaved));
        } catch (e) {
          console.error(e);
        }
      }

      setLoading(false);
    }

    loadData();
  }, [userRol]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Si es CLIENTE o viene desde el portal cliente
  if (userRol?.toUpperCase() === 'CLIENTE' && cliente) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans">
        <ClientePerfilView 
          cliente={cliente}
          onCerrarSesion={() => {
            localStorage.removeItem('vaikuntha_cliente_sesion');
            setCliente(null);
          }}
        />
      </div>
    );
  }

  // 2. Si es STAFF operario
  if (userRol?.toUpperCase() === 'STAFF') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 pb-24 font-sans transition-colors duration-200">
        <div className="mb-4">
          <Link
            href="/mobile/operacion"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Operaciones
          </Link>
        </div>
        <StaffPerfilView agente={agente} gamProfile={{ streak_asistencia: 7, streak_max: 14, badges: ['PUNTUAL_ORO', 'ZERO_WASTE', 'SPEED_MASTER'] }} />
      </div>
    );
  }

  // 3. Si es Superadmin, Admin o Soporte en Móvil: Renderiza la suite responsive
  const backRoute = userRol?.toUpperCase() === 'ADMIN' ? '/mobile/admin' : userRol?.toUpperCase() === 'SOPORTE' ? '/mobile/soporte' : '/mobile/operacion';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 font-sans transition-colors duration-200">
      <div className="p-4">
        <Link
          href={backRoute}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Panel
        </Link>
      </div>
      <MiPerfilPage />
    </div>
  );
}
