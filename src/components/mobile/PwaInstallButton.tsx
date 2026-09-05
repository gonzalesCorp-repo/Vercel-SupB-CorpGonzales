'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, CheckCircle2, Share2, PlusSquare, 
  X, Zap, Bell, ShieldCheck, Laptop, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { resolveBrand } from '@/lib/branding/brandsConfig';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallButton() {
  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const brand = resolveBrand(sedeActiva?.id);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);

      // Detectar dispositivo iOS
      const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIos(isIosDevice);

      // Capturar evento nativo antes de la instalación
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setIsModalOpen(false);
        setInstallSuccess(true);
      });

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleTriggerNativeInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setIsModalOpen(false);
          setInstallSuccess(true);
        }
      } catch (err) {
        console.error('Error al invocar instalación PWA:', err);
      } finally {
        setDeferredPrompt(null);
      }
    }
  };

  if (isInstalled || installSuccess) {
    return (
      <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-300">
        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
        <div>
          <p className="text-xs font-bold flex items-center gap-1.5">
            <span>App de {brand.shortName} Instalada</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded-full font-black">
              Modo Nativo
            </span>
          </p>
          <p className="text-[11px] opacity-80 mt-0.5">
            Estás ejecutando la aplicación oficial en tu escritorio o pantalla de inicio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Tarjeta de Entrada al Instalador */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-3 transition-colors duration-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-slate-700/80 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brand.icon192} alt={brand.name} className="w-full h-full object-cover rounded-xl" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                Instalar App de {brand.shortName}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Acceso directo oficial, pantalla completa y alta velocidad
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
        </div>
      </div>

      {/* Modal / Dialog de Instalación Estética */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            {/* Backdrop click dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 cursor-pointer"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 space-y-5 p-6"
            >
              {/* Header con Botón de Cierre */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-slate-800 p-1.5 flex items-center justify-center shadow-xl shadow-indigo-500/10 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={brand.icon192} alt={brand.name} className="w-full h-full object-cover rounded-xl" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 inline-block mb-1">
                      PWA Certificada
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {brand.name}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Beneficios de la Aplicación */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Ventana Dedicada & Máxima Fluidez</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sin barras del navegador ni pestañas; optimizada para pantallas táctiles y estaciones de trabajo.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Alertas Sonoras en Tiempo Real</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sincronización instantánea con el mostrador y aviso sonoro de órdenes asignadas en piso.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">100% Segura & Cero Almacenamiento</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Acceso directo ultra liviano y siempre actualizado a la última versión sin descargas de tiendas externas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de Acción o Guía Visual Adaptativa */}
              <div className="space-y-2 pt-1">
                {deferredPrompt ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleTriggerNativeInstall}
                      className="w-full py-3.5 px-5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-98 text-white font-black text-xs rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Instalar Aplicación Oficial</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 leading-tight">
                      Tu navegador te mostrará una confirmación rápida del sistema operativo para registrar el acceso directo.
                    </p>
                  </div>
                ) : isIos ? (
                  <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                    <p className="font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                      <Share2 className="w-4 h-4" /> Instalación en iPhone / iPad (Safari):
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      <li>Toca el botón <strong>Compartir</strong> (<Share2 className="w-3.5 h-3.5 inline text-indigo-500" />) en la barra inferior.</li>
                      <li>Desliza hacia abajo y pulsa <strong className="text-indigo-600 dark:text-indigo-400">"Agregar a pantalla de inicio"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-indigo-500" />).</li>
                      <li>Confirma pulsando <strong>"Agregar"</strong> en la esquina superior.</li>
                    </ol>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                    <p className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <Laptop className="w-4 h-4 text-indigo-500" /> Instalación en Navegador de Escritorio:
                    </p>
                    <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      <li className="flex items-start gap-2">
                        <span className="font-black text-indigo-500">1.</span>
                        <span>Haz clic en el ícono de instalación <strong>(🖥️ o 📥)</strong> ubicado a la derecha en la barra de direcciones de tu navegador.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-black text-indigo-500">2.</span>
                        <span>O abre el menú <strong>(⋮)</strong> de tu navegador ➔ <strong>Guardar y compartir</strong> ➔ <strong>"Instalar {brand.shortName}"</strong>.</span>
                      </li>
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
