'use client';

import { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { obtenerConfigPeticiones, guardarConfigPeticion, eliminarConfigPeticion, ConfigPeticion } from '@/services/wfmConfig';
import { Modal } from '@/components/ui/Modal';

export default function WFMConfigPage() {
  const [configs, setConfigs] = useState<ConfigPeticion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ConfigPeticion>>({
    nombre: '',
    penaliza_cola: false,
    color: 'bg-slate-100 text-slate-700'
  });
  const [isSaving, setIsSaving] = useState(false);

  const cargarDatos = async () => {
    setIsLoading(true);
    const data = await obtenerConfigPeticiones();
    setConfigs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const openNewModal = () => {
    setEditId(null);
    setFormData({ nombre: '', penaliza_cola: false, color: 'bg-slate-100 text-slate-700' });
    setIsModalOpen(true);
  };

  const openEditModal = (conf: ConfigPeticion) => {
    setEditId(conf.id);
    setFormData({ nombre: conf.nombre, penaliza_cola: conf.penaliza_cola, color: conf.color });
    setIsModalOpen(true);
  };

  const handleDelete = async (conf: ConfigPeticion) => {
    if (confirm(`¿Estás seguro de eliminar la petición "${conf.nombre}"?`)) {
      const ok = await eliminarConfigPeticion(conf.id, conf.nombre);
      if (ok) cargarDatos();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const ok = await guardarConfigPeticion({ ...formData, id: editId || undefined });
    if (ok) {
      setIsModalOpen(false);
      cargarDatos();
    }
    setIsSaving(false);
  };

  const colorOptions = [
    { label: 'Gris (Default)', value: 'bg-slate-100 text-slate-700' },
    { label: 'Verde', value: 'bg-emerald-100 text-emerald-700' },
    { label: 'Azul', value: 'bg-blue-100 text-blue-700' },
    { label: 'Rojo', value: 'bg-red-100 text-red-700' },
    { label: 'Naranja', value: 'bg-orange-100 text-orange-700' },
    { label: 'Morado', value: 'bg-purple-100 text-purple-700' },
  ];

  return (
    <div className="p-8 h-full bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-indigo-600" />
            Configuración WFM
          </h1>
          <p className="text-slate-500 mt-2">Gestiona los tipos de solicitudes y sus reglas operativas.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 text-white bg-indigo-600 px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Petición</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500">Cargando configuración...</div>
          ) : (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Nombre de la Petición</th>
                  <th className="px-6 py-4">Estilo Visual (Badge)</th>
                  <th className="px-6 py-4">¿Pierde su lugar en la Cola?</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {configs.map(conf => (
                  <tr key={conf.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{conf.nombre}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${conf.color}`}>
                        {conf.nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {conf.penaliza_cola ? (
                        <span className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-md text-xs">Sí (Sale de Cola)</span>
                      ) : (
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md text-xs">No (Mantiene Turno)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(conf)} className="text-slate-400 hover:text-blue-600 p-2 rounded-md hover:bg-blue-50 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(conf)} className="text-slate-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {configs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                      No hay peticiones configuradas. Crea una nueva.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Editar Petición" : "Nueva Petición"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre (Ej. Urgencia Médica)</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Color del Badge</label>
            <select 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              value={formData.color}
              onChange={e => setFormData({...formData, color: e.target.value})}
            >
              {colorOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <input 
                type="checkbox" 
                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                checked={formData.penaliza_cola}
                onChange={e => setFormData({...formData, penaliza_cola: e.target.checked})}
              />
              <div>
                <div className="font-bold text-slate-800 text-sm">Penaliza en la cola</div>
                <div className="text-xs text-slate-500 mt-0.5">Si marcas esta opción, el agente perderá su turno activo al aprobarse su solicitud. Si la desmarcas, será solo un "badge" informativo.</div>
              </div>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
              Cancelar
            </button>
            <button disabled={isSaving} type="submit" className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
              {isSaving ? 'Guardando...' : (editId ? 'Actualizar' : 'Crear Petición')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
