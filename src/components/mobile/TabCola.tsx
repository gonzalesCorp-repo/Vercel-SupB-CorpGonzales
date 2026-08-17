'use client';

import React, { useState, useEffect } from 'react';
import { Users, Clock, Sparkles, RefreshCw, Scissors, Sparkle } from 'lucide-react';
import { obtenerAgentesDisponibles, Agente } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';

interface TabColaProps {
  miNombre: string;
}

type TipoFiltro = 'Todos' | 'Estilismo' | 'Cosmiatria';

function clasificarEspecialidad(agente: Agente): ('Estilismo' | 'Cosmiatria')[] {
  const result: ('Estilismo' | 'Cosmiatria')[] = [];
  const esp = (agente.especialidad || '').toLowerCase();

  // 1. Cabello / Estilismo / Barbería
  if (
    esp.includes('estil') ||
    esp.includes('barber') ||
    esp.includes('corte') ||
    esp.includes('color') ||
    esp.includes('capilar') ||
    esp.includes('alisado') ||
    esp.includes('peinado') ||
    !esp
  ) {
    result.push('Estilismo');
  }

  // 2. Uñas / Piel / Cosmiatría / Maquillaje
  if (
    esp.includes('cosm') ||
    esp.includes('uña') ||
    esp.includes('piel') ||
    esp.includes('maquillaje') ||
    esp.includes('mani') ||
    esp.includes('pedi') ||
    esp.includes('facial') ||
    esp.includes('ceja') ||
    esp.includes('pestaña') ||
    esp.includes('spa') ||
    esp.includes('podolog')
  ) {
    result.push('Cosmiatria');
  }

  if (result.length === 0) result.push('Estilismo');
  return result;
}

export function TabCola({ miNombre }: TabColaProps) {
  const [filtro, setFiltro] = useState<TipoFiltro>('Todos');
  const [agentesEnPiso, setAgentesEnPiso] = useState<Agente[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarColaEnVivo = async () => {
    try {
      const data = await obtenerAgentesDisponibles();
      // Filtrar solo colaboradores que están en piso (no fuera de turno)
      const enPiso = data.filter(a => a.estadoOperativo !== 'FUERA_DE_TURNO');
      setAgentesEnPiso(enPiso);
    } catch (e) {
      console.warn('Error cargando cola en vivo:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarColaEnVivo();

    const supabase = createClient();
    // Suscripción Realtime a asistencias, ordenes y agentes
    const channel = supabase.channel('realtime-tab-cola')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asistencias_turnos' }, () => cargarColaEnVivo())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarColaEnVivo())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agentes' }, () => cargarColaEnVivo())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtrados = agentesEnPiso.filter(c => {
    if (filtro === 'Todos') return true;
    const cats = clasificarEspecialidad(c);
    return cats.includes(filtro);
  });

  // Calcular mi posición en la cola filtrada
  const miIndex = filtrados.findIndex(c => 
    c.nombre.toLowerCase().includes(miNombre.toLowerCase()) || 
    miNombre.toLowerCase().includes(c.nombre.toLowerCase())
  );
  const miPosicion = miIndex >= 0 ? miIndex + 1 : 1;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Banner de Posición */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 text-white p-5 rounded-3xl shadow-xl shadow-indigo-950/30 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">
          Posición de Turno en Sede
        </span>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-xs text-indigo-100 font-medium">Estás en el turno:</p>
            <p className="text-3xl font-black mt-0.5">#{miPosicion} de {filtrados.length || 1}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl border border-white/20">
            👥
          </div>
        </div>
      </div>

      {/* Filtros de Especialidad Claros y Estándar */}
      <div className="flex gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800">
        <button
          onClick={() => setFiltro('Todos')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            filtro === 'Todos'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Todos
        </button>

        <button
          onClick={() => setFiltro('Estilismo')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
            filtro === 'Estilismo'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>✂️ Estilismo</span>
        </button>

        <button
          onClick={() => setFiltro('Cosmiatria')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
            filtro === 'Cosmiatria'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>💅 Cosmiatría</span>
        </button>
      </div>

      {/* Lista de Turnos en Vivo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Compañeros en Piso ({filtrados.length})
          </span>
          <button
            type="button"
            onClick={cargarColaEnVivo}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${cargando ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>

        {filtrados.length === 0 ? (
          <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
            No hay colaboradores en piso para este filtro.
          </div>
        ) : (
          filtrados.map((c, idx) => {
            const esTu = c.nombre.toLowerCase().includes(miNombre.toLowerCase()) || miNombre.toLowerCase().includes(c.nombre.toLowerCase());
            const pos = idx + 1;
            const estadoOp = c.estadoOperativo || 'DISPONIBLE';
            const categorias = clasificarEspecialidad(c);
            const tagLabel = categorias.length > 1 
              ? '✂️ Estilismo & 💅 Cosmiatría' 
              : categorias[0] === 'Estilismo' 
              ? '✂️ Estilismo (Cabello)' 
              : '💅 Cosmiatría (Uñas & Piel)';

            return (
              <div
                key={c.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  esTu
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                    esTu ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {pos}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      {c.nombre}
                      {esTu && (
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded-md">
                          Tú
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {tagLabel}
                    </span>
                  </div>
                </div>

                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                  estadoOp === 'DISPONIBLE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : estadoOp === 'OCUPADO'
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    : estadoOp === 'EN_REFRIGERIO'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {estadoOp === 'OCUPADO' ? 'EN ATENCIÓN' : estadoOp === 'EN_REFRIGERIO' ? 'EN REFRIGERIO' : 'DISPONIBLE'}
                </span>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
