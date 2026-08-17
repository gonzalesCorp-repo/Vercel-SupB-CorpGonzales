'use client';

import { useState, useEffect } from 'react';
import { 
  Map, RefreshCw, Scissors, Droplet, User as UserIcon, 
  HelpCircle, Grid, List, Edit3, Save, Plus, Minus, 
  MousePointer2, Sparkles, Armchair, Coffee, Shield, 
  Building2, CheckCircle2, AlertTriangle, Trash2
} from 'lucide-react';
import { 
  obtenerEstacionesPiso, obtenerNivelesPisos, 
  guardarLayoutEstacionesCompleto, EstacionPiso, 
  TipoEstacionPiso, ZonaPiso, NivelPisoInfo 
} from '@/services/wfm';
import { createClient } from '@/lib/supabase/client';
import { MapaPiso2DView } from '@/components/wfm/MapaPiso2DView';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';

export default function WFMPage() {
  const { sedeActiva } = useAppStore();
  const { showAlert } = useUIStore();

  const [estacionesOriginal, setEstacionesOriginal] = useState<EstacionPiso[]>([]);
  const [estacionesLocal, setEstacionesLocal] = useState<EstacionPiso[]>([]);
  const [eliminadosIds, setEliminadosIds] = useState<string[]>([]);
  const [nivelesPisos, setNivelesPisos] = useState<NivelPisoInfo[]>([
    { piso: 1, nombre: 'Piso 1: Salón Principal', totalEstaciones: 0 }
  ]);
  const [pisoActivo, setPisoActivo] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [viewMode, setViewMode] = useState<'mapa2d' | 'lista' | 'grid'>('mapa2d');
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Grid config
  const [gridCols, setGridCols] = useState(12);
  const [gridRows, setGridRows] = useState(10);
  const [selectedTool, setSelectedTool] = useState<string | null>('sillon');

  const supabase = createClient();

  const cargarDatos = async () => {
    if (isEditMode) return; // No sobreescribir si el usuario está dibujando
    setIsLoading(true);
    try {
      const [todasEstaciones, niveles] = await Promise.all([
        obtenerEstacionesPiso(sedeActiva?.id),
        obtenerNivelesPisos(sedeActiva?.id)
      ]);

      setEstacionesOriginal(todasEstaciones);
      setEstacionesLocal(todasEstaciones);
      setEliminadosIds([]);

      if (niveles.length > 0) {
        setNivelesPisos(niveles);
        // Si el piso activo no existe en los niveles, poner el primero
        if (!niveles.some(n => n.piso === pisoActivo)) {
          setPisoActivo(niveles[0].piso);
        }
      }

      // Ajustar dimensiones del grid si hay módulos más alejados
      const estPiso = todasEstaciones.filter(e => (e.piso || 1) === pisoActivo);
      const maxX = Math.max(12, ...estPiso.map(e => e.posicion_x || 1));
      const maxY = Math.max(10, ...estPiso.map(e => e.posicion_y || 1));
      setGridCols(maxX);
      setGridRows(maxY);
    } catch (e) {
      console.error('Error cargando datos WFM:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(() => {
      if (!isEditMode) cargarDatos();
    }, 45000);

    const channel = supabase.channel('realtime-wfm-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estaciones_piso' }, () => {
        if (!isEditMode) cargarDatos();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => {
        if (!isEditMode) cargarDatos();
      })
      .subscribe();
      
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [sedeActiva?.id, isEditMode, pisoActivo]);

  const nivelActualInfo = nivelesPisos.find(n => n.piso === pisoActivo) || {
    piso: pisoActivo,
    nombre: `Piso ${pisoActivo}`,
    totalEstaciones: 0
  };

  // Filtrar estaciones del piso activo
  const estacionesPisoActivo = estacionesLocal.filter(e => (e.piso || 1) === pisoActivo);

  const getTipoIcon = (tipo: string, className = "w-5 h-5") => {
    switch (tipo.toUpperCase()) {
      case 'SILLON': return <Scissors className={className} />;
      case 'LAVADERO': return <Droplet className={className} />;
      case 'MANICURA': return <Sparkles className={className} />;
      case 'CABINA': return <UserIcon className={className} />;
      case 'SALA_ESPERA': return <Armchair className={className} />;
      case 'PARED': return <div className={`bg-slate-800 dark:bg-slate-300 rounded-sm ${className}`} />;
      default: return <HelpCircle className={className} />;
    }
  };

  const mapToolToTipoEstacion = (tool: string): { tipo: TipoEstacionPiso; zona: ZonaPiso; defaultName: string } => {
    switch (tool) {
      case 'sillon':
        return { tipo: 'SILLON', zona: 'ESTILISMO', defaultName: 'Sillón de Corte' };
      case 'lavadero':
        return { tipo: 'LAVADERO', zona: 'HEAD_SPA', defaultName: 'Lavadero Head Spa' };
      case 'manicura':
        return { tipo: 'MANICURA', zona: 'MANICURA', defaultName: 'Mesa Manicura' };
      case 'cabina':
        return { tipo: 'CABINA', zona: 'COSMIATRIA', defaultName: 'Cabina Facial / Spa' };
      case 'lounge':
        return { tipo: 'SALA_ESPERA', zona: 'LOUNGE', defaultName: 'Sala Lounge / Espera' };
      case 'pared':
        return { tipo: 'PARED', zona: 'ESTRUCTURA', defaultName: 'Pared Divisoria' };
      default:
        return { tipo: 'SILLON', zona: 'ESTILISMO', defaultName: 'Estación' };
    }
  };

  // Editor Interactivo en Plano
  const handleCellClick = (x: number, y: number) => {
    if (!isEditMode || !selectedTool) return;
    
    // Verificar si ya hay un módulo en esa coordenada (del piso activo)
    const existingIndex = estacionesLocal.findIndex(
      e => (e.piso || 1) === pisoActivo && e.posicion_x === x && e.posicion_y === y
    );

    if (selectedTool === 'borrador') {
      if (existingIndex >= 0) {
        const itemABorrar = estacionesLocal[existingIndex];
        if (itemABorrar.id && !itemABorrar.id.startsWith('temp-')) {
          setEliminadosIds(prev => [...prev, itemABorrar.id]);
        }
        setEstacionesLocal(prev => prev.filter((_, idx) => idx !== existingIndex));
      }
      return;
    }

    if (selectedTool === 'mouse') return;

    const { tipo, zona, defaultName } = mapToolToTipoEstacion(selectedTool);
    const countMismoTipo = estacionesPisoActivo.filter(e => e.tipo_estacion === tipo).length + 1;
    const nombreGenerado = tipo === 'PARED' ? 'Pared Divisoria' : `${defaultName} #${String(countMismoTipo).padStart(2, '0')}`;

    const nuevaEstacion: EstacionPiso = {
      id: `temp-${Date.now()}-${x}-${y}`,
      sede_id: sedeActiva?.id || null,
      nombre: nombreGenerado,
      tipo_estacion: tipo,
      zona: zona,
      posicion_x: x,
      posicion_y: y,
      estado_ocupacion: 'LIBRE',
      piso: pisoActivo,
      nivel_nombre: nivelActualInfo.nombre
    };

    if (existingIndex >= 0) {
      // Reemplazar celda
      const itemAnterior = estacionesLocal[existingIndex];
      if (itemAnterior.id && !itemAnterior.id.startsWith('temp-')) {
        setEliminadosIds(prev => [...prev, itemAnterior.id]);
      }
      setEstacionesLocal(prev => {
        const copy = [...prev];
        copy[existingIndex] = nuevaEstacion;
        return copy;
      });
    } else {
      // Añadir nueva celda
      setEstacionesLocal(prev => [...prev, nuevaEstacion]);
    }
  };

  const handleGuardarLayout = async () => {
    setIsSaving(true);
    try {
      const itemsPiso = estacionesLocal.filter(e => (e.piso || 1) === pisoActivo);
      const exito = await guardarLayoutEstacionesCompleto({
        items: itemsPiso,
        eliminadosIds,
        sedeId: sedeActiva?.id || null,
        pisoActivo,
        nivelNombreActivo: nivelActualInfo.nombre
      });

      if (exito) {
        showAlert(`¡Layout de ${nivelActualInfo.nombre} guardado y sincronizado con éxito!`, 'success');
        setIsEditMode(false);
        setEliminadosIds([]);
        await cargarDatos();
      } else {
        showAlert('Hubo un problema al persistir el layout en la base de datos.', 'error');
      }
    } catch (err) {
      console.error('Error guardando layout:', err);
      showAlert('Error inesperado al guardar.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCrearNuevoNivel = () => {
    const siguientePiso = Math.max(1, ...nivelesPisos.map(n => n.piso)) + 1;
    const nombreSugerido = prompt(`Ingresa el nombre para el Nivel / Piso ${siguientePiso}:`, `Piso ${siguientePiso}: Zona Especial`);
    if (!nombreSugerido) return;

    const nuevoNivel: NivelPisoInfo = {
      piso: siguientePiso,
      nombre: nombreSugerido,
      totalEstaciones: 0
    };

    setNivelesPisos(prev => [...prev, nuevoNivel]);
    setPisoActivo(siguientePiso);
    showAlert(`Nivel '${nombreSugerido}' creado. Ahora puedes dibujar sus estaciones en el plano.`, 'info');
  };

  const handleRenombrarNivel = () => {
    const nuevoNombre = prompt(`Editar nombre de ${nivelActualInfo.nombre}:`, nivelActualInfo.nombre);
    if (!nuevoNombre || nuevoNombre === nivelActualInfo.nombre) return;

    setNivelesPisos(prev => prev.map(n => n.piso === pisoActivo ? { ...n, nombre: nuevoNombre } : n));
    setEstacionesLocal(prev => prev.map(e => (e.piso || 1) === pisoActivo ? { ...e, nivel_nombre: nuevoNombre } : e));
    showAlert(`Nombre de nivel actualizado a '${nuevoNombre}'. Guarda el layout para persistir.`, 'info');
  };

  // Agrupar para modo Zonas (Lista)
  const zonasMap = estacionesPisoActivo
    .filter(e => e.tipo_estacion !== 'PARED')
    .reduce((acc, item) => {
      const z = item.zona || 'ESTILISMO';
      if (!acc[z]) acc[z] = [];
      acc[z].push(item);
      return acc;
    }, {} as Record<string, EstacionPiso[]>);

  // Matriz visual
  const gridCells = [];
  for (let y = 1; y <= gridRows; y++) {
    for (let x = 1; x <= gridCols; x++) {
      gridCells.push({ x, y });
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* Header WFM & Selector Multi-Piso */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3.5 rounded-2xl text-white shadow-lg shadow-indigo-600/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Mapa WFM Operativo
              </h1>
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-black px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 uppercase">
                Multi-Piso 2D
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualización de distribución espacial, control de ocupación y diseño de estaciones.
            </p>
          </div>
        </div>
        
        {/* Controles de Vistas y Edición */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {!isEditMode && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
              <button 
                onClick={() => setViewMode('mapa2d')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'mapa2d' 
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Map className="w-4 h-4" /> Mapa 2D
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Grid className="w-4 h-4" /> Plano
              </button>
              <button 
                onClick={() => setViewMode('lista')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'lista' 
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <List className="w-4 h-4" /> Zonas ({estacionesPisoActivo.filter(e => e.tipo_estacion !== 'PARED').length})
              </button>
            </div>
          )}

          {isEditMode ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setIsEditMode(false);
                  setEstacionesLocal(estacionesOriginal);
                  setEliminadosIds([]);
                }}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-300 dark:border-slate-700 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleGuardarLayout}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Guardando...' : 'Guardar Layout'}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                setIsEditMode(true);
                setViewMode('grid');
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shadow-md bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white cursor-pointer"
            >
              <Edit3 className="w-4 h-4" /> Editar Plano
            </button>
          )}
          
          <button 
            onClick={cargarDatos} 
            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition shadow-sm cursor-pointer" 
            title="Sincronizar con Base de Datos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Selector de Nivel / Piso */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider ml-2 hidden sm:inline">
            Nivel Activo:
          </span>
          {nivelesPisos.map(nivel => (
            <button
              key={nivel.piso}
              onClick={() => setPisoActivo(nivel.piso)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                pisoActivo === nivel.piso
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{nivel.nombre}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                pisoActivo === nivel.piso ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {estacionesLocal.filter(e => (e.piso || 1) === nivel.piso && e.tipo_estacion !== 'PARED').length} est.
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRenombrarNivel}
            className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Renombrar Piso
          </button>
          <button
            onClick={handleCrearNuevoNivel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> <span>Agregar Nivel</span>
          </button>
        </div>
      </div>

      {/* VISTA 1: MAPA 2D (Visual & Asignación Rápida) */}
      {viewMode === 'mapa2d' && !isEditMode && (
        <MapaPiso2DView pisoActivo={pisoActivo} />
      )}

      {/* VISTA 2: ZONAS (Agrupadas por Especialidad) */}
      {viewMode === 'lista' && !isEditMode && (
        <div className="space-y-6">
          {Object.keys(zonasMap).length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Armchair className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                No hay estaciones registradas en {nivelActualInfo.nombre}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Cambia al modo "Plano" y presiona "Editar Plano" para colocar sillones, lavaderos o cabinas en este piso.
              </p>
            </div>
          ) : (
            Object.entries(zonasMap).map(([zona, items]) => (
              <div key={zona} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                    {getTipoIcon(items[0]?.tipo_estacion || 'SILLON', "w-5 h-5")}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      Zona {zona}
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">
                      {items.length} módulos físicos en {nivelActualInfo.nombre}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map(item => {
                    const ocupado = item.estado_ocupacion === 'OCUPADO' || item.estado_ocupacion === 'SERVICIO' || item.estado_ocupacion === 'ASESORIA';
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`rounded-2xl border ${
                          ocupado 
                            ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md' 
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
                        } overflow-hidden transition-all`}
                      >
                        <div className={`px-4 py-3 border-b flex justify-between items-center ${
                          ocupado 
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-800' 
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                        }`}>
                          <h3 className="font-bold text-xs text-slate-800 dark:text-white truncate">
                            {item.nombre}
                          </h3>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            ocupado 
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' 
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {ocupado ? 'Ocupado' : 'Libre'}
                          </span>
                        </div>
                        
                        <div className="p-4 space-y-2 text-xs">
                          {ocupado ? (
                            <>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Cliente:</span>
                                <span className="font-bold text-indigo-950 dark:text-indigo-300 text-sm">{item.cliente_nombre_actual || 'En Atención'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Staff Responsable:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">{item.agente_nombre_actual || 'Staff'}</span>
                              </div>
                            </>
                          ) : (
                            <div className="py-4 text-center text-slate-400">
                              <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500 opacity-60" />
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Estación Disponible</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VISTA 3: PLANO (Grid Cuadrícula Interactivo) */}
      {viewMode === 'grid' && (
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Toolbar Lateral (En Modo Edición) */}
          {isEditMode && (
            <div className="w-full lg:w-72 shrink-0 space-y-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div>
                  <h3 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Paleta de Módulos
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Selecciona una herramienta y haz clic en la cuadrícula
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <button 
                    onClick={() => setSelectedTool('sillon')} 
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedTool === 'sillon' 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-600 dark:text-indigo-300 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Scissors className="w-4 h-4 text-indigo-600" />
                    <span>Sillón de Corte / Tocador</span>
                  </button>

                  <button 
                    onClick={() => setSelectedTool('lavadero')} 
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedTool === 'lavadero' 
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-700 dark:bg-cyan-950 dark:border-cyan-600 dark:text-cyan-300 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Droplet className="w-4 h-4 text-cyan-600" />
                    <span>Lavadero Head Spa</span>
                  </button>

                  <button 
                    onClick={() => setSelectedTool('manicura')} 
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedTool === 'manicura' 
                        ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-950 dark:border-purple-600 dark:text-purple-300 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Mesa Manicura / Pedicura</span>
                  </button>

                  <button 
                    onClick={() => setSelectedTool('cabina')} 
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedTool === 'cabina' 
                        ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:border-rose-600 dark:text-rose-300 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <UserIcon className="w-4 h-4 text-rose-600" />
                    <span>Cabina Estética / Cosmiatría</span>
                  </button>

                  <button 
                    onClick={() => setSelectedTool('lounge')} 
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedTool === 'lounge' 
                        ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950 dark:border-amber-600 dark:text-amber-300 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Armchair className="w-4 h-4 text-amber-600" />
                    <span>Sala Lounge / Espera</span>
                  </button>

                  <button 
                    onClick={() => setSelectedTool('pared')} 
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedTool === 'pared' 
                        ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-4 h-4 bg-slate-800 dark:bg-slate-200 rounded-sm" />
                    <span>Pared / Divisor Estructural</span>
                  </button>

                  <button 
                    onClick={() => setSelectedTool('borrador')} 
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedTool === 'borrador' 
                        ? 'bg-rose-600 text-white shadow-md' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Borrador / Eliminar</span>
                  </button>
                </div>

                {/* Dimensiones */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">Dimensiones de Cuadrícula</h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Columnas ($X$):</span>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                      <button onClick={() => setGridCols(c => Math.max(6, c - 1))} className="p-1 hover:bg-slate-200 rounded"><Minus className="w-3 h-3" /></button>
                      <span className="font-bold w-6 text-center">{gridCols}</span>
                      <button onClick={() => setGridCols(c => Math.min(24, c + 1))} className="p-1 hover:bg-slate-200 rounded"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Filas ($Y$):</span>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                      <button onClick={() => setGridRows(r => Math.max(6, r - 1))} className="p-1 hover:bg-slate-200 rounded"><Minus className="w-3 h-3" /></button>
                      <span className="font-bold w-6 text-center">{gridRows}</span>
                      <button onClick={() => setGridRows(r => Math.min(24, r + 1))} className="p-1 hover:bg-slate-200 rounded"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Canvas Cuadrícula */}
          <div className="flex-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-auto custom-scrollbar flex flex-col items-center min-h-[600px] relative">
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                {nivelActualInfo.nombre} • {estacionesPisoActivo.filter(e => e.tipo_estacion !== 'PARED').length} Estaciones
              </span>
              {isEditMode && (
                <span className="text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800 animate-pulse">
                  🛠️ Modo Edición Activo: Haz clic en las celdas para colocar módulos
                </span>
              )}
            </div>

            <div 
              className={`grid gap-1.5 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 transition-all ${
                isEditMode ? 'border-indigo-400 border-dashed cursor-crosshair' : 'border-slate-200 dark:border-slate-800'
              }`}
              style={{
                gridTemplateColumns: `repeat(${gridCols}, 64px)`,
                gridTemplateRows: `repeat(${gridRows}, 64px)`
              }}
            >
              {gridCells.map(cell => {
                const item = estacionesPisoActivo.find(e => e.posicion_x === cell.x && e.posicion_y === cell.y);
                
                let cellContent = null;
                if (item) {
                  const esPared = item.tipo_estacion === 'PARED';
                  const ocupado = item.estado_ocupacion === 'OCUPADO' || item.estado_ocupacion === 'SERVICIO' || item.estado_ocupacion === 'ASESORIA';
                  
                  if (esPared) {
                    cellContent = (
                      <div className="w-full h-full bg-slate-800 dark:bg-slate-300 rounded-xl shadow-sm flex items-center justify-center text-[10px] text-white dark:text-slate-900 font-bold">
                        Pared
                      </div>
                    );
                  } else {
                    cellContent = (
                      <div className={`relative w-full h-full rounded-xl flex flex-col items-center justify-center p-1 border shadow-sm transition-all ${
                        ocupado 
                          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300' 
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}>
                        {getTipoIcon(item.tipo_estacion, "w-5 h-5")}
                        <span className="text-[9px] font-black mt-0.5 truncate w-full text-center leading-none">
                          {item.nombre.split(' ')[0]}
                        </span>

                        {ocupado && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        )}
                      </div>
                    );
                  }
                }

                return (
                  <div 
                    key={`${cell.x}-${cell.y}`}
                    onClick={() => handleCellClick(cell.x, cell.y)}
                    className={`w-[64px] h-[64px] rounded-xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center transition-all ${
                      isEditMode ? 'hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 cursor-pointer' : ''
                    }`}
                  >
                    {cellContent}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
