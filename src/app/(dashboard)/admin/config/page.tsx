'use client';

import React, { useEffect, useState } from 'react';
import { SedeFeatureToggles, obtenerConfiguracionSede, guardarConfiguracionSede } from '@/services/sedesConfig';
import { 
  Sliders, Settings2, ShieldCheck, Save, Building, Cpu, 
  Receipt, Sparkles, Clock, Palette, Flame, Radio, Check, 
  Layers, RefreshCw 
} from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useAppStore } from '@/store/useAppStore';
import { SKINS_CATALOG, getSkinById, ThemeCategory } from '@/config/themes';
import { motion } from 'framer-motion';

export default function AdminSedeConfigPage() {
  const [toggles, setToggles] = useState<SedeFeatureToggles>({
    moduloLaboratorioGramos: true,
    usarComisionesEscalonadas: true,
    modoEstaciones: 'SEMI_AUTOMATICO_BUZON',
    kioskoAutoservicioHabilitado: true,
    sunatRuc: '',
    sunatRazonSocial: '',
    sunatSerieBoleta: 'B001',
    sunatSerieFactura: 'F001',
    sunatApiToken: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSkinCategory, setSelectedSkinCategory] = useState<ThemeCategory>('ANIME_MECHA');
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const { showAlert } = useUIStore();
  const {
    nervProtocolEnabled,
    setNervProtocolEnabled,
    evaTheme,
    setEvaTheme,
    houdiniGlowEnabled,
    setHoudiniGlowEnabled,
    glowOpacity,
    setGlowOpacity,
    primaryColor,
    setPrimaryColor
  } = useThemeStore();

  useEffect(() => {
    cargarConfig();
  }, []);

  const cargarConfig = async () => {
    setLoading(true);
    try {
      const data = await obtenerConfiguracionSede();
      setToggles(data);

      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = await guardarConfiguracionSede(toggles);
      if (ok) {
        showAlert('Configuración quirúrgica guardada correctamente', 'success');
      } else {
        showAlert('Error al guardar configuración', 'error');
      }
    } catch (err: any) {
      showAlert(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectSkin = async (skinId: string) => {
    const skin = getSkinById(skinId);
    if (!skin) return;

    await setNervProtocolEnabled(true, userId);
    await setEvaTheme(skinId, userId);
    showAlert(`¡Skin activado: ${skin.name}!`, 'success');
  };

  const handleRestoreStandardTheme = async () => {
    await setNervProtocolEnabled(false, userId);
    await setEvaTheme('none', userId);
    showAlert('Restaurado tema estándar Vaikuntha', 'info');
  };

  const activeSkin = nervProtocolEnabled && evaTheme !== 'none' ? getSkinById(evaTheme) : null;
  const filteredSkins = SKINS_CATALOG.filter((s) => s.category === selectedSkinCategory);

  if (loading) {
    return <div className="p-8 text-emerald-500 font-medium animate-pulse">Cargando configuración de sede...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 font-sans">
      
      {/* 🛠️ TOP HEADER: GOBERNANZA OPERATIVA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-inner">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Configuración Quirúrgica por Sede
                <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  Feature Toggles
                </span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-0.5 font-medium">
                Gobernanza modular de capacidades operativas, hardware IoT, automatizaciones y facturación SUNAT.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4" /> 
            <span>SuperAdmin Controls</span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2 text-xs disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--active-theme-primary, #10b981)' }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* FORMULARIO DE TOGGLES OPERATIVOS */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Columna Izquierda: Operación & Automatizaciones */}
          <div className="space-y-6">
            
            {/* Card 1: Módulos Operativos & IoT */}
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-sky-500" /> Módulos Operativos & Hardware
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                  Infraestructura
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition">
                  <div className="space-y-0.5 max-w-md">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Módulo de Laboratorio (Pesaje en Gramos)</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Descuenta gramos de tintes y químicos en taller físico.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggles.moduloLaboratorioGramos}
                    onChange={(e) => setToggles(prev => ({ ...prev, moduloLaboratorioGramos: e.target.checked }))}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition">
                  <div className="space-y-0.5 max-w-md">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Balanzas Digitales IoT & Flujo Rápido</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Habilita drivers de pesaje en tiempo real (Bluetooth BLE, WiFi, USB Serial).</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggles.habilitarBalanzasIot ?? true}
                    onChange={(e) => setToggles(prev => ({ ...prev, habilitarBalanzasIot: e.target.checked }))}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition">
                  <div className="space-y-0.5 max-w-md">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Tótem Kiosko de Autoservicio (/kiosk)</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Habilita la interfaz táctil de recepción para check-in de clientes.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggles.kioskoAutoservicioHabilitado}
                    onChange={(e) => setToggles(prev => ({ ...prev, kioskoAutoservicioHabilitado: e.target.checked }))}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Modo de Orquestación de Estaciones de Piso</p>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{toggles.modoEstaciones}</span>
                  </div>
                  <select
                    value={toggles.modoEstaciones}
                    onChange={(e) => setToggles(prev => ({ ...prev, modoEstaciones: e.target.value as any }))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-emerald-400 font-bold outline-none cursor-pointer"
                  >
                    <option value="SEMI_AUTOMATICO_BUZON">📩 Semi-Automático (Buzón de Solicitudes A ➔ B)</option>
                    <option value="AUTOMATICO_IOT">📡 Automático (Web NFC / Balanzas IoT en Tiempo Real)</option>
                    <option value="MANUAL">🖐️ Manual (Asignación Directa de Recepción)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: Automatizaciones & Cronjobs */}
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-amber-500" /> Automatizaciones & Cronjobs Fuera de Horario
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                  Desatendido
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition">
                  <div className="space-y-0.5 max-w-md">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Auto-Aprobación de Asistencia Web NFC</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Registra entrada/salida autónoma con tag NFC fuera de turno.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggles.cronAutoAprobacionNfc ?? true}
                    onChange={(e) => setToggles(prev => ({ ...prev, cronAutoAprobacionNfc: e.target.checked }))}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition">
                  <div className="space-y-0.5 max-w-md">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Auto-Cierre de Órdenes Pre-Cobradas (100%)</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Finaliza y liquida órdenes de noche sin personal de caja.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggles.cronAutoCierreOatcFueraHorario ?? true}
                    onChange={(e) => setToggles(prev => ({ ...prev, cronAutoCierreOatcFueraHorario: e.target.checked }))}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition">
                  <div className="space-y-0.5 max-w-md">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Auto-Reset Diario Nocturno (Midnight Reset)</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Pasa automáticamente a 'FUERA_TURNO' al personal del día anterior.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggles.autoResetDiarioNocturno ?? true}
                    onChange={(e) => setToggles(prev => ({ ...prev, autoResetDiarioNocturno: e.target.checked }))}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Columna Derecha: Plug-ins & Facturación SUNAT */}
          <div className="space-y-6">
            
            {/* Card 3: LuminaHQ Suite */}
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-indigo-500" /> Plug-in LuminaHQ AI Suite
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                  Plug-in Oficial
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-1 max-w-md">
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">Habilitar Suite LuminaHQ en Barra de Navegación</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Despliega los accesos a <strong>LuminaHQ AI Suite</strong> en el Sidebar.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={toggles.pluginLuminaHqActivo || false}
                  onChange={(e) => setToggles(prev => ({ ...prev, pluginLuminaHqActivo: e.target.checked }))}
                  className="w-6 h-6 accent-indigo-600 rounded cursor-pointer shrink-0"
                />
              </div>
            </div>

            {/* Card 4: Facturación Fiscal SUNAT */}
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Receipt className="w-5 h-5 text-purple-500" /> Configuración Fiscal SUNAT (Multi-RUC)
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                  Tributario
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">RUC de Sede</label>
                  <input
                    type="text"
                    value={toggles.sunatRuc || ''}
                    onChange={(e) => setToggles(prev => ({ ...prev, sunatRuc: e.target.value }))}
                    placeholder="20601234567"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Razón Social</label>
                  <input
                    type="text"
                    value={toggles.sunatRazonSocial || ''}
                    onChange={(e) => setToggles(prev => ({ ...prev, sunatRazonSocial: e.target.value }))}
                    placeholder="Vaikuntha Salon & Spa S.A.C."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Serie Boletas (B001)</label>
                  <input
                    type="text"
                    value={toggles.sunatSerieBoleta || 'B001'}
                    onChange={(e) => setToggles(prev => ({ ...prev, sunatSerieBoleta: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Serie Facturas (F001)</label>
                  <input
                    type="text"
                    value={toggles.sunatSerieFactura || 'F001'}
                    onChange={(e) => setToggles(prev => ({ ...prev, sunatSerieFactura: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer active:scale-98"
              style={{ backgroundColor: 'var(--active-theme-primary, #10b981)' }}
            >
              <Save className="w-5 h-5" />
              {saving ? 'Guardando Configuración...' : 'Guardar Permisos Quirúrgicos de Sede'}
            </button>

          </div>

        </div>
      </form>

      {/* ========================================================================= */}
      {/* 🧬 GOBERNANZA VISUAL & CATÁLOGO DE SKINS DEL SISTEMA (SUPERADMIN)        */}
      {/* ========================================================================= */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-500">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Gobernanza Visual & Catálogo de Skins
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  Global Themes
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Administra los skins temáticos (Evangelion NERV, Cyberpunk, Matrix) y efectos avanzados CSS Houdini.
              </p>
            </div>
          </div>

          {activeSkin && (
            <button
              type="button"
              onClick={handleRestoreStandardTheme}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs border border-slate-300 dark:border-slate-700 transition cursor-pointer flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restaurar Tema Estándar Vaikuntha</span>
            </button>
          )}
        </div>

        {/* CONTROLES DE EFECTOS VISUALES HOUDINI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-indigo-500 animate-pulse" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Bordes Giratorios Dual Neón (CSS Houdini @property)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHoudiniGlowEnabled(!houdiniGlowEnabled, userId)}
                className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                  houdiniGlowEnabled
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                {houdiniGlowEnabled ? 'Efecto Activado' : 'Desactivado'}
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                <span>Intensidad de Resplandor Glow</span>
                <span className="font-mono text-indigo-500 font-black">{Math.round(glowOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.9"
                step="0.05"
                value={glowOpacity}
                onChange={(e) => setGlowOpacity(parseFloat(e.target.value), userId)}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>Sutil (20%)</span>
                <span>Equilibrado (60%)</span>
                <span>Intenso Neón (90%)</span>
              </div>
            </div>
          </div>

          {/* TELEMETRÍA PREVIEW */}
          <div
            className={`p-6 rounded-3xl flex flex-col justify-between space-y-3 relative ${
              houdiniGlowEnabled ? 'card-glow-animated bg-slate-950 text-white shadow-2xl' : 'bg-slate-900 border border-slate-800 text-white shadow-xl'
            }`}
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-black uppercase">Telemetría Activa</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {activeSkin?.syncRate || '100%'}
              </span>
            </div>
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Skin en Uso:</span>
              <h4 className="text-base font-black text-white">{activeSkin?.name || 'Vaikuntha Estándar'}</h4>
              <p className="text-xs text-slate-300 font-medium">{activeSkin?.pilotOrSubtitle || 'Paleta Base del Sistema'}</p>
            </div>
          </div>
        </div>

        {/* PESTAÑAS DE CATEGORÍA DE SKINS */}
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-hide">
            {(
              [
                { id: 'ANIME_MECHA', label: '🧬 Anime & Mecha (Evangelion)' },
                { id: 'GAMING_CYBERPUNK', label: '⚡ Gaming & Cyberpunk' },
                { id: 'MINIMAL_LUXURY', label: '💎 Minimal Luxury' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedSkinCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedSkinCategory === cat.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* GRID DE SKINS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSkins.map((skin) => {
              const isCurrent = evaTheme === skin.id && nervProtocolEnabled;
              return (
                <div
                  key={skin.id}
                  onClick={() => handleSelectSkin(skin.id)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 relative ${
                    isCurrent
                      ? 'border-purple-500 bg-purple-500/10 dark:bg-purple-950/30 shadow-xl ring-2 ring-purple-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-purple-400/50 hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                        {skin.typeBadge}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                        {skin.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {skin.pilotOrSubtitle}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="p-1 rounded-full bg-purple-600 text-white shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {skin.description}
                  </p>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400">Paleta:</span>
                    <div className="flex gap-1.5">
                      <div className="w-5 h-5 rounded-full border border-black/20" style={{ backgroundColor: skin.palette.primary }} title="Primario" />
                      <div className="w-5 h-5 rounded-full border border-black/20" style={{ backgroundColor: skin.palette.accent }} title="Acento" />
                      <div className="w-5 h-5 rounded-full border border-black/20" style={{ backgroundColor: skin.palette.dark }} title="Oscuro" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
