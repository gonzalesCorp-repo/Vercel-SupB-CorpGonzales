'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, Edit2, CheckCircle, XCircle, Plus } from 'lucide-react';
import { obtenerTodosLosAgentes, guardarAgente, obtenerTodasLasSedes } from '@/services/admin';
import { Agente } from '@/services/recepcion';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/store/useAppStore';

// Extendemos Agente base con campos extra para admin
interface AgenteAdmin extends Agente {
  email?: string;
  password?: string;
  rol?: string;
  sedes_ids?: string[];
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<AgenteAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { sedeActiva, userRol } = useAppStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AgenteAdmin>>({
    nombre: '',
    email: '',
    password: '',
    rol: 'STAFF',
    estado: 'DISPONIBLE',
    sedes_ids: []
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [todasSedes, setTodasSedes] = useState<{id: string, nombre: string}[]>([]);

  const cargarDatos = async () => {
    setIsLoading(true);
    const [usuariosData, sedesData] = await Promise.all([
      obtenerTodosLosAgentes(),
      obtenerTodasLasSedes()
    ]);
    
    // Filtrar usuarios por Sede Activa para mantener el contexto
    const filtrados = usuariosData.filter(u => {
      if (!sedeActiva) return true;
      if (u.rol === 'SUPERADMIN') return true; // Superadmins se ven en todas las sedes
      return u.sedes_ids?.includes(sedeActiva.id);
    });

    setUsuarios(filtrados as AgenteAdmin[]);
    setTodasSedes(sedesData);
    setIsLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const exito = await guardarAgente({ ...formData, id: editId }, formData.sedes_ids || []);
    if (exito) {
      cargarDatos();
      closeModal();
    }
    
    setIsSaving(false);
  };

  const openNewUserModal = () => {
    setEditId(null);
    setFormData({ nombre: '', email: '', password: '', rol: 'STAFF', estado: 'DISPONIBLE', sedes_ids: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (user: AgenteAdmin) => {
    setEditId(user.id!);
    setFormData({
      nombre: user.nombre,
      email: user.email || '',
      rol: user.rol || 'STAFF',
      estado: user.estado,
      sedes_ids: user.sedes_ids || []
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData({ nombre: '', email: '', password: '', rol: 'STAFF', estado: 'DISPONIBLE', sedes_ids: [] });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 min-h-[calc(100vh-4rem)] bg-slate-50">
      
      {/* Header Admin */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
            <p className="text-sm text-slate-500">Administra los roles, accesos y estado del personal en el sistema.</p>
          </div>
        </div>
        <button 
          onClick={openNewUserModal} 
          className="flex items-center gap-2 text-sm text-white bg-indigo-600 px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Directorio del Staff
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500">Cargando usuarios...</div>
          ) : (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Nombre Completo</th>
                  <th className="px-6 py-4">Correo / Acceso</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{u.nombre}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {u.email || <span className="italic text-xs text-slate-400">Sin acceso de Login</span>}
                      {u.sedes_ids && u.sedes_ids.length > 0 && (
                        <div className="text-[10px] font-bold text-indigo-500 mt-1 uppercase tracking-wider">{u.sedes_ids.length} sedes asignadas</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${u.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : u.rol === 'RECEPCION' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.rol || 'STAFF'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.estado === 'INACTIVO' ? (
                        <span className="flex items-center gap-1.5 text-red-600 font-bold text-xs"><XCircle className="w-4 h-4"/> INACTIVO</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs"><CheckCircle className="w-4 h-4"/> ACTIVO</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEditModal(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title={editId ? 'Editar Usuario' : 'Nuevo Usuario'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Nombre Completo *</label>
            <input 
              type="text" 
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              required
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Correo Electrónico</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Para acceder al sistema ERP"
            />
          </div>
          
          {!editId && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Contraseña Inicial *</label>
              <input 
                type="text" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required={!editId}
                placeholder="Ej. temporal123"
              />
              <p className="text-[10px] text-slate-500 mt-1">El usuario usará esta contraseña para su primer ingreso.</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Rol de Acceso</label>
              <select 
                value={formData.rol}
                onChange={e => setFormData({...formData, rol: e.target.value})}
                className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="STAFF">Operaciones de Piso (Staff)</option>
                <option value="RECEPCION">Recepción CRM</option>
                <option value="CAJA">Caja y Cobros</option>
                <option value="DESPACHO">Laboratorio / Despacho</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Estado</label>
              <select 
                value={formData.estado}
                onChange={e => setFormData({...formData, estado: e.target.value})}
                className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="DISPONIBLE">ACTIVO</option>
                <option value="INACTIVO">SUSPENDIDO</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Asignación de Sedes</label>
            <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
              {todasSedes.map(sede => (
                <label key={sede.id} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-colors">
                  <input 
                    type="checkbox"
                    checked={formData.sedes_ids?.includes(sede.id) || false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const current = formData.sedes_ids || [];
                      if (checked) {
                        setFormData({...formData, sedes_ids: [...current, sede.id]});
                      } else {
                        setFormData({...formData, sedes_ids: current.filter(id => id !== sede.id)});
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="font-semibold">{sede.nombre}</span>
                </label>
              ))}
              {todasSedes.length === 0 && (
                <div className="text-xs text-slate-500 italic">No hay sedes creadas en el sistema.</div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 pt-6 border-t border-slate-100">
            <button 
              type="button" 
              onClick={closeModal}
              className="w-1/2 bg-slate-100 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving || !formData.nombre}
              className="w-1/2 bg-indigo-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md shadow-indigo-600/20"
            >
              {isSaving ? 'Guardando...' : (editId ? 'Actualizar' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
