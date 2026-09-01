'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, X, Edit3, Award, Heart, LogOut, Sliders, 
  KeyRound, Check, Sparkles, Shield, Trophy, Settings, 
  Calendar, Mail, Lock
} from 'lucide-react';
import StreakCounter from '@/components/mobile/StreakCounter';
import HallOfFameBanner from '@/components/mobile/HallOfFameBanner';
import BadgeCollection from '@/components/mobile/BadgeCollection';
import { BADGE_CATALOG, calcularFinCiclo } from '@/lib/gamification/config';
import { useUIStore } from '@/store/useUIStore';
import { useThemeStore } from '@/store/useThemeStore';
import { createClient } from '@/lib/supabase/client';
import { MobileAccessibilityCard } from '@/components/mobile/MobileAccessibilityCard';
import { PwaInstallButton } from '@/components/mobile/PwaInstallButton';
import { formatHorarioAgente, formatDescansoAgente } from '@/lib/utils/timeUtils';

export interface StaffPerfilViewProps {
  agente?: any;
  gamProfile?: any;
  hallOfFame?: any[];
  setShowKudosModal?: (val: boolean) => void;
  setKudosTargetId?: (id: string) => void;
  setKudosTargetName?: (name: string) => void;
  onClose?: () => void;
  onThemeToggle?: () => void;
}

export default function StaffPerfilView({
  agente: initialAgente,
  gamProfile,
  hallOfFame = [],
  setShowKudosModal,
  setKudosTargetId,
  setKudosTargetName,
  onClose
}: StaffPerfilViewProps) {
  const { showAlert } = useUIStore();
  const supabase = createClient();
  const { themeMode, setThemeMode, primaryColor, setPrimaryColor } = useThemeStore();

  const [activeTab, setActiveTab] = useState<'perfil' | 'logros' | 'ajustes'>('perfil');
  const [agente, setAgente] = useState<any>(initialAgente);
  const [modalPinOpen, setModalPinOpen] = useState(false);
  const [nuevoPin, setNuevoPin] = useState('');
  const [guardandoPin, setGuardandoPin] = useState(false);

  const [modalApodoOpen, setModalApodoOpen] = useState(false);
  const [nuevoApodo, setNuevoApodo] = useState(agente?.nombre || '');
  const [guardandoApodo, setGuardandoApodo] = useState(false);

  const handleGuardarPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevoPin.length !== 4 || isNaN(Number(nuevoPin))) {
      showAlert('El PIN debe ser de 4 dígitos numéricos', 'error');
      return;
    }

    if (!agente?.id) return;
    setGuardandoPin(true);
    try {
      const { error } = await supabase
        .from('agentes')
        .update({ pin: nuevoPin })
        .eq('id', agente.id);

      if (error) {
        showAlert('Error al actualizar el PIN en base de datos', 'error');
        return;
      }

      setAgente({ ...agente, pin: nuevoPin });
      showAlert('¡PIN Secreto de Piso actualizado con éxito!', 'success');
      setModalPinOpen(false);
      setNuevoPin('');
    } catch (err) {
      console.error(err);
      showAlert('Error al guardar PIN', 'error');
    } finally {
      setGuardandoPin(false);
    }
  };

  const handleGuardarApodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoApodo.trim()) return;

    if (!agente?.id) return;
    setGuardandoApodo(true);
    try {
      const { error } = await supabase
        .from('agentes')
        .update({ nombre: nuevoApodo.trim() })
        .eq('id', agente.id);

      if (error) {
        showAlert('Error al actualizar el apodo', 'error');
        return;
      }

      setAgente({ ...agente, nombre: nuevoApodo.trim() });
      showAlert('¡Apodo en comandas actualizado!', 'success');
      setModalApodoOpen(false);
    } catch (err) {
      console.error(err);
      showAlert('Error al guardar apodo', 'error');
    } finally {
      setGuardandoApodo(false);
    }
  };

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vaikuntha_user_email');
      localStorage.removeItem('vaikuntha_user_rol');
      localStorage.removeItem('vaikuntha_user_name');
      window.location.href = '/login';
    }
  };

  return (
    <div className="space-y-4 pb-20 w-full animate-in fade-in duration-200">
      
      {/* 1. Selector de Pestañas Superiores de Mi Cuenta */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner w-full">
        <button
          type="button"
          onClick={() => setActiveTab('perfil')}
          className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'perfil'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Perfil</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logros')}
          className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'logros'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Logros</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ajustes')}
          className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'ajustes'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Ajustes</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: PERFIL & DATOS PERSONALES */}
      {/* ========================================================================= */}
      {activeTab === 'perfil' && (
        <div className="space-y-4 animate-in fade-in w-full">
          {/* Tarjeta de Identidad */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-purple-600/30">
                  {agente?.nombre ? agente.nombre.charAt(0) : 'S'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {agente?.nombre || 'Colaborador Staff'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Turno: ⏰ {formatHorarioAgente(agente?.atributos)} • <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase">{agente?.rol || 'STAFF'}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalApodoOpen(true)}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Editar
              </button>
            </div>

            {/* Bloques de Datos */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Apodo / Nombre en Comandas</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{agente?.atributos?.nickname || agente?.nombre}</span>
                </div>
                <button onClick={() => setModalApodoOpen(true)} className="p-1.5 text-indigo-500 hover:text-indigo-600 cursor-pointer">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">PIN Secreto de Piso</span>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {agente?.pin ? '•••• (Configurado)' : 'Sin configurar'}
                  </span>
                </div>
                <button onClick={() => setModalPinOpen(true)} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-[11px] font-bold border border-indigo-200 dark:border-indigo-500/30 cursor-pointer">
                  Cambiar
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Día de Descanso Habitual</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatDescansoAgente(agente?.atributos)}
                  </span>
                </div>
                <Calendar className="w-4 h-4 text-emerald-500" />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Correo / Usuario</span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {agente?.email || 'Sin correo asignado'}
                  </span>
                </div>
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Botón Cerrar Sesión */}
          <button
            onClick={handleCerrarSesion}
            className="w-full py-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión Segura
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: LOGROS, RACHA & GAMIFICACIÓN */}
      {/* ========================================================================= */}
      {activeTab === 'logros' && (
        <div className="space-y-4 animate-in fade-in w-full">
          <StreakCounter
            streak={gamProfile?.streak_asistencia || 0}
            streakMax={gamProfile?.streak_max || 0}
          />

          <HallOfFameBanner
            hallOfFame={hallOfFame || []}
            currentAgenteId={agente?.id || ''}
            cicloFin={calcularFinCiclo()}
          />

          <BadgeCollection
            earnedBadges={gamProfile?.badges || []}
            allBadges={BADGE_CATALOG}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: AJUSTES, ACCESIBILIDAD & PWA */}
      {/* ========================================================================= */}
      {activeTab === 'ajustes' && (
        <div className="space-y-4 animate-in fade-in w-full">
          <PwaInstallButton />
          <MobileAccessibilityCard />
        </div>
      )}

      {/* Modal Cambio de PIN */}
      {modalPinOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-500" /> Cambiar PIN Secreto
              </h4>
              <button onClick={() => setModalPinOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">Ingresa tu nuevo PIN de 4 dígitos para autorizar comandas e insumos en salón.</p>

            <form onSubmit={handleGuardarPin} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                value={nuevoPin}
                onChange={(e) => setNuevoPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4 dígitos numéricos"
                className="w-full text-center text-2xl font-mono tracking-widest bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                autoFocus
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalPinOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPin || nuevoPin.length !== 4}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {guardandoPin ? 'Guardando...' : 'Guardar PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambio de Apodo */}
      {modalApodoOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-500" /> Editar Apodo en Salón
              </h4>
              <button onClick={() => setModalApodoOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">Este nombre aparecerá en la comanda de bar, tickets y pantalla de turnos.</p>

            <form onSubmit={handleGuardarApodo} className="space-y-3">
              <input
                type="text"
                value={nuevoApodo}
                onChange={(e) => setNuevoApodo(e.target.value)}
                placeholder="Tu apodo o nombre corto"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-xs font-bold"
                autoFocus
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalApodoOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoApodo || !nuevoApodo.trim()}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {guardandoApodo ? 'Guardando...' : 'Guardar Apodo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
