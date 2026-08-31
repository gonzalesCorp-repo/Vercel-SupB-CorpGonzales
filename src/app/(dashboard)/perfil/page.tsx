'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Shield, KeyRound, Palette, MapPin, Volume2, 
  VolumeX, Check, Save, Eye, EyeOff, Sparkles, Moon, Sun, 
  Building2, CheckCircle2, Type, Glasses, ZoomIn, CaseSensitive
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { useThemeStore } from '@/store/useThemeStore';
import { createClient } from '@/lib/supabase/client';

export default function PerfilPage() {
  const [agente, setAgente] = useState<any>(null);
  const { showAlert } = useUIStore();
  const { 
    themeMode, 
    setThemeMode, 
    primaryColor, 
    setPrimaryColor, 
    fontSize, 
    setFontSize,
    fontFamily,
    setFontFamily,
    uppercaseMode,
    setUppercaseMode,
    cargarPreferenciasNube 
  } = useThemeStore();

  const [pin, setPin] = useState('');
  const [mostrarPin, setMostrarPin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sedesList, setSedesList] = useState<{ id: string; nombre: string; codigo?: string }[]>([]);
  const [sedePredeterminada, setSedePredeterminada] = useState<string>('');
  const [liveSoundEnabled, setLiveSoundEnabled] = useState<boolean>(true);

  const supabase = createClient();
  const sedeActiva = useAppStore((state) => state.sedeActiva);

  const colors = [
    { name: 'Índigo Real', value: '#4f46e5' },
    { name: 'Esmeralda Pro', value: '#10b981' },
    { name: 'Violeta Eléctrico', value: '#8b5cf6' },
    { name: 'Rosa Neón', value: '#ec4899' },
    { name: 'Ámbar Cálido', value: '#f59e0b' },
    { name: 'Cian Futurista', value: '#06b6d4' },
  ];

  useEffect(() => {
    async function loadProfile() {
      // 1. Cargar sonido de feed
      const soundPref = localStorage.getItem('vaikuntha_live_feed_sound');
      setLiveSoundEnabled(soundPref !== 'disabled');

      // 2. Cargar sede predeterminada guardada
      const sedePref = localStorage.getItem('vaikuntha_default_sede_id');
      if (sedePref) setSedePredeterminada(sedePref);

      // 3. Cargar lista de sedes reales de Supabase
      const { data: dataSedes } = await supabase.from('sedes').select('id, nombre, codigo');
      if (dataSedes) setSedesList(dataSedes);

      // 4. Cargar agente activo
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('vaikuntha_user_email') : null);

      if (userEmail) {
        const { data } = await supabase.from('agentes').select('*').eq('email', userEmail).maybeSingle();
        if (data) {
          setAgente(data);
          if (data.pin) setPin(data.pin);
          await cargarPreferenciasNube(data.id);
        }
      }
    }
    loadProfile();
  }, []);

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agente?.id) return;
    if (pin.length !== 4) {
      showAlert('El PIN debe tener exactamente 4 dígitos', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('agentes').update({ pin }).eq('id', agente.id);
      if (error) throw error;
      showAlert('PIN de seguridad actualizado correctamente', 'success');
      setAgente({ ...agente, pin });
    } catch (err: any) {
      showAlert(`Error al guardar PIN: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSedePredeterminada = (sedeId: string) => {
    setSedePredeterminada(sedeId);
    if (typeof window !== 'undefined') {
      if (sedeId) {
        localStorage.setItem('vaikuntha_default_sede_id', sedeId);
      } else {
        localStorage.removeItem('vaikuntha_default_sede_id');
      }
    }
    showAlert('Sede predeterminada guardada en este dispositivo', 'success');
  };

  const handleToggleLiveSound = () => {
    const nextVal = !liveSoundEnabled;
    setLiveSoundEnabled(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vaikuntha_live_feed_sound', nextVal ? 'enabled' : 'disabled');
    }
    showAlert(nextVal ? 'Sonido de Live Feed activado' : 'Sonido de Live Feed silenciado', 'info');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 font-sans animate-in fade-in duration-300">
      
      {/* 👤 TARJETA DE IDENTIDAD DEL COLABORADOR */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        <motion.div 
          variants={itemVariants} 
          className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 text-2xl font-black shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {agente?.nombre?.charAt(0) || <User className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {agente?.nombre || 'Colaborador Vaikuntha'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {agente?.email || 'usuario@vaikuntha.pe'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span 
                  className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-xs"
                  style={{ backgroundColor: `${primaryColor}15`, color: primaryColor, borderColor: `${primaryColor}30` }}
                >
                  ROL: {agente?.rol || 'STAFF'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ACTIVO
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 w-full md:w-auto">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Sede en Operación</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                {sedeActiva?.nombre || 'Unidad de Prueba (Sandbox)'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* GRID DE AJUSTES: PIN + APARIENCIA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 🔑 Seguridad PIN */}
          <motion.div variants={itemVariants} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">Seguridad PIN</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setMostrarPin(!mostrarPin)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition rounded-lg cursor-pointer"
                  title={mostrarPin ? 'Ocultar PIN' : 'Ver PIN'}
                >
                  {mostrarPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Tu clave de 4 dígitos para autorizaciones rápidas, descuentos y cortesías en piso.
              </p>
            </div>

            <form onSubmit={handleSavePin} className="space-y-4">
              <div className="relative">
                <input
                  type={mostrarPin ? 'text' : 'password'}
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full text-3xl tracking-[0.6em] pl-[0.6em] text-center font-black px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition shadow-inner"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isSaving || pin.length !== 4}
                className="w-full flex items-center justify-center gap-2 text-white font-black py-3 px-6 rounded-2xl shadow-lg disabled:opacity-50 transition-all text-xs cursor-pointer active:scale-98"
                style={{ backgroundColor: primaryColor }}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar PIN Operativo</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* 🎨 Personalización de Apariencia */}
          <motion.div variants={itemVariants} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Tema & Apariencia</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Personaliza el modo visual y los colores de acento de tu sesión.
              </p>
            </div>

            <div className="space-y-4">
              {/* Toggle Modo Claro / Oscuro */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {themeMode === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Modo {themeMode === 'dark' ? 'Oscuro' : 'Claro'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark', agente?.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cambiar a {themeMode === 'dark' ? 'Claro' : 'Oscuro'}
                </button>
              </div>

              {/* Selector de Color de Acento */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                  Color de Acento
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((color) => {
                    const isSelected = primaryColor === color.value;
                    return (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setPrimaryColor(color.value, agente?.id)}
                        title={color.name}
                        className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isSelected ? 'scale-110 shadow-lg ring-2 ring-white dark:ring-slate-900' : 'hover:scale-105 opacity-80'
                        }`}
                        style={{ backgroundColor: color.value }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resumen de Ajustes Visuales */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400">Tamaño actual:</span>
                <span className="font-black text-slate-900 dark:text-white capitalize">
                  {fontSize === 'small' ? '14px (Pequeño)' : fontSize === 'normal' ? '16px (Normal)' : fontSize === 'large' ? '18px (Grande)' : fontSize === 'extra-large' ? '20px (Extra Grande)' : '22px (Gigante)'}
                </span>
              </div>
            </div>
          </motion.div>

        </div>

        {/* ♿ ACCESIBILIDAD & LEGIBILIDAD VISUAL */}
        <motion.div 
          variants={itemVariants} 
          className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-6 md:p-8 space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <Glasses className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  Accesibilidad & Legibilidad Visual
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Personaliza el tamaño, la tipografía y transforma el texto a MAYÚSCULAS para una lectura cómoda sin fatiga visual.
              </p>
            </div>

            {/* Switch Rápido: Modo Todo en MAYÚSCULAS */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2 pl-2">
                <CaseSensitive className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                  Todo en MAYÚSCULAS
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUppercaseMode(!uppercaseMode, agente?.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  uppercaseMode
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {uppercaseMode ? 'ACTIVADO' : 'Desactivado'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Control 1: Tamaño de Letra (5 Niveles) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ZoomIn className="w-4 h-4 text-emerald-500" />
                  <span>Tamaño de Letra (Zoom UI)</span>
                </label>
                <span className="text-[11px] font-bold text-slate-400">
                  {fontSize === 'small' ? '14px (Pequeño)' : fontSize === 'normal' ? '16px (Normal)' : fontSize === 'large' ? '18px (Grande)' : fontSize === 'extra-large' ? '20px (Extra Grande)' : '22px (Gigante)'}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: 'small', label: '14px', title: 'Pequeño' },
                  { id: 'normal', label: '16px', title: 'Normal' },
                  { id: 'large', label: '18px', title: 'Grande' },
                  { id: 'extra-large', label: '20px', title: 'Extra' },
                  { id: 'huge', label: '22px', title: 'Gigante' },
                ].map((s) => {
                  const isSelected = fontSize === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFontSize(s.id as any, agente?.id)}
                      className={`py-2 px-1 rounded-xl border text-xs font-black transition-all flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'border-transparent text-white shadow-md'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      style={isSelected ? { backgroundColor: primaryColor } : {}}
                    >
                      <span>{s.label}</span>
                      <span className="text-[9px] opacity-75 font-normal">{s.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Control 2: Familia Tipográfica */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-indigo-500" />
                <span>Tipografía del Sistema</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'inter', label: 'Inter (Sans)', desc: 'Moderna y limpia', style: { fontFamily: 'var(--font-inter), sans-serif' } },
                  { id: 'jakarta', label: 'Plus Jakarta', desc: 'Geométrica corporativa', style: { fontFamily: 'var(--font-plus-jakarta), sans-serif' } },
                  { id: 'hyperlegible', label: 'Alta Legibilidad', desc: 'Atkinson (Baja visión)', style: { fontFamily: "'Atkinson Hyperlegible', sans-serif" } },
                  { id: 'mono', label: 'Monoespaciada', desc: 'Cajeros y números', style: { fontFamily: 'ui-monospace, monospace' } },
                ].map((f) => {
                  const isSelected = fontFamily === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFontFamily(f.id as any, agente?.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-transparent text-white shadow-md'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      style={isSelected ? { backgroundColor: primaryColor } : {}}
                    >
                      <span className="block text-xs font-black" style={f.style}>
                        {f.label}
                      </span>
                      <span className="block text-[10px] opacity-75 mt-0.5">
                        {f.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Caja de Vista Previa Interactiva */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Vista Previa en Tiempo Real de Orden de Mostrador</span>
              <span>Ajustes Aplicados</span>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-900 dark:text-white">
                  OATC #1042 — BALAYAGE VIP & CORTE SENIOR
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  S/ 280.00
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Clienta: Mariana Valdez • Estilista: Jean Pierre • Puesto: Sillón #04 • Estado: En Atención
              </p>
            </div>
          </div>

        </motion.div>

        {/* PREFERENCIAS OPERATIVAS: SEDE PREDETERMINADA & SONIDO */}
        <motion.div 
          variants={itemVariants} 
          className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl p-6 md:p-8 space-y-4"
        >
          <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" /> Preferencias Operativas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sede Predeterminada */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Sede Predeterminada al Iniciar
              </label>
              <select
                value={sedePredeterminada}
                onChange={(e) => handleSaveSedePredeterminada(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="">(Auto: Recordar última seleccionada)</option>
                {sedesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.codigo || 'SEDE'})
                  </option>
                ))}
              </select>
            </div>

            {/* Sonidos del Feed */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Alertas Sonoras Live Feed
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Emitir chime ante nuevas órdenes de servicio.
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleLiveSound}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  liveSoundEnabled
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                {liveSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
