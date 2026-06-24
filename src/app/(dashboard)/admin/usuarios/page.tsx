'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { obtenerTodosLosAgentes, guardarAgente, obtenerTodasLasSedes } from '@/services/admin';
import { Agente } from '@/services/recepcion';

// Extendemos Agente base con campos extra para admin
interface AgenteAdmin extends Agente {
  email?: string;
  rol?: string;
  sedes_ids?: string[];
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<AgenteAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState<Partial<AgenteAdmin>>({
    nombre: '',
    email: '',
    rol: 'STAFF',
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
    setUsuarios(usuariosData as AgenteAdmin[]);
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
      setFormData({ nombre: '', email: '', rol: 'STAFF', sedes_ids: [] });
      setEditId(null);
    }
    
    setIsSaving(false);
  };

  const handleEdit = (user: AgenteAdmin) => {
    setEditId(user.id!);
    setFormData({
      nombre: user.nombre,
      email: user.email || '',
      rol: user.rol || 'STAFF',
      estado: user.estado,
      sedes_ids: user.sedes_ids || []
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p className="text-sm text-gray-500 mt-1">Administra los roles, accesos y estado del personal en el sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Lista de Usuarios */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> 
                Directorio del Staff
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-10 text-center text-gray-500">Cargando usuarios...</div>
              ) : (
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                    <tr>
                      <th className="px-5 py-3">Nombre</th>
                      <th className="px-5 py-3">Correo / Acceso</th>
                      <th className="px-5 py-3">Rol</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usuarios.map(u => (
                      <tr key={u.id} className="hover:bg-indigo-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900">{u.nombre}</td>
                        <td className="px-5 py-3 text-gray-500">
                          {u.email || <span className="italic text-xs text-gray-400">Sin acceso</span>}
                          {u.sedes_ids && u.sedes_ids.length > 0 && (
                            <div className="text-[10px] text-indigo-500 mt-1">{u.sedes_ids.length} sedes asignadas</div>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${u.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {u.rol || 'STAFF'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {u.estado === 'INACTIVO' ? (
                            <span className="flex items-center gap-1 text-red-600 font-semibold text-xs"><XCircle className="w-3 h-3"/> Inactivo</span>
                          ) : (
                            <span className="flex items-center gap-1 text-green-600 font-semibold text-xs"><CheckCircle className="w-3 h-3"/> Activo</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <button onClick={() => handleEdit(u)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition">
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
        </div>

        {/* Columna Derecha: Formulario */}
        <div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {editId ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo *</label>
                <input 
                  type="text" 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico (Para Login)</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nivel de Acceso (Rol)</label>
                <select 
                  value={formData.rol}
                  onChange={e => setFormData({...formData, rol: e.target.value})}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="STAFF">STAFF (Barbero/Estilista)</option>
                  <option value="ADMIN">ADMINISTRADOR</option>
                  <option value="RECEPCION">RECEPCIÓN</option>
                </select>
              </div>

              {editId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado</label>
                  <select 
                    value={formData.estado}
                    onChange={e => setFormData({...formData, estado: e.target.value})}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="DISPONIBLE">ACTIVO (Disponible)</option>
                    <option value="INACTIVO">SUSPENDIDO (Inactivo)</option>
                  </select>
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-700 mb-2">Unidades de Negocio (Sedes)</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {todasSedes.map(sede => (
                    <label key={sede.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
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
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {sede.nombre}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                {editId && (
                  <button 
                    type="button" 
                    onClick={() => { setEditId(null); setFormData({ nombre: '', email: '', rol: 'STAFF', sedes_ids: [] }); }}
                    className="w-1/3 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={isSaving || !formData.nombre}
                  className={`${editId ? 'w-2/3' : 'w-full'} bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50`}
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
