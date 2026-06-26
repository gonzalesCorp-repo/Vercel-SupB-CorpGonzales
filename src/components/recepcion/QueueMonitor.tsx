'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Search, PauseCircle, PlayCircle, UserCheck } from 'lucide-react';
import { obtenerTodosLosAgentes, cambiarEstadoAgente } from '@/services/agentes';
import { Agente } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';

export default function QueueMonitor() {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  const cargarAgentes = async () => {
    setIsRefreshing(true);
    const data = await obtenerTodosLosAgentes();
    setAgentes(data);
    setIsRefreshing(false);
  };

  useEffect(() => {
    cargarAgentes();
    
    // Realtime Suscripción
    const channel = supabase.channel('realtime-agentes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agentes' }, () => {
        cargarAgentes();
      })
      .subscribe();
      
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRegistrarIngreso = async () => {
    if (!selectedAgentId) return;
    await cambiarEstadoAgente(selectedAgentId, 'DISPONIBLE');
    setSearch('');
    setSelectedAgentId('');
    cargarAgentes();
  };

  const handleCambiarEstado = async (id: string, estado: string) => {
    await cambiarEstadoAgente(id, estado);
    cargarAgentes();
  };

  // Filtrar agentes en turno (excluir inactivos/fuera de turno si es necesario, 
  // en la versión anterior mostraba todos los que están en la cola)
  // Asumiremos que si están en la lista es porque están activos, o podemos mostrar solo los no INACTIVO
  const agentesEnCola = agentes.filter(a => a.estado !== 'INACTIVO');

  // Para el dropdown de búsqueda, mostramos todos
  const searchResults = agentes.filter(a => a.nombre.toLowerCase().includes(search.toLowerCase()));

  const getStatusColor = (estado: string) => {
    switch(estado) {
      case 'DISPONIBLE': return { border: 'border-green-300', bgHdr: 'bg-green-50', badgeBg: 'bg-green-100', badgeTxt: 'text-green-800' };
      case 'ASESORANDO': return { border: 'border-yellow-300', bgHdr: 'bg-yellow-50', badgeBg: 'bg-yellow-100', badgeTxt: 'text-yellow-800' };
      case 'OCUPADO': 
      case 'TRABAJANDO': return { border: 'border-blue-300', bgHdr: 'bg-blue-50', badgeBg: 'bg-blue-100', badgeTxt: 'text-blue-800' };
      default: return { border: 'border-gray-300', bgHdr: 'bg-gray-50', badgeBg: 'bg-gray-100', badgeTxt: 'text-gray-800' };
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Monitor de Cola (Agentes)</h2>
        <button 
          onClick={cargarAgentes} 
          disabled={isRefreshing}
          className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>
      
      {/* Registro de Ingreso */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-end gap-3">
        <div className="flex-grow w-full relative" ref={dropdownRef}>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Registrar Ingreso de Agente</label>
          <div className="relative">
            <input 
              type="text" 
              value={selectedAgentId ? (agentes.find(a => a.id === selectedAgentId)?.nombre || '') : search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedAgentId('');
                setShowDropdown(true);
              }}
              onFocus={() => { setShowDropdown(true); setSearch(''); }}
              placeholder="Buscar o seleccionar agente..." 
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 pr-8 bg-gray-50"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>

            {showDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {searchResults.map(usr => (
                  <div 
                    key={usr.id}
                    onClick={() => {
                      setSelectedAgentId(usr.id);
                      setSearch(usr.nombre);
                      setShowDropdown(false);
                    }} 
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                  >
                    {usr.nombre}
                  </div>
                ))}
                {searchResults.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center italic">
                    No se encontraron agentes
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={handleRegistrarIngreso} 
          disabled={!selectedAgentId}
          className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center justify-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          Registrar Ingreso
        </button>
      </div>

      {/* Cola de Agentes */}
      <div className="flex-grow overflow-y-auto mt-2 custom-scrollbar pr-1">
        <div className="flex flex-col gap-3">
          {agentesEnCola.map((agente, index) => {
            const colors = getStatusColor(agente.estado);
            return (
              <div key={agente.id} className={`border rounded-xl shadow-sm bg-white overflow-hidden transition-all hover:shadow-md ${colors.border}`}>
                <div className={`p-3 flex items-center justify-between ${colors.bgHdr}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 shadow-sm text-xs shrink-0">
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">{agente.nombre}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">Especialista</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/50 shrink-0 ${colors.badgeBg} ${colors.badgeTxt}`}>
                    {agente.estado}
                  </span>
                </div>
                
                <div className="px-3 py-2 bg-slate-50/50 border-t border-slate-100 flex gap-2">
                  {agente.estado === 'DISPONIBLE' ? (
                    <button 
                      onClick={() => handleCambiarEstado(agente.id, 'INACTIVO')} 
                      className="flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg w-full font-semibold transition-colors shadow-sm"
                    >
                      <PauseCircle className="w-4 h-4" /> Pausar / Salir
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleCambiarEstado(agente.id, 'DISPONIBLE')} 
                      className="flex items-center justify-center gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg w-full font-semibold border border-emerald-200 transition-colors shadow-sm"
                    >
                      <PlayCircle className="w-4 h-4" /> Volver a Disponible
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {agentesEnCola.length === 0 && (
            <div className="col-span-full text-center py-10 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
              <p className="text-gray-500 text-sm font-medium">No hay agentes en turno.</p>
              <p className="text-gray-400 text-xs mt-1">Busca y registra el ingreso de un agente arriba.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
