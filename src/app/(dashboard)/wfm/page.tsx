'use client';

import { useState, useEffect } from 'react';
import { Map, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { obtenerMapaSalon, MapaSalonData } from '@/services/wfm';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

export default function WFMPage() {
  const [mapa, setMapa] = useState<MapaSalonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cargarMapa = async () => {
    setIsLoading(true);
    const data = await obtenerMapaSalon();
    setMapa(data);
    setIsLoading(false);
  };

  useEffect(() => {
    cargarMapa();
    // Actualización automática cada minuto para los semáforos
    const interval = setInterval(cargarMapa, 60000);
    return () => clearInterval(interval);
  }, []);

  // Función para determinar el semáforo
  const calcularEstadoSemaforo = (horaInicio?: string, estimadoMin?: number) => {
    if (!horaInicio || !estimadoMin) return 'bg-gray-100 text-gray-500'; // Libre o sin datos
    
    const minTranscurridos = differenceInMinutes(new Date(), new Date(horaInicio));
    
    if (minTranscurridos > estimadoMin) {
      return 'bg-red-100 text-red-800 ring-2 ring-red-500 animate-pulse'; // Atrasado
    } else if (minTranscurridos > estimadoMin * 0.8) {
      return 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400'; // Por terminar / Cerca del límite
    } else {
      return 'bg-green-100 text-green-800'; // A tiempo
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-teal-100 p-3 rounded-full text-teal-600">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Workforce Management (WFM)</h1>
            <p className="text-sm text-gray-500">Mapa del salón y control de tiempos en tiempo real</p>
          </div>
        </div>
        <button onClick={cargarMapa} className="flex items-center gap-2 text-sm text-teal-600 bg-teal-50 px-4 py-2 rounded-lg hover:bg-teal-100 transition-colors">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar Mapa</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && mapa.length === 0 ? (
          <div className="col-span-full text-center p-10 text-gray-500">Cargando mapa de ubicaciones...</div>
        ) : (
          mapa.map(item => {
            const isOcupado = !!item.agente_nombre;
            const semaforoClase = isOcupado ? calcularEstadoSemaforo(item.hora_inicio_atencion, item.tiempo_estimado_min) : 'bg-gray-50 text-gray-400';
            
            return (
              <div key={item.ubicacion.id} className={`bg-white rounded-xl shadow-sm border p-5 transition-all ${isOcupado ? 'border-teal-200 shadow-md' : 'border-gray-200 opacity-70'}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.ubicacion.tipo}</span>
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${semaforoClase}`}>
                    {isOcupado ? 'OCUPADO' : 'LIBRE'}
                  </div>
                </div>
                
                <h3 className="font-bold text-lg text-gray-900 mb-1">{item.ubicacion.nombre}</h3>
                
                {isOcupado ? (
                  <div className="space-y-3 mt-4 border-t border-gray-100 pt-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Atendiendo a:</p>
                      <p className="font-semibold text-gray-900">{item.cliente_nombre}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Agente:</p>
                      <p className="font-medium text-teal-700">{item.agente_nombre}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Inició {item.hora_inicio_atencion ? formatDistanceToNow(new Date(item.hora_inicio_atencion), { addSuffix: true, locale: es }) : ''}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-700">Meta: {item.tiempo_estimado_min}m</span>
                    </div>
                    
                    {item.hora_inicio_atencion && item.tiempo_estimado_min && differenceInMinutes(new Date(), new Date(item.hora_inicio_atencion)) > item.tiempo_estimado_min && (
                      <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg font-medium">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Excedió el tiempo estimado</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center h-24">
                    <p className="text-sm text-gray-400 font-medium">Sin cliente asignado</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
