'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Star, Trophy, Award, ShoppingBag, ChevronRight, Sparkles, X, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { obtenerPerfilCliente, obtenerRecompensasCliente, canjearRecompensa, CLIENTE_BADGES, ClienteGamProfile } from '@/lib/gamification/clientEngine';
import { getNivelPorXP } from '@/lib/gamification/config';

interface Reward {
  id: string;
  nombre: string;
  descripcion: string;
  costo_monedas: number;
  imagen_url?: string;
  stock: number;
}

export default function ClientePortalPage() {
  const searchParams = useSearchParams();
  const clienteId = searchParams.get('id');

  const [cliente, setCliente] = useState<any>(null);
  const [profile, setProfile] = useState<ClienteGamProfile | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [activeTab, setActiveTab] = useState<'inicio' | 'recompensas' | 'badges'>('inicio');
  const [isLoading, setIsLoading] = useState(true);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!clienteId) return;
    cargarDatos();
  }, [clienteId]);

  const cargarDatos = async () => {
    if (!clienteId) return;
    setIsLoading(true);

    // Obtener datos del cliente
    const { data: clienteData } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .single();

    if (clienteData) setCliente(clienteData);

    // Obtener perfil de gamificación
    const gamProfile = await obtenerPerfilCliente(clienteId);
    if (gamProfile) setProfile(gamProfile);

    // Obtener recompensas disponibles
    const rewardsList = await obtenerRecompensasCliente();
    setRewards(rewardsList);

    setIsLoading(false);
  };

  const handleCanjear = async () => {
    if (!selectedReward || !profile) return;
    const ok = await canjearRecompensa(profile.id, selectedReward.id, selectedReward.costo_monedas, profile.monedas);
    if (ok) {
      setRedeemSuccess(true);
      setTimeout(() => {
        setRedeemSuccess(false);
        setShowRedeemModal(false);
        setSelectedReward(null);
        cargarDatos();
      }, 2000);
    }
  };

  const nivelInfo = profile ? getNivelPorXP(profile.xp_total) : null;

  if (!clienteId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-8">
        <Sparkles className="w-12 h-12 text-purple-400 mb-4" />
        <h1 className="text-xl font-black">Portal de Fidelidad</h1>
        <p className="text-sm text-slate-400 mt-2 text-center">
          Escanea el código QR proporcionado por el salón para acceder a tu perfil de fidelidad.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Sparkles className="w-8 h-8 text-purple-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 select-none font-sans">
      
      {/* Hero Header con Nivel y Puntos */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        
        <div className="relative z-10 px-6 pt-10 pb-8 text-center space-y-4">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 mx-auto rounded-3xl bg-white/10 backdrop-blur-xl border-2 border-white/20 flex items-center justify-center shadow-2xl"
          >
            <span className="text-4xl font-black text-white">
              {cliente?.nombre?.charAt(0) || '?'}
            </span>
          </motion.div>

          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              {cliente?.nombre || 'Cliente'}
            </h1>
            <p className="text-sm text-purple-200 font-medium mt-1">
              ⭐ {nivelInfo?.titulo || 'Novato'} • Nivel {nivelInfo?.nivel || 1}
            </p>
          </div>

          {/* XP Progress Bar */}
          <div className="max-w-xs mx-auto">
            <div className="flex justify-between text-[10px] text-purple-200 font-bold mb-1">
              <span>{profile?.xp_total || 0} XP</span>
              <span>{nivelInfo?.xpParaSiguiente || 100} XP</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-xl">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${nivelInfo?.progreso || 0}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-full shadow-lg shadow-amber-400/30"
              />
            </div>
          </div>

          {/* Stats Rápidos */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/10">
              <p className="text-xl font-black text-white">{profile?.visitas_total || 0}</p>
              <p className="text-[10px] text-purple-200 font-bold uppercase">Visitas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/10">
              <p className="text-xl font-black text-amber-300">💎 {profile?.monedas || 0}</p>
              <p className="text-[10px] text-purple-200 font-bold uppercase">Monedas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/10">
              <p className="text-xl font-black text-white">{profile?.badges?.length || 0}</p>
              <p className="text-[10px] text-purple-200 font-bold uppercase">Insignias</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800">
        <div className="grid grid-cols-3 p-1.5 mx-4 my-2 bg-slate-900 rounded-2xl">
          {[
            { id: 'inicio' as const, label: 'Inicio', icon: Star },
            { id: 'recompensas' as const, label: 'Canjear', icon: Gift },
            { id: 'badges' as const, label: 'Insignias', icon: Award },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        
        {/* TAB: INICIO */}
        {activeTab === 'inicio' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Mensaje de Bienvenida */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-5 shadow-xl">
              <h2 className="text-sm font-black text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> ¡Bienvenido a tu programa de fidelidad!
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cada vez que nos visitas ganas puntos de experiencia y monedas 💎 que puedes canjear por premios exclusivos. 
                ¡Sigue acumulando para subir de nivel!
              </p>
            </div>

            {/* Próximo Nivel */}
            {nivelInfo && nivelInfo.nivel < 20 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">PRÓXIMO NIVEL</span>
                  <span className="text-xs font-black text-indigo-400">
                    {nivelInfo.xpActualEnNivel} / {nivelInfo.xpTotalNivel} XP
                  </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${nivelInfo.progreso}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Te faltan <span className="font-black text-purple-400">{nivelInfo.xpTotalNivel - nivelInfo.xpActualEnNivel} XP</span> para llegar a {getNivelPorXP(nivelInfo.xpParaSiguiente).titulo}
                </p>
              </div>
            )}

            {/* Cómo Ganar Puntos */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> CÓMO GANAR PUNTOS
              </h3>
              <div className="space-y-2">
                {[
                  { emoji: '💇', label: 'Servicio completado', xp: '+30 XP' },
                  { emoji: '🌟', label: 'Primera visita', xp: '+50 XP' },
                  { emoji: '👫', label: 'Referir un amigo', xp: '+100 XP' },
                  { emoji: '⭐', label: 'Dejar una reseña', xp: '+20 XP' },
                  { emoji: '🛍️', label: 'Comprar un producto', xp: '+10 XP' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.emoji}</span>
                      <span className="text-xs font-bold text-slate-300">{item.label}</span>
                    </div>
                    <span className="text-xs font-black text-emerald-400">{item.xp}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB: RECOMPENSAS / MARKETPLACE */}
        {activeTab === 'recompensas' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-400" /> MARKETPLACE
              </h2>
              <span className="text-xs font-black text-amber-400">💎 {profile?.monedas || 0} monedas</span>
            </div>

            {rewards.length === 0 ? (
              <div className="bg-slate-900/60 border border-dashed border-slate-800 p-8 rounded-3xl text-center space-y-2">
                <span className="text-3xl block">🎁</span>
                <p className="text-xs text-slate-400 font-medium">Aún no hay recompensas disponibles.</p>
                <p className="text-[10px] text-slate-500">El administrador agregará premios próximamente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rewards.map(reward => {
                  const canAfford = (profile?.monedas || 0) >= reward.costo_monedas;
                  return (
                    <button
                      key={reward.id}
                      onClick={() => {
                        setSelectedReward(reward);
                        setShowRedeemModal(true);
                      }}
                      disabled={!canAfford}
                      className={`w-full p-4 rounded-3xl border shadow-xl text-left transition-all active:scale-[0.98] ${
                        canAfford
                          ? 'bg-slate-900 border-slate-700 hover:border-purple-500/50'
                          : 'bg-slate-900/50 border-slate-800 opacity-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1">
                          <h4 className="text-sm font-black text-white">{reward.nombre}</h4>
                          <p className="text-[11px] text-slate-400">{reward.descripcion}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl shrink-0">
                          <span className="text-sm font-black text-amber-400">💎 {reward.costo_monedas}</span>
                        </div>
                      </div>
                      {canAfford && (
                        <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-purple-400">
                          Toca para canjear <ChevronRight className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB: BADGES */}
        {activeTab === 'badges' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 px-1">
              <Award className="w-4 h-4 text-amber-400" /> MIS INSIGNIAS DE FIDELIDAD
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {CLIENTE_BADGES.map(badge => {
                const earned = profile?.badges?.includes(badge.id);
                return (
                  <motion.div
                    key={badge.id}
                    whileTap={{ scale: 0.95 }}
                    className={`p-4 rounded-3xl border shadow-xl text-center space-y-2 ${
                      earned
                        ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-amber-500/30 shadow-amber-500/5'
                        : 'bg-slate-900/50 border-slate-800 opacity-40 grayscale'
                    }`}
                  >
                    <span className="text-3xl block">{badge.icono}</span>
                    <h4 className="text-xs font-black text-white">{badge.nombre}</h4>
                    <p className="text-[10px] text-slate-400">{badge.descripcion}</p>
                    {earned ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Obtenido
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500">
                        🔒 {badge.visitas_req} visitas
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>

      {/* Modal de Confirmación de Canje */}
      <AnimatePresence>
        {showRedeemModal && selectedReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl"
            >
              {redeemSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <span className="text-5xl block">🎉</span>
                  </motion.div>
                  <h3 className="font-black text-lg text-white">¡Canje Exitoso!</h3>
                  <p className="text-sm text-slate-400">Tu recompensa está pendiente de entrega.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-sm text-white">Confirmar Canje</h3>
                    <button onClick={() => setShowRedeemModal(false)} className="text-slate-400">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <h4 className="font-black text-white">{selectedReward.nombre}</h4>
                    <p className="text-xs text-slate-400">{selectedReward.descripcion}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-sm font-black text-amber-400">💎 {selectedReward.costo_monedas} monedas</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Tu saldo actual:</span>
                    <span className="font-black text-white">💎 {profile?.monedas || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Saldo después del canje:</span>
                    <span className="font-black text-emerald-400">
                      💎 {(profile?.monedas || 0) - selectedReward.costo_monedas}
                    </span>
                  </div>

                  <button
                    onClick={handleCanjear}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition-all"
                  >
                    Confirmar Canje
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
