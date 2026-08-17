'use client';

import React, { useState } from 'react';
import NuevaOATC from '@/components/recepcion/NuevaOATC';
import QueueMonitor from '@/components/recepcion/QueueMonitor';
import ActiveOATCsTable from '@/components/recepcion/ActiveOATCsTable';
import ColaboradorDetalleCard from '@/components/recepcion/ColaboradorDetalleCard';
import { DesktopWindow, WindowState } from '@/components/ui/DesktopWindow';
import { DesktopTaskbar } from '@/components/ui/DesktopTaskbar';
import { Agente } from '@/services/recepcion';
import { MetricCard } from '@/components/ui/watermelon-patterns/metric-card';
import { Users, Clock, Layers, Sparkles, Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

interface ExtendedWindowState extends WindowState {
  type: 'OATC' | 'AGENTE';
  agenteData?: Agente;
}

export default function RecepcionPage() {
  const [windows, setWindows] = useState<ExtendedWindowState[]>([]);
  const [topZIndex, setTopZIndex] = useState(100);

  // Abrir nueva ventana de borrador de orden
  const abrirNuevaVentanaOATC = () => {
    const nextIndex = windows.filter(w => w.type === 'OATC').length + 1;
    const newZ = topZIndex + 1;
    setTopZIndex(newZ);

    const cascadeOffset = (windows.length % 5) * 35;
    const initialX = Math.max(20, Math.min(typeof window !== 'undefined' ? window.innerWidth / 2 - 260 + cascadeOffset : 100, 700));
    const initialY = Math.max(90, 110 + cascadeOffset);

    const newWin: ExtendedWindowState = {
      id: `oatc_draft_${Date.now()}`,
      type: 'OATC',
      title: `Orden #${nextIndex}`,
      clientLabel: '',
      isMinimized: false,
      isMaximized: false,
      zIndex: newZ,
      position: { x: initialX, y: initialY }
    };

    setWindows((prev) => [...prev, newWin]);
  };

  // Abrir ventana de detalle de colaborador (STAFF o SOPORTE)
  const abrirVentanaAgente = (agente: Agente) => {
    const existing = windows.find(w => w.id === `agente_${agente.id}`);
    if (existing) {
      handleFocusWindow(existing.id);
      return;
    }

    const newZ = topZIndex + 1;
    setTopZIndex(newZ);

    const cascadeOffset = (windows.length % 5) * 35;
    const initialX = Math.max(20, Math.min(typeof window !== 'undefined' ? window.innerWidth / 2 - 240 + cascadeOffset : 150, 700));
    const initialY = Math.max(90, 120 + cascadeOffset);

    const newWin: ExtendedWindowState = {
      id: `agente_${agente.id}`,
      type: 'AGENTE',
      title: `${agente.nombre}`,
      clientLabel: agente.rol || 'STAFF',
      agenteData: agente,
      isMinimized: false,
      isMaximized: false,
      zIndex: newZ,
      position: { x: initialX, y: initialY }
    };

    setWindows((prev) => [...prev, newWin]);
  };

  const handleCloseWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  };

  const handleMinimizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
  };

  const handleMaximizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  };

  const handleFocusWindow = (id: string) => {
    const newZ = topZIndex + 1;
    setTopZIndex(newZ);
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, zIndex: newZ, isMinimized: false } : w
      )
    );
  };

  const handleToggleFromTaskbar = (id: string) => {
    const target = windows.find((w) => w.id === id);
    if (!target) return;

    if (target.isMinimized) {
      handleFocusWindow(id);
    } else {
      handleMinimizeWindow(id);
    }
  };

  const handleClientSelected = (windowId: string, clientName: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === windowId
          ? { ...w, clientLabel: clientName ? clientName : '' }
          : w
      )
    );
  };

  return (
    <div className="relative p-6 lg:p-8 h-full bg-slate-50/50 dark:bg-slate-950/50 min-h-[calc(100vh-4rem)] pb-24">
      
      {/* Header Recepción */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Workspace de Recepción
            <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
              Escritorio Multitarea
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Gestiona la llegada de clientes y abre múltiples borradores de órdenes simultáneamente.
          </p>
        </div>

        <button
          onClick={abrirNuevaVentanaOATC}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nueva Orden (Escritorio)</span>
        </button>
      </div>

      {/* 📊 Métricas Rápidas Estilo Watermelon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Atenciones en Curso"
          value={12}
          icon={<Layers className="w-4 h-4 text-indigo-500" />}
          badge="Tiempo Real"
          badgeColor="bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
          trend={{ value: 8.5, label: 'vs ayer', isPositive: true }}
        />
        <MetricCard
          title="Staff en Piso Activo"
          value={8}
          icon={<Users className="w-4 h-4 text-emerald-500" />}
          badge="WFM Online"
          badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
        />
        <MetricCard
          title="Tiempo Promedio Atención"
          value={32}
          suffix=" min"
          decimals={0}
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          badge="Eficiencia"
          badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/30"
          trend={{ value: -4.2, label: 'más ágil', isPositive: true }}
        />
      </div>

      {/* Grid Principal */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Columna Izquierda (30%): Monitor de Disponibilidad */}
        <div className="w-full lg:w-[30%]">
          <QueueMonitor onSelectAgente={abrirVentanaAgente} />
        </div>

        {/* Columna Derecha (70%): Gestión de Atenciones Activas */}
        <div className="w-full lg:w-[70%] flex flex-col gap-6">
          <ActiveOATCsTable onGenerarOrden={abrirNuevaVentanaOATC} />
        </div>
      </div>

      {/* Ventanas Flotantes de Escritorio Multitarea */}
      <AnimatePresence>
        {windows.map((win) => (
          <DesktopWindow
            key={win.id}
            window={win}
            onClose={handleCloseWindow}
            onMinimize={handleMinimizeWindow}
            onMaximize={handleMaximizeWindow}
            onFocus={handleFocusWindow}
          >
            {win.type === 'OATC' ? (
              <NuevaOATC
                onClose={() => handleCloseWindow(win.id)}
                onClientSelected={(clientName) => handleClientSelected(win.id, clientName)}
                onCreatedSuccess={() => handleCloseWindow(win.id)}
              />
            ) : win.agenteData ? (
              <ColaboradorDetalleCard
                agente={win.agenteData}
                onClose={() => handleCloseWindow(win.id)}
              />
            ) : null}
          </DesktopWindow>
        ))}
      </AnimatePresence>

      {/* Barra de Tareas / Dock de Borradores en la parte inferior */}
      <DesktopTaskbar
        windows={windows}
        onToggleWindow={handleToggleFromTaskbar}
        onNewWindow={abrirNuevaVentanaOATC}
      />
    </div>
  );
}
