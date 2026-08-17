'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const rol = typeof window !== 'undefined' ? localStorage.getItem('vaikuntha_user_rol') : null;
    const isMobile = typeof window !== 'undefined' && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    );

    if (!rol) {
      router.replace('/login');
    } else if (rol === 'SUPERADMIN' && isMobile) {
      router.replace('/mobile/superadmin');
    } else if (rol === 'STAFF' || (isMobile && rol !== 'ADMIN' && rol !== 'JEFE_OPERATIVO')) {
      router.replace('/mobile/operacion');
    } else if (rol === 'KIOSKO') {
      router.replace('/kiosk');
    } else {
      router.replace('/recepcion');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6">
      <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-2xl shadow-indigo-500/20 animate-pulse">
          <Sparkles className="w-8 h-8 text-indigo-400" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-lg font-black tracking-tight text-white">Vaikuntha ERP</h1>
          <p className="text-xs text-slate-500 font-medium">Sincronizando entorno operativo...</p>
        </div>
        <div className="w-24 h-1 bg-slate-900 rounded-full overflow-hidden">
          <div className="w-full h-full bg-indigo-500 rounded-full animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>
    </div>
  );
}
