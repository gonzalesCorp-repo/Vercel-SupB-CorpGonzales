'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X, Edit3, Award, Heart, LogOut, Sliders, KeyRound, Check } from 'lucide-react';
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

  const [agente, setAgente] = useState<any>(initialAgente);
  const [modalPinOpen, setModalPinOpen] = useState(false);
  const [nuevoPin, setNuevoPin] = useState('');
  const [guardandoPin, setGuardandoPin] = useState(false);

  const [modalApodoOpen, setModalApodoOpen] = useState(false);
  const [nuevoApodo, setNuevoApodo] = useState(agente?.nombre || '');
  const [guardandoApodo, setGuardandoApodo] = useState(false);

  const colors = [
    { name: 'Índigo', value: '#4f46e5' },
    { name: 'Esmeralda', value: '#10b981' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Violeta', value: '#8b5cf6' },
    { name: 'Naranja', value: '#f97316' },
    { name: 'Azul', value: '#3b82f6' }
  ];

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
        showAlert('Error al actualizar tu apodo', 'error');
        return;
      }

      setAgente({ ...agente, nombre: nuevoApodo.trim() });
      showAlert('¡Apodo de comanda actualizado con éxito!', 'success');
      setModalApodoOpen(false);
    } catch (err) {
      console.error(err);
      showAlert('Error al guardar apodo', 'error');
    } finally {
      setGuardandoApodo(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 font-sans">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <User className="w-5 h-5 text-pink-400" /> MI CUENTA STAFF (360)
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 🏆 Hall of Fame Banner */}
      {hallOfFame && hallOfFame.length > 0 && (
        <HallOfFameBanner
          hallOfFame={hallOfFame.slice(0, 3).map(h => ({
            nombre: h.nombre,
            xp_ciclo: h.xp_ciclo,
            streak: h.streak_asistencia,
            titulo: h.titulo,
            agente_id: h.agente_id
          }))}
          currentAgenteId={agente?.id || ''}
          cicloFin={calcularFinCiclo()}
        />
      )}

      {/* 🔥 Streak Counter */}
      {gamProfile && (
        <StreakCounter
          streak={gamProfile.streak_asistencia || 0}
          streakMax={gamProfile.streak_max || 0}
        />
      )}

      {/* Card Principal de Perfil */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl transition-colors">
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{agente?.nombre || 'Colaborador'}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              Turno: ⏰ {formatHorarioAgente(agente?.atributos)} • <span className="text-indigo-600 dark:text-indigo-400 font-bold">ROL: {agente?.rol || 'STAFF'}</span>
            </p>
          </div>
          <button onClick={() => setModalApodoOpen(true)}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-600/30 transition cursor-pointer"
          >
            Editar
          </button>
        </div>

        {/* Campos Configuración */}
        <div className="space-y-2 text-xs">
          <div 
            onClick={() => setModalApodoOpen(true)}
            className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition"
          >
            <span className="font-bold text-slate-500 dark:text-slate-400">APODO / NOMBRE EN COMANDAS</span>
            <span className="font-black text-slate-900 dark:text-white flex items-center gap-1">
              {agente?.atributos?.nickname || agente?.nombre || 'Colaborador'} <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
            </span>
          </div>

          <div 
            onClick={() => setModalPinOpen(true)}
            className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-pink-500/40 cursor-pointer transition"
          >
            <span className="font-bold text-slate-500 dark:text-slate-400">PIN SECRETO DE PISO</span>
            <span className="font-black text-pink-500 tracking-widest flex items-center gap-1">
              {agente?.pin ? '••••' : 'Configurar'} <Edit3 className="w-3.5 h-3.5 text-pink-500" />
            </span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-500 dark:text-slate-400">DÍA DE DESCANSO HABITUAL</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">{formatDescansoAgente(agente?.atributos)}</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-500 dark:text-slate-400">CORREO / USUARIO</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{agente?.email || 'Sin correo asignado'}</span>
          </div>
        </div>

        {/* 📲 Botón de Instalación PWA Directa con Marca */}
        <PwaInstallButton />

        {/* Tarjeta Completa de Accesibilidad y Legibilidad Visual */}
        <MobileAccessibilityCard userId={agente?.id} />

        {/* Botón Enviar Kudos */}
        <button onClick={() => {
            if (setKudosTargetId && setKudosTargetName && setShowKudosModal) {
              setKudosTargetId(agente?.id || '');
              setKudosTargetName(agente?.nombre || 'Compañero');
              setShowKudosModal(true);
            }
          }}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 active:scale-95 transition cursor-pointer"
        >
          <Heart className="w-4 h-4 fill-current" /> Enviar Kudos Reconocimiento 💖
        </button>

        {/* Botón Acceso Configuración de Sede para Admin / SuperAdmin */}
        {['ADMIN', 'SUPERADMIN', 'SOPORTE'].includes(agente?.rol?.toUpperCase() || '') && (
          <a 
            href="/mobile/config"
            className="w-full py-3.5 rounded-2xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition hover:bg-emerald-500/20 cursor-pointer shadow-md"
          >
            <Sliders className="w-4 h-4 text-emerald-400" /> Configuración Quirúrgica de Sede (Admin)
          </a>
        )}

        {/* Botón Cerrar Sesión */}
        <button onClick={async () => {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            await supabase.auth.signOut();
            if (typeof window !== 'undefined') {
              localStorage.removeItem('vaikuntha_user_email');
              localStorage.removeItem('vaikuntha_user_role');
              localStorage.removeItem('vaikuntha_user_name');
              window.location.href = '/login';
            }
          }}
          className="w-full py-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition hover:bg-rose-500/20 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Cerrar Sesión Operativa
        </button>
      </div>

      {/* 🏅 Badge Collection */}
      {gamProfile && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> MIS INSIGNIAS OPERATIVAS
          </h3>
          <BadgeCollection
            earnedBadges={gamProfile.badges || []}
            allBadges={BADGE_CATALOG.filter(b => !b.role_filter || b.role_filter.includes(agente?.rol || 'STAFF'))}
          />
        </div>
      )}

      {/* MODAL CAMBIAR PIN */}
      <AnimatePresence>
        {modalPinOpen && (
          <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Cambiar PIN Secreto</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ingresa un PIN numérico de 4 dígitos para desbloquear tus autorizaciones de piso.</p>
              </div>

              <form onSubmit={handleGuardarPin} className="space-y-4">
                <input
                  type="password"
                  maxLength={4}
                  value={nuevoPin}
                  onChange={e => setNuevoPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full text-center text-3xl tracking-[0.5em] font-black bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors rounded-2xl p-4 focus:border-pink-500 outline-none"
                  autoFocus
                  required
                />

                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => setModalPinOpen(false)}
                    className="w-1/2 py-3 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button type="submit"
                    disabled={guardandoPin || nuevoPin.length !== 4}
                    className="w-1/2 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl text-xs font-black shadow-lg disabled:opacity-50 transition cursor-pointer"
                  >
                    {guardandoPin ? 'Guardando...' : 'Guardar PIN'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CAMBIAR APODO */}
      <AnimatePresence>
        {modalApodoOpen && (
          <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <User className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Editar Apodo</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Este nombre aparecerá en las comandas de clientes y reportes de producción.</p>
              </div>

              <form onSubmit={handleGuardarApodo} className="space-y-4">
                <input
                  type="text"
                  value={nuevoApodo}
                  onChange={e => setNuevoApodo(e.target.value)}
                  placeholder="Tu apodo o nombre..."
                  className="w-full text-center text-base font-black bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors rounded-2xl p-3.5 focus:border-indigo-500 outline-none"
                  autoFocus
                  required
                />

                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => setModalApodoOpen(false)}
                    className="w-1/2 py-3 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button type="submit"
                    disabled={guardandoApodo || !nuevoApodo.trim()}
                    className="w-1/2 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg disabled:opacity-50 transition cursor-pointer"
                  >
                    {guardandoApodo ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
