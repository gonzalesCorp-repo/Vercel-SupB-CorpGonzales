'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/useUIStore';
import { KeyRound, Save, UserCircle2 } from 'lucide-react';

export default function MiPerfilPage() {
  const [agente, setAgente] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();
  const { showAlert } = useUIStore();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data } = await supabase.from('agentes').select('*').eq('email', user.email).single();
        if (data) {
          setAgente(data);
          if (data.pin) setPin(data.pin);
        }
      }
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || isNaN(Number(pin))) {
      showAlert("El PIN debe ser un número de 4 dígitos", "error");
      return;
    }

    if (!agente?.id) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('agentes')
      .update({ pin })
      .eq('id', agente.id);

    setIsSaving(false);

    if (error) {
      showAlert("Error al guardar el PIN", "error");
    } else {
      showAlert("PIN actualizado exitosamente", "success");
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Cargando perfil...</div>;

  if (!agente) return <div className="p-8 text-center text-slate-500">No tienes un perfil de agente asociado.</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Mi Cuenta</h1>
        <p className="text-slate-500 mt-2">Configura tu perfil y preferencias de seguridad.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <UserCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{agente.nombre}</h2>
            <p className="text-slate-500">{agente.email}</p>
            <span className="inline-block mt-1 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md uppercase tracking-wider">
              ROL: {agente.rol}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3">
          <KeyRound className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-lg">PIN Operativo</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-6">
            El PIN operativo es un código de 4 dígitos que te permitirá identificarte rápidamente y autorizar acciones en los Quioscos (Workspace Compartido de la sede).
          </p>

          <form onSubmit={handleSavePin} className="max-w-xs space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nuevo PIN (4 dígitos)</label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej. 1234"
                className="w-full text-2xl tracking-[0.5em] text-center font-bold px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isSaving || pin.length !== 4}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Guardando...' : 'Guardar PIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
