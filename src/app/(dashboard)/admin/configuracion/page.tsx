'use client';

import { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, List } from 'lucide-react';
import { 
  obtenerConfigPeticiones, guardarConfigPeticion, eliminarConfigPeticion, ConfigPeticion,
  obtenerConfigDemandas, guardarConfigDemanda, eliminarConfigDemanda, ConfigDemanda,
  obtenerTodosMotivosCancelacion, crearMotivoCancelacion, actualizarMotivoCancelacion, MotivoCancelacion
} from '@/services/wfmConfig';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';

export default function WFMConfigPage() {
  const [activeTab, setActiveTab] = useState<'PETICIONES' | 'DEMANDAS' | 'MOTIVOS'>('PETICIONES');
  const [isLoading, setIsLoading] = useState(true);
  
  const { sedeActiva } = useAppStore();
  const { showConfirm, showAlert } = useUIStore();

  // States for Peticiones
  const [peticiones, setPeticiones] = useState<ConfigPeticion[]>([]);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editPetId, setEditPetId] = useState<string | null>(null);
  const [petFormData, setPetFormData] = useState<Partial<ConfigPeticion> & { isGlobal?: boolean }>({
    nombre: '', estado_destino: 'DISPONIBLE', actualiza_timestamp: false, penaliza_cola: false, color: 'bg-slate-100 text-slate-700', isGlobal: true
  });

  // States for Demandas
  const [demandas, setDemandas] = useState<ConfigDemanda[]>([]);
  const [isDemModalOpen, setIsDemModalOpen] = useState(false);
  const [editDemId, setEditDemId] = useState<string | null>(null);
  const [demFormData, setDemFormData] = useState<Partial<ConfigDemanda> & { isGlobal?: boolean }>({
    nombre: '', estado_disparador: 'ASESORANDO', isGlobal: true
  });

  const [isSaving, setIsSaving] = useState(false);

  // States for Motivos
  const [motivos, setMotivos] = useState<MotivoCancelacion[]>([]);
  const [isMotModalOpen, setIsMotModalOpen] = useState(false);
  const [editMotId, setEditMotId] = useState<string | null>(null);
  const [motFormData, setMotFormData] = useState<{ motivo: string; activo: boolean }>({
    motivo: '', activo: true
  });

  const cargarDatos = async () => {
    setIsLoading(true);
    const [dataPet, dataDem, dataMot] = await Promise.all([
      obtenerConfigPeticiones(),
      obtenerConfigDemandas(),
      obtenerTodosMotivosCancelacion()
    ]);
    setPeticiones(dataPet);
    setDemandas(dataDem);
    setMotivos(dataMot);
    setIsLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [sedeActiva?.id]);

  // Handlers Peticiones
  const openNewPetModal = () => {
    setEditPetId(null);
    setPetFormData({ nombre: '', estado_destino: 'DISPONIBLE', actualiza_timestamp: false, penaliza_cola: false, color: 'bg-slate-100 text-slate-700', isGlobal: true });
    setIsPetModalOpen(true);
  };
  const openEditPetModal = (conf: ConfigPeticion) => {
    setEditPetId(conf.id);
    setPetFormData({ ...conf, isGlobal: !conf.sede_id });
    setIsPetModalOpen(true);
  };
  const handleDeletePet = (conf: ConfigPeticion) => {
    showConfirm(
      'Eliminar Petición',
      `¿Eliminar petición "${conf.nombre}"?`,
      async () => {
        const ok = await eliminarConfigPeticion(conf.id, conf.nombre);
        if (ok) {
          showAlert('Petición eliminada', 'success');
          cargarDatos();
        } else {
          showAlert('Error al eliminar', 'error');
        }
      }
    );
  };
  const handleSubmitPet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const payload = { ...petFormData, id: editPetId || undefined, sede_id: petFormData.isGlobal ? null : sedeActiva?.id };
    delete payload.isGlobal;
    
    const ok = await guardarConfigPeticion(payload);
    if (ok) {
      setIsPetModalOpen(false);
      cargarDatos();
    }
    setIsSaving(false);
  };

  // Handlers Demandas
  const openNewDemModal = () => {
    setEditDemId(null);
    setDemFormData({ nombre: '', estado_disparador: 'ASESORANDO', isGlobal: true });
    setIsDemModalOpen(true);
  };
  const openEditDemModal = (conf: ConfigDemanda) => {
    setEditDemId(conf.id);
    setDemFormData({ ...conf, isGlobal: !conf.sede_id });
    setIsDemModalOpen(true);
  };
  const handleDeleteDem = (conf: ConfigDemanda) => {
    showConfirm(
      'Eliminar Demanda',
      `¿Eliminar demanda "${conf.nombre}"?`,
      async () => {
        const ok = await eliminarConfigDemanda(conf.id, conf.nombre);
        if (ok) {
          showAlert('Demanda eliminada', 'success');
          cargarDatos();
        } else {
          showAlert('Error al eliminar', 'error');
        }
      }
    );
  };
  const handleSubmitDem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const payload = { ...demFormData, id: editDemId || undefined, sede_id: demFormData.isGlobal ? null : sedeActiva?.id };
    delete payload.isGlobal;
    
    const ok = await guardarConfigDemanda(payload);
    if (ok) {
      setIsDemModalOpen(false);
      cargarDatos();
    }
    setIsSaving(false);
  };

  // Handlers Motivos
  const openNewMotModal = () => {
    setEditMotId(null);
    setMotFormData({ motivo: '', activo: true });
    setIsMotModalOpen(true);
  };
  const openEditMotModal = (conf: MotivoCancelacion) => {
    setEditMotId(conf.id);
    setMotFormData({ motivo: conf.motivo, activo: conf.activo });
    setIsMotModalOpen(true);
  };
  const handleSubmitMot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    let ok = false;
    if (editMotId) {
      ok = await actualizarMotivoCancelacion(editMotId, motFormData.motivo, motFormData.activo);
    } else {
      ok = await crearMotivoCancelacion(motFormData.motivo);
    }
    
    if (ok) {
      setIsMotModalOpen(false);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-indigo-600" />
            Configuración Estructural
          </h1>
          <p className="text-slate-500 mt-2">Gestiona las reglas de operación y tipos de atención de la empresa.</p>
        </div>
        <button 
          onClick={activeTab === 'PETICIONES' ? openNewPetModal : activeTab === 'DEMANDAS' ? openNewDemModal : openNewMotModal}
          className="flex items-center gap-2 text-white bg-indigo-600 px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'PETICIONES' ? 'Nueva Petición WFM' : activeTab === 'DEMANDAS' ? 'Nuevo Tipo Demanda' : 'Nuevo Motivo'}</span>
        </button>
      </div>

      {/* TABS */}
      <div className="flex space-x-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('PETICIONES')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'PETICIONES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Peticiones de Personal (WFM)
        </button>
        <button
          onClick={() => setActiveTab('DEMANDAS')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'DEMANDAS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Tipos de Demanda (OATC)
        </button>
        <button
          onClick={() => setActiveTab('MOTIVOS')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'MOTIVOS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Motivos de Cancelación
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500">Cargando configuración...</div>
          ) : activeTab === 'PETICIONES' ? (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Petición</th>
                  <th className="px-6 py-4">Alcance</th>
                  <th className="px-6 py-4">Badge</th>
                  <th className="px-6 py-4">Estado Destino</th>
                  <th className="px-6 py-4">Reinicio Turno</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {peticiones.map(conf => (
                  <tr key={conf.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{conf.nombre}</td>
                    <td className="px-6 py-4">
                      {conf.sede_id ? (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">Local</span>
                      ) : (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">Global</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${conf.color}`}>{conf.nombre}</span>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs font-bold text-slate-500 uppercase">{conf.estado_destino}</span></td>
                    <td className="px-6 py-4">
                      {conf.actualiza_timestamp ? <span className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-md text-xs">Sí</span> : <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md text-xs">No</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEditPetModal(conf)} className="text-slate-400 hover:text-blue-600 p-2"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeletePet(conf)} className="text-slate-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'DEMANDAS' ? (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Tipo de Demanda (OATC)</th>
                  <th className="px-6 py-4">Alcance</th>
                  <th className="px-6 py-4">Estado Operativo (Disparador)</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {demandas.map(conf => (
                  <tr key={conf.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{conf.nombre}</td>
                    <td className="px-6 py-4">
                      {conf.sede_id ? (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">Local</span>
                      ) : (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">Global</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-xs rounded-full">{conf.estado_disparador}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEditDemModal(conf)} className="text-slate-400 hover:text-blue-600 p-2"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteDem(conf)} className="text-slate-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {demandas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">No hay demandas configuradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Motivo de Cancelación</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {motivos.map(conf => (
                  <tr key={conf.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{conf.motivo}</td>
                    <td className="px-6 py-4">
                      {conf.activo ? (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">Activo</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-bold">Inactivo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEditMotModal(conf)} className="text-slate-400 hover:text-blue-600 p-2"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {motivos.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-slate-500">No hay motivos configurados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Peticiones */}
      <Modal isOpen={isPetModalOpen} onClose={() => setIsPetModalOpen(false)} title={editPetId ? "Editar Petición WFM" : "Nueva Petición WFM"}>
        <form onSubmit={handleSubmitPet} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label><input required type="text" className="w-full px-4 py-2 border rounded-xl" value={petFormData.nombre} onChange={e => setPetFormData({...petFormData, nombre: e.target.value})} /></div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alcance de la Configuración</label>
            <select className="w-full px-4 py-2 border rounded-xl" value={petFormData.isGlobal ? 'global' : 'local'} onChange={e => setPetFormData({...petFormData, isGlobal: e.target.value === 'global'})}>
              <option value="global">Global (Todas las Sedes)</option>
              <option value="local">Local (Solo esta Sede)</option>
            </select>
          </div>

          <div><label className="block text-sm font-medium text-slate-700 mb-1">Color del Badge</label><select className="w-full px-4 py-2 border rounded-xl" value={petFormData.color} onChange={e => setPetFormData({...petFormData, color: e.target.value})}>{colorOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Estado de Sistema (Destino)</label><select className="w-full px-4 py-2 border rounded-xl" value={petFormData.estado_destino} onChange={e => setPetFormData({...petFormData, estado_destino: e.target.value})}><option value="DISPONIBLE">DISPONIBLE</option><option value="OCUPADO">OCUPADO</option><option value="INACTIVO">INACTIVO</option></select></div>
          <div className="pt-2"><label className="flex items-center gap-3 cursor-pointer p-4 border rounded-xl hover:bg-slate-50"><input type="checkbox" className="w-5 h-5 text-indigo-600" checked={petFormData.actualiza_timestamp} onChange={e => setPetFormData({...petFormData, actualiza_timestamp: e.target.checked})} /><div><div className="font-bold text-slate-800 text-sm">Actualiza Timestamp</div><div className="text-xs text-slate-500">Reinicia antigüedad al regresar a disponible.</div></div></label></div>
          <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsPetModalOpen(false)} className="px-5 py-2 text-sm bg-white border rounded-xl hover:bg-slate-50">Cancelar</button><button disabled={isSaving} type="submit" className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700">{isSaving ? 'Guardando...' : 'Guardar'}</button></div>
        </form>
      </Modal>

      {/* Modal Demandas */}
      <Modal isOpen={isDemModalOpen} onClose={() => setIsDemModalOpen(false)} title={editDemId ? "Editar Tipo Demanda" : "Nuevo Tipo Demanda"}>
        <form onSubmit={handleSubmitDem} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Demanda (Ej. Apoyo Interno)</label><input required type="text" className="w-full px-4 py-2 border rounded-xl" value={demFormData.nombre} onChange={e => setDemFormData({...demFormData, nombre: e.target.value})} /></div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alcance de la Configuración</label>
            <select className="w-full px-4 py-2 border rounded-xl" value={demFormData.isGlobal ? 'global' : 'local'} onChange={e => setDemFormData({...demFormData, isGlobal: e.target.value === 'global'})}>
              <option value="global">Global (Todas las Sedes)</option>
              <option value="local">Local (Solo esta Sede)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado Operativo (Disparador)</label>
            <p className="text-xs text-slate-500 mb-2">Estado que tomará la OATC y el agente al iniciar esta demanda.</p>
            <input required type="text" className="w-full px-4 py-2 border rounded-xl uppercase" placeholder="Ej. TRABAJANDO, CORRIGIENDO, APOYANDO..." value={demFormData.estado_disparador} onChange={e => setDemFormData({...demFormData, estado_disparador: e.target.value.toUpperCase()})} />
          </div>
          <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsDemModalOpen(false)} className="px-5 py-2 text-sm bg-white border rounded-xl hover:bg-slate-50">Cancelar</button><button disabled={isSaving} type="submit" className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700">{isSaving ? 'Guardando...' : 'Guardar'}</button></div>
        </form>
      </Modal>

      {/* Modal Motivos */}
      <Modal isOpen={isMotModalOpen} onClose={() => setIsMotModalOpen(false)} title={editMotId ? "Editar Motivo" : "Nuevo Motivo"}>
        <form onSubmit={handleSubmitMot} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Motivo</label><input required type="text" className="w-full px-4 py-2 border rounded-xl" value={motFormData.motivo} onChange={e => setMotFormData({...motFormData, motivo: e.target.value})} /></div>
          
          <div className="pt-2"><label className="flex items-center gap-3 cursor-pointer p-4 border rounded-xl hover:bg-slate-50"><input type="checkbox" className="w-5 h-5 text-indigo-600" checked={motFormData.activo} onChange={e => setMotFormData({...motFormData, activo: e.target.checked})} /><div><div className="font-bold text-slate-800 text-sm">Motivo Activo</div><div className="text-xs text-slate-500">Si está inactivo, no aparecerá en las opciones de Recepción.</div></div></label></div>
          <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsMotModalOpen(false)} className="px-5 py-2 text-sm bg-white border rounded-xl hover:bg-slate-50">Cancelar</button><button disabled={isSaving} type="submit" className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700">{isSaving ? 'Guardando...' : 'Guardar'}</button></div>
        </form>
      </Modal>

    </div>
  );
}
