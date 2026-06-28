import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, User } from 'lucide-react';
import { Agente } from '@/services/recepcion';

interface AgentSearchProps {
  agentes: Agente[];
  selectedAgenteId: string;
  onSelectAgente: (id: string) => void;
}

export default function AgentSearch({ agentes, selectedAgenteId, onSelectAgente }: AgentSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredAgentes = agentes.filter(agente => {
    const searchLower = searchTerm.toLowerCase();
    return (
      agente.nombre.toLowerCase().includes(searchLower) ||
      (agente as any).especialidad?.toLowerCase().includes(searchLower)
    );
  });

  const selectedAgente = agentes.find(a => a.id === selectedAgenteId);

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className="flex items-center justify-between w-full p-2 border border-slate-300 rounded-lg cursor-text focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-white"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-2 flex-1">
          {isOpen ? (
            <Search className="w-4 h-4 text-slate-400" />
          ) : selectedAgenteId === '' ? (
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="w-3 h-3 text-slate-400" />
            </div>
          ) : (
            <div className="bg-indigo-100 text-indigo-800 text-xs font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm border border-indigo-200">
              {agentes.findIndex(a => a.id === selectedAgenteId) + 1}
            </div>
          )}
          
          <input
            type="text"
            className="w-full text-sm outline-none placeholder:text-slate-400 text-slate-800"
            placeholder={isOpen ? "Buscar por nombre o especialidad..." : (selectedAgenteId === '' ? "A Lista de Espera General" : selectedAgente?.nombre)}
            value={isOpen ? searchTerm : ''}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {/* Opcion por defecto */}
            <li 
              className={`px-3 py-2 cursor-pointer text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${selectedAgenteId === '' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700'}`}
              onClick={() => {
                onSelectAgente('');
                setIsOpen(false);
                setSearchTerm('');
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span>A Lista de Espera General</span>
              </div>
              {selectedAgenteId === '' && <Check className="w-4 h-4" />}
            </li>
            
            {filteredAgentes.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-slate-500">
                No se encontraron agentes
              </li>
            )}
            
            {filteredAgentes.map((agente, index) => {
              // Calcular el indice original para mantener el numero de turno coherente
              const originalIndex = agentes.findIndex(a => a.id === agente.id);
              
              return (
                <li 
                  key={agente.id}
                  className={`px-3 py-2 cursor-pointer text-sm flex items-center justify-between hover:bg-slate-50 transition-colors border-t border-slate-50 ${selectedAgenteId === agente.id ? 'bg-indigo-50/50 text-indigo-900 font-medium' : 'text-slate-700'}`}
                  onClick={() => {
                    onSelectAgente(agente.id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 text-slate-700 text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-sm border border-slate-200">
                      {originalIndex + 1}
                    </div>
                    <div className="flex flex-col">
                      <span>{agente.nombre}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{agente.estado}</span>
                        {(agente as any).especialidad && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[150px]" title={(agente as any).especialidad}>
                            {(agente as any).especialidad}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedAgenteId === agente.id && <Check className="w-4 h-4 text-indigo-600" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
