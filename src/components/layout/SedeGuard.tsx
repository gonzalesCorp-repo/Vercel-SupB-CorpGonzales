'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { obtenerTodasLasSedes } from '@/services/admin';
import { Building2, ShieldCheck, ArrowRight } from 'lucide-react';

interface SedeGuardProps {
  children: React.ReactNode;
}

export default function SedeGuard({ children }: SedeGuardProps) {
  const { sedeActiva, setSedeActiva } = useAppStore();
  const [sedes, setSedes] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sedeActiva) {
      cargarSedes();
    }
  }, [sedeActiva]);

  const cargarSedes = async () => {
    setLoading(true);
    try {
      const data = await obtenerTodasLasSedes();
      const list = data || [];
      setSedes(list);

      // Auto-recuperación de sede si no está activa
      if (list.length > 0) {
        const defaultId = typeof window !== 'undefined' ? localStorage.getItem('vaikuntha_default_sede_id') : null;
        const found = defaultId ? list.find(s => s.id === defaultId) : null;
        const sedeToSet = found || list[0];
        setSedeActiva(sedeToSet);
      }
    } catch (e) {
      console.error('[SedeGuard] Error al cargar sedes:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!sedeActiva) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-emerald-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Selecciona tu Sede Activa</h2>
          <p className="text-slate-400 text-sm mb-6">
            Para operar en el sistema, selecciona la sede física donde te encuentras trabajando.
          </p>

          {loading ? (
            <div className="py-8 text-emerald-400 font-medium animate-pulse">
              Cargando sedes autorizadas...
            </div>
          ) : sedes.length > 0 ? (
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
              {sedes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSedeActiva(s)}
                  className="w-full flex items-center justify-between bg-slate-800/80 hover:bg-emerald-600/20 border border-slate-700 hover:border-emerald-500/50 p-4 rounded-xl text-left transition-all text-slate-200 hover:text-white group"
                >
                  <span className="font-semibold">{s.nombre}</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-400 text-sm mb-6">
              No se encontraron sedes activas. Por favor contacta al Administrador.
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 border-t border-slate-800 pt-4">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Vaikuntha ERP — Control de Acceso por Sede</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
