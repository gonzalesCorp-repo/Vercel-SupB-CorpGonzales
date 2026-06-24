'use client';

import { useState, useEffect } from 'react';
import { Search, UserPlus, Users, Phone, CreditCard, ExternalLink } from 'lucide-react';
import { Cliente, obtenerTodosLosClientes, buscarClientes, crearCliente } from '@/services/clientes';
import Link from 'next/link';

export default function DirectorioPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Nuevo Cliente form
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
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Directorio de Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">Busca, administra y registra nuevos perfiles de clientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Buscador y Lista */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-grow">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, DNI o celular..." 
                  className="w-full text-sm border border-gray-300 rounded-lg p-3 pl-10 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              </div>
              <button 
                type="submit" 
                disabled={isSearching}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSearching ? 'Buscando...' : 'Buscar'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> 
                Resultados
              </h3>
              <span className="text-xs bg-gray-200 text-gray-700 py-1 px-2.5 rounded-full font-medium">
                {clientes.length} encontrados
              </span>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-10 text-center text-gray-500">Cargando directorio...</div>
              ) : clientes.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  <p>No se encontraron clientes.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                    <tr>
                      <th className="px-5 py-3">Cliente</th>
                      <th className="px-5 py-3">Contacto</th>
                      <th className="px-5 py-3">DNI / Doc</th>
                      <th className="px-5 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clientes.map(cli => (
                      <tr key={cli.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900">{cli.nombre}</td>
                        <td className="px-5 py-3">
                          {cli.celular ? (
                            <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-gray-400"/> {cli.celular}</span>
                          ) : <span className="text-gray-400 italic">Sin celular</span>}
                        </td>
                        <td className="px-5 py-3">
                          {cli.dni ? (
                            <span className="flex items-center gap-1.5"><CreditCard className="w-3 h-3 text-gray-400"/> {cli.dni}</span>
                          ) : <span className="text-gray-400 italic">-</span>}
                        </td>
                        <td className="px-5 py-3">
                          <Link href="/recepcion" className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 text-xs bg-blue-50 px-2 py-1 rounded w-max transition-colors">
                            Generar OATC <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Nuevo Cliente */}
        <div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Registrar Nuevo</h3>
            </div>
            
            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo *</label>
                <input 
                  type="text" 
                  value={nuevoCliente.nombre}
                  onChange={e => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Celular</label>
                <input 
                  type="text" 
                  value={nuevoCliente.celular || ''}
                  onChange={e => setNuevoCliente({...nuevoCliente, celular: e.target.value})}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">DNI / Documento</label>
                <input 
                  type="text" 
                  value={nuevoCliente.dni || ''}
                  onChange={e => setNuevoCliente({...nuevoCliente, dni: e.target.value})}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSaving || !nuevoCliente.nombre}
                className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cliente'}
              </button>
              
              {successMsg && (
                <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 mt-3 text-center font-medium">
                  {successMsg}
                </div>
              )}
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
