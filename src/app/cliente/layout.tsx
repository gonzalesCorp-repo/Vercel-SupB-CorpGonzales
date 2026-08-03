import { Suspense } from 'react';

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400 animate-pulse">Cargando portal de fidelidad...</p>
      </div>
    }>
      {children}
    </Suspense>
  );
}
