'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, CheckCircle2, Share2, PlusSquare } from 'lucide-react';
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
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya está instalada / en modo standalone
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);

      // Detectar iOS
      const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIos(isIosDevice);

      // 2. Capturar evento de instalación nativo de Android
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      });

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosInstructions(!showIosInstructions);
    } else {
      // Fallback para navegadores que no emiten beforeinstallprompt
      alert(`Para instalar la app de ${brand.shortName}: presiona el menú de 3 puntos de tu navegador (⋮) y selecciona "Agregar a la pantalla principal" o "Instalar aplicación".`);
    }
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        <div>
          <p className="text-xs font-bold">App de {brand.shortName} Instalada</p>
          <p className="text-[11px] opacity-80">Estás ejecutando la aplicación nativa en tu pantalla de inicio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-3 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.icon192} alt={brand.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              Instalar App de {brand.shortName}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Acceso directo con logo oficial en tu pantalla de inicio
            </p>
          </div>
        </div>

        <button onClick={handleInstallClick}
          className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5" /> Instalar
        </button>
      </div>

      {showIosInstructions && (
        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1 animate-in fade-in">
          <p className="font-bold flex items-center gap-1">
            <Share2 className="w-3.5 h-3.5 text-indigo-500" /> En iPhone / iPad (Safari):
          </p>
          <p>1. Toca el botón <strong>Compartir</strong> en la barra inferior.</p>
          <p>2. Desliza hacia abajo y selecciona <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400"><PlusSquare className="w-3 h-3" /> Agregar a pantalla de inicio</span>.</p>
        </div>
      )}
    </div>
  );
}
