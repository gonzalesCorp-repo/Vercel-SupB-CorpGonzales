'use client';

import React, { useState, useEffect } from 'react';
import { Search, Users, Building2, UserPlus, Check, X, Phone, CreditCard, Sparkles, MapPin } from 'lucide-react';
import { Cliente, obtenerTodosLosClientes, buscarClientes, crearCliente } from '@/services/clientes';
import { useAppStore } from '@/store/useAppStore';

interface DirectorioClientesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCliente: (cliente: Cliente) => void;
}

export default function DirectorioClientesModal({
  isOpen,
  onClose,
  onSelectCliente
}: DirectorioClientesModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCadenaMode, setIsCadenaMode] = useState(true); // Ver toda la cadena / multisede
  
  // Registro rápido
  const [showNuevoForm, setShowNuevoForm] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoDni, setNuevoDni] = useState('');
  const [nuevoCelular, setNuevoCelular] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const sedeActiva = useAppStore((state) => state.sedeActiva);

  useEffect(() => {
    if (isOpen) {
      cargarClientes();
    }
  }, [isOpen, isCadenaMode]);

  const cargarClientes = async () => {
    setIsSearching(true);
    try {
      const data = await obtenerTodosLosClientes();
      setClientes(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      cargarClientes();
      return;
    }
    setIsSearching(true);
    const results = await buscarClientes(searchQuery);
    setClientes(results || []);
    setIsSearching(false);
  };

  const handleCrearNuevo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    setIsSaving(true);
    try {
      const creado = await crearCliente({
        nombre: nuevoNombre.trim(),
        dni: nuevoDni.trim() || undefined,
        celular: nuevoCelular.trim() || undefined
      });

      if (creado) {
        onSelectCliente(creado);
        onClose();
      }
    } catch (err) {
      console.error('Error creando cliente:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Directorio de Clientes
                <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full uppercase">
                  Multisede
                </span>
              </h3>
              <p className="text-xs text-slate-400">Busca en la cartera de {sedeActiva?.nombre || 'la sede'} y de toda la cadena.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por Nombre, DNI o Teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-indigo-500 transition-all font-medium text-slate-800 dark:text-slate-100"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20"
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
            <button
              type="button"
              onClick={() => setShowNuevoForm(!showNuevoForm)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo</span>
            </button>
          </form>

          {/* Formulario de Creación Rápida */}
          {showNuevoForm && (
            <form onSubmit={handleCrearNuevo} className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block uppercase tracking-wider">
                Registrar Nuevo Cliente en la Cartera
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Nombre y Apellidos *"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  required
                />
                <input
                  type="text"
                  placeholder="DNI / Documento"
                  value={nuevoDni}
                  onChange={(e) => setNuevoDni(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
                <input
                  type="text"
                  placeholder="Celular / WhatsApp"
                  value={nuevoCelular}
                  onChange={(e) => setNuevoCelular(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNuevoForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 font-bold hover:bg-slate-200/50 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !nuevoNombre.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm"
                >
                  {isSaving ? 'Guardando...' : 'Guardar y Seleccionar'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Lista de Resultados */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {clientes.map((c) => (
            <div
              key={c.id || c.dni}
              className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex items-center justify-between transition-all group cursor-pointer"
              onClick={() => {
                onSelectCliente(c);
                onClose();
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                    {c.nombre}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    {c.dni && <span className="font-mono">DNI: {c.dni}</span>}
                    {c.celular && <span>Cel: {c.celular}</span>}
                    {c.sedes?.nombre && (
                      <span className="flex items-center gap-1 text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md font-semibold text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3 h-3" /> {c.sedes.nombre}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="bg-white dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs"
              >
                Seleccionar
              </button>
            </div>
          ))}

          {clientes.length === 0 && !isSearching && (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
              No se encontraron clientes con el criterio de búsqueda.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs text-slate-400">
          <span>{clientes.length} clientes en cartera</span>
          <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Portabilidad Multisede Activa
          </span>
        </div>

      </div>
    </div>
  );
}
