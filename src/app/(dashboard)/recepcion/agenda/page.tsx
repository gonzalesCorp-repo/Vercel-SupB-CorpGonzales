'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, User, PlusCircle, CheckCircle, XCircle, FileText, Plus } from 'lucide-react';
import { obtenerCitas, crearCita, actualizarEstadoCita, Cita } from '@/services/agenda';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '@/components/ui/Modal';

export default function AgendaPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      setIsModalOpen(false);
      cargarCitas();
    }
    setIsSaving(false);
  };

  const cambiarEstado = async (id: string, estado: string) => {
    await actualizarEstadoCita(id, estado);
    cargarCitas();
  };

  const getStatusColor = (estado: string) => {
    switch(estado.toLowerCase()) {
      case 'programado': return 'bg-blue-100 text-blue-800';
      case 'completado': return 'bg-emerald-100 text-emerald-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 min-h-[calc(100vh-4rem)] bg-slate-50">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600 shadow-sm">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Agenda CRM</h1>
            <p className="text-sm text-slate-500">Gestiona las reservas y citas programadas de tus clientes.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 text-sm text-white bg-blue-600 px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Cita</span>
        </button>
      </div>

      {/* Lista de Citas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Próximos Eventos
          </h3>
          <span className="text-xs bg-blue-100 text-blue-800 py-1 px-3 rounded-full font-bold">
            {citas.length} citas
          </span>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500">Cargando agenda...</div>
          ) : citas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
              <CalendarIcon className="w-16 h-16 text-slate-300 mb-3" />
              <p className="font-bold text-xl text-slate-700">Agenda Libre</p>
              <p className="text-sm mt-1">No hay citas programadas para mostrar.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {citas.map(cita => (
                  <tr key={cita.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{cita.fecha ? format(parseISO(cita.fecha), 'EEEE d, MMMM', { locale: es }) : 'Sin fecha'}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                        <Clock className="w-3.5 h-3.5" /> 
                        {cita.hora_inicio} - {cita.hora_fin || '?'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{cita.cliente_nombre}</div>
                      {cita.notas && <div className="text-xs text-slate-500 mt-1 italic line-clamp-1">{cita.notas}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusColor(cita.estado)}`}>
                        {cita.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {cita.estado === 'Programado' && (
                          <>
                            <button 
                              onClick={() => cambiarEstado(cita.id!, 'Completado')}
                              title="Marcar Completado"
                              className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => cambiarEstado(cita.id!, 'Cancelado')}
                              title="Cancelar Cita"
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Nueva Cita */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Agendar Nueva Cita"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleGuardar} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Nombre del Cliente *</label>
            <div className="relative">
              <input 
                type="text" 
                value={nuevaCita.cliente_nombre}
                onChange={e => setNuevaCita({...nuevaCita, cliente_nombre: e.target.value})}
                className="w-full text-sm border border-slate-300 rounded-xl p-3 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
                placeholder="Busca o ingresa el nombre..."
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Fecha *</label>
              <input 
                type="date" 
                value={nuevaCita.fecha}
                onChange={e => setNuevaCita({...nuevaCita, fecha: e.target.value})}
                className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Hora Inicio *</label>
              <input 
                type="time" 
                value={nuevaCita.hora_inicio}
                onChange={e => setNuevaCita({...nuevaCita, hora_inicio: e.target.value})}
                className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Notas Adicionales</label>
            <textarea 
              value={nuevaCita.notas}
              onChange={e => setNuevaCita({...nuevaCita, notas: e.target.value})}
              className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              rows={3}
              placeholder="Detalles sobre el servicio requerido..."
            ></textarea>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="w-1/2 bg-slate-100 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving || !nuevaCita.cliente_nombre}
              className="w-1/2 bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md shadow-blue-600/20 flex justify-center items-center gap-2"
            >
              {isSaving ? 'Guardando...' : <><CheckCircle className="w-4 h-4" /> Guardar Cita</>}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
