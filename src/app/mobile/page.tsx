'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DedicatedMobileViewPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/mobile/operacion');
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
