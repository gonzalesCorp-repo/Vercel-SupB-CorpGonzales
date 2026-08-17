'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Users, BookOpen } from 'lucide-react';
import { buscarCliente, Cliente } from '@/services/recepcion';
import DirectorioClientesModal from './DirectorioClientesModal';

interface ClientSearchProps {
  onSelect: (cliente: Cliente | null) => void;
  selectedClientName?: string;
}

export default function ClientSearch({ onSelect, selectedClientName }: ClientSearchProps) {
  const [query, setQuery] = useState(selectedClientName || '');
  const [results, setResults] = useState<Cliente[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showDirectorioModal, setShowDirectorioModal] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selectedClientName || '');
  }, [selectedClientName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2 && query !== selectedClientName) {
        const data = await buscarCliente(query);
        setResults(data);
        setIsOpen(true);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, selectedClientName]);

  const handleSelectClienteDirecto = (cli: Cliente) => {
    setQuery(cli.nombre);
    setIsOpen(false);
    onSelect(cli);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value === '') {
                onSelect(null);
              }
            }}
            onFocus={() => { if (results.length > 0) setIsOpen(true); }}
            placeholder="Buscar por nombre, DNI o celular..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-xl p-2.5 pr-8 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onSelect(null);
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Botón Lupa / Directorio Multisede */}
        <button
          type="button"
          onClick={() => setShowDirectorioModal(true)}
          title="Abrir Directorio Multisede de Clientes"
          className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl transition flex items-center justify-center gap-1 shrink-0"
        >
          <Search className="w-4 h-4" />
          <span className="text-[10px] font-bold hidden sm:inline">Directorio</span>
        </button>
      </div>

      {/* Dropdown autocompletado */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-40 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar p-1">
          {results.map((cli) => (
            <div
              key={cli.id || cli.dni}
              onClick={() => handleSelectClienteDirecto(cli)}
              className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl cursor-pointer transition-colors"
            >
              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">{cli.nombre}</span>
              {(cli.dni || cli.celular) && (
                <span className="text-slate-400 text-[10px]">
                  {cli.dni ? `DNI: ${cli.dni}` : ''} {cli.dni && cli.celular ? '• ' : ''} {cli.celular ? `Cel: ${cli.celular}` : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Directorio Multisede */}
      <DirectorioClientesModal
        isOpen={showDirectorioModal}
        onClose={() => setShowDirectorioModal(false)}
        onSelectCliente={handleSelectClienteDirecto}
      />
    </div>
  );
}
