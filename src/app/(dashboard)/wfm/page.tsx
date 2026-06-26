'use client';

import { useState, useEffect } from 'react';
import { Map, RefreshCw, Scissors, Droplet, User as UserIcon, HelpCircle } from 'lucide-react';
import { obtenerMapaSalon, MapaSalonData } from '@/services/wfm';
import { differenceInMinutes } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

export default function WFMPage() {
  const [mapa, setMapa] = useState<MapaSalonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const cargarMapa = async () => {
    setIsLoading(true);
    const data = await obtenerMapaSalon();
    setMapa(data);
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

  const getTipoIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'tocador':
      case 'silla': return <Scissors className="w-5 h-5" />;
      case 'lavadero': return <Droplet className="w-5 h-5" />;
      case 'cabina': return <UserIcon className="w-5 h-5" />;
      default: return <HelpCircle className="w-5 h-5" />;
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

  // Agrupar por tipo de zona
  const zonas = mapa.reduce((acc, item) => {
    const tipo = item.ubicacion.tipo.toUpperCase();
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(item);
    return acc;
  }, {} as Record<string, MapaSalonData[]>);

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 bg-slate-50 min-h-screen">
      
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
        <button onClick={cargarMapa} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-colors shadow-sm font-semibold">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sincronizar Plano</span>
        </button>
      </div>

      {isLoading && mapa.length === 0 ? (
        <div className="text-center p-12 text-slate-500">Cargando distribución del salón...</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(zonas).map(([tipo, items]) => (
            <div key={tipo} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="text-slate-400">
                  {getTipoIcon(tipo)}
                </div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Zona de {tipo}S</h2>
                <span className="ml-auto bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                  {items.filter(i => i.agente_nombre).length} / {items.length} Ocupados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {items.map(item => {
                  const isOcupado = !!item.agente_nombre;
                  const { barColor, textColor, progress } = getSemaforoColors(item.hora_inicio_atencion, item.tiempo_estimado_min);
                  
                  return (
                    <div key={item.ubicacion.id} className={`relative rounded-xl border p-4 transition-all duration-300 ${isOcupado ? 'border-blue-200 bg-white shadow-md hover:shadow-lg' : 'border-slate-200 bg-slate-50/50 opacity-80'}`}>
                      
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{item.ubicacion.nombre}</h3>
                        <div className={`w-2 h-2 rounded-full ${isOcupado ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}></div>
                      </div>
                      
                      {isOcupado ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 text-xs font-medium">Cliente</span>
                            <span className="font-bold text-slate-800 truncate pl-2">{item.cliente_nombre}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 text-xs font-medium">Agente</span>
                            <span className="font-bold text-blue-700 truncate pl-2">{item.agente_nombre}</span>
                          </div>

                          {/* Barra de Progreso */}
                          <div className="pt-2">
                            <div className="flex justify-between text-xs mb-1 font-semibold">
                              <span className={textColor}>Avance Estimado</span>
                              <span className={textColor}>{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-1.5 rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${progress}%` }}></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center">
                          <span className="text-slate-400 font-medium text-sm">LIBRE</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
