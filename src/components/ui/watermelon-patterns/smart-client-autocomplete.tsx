'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, User, Phone, CreditCard, Sparkles, Plus, 
  Check, X, Award, Clock, ArrowRight, Loader2 
} from 'lucide-react';
import { buscarClientes, crearCliente, Cliente } from '@/services/clientes';
import { useUIStore } from '@/store/useUIStore';
import { useAppStore } from '@/store/useAppStore';

export interface SmartClientAutocompleteProps {
  onSelect: (cliente: Cliente | null) => void;
  selectedClient?: Cliente | null;
  placeholder?: string;
  className?: string;
}

export function SmartClientAutocomplete({
  onSelect,
  selectedClient = null,
  placeholder = 'Buscar cliente por DNI, Nombre o Celular...',
  className = '',
}: SmartClientAutocompleteProps) {
  const [query, setQuery] = useState(selectedClient?.nombre || '');
  const [results, setResults] = useState<Cliente[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingQuick, setIsCreatingQuick] = useState(false);
  const [quickNombre, setQuickNombre] = useState('');
  const [quickDni, setQuickDni] = useState('');
  const [quickCelular, setQuickCelular] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const { showAlert } = useUIStore();
  const sedeActiva = useAppStore((state) => state.sedeActiva);

  useEffect(() => {
    if (selectedClient) {
      setQuery(selectedClient.nombre);
    }
  }, [selectedClient]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    if (selectedClient && query === selectedClient.nombre) {
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const data = await buscarClientes(trimmed);
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.error('[SmartClientAutocomplete] Error buscando:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, selectedClient]);

  const handleSelect = (client: Cliente) => {
    setQuery(client.nombre);
    setIsOpen(false);
    onSelect(client);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSelect(null);
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNombre.trim()) {
      showAlert('El nombre del cliente es obligatorio', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const nuevo = await crearCliente({
        nombre: quickNombre.trim(),
        dni: quickDni.trim() || undefined,
        celular: quickCelular.trim() || undefined,
        sede_id: sedeActiva?.id || null,
      });

      if (nuevo) {
        showAlert(`Cliente ${nuevo.nombre} registrado con éxito`, 'success');
        handleSelect(nuevo);
        setIsCreatingQuick(false);
        setQuickNombre('');
        setQuickDni('');
        setQuickCelular('');
      } else {
        showAlert('No se pudo registrar el cliente', 'error');
      }
    } catch (err: any) {
      showAlert(`Error creando cliente: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative w-full font-sans ${className}`} ref={containerRef}>
      {/* Input de Búsqueda */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedClient && e.target.value !== selectedClient.nombre) {
              onSelect(null);
            }
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 shadow-inner transition"
        />

        {isLoading ? (
          <Loader2 className="w-4 h-4 text-indigo-500 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Dropdown de Resultados Inteligentes */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-50 p-2 space-y-1 max-h-72 overflow-y-auto"
          >
            {results.length > 0 ? (
              results.map((c) => {
                const isSelected = selectedClient?.id === c.id;
                return (
                  <div
                    key={c.id || c.dni || c.nombre}
                    onClick={() => handleSelect(c)}
                    className={`p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {c.nombre}
                          </h4>
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            VIP
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {c.dni && (
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-slate-400" /> {c.dni}
                            </span>
                          )}
                          {c.celular && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {c.celular}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1" />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No se encontró ningún cliente registrado como &ldquo;{query}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuickNombre(query);
                    setIsCreatingQuick(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Registrar &ldquo;{query}&rdquo; en 1-Click</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Creación Rápida en 1-Click */}
      <AnimatePresence>
        {isCreatingQuick && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreatingQuick(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Registro Rápido de Cliente
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreatingQuick(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={quickNombre}
                    onChange={(e) => setQuickNombre(e.target.value)}
                    placeholder="Ej. Valeria Montes"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      DNI (Opcional)
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={quickDni}
                      onChange={(e) => setQuickDni(e.target.value.replace(/\D/g, ''))}
                      placeholder="71234567"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Celular (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      maxLength={9}
                      value={quickCelular}
                      onChange={(e) => setQuickCelular(e.target.value.replace(/\D/g, ''))}
                      placeholder="987654321"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !quickNombre.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-lg transition active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar & Seleccionar Cliente</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
