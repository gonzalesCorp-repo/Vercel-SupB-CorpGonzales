'use client';

import { useState, useEffect } from 'react';
import { Search, UserPlus, Users, Phone, CreditCard, CheckCircle2, Plus } from 'lucide-react';
import { Cliente, obtenerTodosLosClientes, buscarClientes, crearCliente } from '@/services/clientes';
import { Modal } from '@/components/ui/Modal';

export default function DirectorioPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState<Cliente>({ nombre: '', dni: '', celular: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const cargarClientes = async () => {
    setIsLoading(true);
    const data = await obtenerTodosLosClientes();
    setClientes(data);
    setIsLoading(false);
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      cargarClientes();
      return;
    }
    
    setIsSearching(true);
    const results = await buscarClientes(searchQuery);
    setClientes(results);
    setIsSearching(false);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCliente.nombre) return;
    
    setIsSaving(true);
    const res = await crearCliente(nuevoCliente);
    if (res) {
      setSuccessMsg('¡Cliente registrado con éxito!');
      setNuevoCliente({ nombre: '', dni: '', celular: '' });
      cargarClientes();
      setTimeout(() => {
        setSuccessMsg('');
        setIsModalOpen(false);
      }, 2000);
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 min-h-[calc(100vh-4rem)] bg-slate-50">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Directorio de Clientes</h1>
            <p className="text-sm text-slate-500">Busca, administra y registra nuevos perfiles de clientes.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 text-sm text-white bg-indigo-600 px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md font-semibold"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-grow">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, DNI o celular..." 
              className="w-full text-sm border border-slate-300 rounded-xl p-3.5 pl-11 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 outline-none transition-all"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          </div>
          <button 
            type="submit" 
            disabled={isSearching}
            className="bg-slate-800 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-900 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Resultados de Búsqueda
          </h3>
          <span className="text-xs bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full font-bold">
            {clientes.length} encontrados
          </span>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Cargando directorio...</div>
          ) : clientes.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <Search className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-bold text-lg text-slate-700">Sin resultados</p>
              <p className="text-sm">No se encontraron clientes con esos criterios.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Nombre Completo</th>
                  <th className="px-6 py-4">Documento (DNI/RUC)</th>
                  <th className="px-6 py-4">Celular / Teléfono</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientes.map(c => (
                  <tr key={c.id} className="hover:bg-indigo-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{c.nombre}</div>
                      <div className="text-[10px] text-slate-400 uppercase mt-0.5 tracking-wider">Cliente Habitual</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        {c.dni || <span className="text-slate-400 italic font-normal">No registrado</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {c.celular || <span className="text-slate-400 italic font-normal">No registrado</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Nuevo Cliente */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Cliente"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleGuardar} className="space-y-4 mt-4">
          {successMsg && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100 text-sm flex items-center justify-center gap-2 font-bold mb-4">
              <CheckCircle2 className="w-5 h-5" />
              {successMsg}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Nombre Completo *</label>
            <input 
              type="text" 
              value={nuevoCliente.nombre}
              onChange={e => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
              className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              required
              placeholder="Ej. María López"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Documento (DNI/CE/RUC)</label>
            <input 
              type="text" 
              value={nuevoCliente.dni || ''}
              onChange={e => setNuevoCliente({...nuevoCliente, dni: e.target.value})}
              className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Ej. 12345678"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Celular / WhatsApp</label>
            <input 
              type="tel" 
              value={nuevoCliente.celular || ''}
              onChange={e => setNuevoCliente({...nuevoCliente, celular: e.target.value})}
              className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Ej. 987654321"
            />
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
              disabled={isSaving || !nuevoCliente.nombre}
              className="w-1/2 bg-indigo-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md shadow-indigo-600/20"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
