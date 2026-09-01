'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DedicatedMobileViewPage() {
  const router = useRouter();

  useEffect(() => {
    const rol = typeof window !== 'undefined' ? (localStorage.getItem('vaikuntha_user_rol') || '').toUpperCase() : '';
    if (rol === 'SUPERADMIN') {
      router.replace('/mobile/superadmin');
    } else if (rol === 'ADMIN') {
      router.replace('/mobile/admin');
    } else if (rol === 'SOPORTE' || rol === 'RECEPCION' || rol === 'CAJA') {
      router.replace('/mobile/soporte');
    } else {
      router.replace('/mobile/operacion');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-medium">Cargando Suite Móvil Operativa...</p>
      </div>
    </div>
  );
}
