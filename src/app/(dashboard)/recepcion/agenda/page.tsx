'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, User, PlusCircle, CheckCircle, XCircle } from 'lucide-react';
import { obtenerCitas, crearCita, actualizarEstadoCita, Cita } from '@/services/agenda';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AgendaPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Nuevo Cita Form
  const [nuevaCita, setNuevaCita] = useState<Partial<Cita>>({
    cliente_nombre: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '10:00',
    hora_fin: '11:00',
    notas: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const cargarCitas = async () => {
    setIsLoading(true);
    const data = await obtenerCitas();
    setCitas(data);
    setIsLoading(false);
  };

  useEffect(() => {
    cargarCitas();
  }, []);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCita.cliente_nombre || !nuevaCita.fecha || !nuevaCita.hora_inicio) return;
    
    setIsSaving(true);
    const exito = await crearCita(nuevaCita as Cita);
    if (exito) {
      setNuevaCita({ ...nuevaCita, cliente_nombre: '', notas: '' });
      cargarCitas();
    }
    setIsSaving(false);
  };

  const cambiarEstado = async (id: string, estado: string) => {
    await actualizarEstadoCita(id, estado);
    cargarCitas();
  };

  const getStatusColor = (estado: string) => {
    switch(estado) {
      case 'Programado': return 'bg-blue-100 text-blue-800';
      case 'Completado': return 'bg-green-100 text-green-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agenda CRM</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona las reservas y citas programadas de tus clientes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Lista de Citas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" /> 
                Próximos Eventos
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-10 text-center text-gray-500">Cargando agenda...</div>
              ) : citas.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  <p>No hay citas programadas.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                    <tr>
                      <th className="px-5 py-3">Fecha y Hora</th>
                      <th className="px-5 py-3">Cliente</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {citas.map(cita => (
                      <tr key={cita.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900 flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                            {format(parseISO(cita.fecha), "d 'de' MMMM, yyyy", { locale: es })}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {cita.hora_inicio.slice(0,5)} - {cita.hora_fin.slice(0,5)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400" /> {cita.cliente_nombre}
                          </div>
                          {cita.notas && <div className="text-xs text-gray-500 mt-1 line-clamp-1">{cita.notas}</div>}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${getStatusColor(cita.estado)}`}>
                            {cita.estado}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {cita.estado === 'Programado' && (
                            <div className="flex gap-2">
                              <button onClick={() => cambiarEstado(cita.id!, 'Completado')} className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg transition" title="Marcar como Completado">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => cambiarEstado(cita.id!, 'Cancelado')} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition" title="Cancelar Cita">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Nueva Cita */}
        <div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <PlusCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Agendar Cita</h3>
            </div>
            
            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre del Cliente *</label>
                <input 
                  type="text" 
                  value={nuevaCita.cliente_nombre}
                  onChange={e => setNuevaCita({...nuevaCita, cliente_nombre: e.target.value})}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha *</label>
                <input 
                  type="date" 
                  value={nuevaCita.fecha}
                  onChange={e => setNuevaCita({...nuevaCita, fecha: e.target.value})}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Hora Inicio *</label>
                  <input 
                    type="time" 
                    value={nuevaCita.hora_inicio}
                    onChange={e => setNuevaCita({...nuevaCita, hora_inicio: e.target.value})}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Hora Fin *</label>
                  <input 
                    type="time" 
                    value={nuevaCita.hora_fin}
                    onChange={e => setNuevaCita({...nuevaCita, hora_fin: e.target.value})}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Servicio / Notas</label>
                <textarea 
                  value={nuevaCita.notas}
                  onChange={e => setNuevaCita({...nuevaCita, notas: e.target.value})}
                  rows={2}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  placeholder="Ej: Balayage, Manicure..."
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSaving || !nuevaCita.cliente_nombre}
                className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2"
              >
                {isSaving ? 'Guardando...' : 'Programar Cita'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
