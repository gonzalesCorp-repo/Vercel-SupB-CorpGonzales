'use client';

import React, { useState, useEffect, useCallback } from 'react';
import NuevaOATC from '@/components/recepcion/NuevaOATC';
import QueueMonitor from '@/components/recepcion/QueueMonitor';
import ActiveOATCsTable from '@/components/recepcion/ActiveOATCsTable';
import ColaboradorDetalleCard from '@/components/recepcion/ColaboradorDetalleCard';
import { ProximityRadarModal } from '@/components/recepcion/ProximityRadarModal';
import { GoogleDriveExplorerModal } from '@/components/drive/GoogleDriveExplorerModal';
import { DesktopWindow, WindowState } from '@/components/ui/DesktopWindow';
import { DesktopTaskbar } from '@/components/ui/DesktopTaskbar';
import { Agente, obtenerAgentesDisponibles } from '@/services/recepcion';
import { AnimatedNumber } from '@/components/ui/motion-primitives/animated-number';
import { Users, Clock, Layers, Plus, RefreshCw, Activity, HardDrive } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { createClient } from '@/lib/supabase/client';

interface ExtendedWindowState extends WindowState {
  type: 'OATC' | 'AGENTE';
  agenteData?: Agente;
}

export default function RecepcionPage() {
  const [windows, setWindows] = useState<ExtendedWindowState[]>([]);
  const [topZIndex, setTopZIndex] = useState(100);
  const [driveOpen, setDriveOpen] = useState(false);
  
  // Métricas en Vivo conectadas a la base de datos real
  const [metrics, setMetrics] = useState({
    atencionesEnCurso: 0,
    staffEnPiso: 0,
    tiempoPromedioMin: 0,
    loading: true
  });

  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const supabase = createClient();

  const fetchLiveMetrics = useCallback(async () => {
    if (!sedeActiva?.id) return;
    try {
      const [resOatc, agentes] = await Promise.all([
        supabase
          .from('oatc')
          .select('id, estado_proceso, hora_inicio_atencion, created_at')
          .eq('sede_id', sedeActiva.id)
          .in('estado_proceso', ['EN_ESPERA', 'ASESORIA', 'EN_PROCESO', 'EN_EXPOSICION']),
        obtenerAgentesDisponibles()
      ]);

      const oatcsActivas = resOatc.data || [];
      const atencionesCount = oatcsActivas.length;

      // Staff presente en turno (no fuera de turno)
      const staffPresente = (agentes || []).filter(
        (a: Agente) => a.estadoOperativo && a.estadoOperativo !== 'FUERA_DE_TURNO'
      ).length;

      // Tiempo promedio de atención en minutos de las órdenes activas
      let totalMin = 0;
      let count = 0;
      oatcsActivas.forEach((o: any) => {
        const inicio = o.hora_inicio_atencion || o.created_at;
        if (inicio) {
          const diffMin = Math.max(1, Math.floor((Date.now() - new Date(inicio).getTime()) / (1000 * 60)));
          totalMin += diffMin;
          count++;
        }
      });
      const avgMin = count > 0 ? Math.round(totalMin / count) : 0;

      setMetrics({
        atencionesEnCurso: atencionesCount,
        staffEnPiso: staffPresente,
        tiempoPromedioMin: avgMin,
        loading: false
      });
    } catch (e) {
      console.error('Error al obtener métricas en vivo de recepción:', e);
    }
  }, [sedeActiva?.id]);

  useEffect(() => {
    fetchLiveMetrics();
    const interval = setInterval(fetchLiveMetrics, 15000);

    const channel = supabase
      .channel(`recepcion_kpis_${sedeActiva?.id || 'default'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => fetchLiveMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asistencias_turnos' }, () => fetchLiveMetrics())
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchLiveMetrics, sedeActiva?.id]);

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
    <div className="relative p-4 sm:p-6 lg:p-7 h-full bg-slate-50/50 dark:bg-slate-950/50 min-h-[calc(100vh-4rem)] pb-24">
      
      {/* Header Compacto de Recepción */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Workspace de Recepción
            <span className="text-[11px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              Escritorio Multitarea
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Control de flujo en piso, asignación de turnos y emisión de órdenes en tiempo real.
          </p>
        </div>

        <button
          onClick={abrirNuevaVentanaOATC}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nueva Orden (Escritorio)</span>
        </button>
      </div>

      {/* 📊 Barra de Métricas en Vivo Ultra-Compacta (Live Status Strip) */}
      <div className="mb-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-2.5 sm:px-4 shadow-sm backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 sm:gap-7 flex-wrap">
          
          {/* Métrica 1: Atenciones en Curso */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 block tracking-wider">
                Atenciones en Curso
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-slate-900 dark:text-white">
                  <AnimatedNumber value={metrics.atencionesEnCurso} decimals={0} />
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  En Vivo
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Métrica 2: Staff en Piso Activo */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 block tracking-wider">
                Staff en Piso Activo
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-slate-900 dark:text-white">
                  <AnimatedNumber value={metrics.staffEnPiso} decimals={0} />
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  WFM
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Métrica 3: Tiempo Promedio */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 block tracking-wider">
                Tiempo Promedio Actual
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-slate-900 dark:text-white">
                  <AnimatedNumber value={metrics.tiempoPromedioMin} decimals={0} suffix=" min" />
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {metrics.tiempoPromedioMin > 45 ? 'Elevado' : 'Ágil'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón de Google Drive Cloud */}
          <button
            type="button"
            onClick={() => setDriveOpen(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
            title="Explorador Multimedia de Google Drive"
          >
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Google Drive</span>
          </button>

          {/* Botón de recarga sutil */}
          <button
            onClick={fetchLiveMetrics}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Actualizar métricas en vivo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${metrics.loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid Principal: Monitor de Disponibilidad y Atenciones Activas en Primer Plano */}
      <div className="flex flex-col lg:flex-row gap-5">
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

      {/* Radar de Proximidad Bidireccional en Tiempo Real (GPS Geofence + BLE Beacons) */}
      <ProximityRadarModal
        sedeId={sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f'}
        onPreAsignarOatc={() => abrirNuevaVentanaOATC()}
      />

      {/* Explorador Multimedia Embebido de Google Drive */}
      <GoogleDriveExplorerModal
        isOpen={driveOpen}
        onClose={() => setDriveOpen(false)}
        entidadTipo="SEDE"
        entidadNombre={sedeActiva?.nombre || 'Sede San Isidro'}
      />
    </div>
  );
}
