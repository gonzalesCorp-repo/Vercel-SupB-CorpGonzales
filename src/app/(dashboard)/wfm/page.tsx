'use client';

import { useState, useEffect } from 'react';
import { Map, RefreshCw, Scissors, Droplet, User as UserIcon, HelpCircle, Grid, List, Edit3, Save, Plus, Minus, MousePointer2 } from 'lucide-react';
import { obtenerMapaSalon, MapaSalonData, Ubicacion } from '@/services/wfm';
import { differenceInMinutes } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { BulkUploader } from '@/components/ui/BulkUploader';

export default function WFMPage() {
  const [mapaOriginal, setMapaOriginal] = useState<MapaSalonData[]>([]);
  const [mapaLocal, setMapaLocal] = useState<MapaSalonData[]>([]); // Para el editor local
  const [isLoading, setIsLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'lista' | 'grid'>('grid');
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Grid config
  const [gridCols, setGridCols] = useState(12);
  const [gridRows, setGridRows] = useState(10);
  
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const supabase = createClient();

  const cargarMapa = async () => {
    setIsLoading(true);
    const data = await obtenerMapaSalon();
    setMapaOriginal(data);
    setMapaLocal(data);
    setIsLoading(false);
  };

  useEffect(() => {
    cargarMapa();
    const interval = setInterval(cargarMapa, 60000);
    const channel = supabase.channel('realtime-wfm')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarMapa())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ubicaciones' }, () => cargarMapa())
      .subscribe();
      
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const getTipoIcon = (tipo: string, className = "w-5 h-5") => {
    switch (tipo.toLowerCase()) {
      case 'tocador':
      case 'silla': return <Scissors className={className} />;
      case 'lavadero': return <Droplet className={className} />;
      case 'cabina': return <UserIcon className={className} />;
      case 'pared': return <div className={`bg-slate-800 rounded-sm ${className}`} />;
      default: return <HelpCircle className={className} />;
    }
  };

  const getSemaforoColors = (horaInicio?: string, estimadoMin?: number) => {
    if (!horaInicio || !estimadoMin) return { barColor: 'bg-slate-200', textColor: 'text-slate-500', progress: 0 };
    
    const minTranscurridos = differenceInMinutes(new Date(), new Date(horaInicio));
    let progress = Math.min(Math.round((minTranscurridos / estimadoMin) * 100), 100);
    
    if (minTranscurridos > estimadoMin) {
      return { barColor: 'bg-red-500', textColor: 'text-red-700', progress: 100 };
    } else if (minTranscurridos > estimadoMin * 0.8) {
      return { barColor: 'bg-amber-400', textColor: 'text-amber-600', progress };
    } else {
      return { barColor: 'bg-emerald-500', textColor: 'text-emerald-700', progress };
    }
  };

  // Agrupar para modo Lista
  const zonas = mapaLocal.reduce((acc, item) => {
    if (item.ubicacion.tipo === 'pared') return acc; // Excluir paredes de la lista
    const tipo = item.ubicacion.tipo.toUpperCase();
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(item);
    return acc;
  }, {} as Record<string, MapaSalonData[]>);

  // Editor Interactivo
  const handleCellClick = (x: number, y: number) => {
    if (!isEditMode || !selectedTool) return;
    
    setMapaLocal(prev => {
      const copy = [...prev];
      // Eliminar cualquier cosa que este en esa celda
      const filtered = copy.filter(i => !(i.ubicacion.grid_x === x && i.ubicacion.grid_y === y));
      
      if (selectedTool === 'borrador') {
        return filtered;
      }

      // Añadir nuevo
      const newItem: MapaSalonData = {
        ubicacion: {
          id: `temp-${Date.now()}`,
          nombre: `${selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)} ${Math.floor(Math.random() * 100)}`,
          tipo: selectedTool as any,
          estado: 'DISPONIBLE',
          grid_x: x,
          grid_y: y
        }
      };
      
      return [...filtered, newItem];
    });
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      // Al salir de edit, opcionalmente guardar. Por ahora es Mockup.
      setIsEditMode(false);
      setSelectedTool(null);
    } else {
      setIsEditMode(true);
      setViewMode('grid');
    }
  };

  // Matriz visual
  const gridCells = [];
  for (let y = 1; y <= gridRows; y++) {
    for (let x = 1; x <= gridCols; x++) {
      gridCells.push({ x, y });
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 min-h-[calc(100vh-4rem)] bg-slate-50">
      
      {/* Header WFM */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-3 rounded-xl text-white shadow-md">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Mapa WFM Operativo</h1>
            <p className="text-sm text-slate-500">Visualización de distribución de cabinas y control de ocupación</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <BulkUploader 
            tableName="ubicaciones" 
            title="Importar Mapa" 
            injectSedeId={true}
            buttonClassName="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 border border-indigo-100 transition-colors shadow-sm font-semibold"
            onSuccess={cargarMapa} 
          />
          {!isEditMode && (
            <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
              <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Grid className="w-4 h-4" /> Plano
              </button>
              <button 
                onClick={() => setViewMode('lista')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'lista' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <List className="w-4 h-4" /> Zonas
              </button>
            </div>
          )}

          <button 
            onClick={toggleEditMode}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${isEditMode ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-800 text-white hover:bg-slate-900'}`}
          >
            {isEditMode ? <><Save className="w-4 h-4" /> Guardar Layout</> : <><Edit3 className="w-4 h-4" /> Editar Layout</>}
          </button>
          
          <button onClick={cargarMapa} className="flex items-center justify-center p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors shadow-sm" title="Sincronizar">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading && mapaOriginal.length === 0 ? (
        <div className="text-center py-20 text-slate-500 font-bold">Cargando distribución del salón...</div>
      ) : (
        <>
          {/* MODO LISTA (Anterior) */}
          {viewMode === 'lista' && !isEditMode && (
            <div className="space-y-6">
              {Object.entries(zonas).map(([tipo, items]) => (
                <div key={tipo} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <div className="text-slate-400">
                      {getTipoIcon(tipo, "w-6 h-6")}
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Zona de {tipo}S</h2>
                    <span className="ml-auto bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                      {items.length} módulos
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map(item => {
                      const ocupado = item.ubicacion.estado === 'OCUPADO';
                      const semaforo = getSemaforoColors(item.hora_inicio_atencion, item.tiempo_estimado_min);
                      
                      return (
                        <div key={item.ubicacion.id} className={`rounded-xl border ${ocupado ? 'border-indigo-200 shadow-md bg-indigo-50/20' : 'border-slate-200 shadow-sm bg-slate-50'} overflow-hidden transition-all hover:border-indigo-300`}>
                          <div className={`px-4 py-3 border-b ${ocupado ? 'bg-white border-indigo-100' : 'bg-slate-100/50 border-slate-200'}`}>
                            <div className="flex justify-between items-center mb-1">
                              <h3 className="font-bold text-slate-800">{item.ubicacion.nombre}</h3>
                              {ocupado ? (
                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase tracking-wider animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Ocupado
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                  Libre
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">Asignado a: <span className="text-slate-700 font-bold">{item.agente_nombre || 'Nadie'}</span></p>
                          </div>
                          
                          <div className="p-4 bg-white">
                            {ocupado ? (
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Cliente Actual</p>
                                  <p className="text-sm font-bold text-indigo-900">{item.cliente_nombre}</p>
                                </div>
                                
                                <div>
                                  <div className="flex justify-between text-[10px] font-bold mb-1">
                                    <span className="text-slate-500">Progreso Estimado</span>
                                    <span className={semaforo.textColor}>{semaforo.progress}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                                    <div className={`h-2 rounded-full ${semaforo.barColor} transition-all duration-1000`} style={{ width: `${semaforo.progress}%` }}></div>
                                  </div>
                                  <p className="text-[9px] text-slate-400 mt-1 text-right italic font-medium">Base: {item.tiempo_estimado_min} min</p>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full min-h-[90px] flex flex-col items-center justify-center text-slate-400 opacity-60">
                                {getTipoIcon(tipo, "w-8 h-8 mb-2")}
                                <p className="text-xs font-bold uppercase tracking-wider">Listo para usar</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODO PLANO (Grid) */}
          {viewMode === 'grid' && (
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Toolbar Lateral (Sólo en Edit Mode) */}
              {isEditMode && (
                <div className="w-full lg:w-64 shrink-0 space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Herramientas</h3>
                    
                    <div className="space-y-2">
                      <button onClick={() => setSelectedTool('mouse')} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedTool === 'mouse' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                        <MousePointer2 className="w-5 h-5" /> Seleccionar
                      </button>
                      <button onClick={() => setSelectedTool('borrador')} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedTool === 'borrador' ? 'bg-red-50 border-red-300 text-red-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                        <div className="w-5 h-5 bg-red-200 rounded-sm" /> Borrador
                      </button>
                      
                      <div className="pt-2 pb-1"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobiliario</p></div>
                      
                      <button onClick={() => setSelectedTool('tocador')} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedTool === 'tocador' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                        <Scissors className="w-5 h-5" /> Tocador
                      </button>
                      <button onClick={() => setSelectedTool('lavadero')} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedTool === 'lavadero' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                        <Droplet className="w-5 h-5" /> Lavadero
                      </button>
                      <button onClick={() => setSelectedTool('cabina')} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedTool === 'cabina' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                        <UserIcon className="w-5 h-5" /> Cabina
                      </button>
                      
                      <div className="pt-2 pb-1"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estructura</p></div>
                      
                      <button onClick={() => setSelectedTool('pared')} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedTool === 'pared' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                        <div className="w-5 h-5 bg-slate-800 rounded-sm" /> Pared / Divisor
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Dimensiones del Plano</h3>
                    <div className="flex gap-4 items-center mb-4">
                      <div className="text-xs font-bold text-slate-500 w-16">Columnas:</div>
                      <div className="flex bg-slate-100 rounded-lg">
                        <button onClick={() => setGridCols(c => Math.max(5, c - 1))} className="p-2 hover:bg-slate-200 rounded-l-lg"><Minus className="w-4 h-4" /></button>
                        <div className="p-2 px-4 font-bold">{gridCols}</div>
                        <button onClick={() => setGridCols(c => Math.min(30, c + 1))} className="p-2 hover:bg-slate-200 rounded-r-lg"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="text-xs font-bold text-slate-500 w-16">Filas:</div>
                      <div className="flex bg-slate-100 rounded-lg">
                        <button onClick={() => setGridRows(r => Math.max(5, r - 1))} className="p-2 hover:bg-slate-200 rounded-l-lg"><Minus className="w-4 h-4" /></button>
                        <div className="p-2 px-4 font-bold">{gridRows}</div>
                        <button onClick={() => setGridRows(r => Math.min(30, r + 1))} className="p-2 hover:bg-slate-200 rounded-r-lg"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contenedor del Grid */}
              <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-auto custom-scrollbar flex justify-center items-start min-h-[600px] relative">
                
                {/* Cuadrícula */}
                <div 
                  className={`grid gap-1 p-4 bg-slate-100 rounded-xl border-4 ${isEditMode ? 'border-indigo-300 border-dashed cursor-crosshair' : 'border-slate-200 shadow-inner'}`}
                  style={{
                    gridTemplateColumns: `repeat(${gridCols}, 60px)`,
                    gridTemplateRows: `repeat(${gridRows}, 60px)`
                  }}
                >
                  {gridCells.map(cell => {
                    // Encontrar si hay algo en esta celda
                    const item = mapaLocal.find(m => m.ubicacion.grid_x === cell.x && m.ubicacion.grid_y === cell.y);
                    
                    let cellContent = null;
                    if (item) {
                      const ocupado = item.ubicacion.estado === 'OCUPADO';
                      const esPared = item.ubicacion.tipo === 'pared';
                      
                      if (esPared) {
                        cellContent = <div className="w-full h-full bg-slate-800 rounded-md shadow-sm" title="Pared"></div>;
                      } else {
                        // Estación
                        const semaforo = getSemaforoColors(item.hora_inicio_atencion, item.tiempo_estimado_min);
                        cellContent = (
                          <div className={`relative w-full h-full rounded-lg flex flex-col items-center justify-center border shadow-sm transition-all group ${ocupado ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-300'}`}>
                            
                            {/* Icono Principal */}
                            <div className={ocupado ? 'text-indigo-700' : 'text-slate-400'}>
                              {getTipoIcon(item.ubicacion.tipo, "w-6 h-6")}
                            </div>
                            
                            {/* Indicador de ocupación miniatura (fuera de modo edit) */}
                            {!isEditMode && ocupado && (
                              <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse"></div>
                            )}

                            {/* Tooltip flotante (Sólo fuera de modo edicion y si está ocupado) */}
                            {!isEditMode && (
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-900 text-white rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none shadow-xl border border-slate-700">
                                <p className="text-xs font-bold text-slate-300 mb-1">{item.ubicacion.nombre}</p>
                                {ocupado ? (
                                  <>
                                    <p className="text-[10px]"><span className="text-slate-400">Agente:</span> {item.agente_nombre}</p>
                                    <p className="text-[10px]"><span className="text-slate-400">Cliente:</span> {item.cliente_nombre}</p>
                                    <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                                      <div className={`h-1.5 rounded-full ${semaforo.barColor}`} style={{ width: `${semaforo.progress}%` }}></div>
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-[10px] text-emerald-400 font-bold mt-1">Disponible</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                    }

                    return (
                      <div 
                        key={`${cell.x}-${cell.y}`}
                        className={`w-[60px] h-[60px] rounded border border-slate-200/50 flex items-center justify-center transition-colors ${isEditMode ? 'hover:bg-indigo-100/50 hover:border-indigo-300' : ''}`}
                        onClick={() => handleCellClick(cell.x, cell.y)}
                      >
                        {cellContent}
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
