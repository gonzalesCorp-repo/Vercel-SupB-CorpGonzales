'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { buscarCliente, Cliente } from '@/services/recepcion';

interface ClientSearchProps {
  onSelect: (cliente: Cliente) => void;
  selectedClientName?: string;
}

export default function ClientSearch({ onSelect, selectedClientName }: ClientSearchProps) {
  const [query, setQuery] = useState(selectedClientName || '');
  const [results, setResults] = useState<Cliente[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
      if (query.trim().length >= 3 && query !== selectedClientName) {
        const data = await buscarCliente(query);
        setResults(data);
        setIsOpen(true);
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, selectedClientName]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-xs font-semibold text-gray-700 mb-1">Cliente</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder="Buscar por nombre, DNI o número"
          className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 pr-8 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
          <Search className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {results.map((cli) => (
            <div
              key={cli.id}
              onClick={() => {
                setQuery(cli.nombre);
                setIsOpen(false);
                onSelect(cli);
              }}
              className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
            >
              <span className="font-semibold text-gray-800 text-sm block">{cli.nombre}</span>
              {(cli.dni || cli.celular) && (
                <span className="text-gray-500 text-xs">
                  {cli.dni ? `DNI: ${cli.dni}` : ''}
                  {cli.dni && cli.celular ? ' - ' : ''}
                  {cli.celular ? `Cel: ${cli.celular}` : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
