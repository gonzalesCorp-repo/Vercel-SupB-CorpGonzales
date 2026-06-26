'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Search, PauseCircle, PlayCircle, UserCheck, UserMinus, Coffee, Clock, FileText } from 'lucide-react';
import { obtenerTodosLosAgentes, cambiarEstadoAgente } from '@/services/agentes';
import { Agente } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { format } from 'date-fns';

export default function QueueMonitor() {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal de Detalle de Agente
  const [selectedAgentForModal, setSelectedAgentForModal] = useState<Agente | null>(null);

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

  const handleRegistrarSalida = async () => {
    if (!selectedAgentId) return;
    await cambiarEstadoAgente(selectedAgentId, 'INACTIVO');
    setSearch('');
    setSelectedAgentId('');
    cargarAgentes();
  };

  const handleCambiarEstado = async (e: React.MouseEvent, id: string, estado: string) => {
    e.stopPropagation(); // Evitar abrir el modal
    await cambiarEstadoAgente(id, estado);
    cargarAgentes();
  };

  const openAgentModal = (agente: Agente) => {
    setSelectedAgentForModal(agente);
  };

  const closeAgentModal = () => {
    setSelectedAgentForModal(null);
  };

  const agentesEnCola = agentes.filter(a => a.estado !== 'INACTIVO');
  const searchResults = agentes.filter(a => a.nombre.toLowerCase().includes(search.toLowerCase()));

  const getStatusColor = (estado: string) => {
    switch(estado) {
      case 'DISPONIBLE': return { border: 'border-emerald-300', bgHdr: 'bg-emerald-50', badgeBg: 'bg-emerald-100', badgeTxt: 'text-emerald-800' };
      case 'ASESORANDO': return { border: 'border-yellow-300', bgHdr: 'bg-yellow-50', badgeBg: 'bg-yellow-100', badgeTxt: 'text-yellow-800' };
      case 'REFRIGERIO': return { border: 'border-orange-300', bgHdr: 'bg-orange-50', badgeBg: 'bg-orange-100', badgeTxt: 'text-orange-800' };
      case 'OCUPADO': 
      case 'TRABAJANDO': return { border: 'border-blue-300', bgHdr: 'bg-blue-50', badgeBg: 'bg-blue-100', badgeTxt: 'text-blue-800' };
      default: return { border: 'border-slate-300', bgHdr: 'bg-slate-50', badgeBg: 'bg-slate-100', badgeTxt: 'text-slate-800' };
    }
  };

  // Mock data for modal details
  const getMockOATCs = () => [
    { id: '1021', cliente: 'María López', servicio: 'Corte Clásico', estado: 'Completado', hora: '10:30 AM' },
    { id: '1025', cliente: 'Juan Pérez', servicio: 'Corte Fade', estado: 'En Transcurso', hora: '11:45 AM' },
  ];

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header Compacto */}
      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 ml-2">Monitor de Cola</h2>
        <button 
          onClick={cargarAgentes} 
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 p-1.5 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Registro de Ingreso/Salida */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
        <div className="relative" ref={dropdownRef}>
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
              placeholder="Buscar agente..." 
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 pr-7 bg-slate-50 outline-none"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
              <Search className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {showDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-40 overflow-y-auto custom-scrollbar">
                {searchResults.map(usr => (
                  <div 
                    key={usr.id}
                    onClick={() => {
                      setSelectedAgentId(usr.id);
                      setSearch(usr.nombre);
                      setShowDropdown(false);
                    }} 
                    className="px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                  >
                    {usr.nombre}
                  </div>
                ))}
                {searchResults.length === 0 && (
                  <div className="px-3 py-2 text-xs text-slate-500 text-center italic">
                    No encontrado
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRegistrarIngreso} 
            disabled={!selectedAgentId}
            className="w-1/2 bg-blue-600 text-white p-2 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Ingreso
          </button>
          <button 
            onClick={handleRegistrarSalida} 
            disabled={!selectedAgentId}
            className="w-1/2 bg-slate-100 text-slate-600 p-2 rounded-lg text-xs font-semibold hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <UserMinus className="w-3.5 h-3.5" />
            Salida
          </button>
        </div>
      </div>

      {/* Cola de Agentes */}
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
        <div className="flex flex-col gap-2.5">
          {agentesEnCola.map((agente, index) => {
            const colors = getStatusColor(agente.estado);
            // Mock de hora de posicionamiento
            const timeStr = format(new Date(new Date().getTime() - (index * 15 * 60000)), 'hh:mm a');

            return (
              <div 
                key={agente.id} 
                onClick={() => openAgentModal(agente)}
                className={`border rounded-xl shadow-sm bg-white overflow-hidden transition-all hover:shadow-md cursor-pointer ${colors.border}`}
              >
                <div className={`p-2.5 flex items-center justify-between ${colors.bgHdr}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 shadow-sm text-xs shrink-0">
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs leading-tight truncate">{agente.nombre}</h4>
                      <p className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" /> {timeStr}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/50 shrink-0 uppercase tracking-wider ${colors.badgeBg} ${colors.badgeTxt}`}>
                    {agente.estado}
                  </span>
                </div>
                
                <div className="px-2.5 py-1.5 bg-slate-50/50 border-t border-slate-100 flex gap-1.5">
                  {agente.estado === 'REFRIGERIO' ? (
                     <button 
                       onClick={(e) => handleCambiarEstado(e, agente.id, 'DISPONIBLE')} 
                       className="flex items-center justify-center gap-1 text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md w-full font-bold border border-emerald-200 transition-colors shadow-sm"
                     >
                       <PlayCircle className="w-3.5 h-3.5" /> Fin Refrigerio
                     </button>
                  ) : agente.estado === 'DISPONIBLE' ? (
                    <>
                      <button 
                        onClick={(e) => handleCambiarEstado(e, agente.id, 'REFRIGERIO')} 
                        className="flex items-center justify-center gap-1 text-[10px] text-orange-700 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2 py-1 rounded-md w-1/2 font-bold transition-colors shadow-sm"
                      >
                        <Coffee className="w-3.5 h-3.5" /> Refrigerio
                      </button>
                      <button 
                        onClick={(e) => handleCambiarEstado(e, agente.id, 'INACTIVO')} 
                        className="flex items-center justify-center gap-1 text-[10px] text-slate-600 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 px-2 py-1 rounded-md w-1/2 font-bold transition-colors shadow-sm"
                      >
                        <PauseCircle className="w-3.5 h-3.5" /> Pausar
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={(e) => handleCambiarEstado(e, agente.id, 'DISPONIBLE')} 
                      className="flex items-center justify-center gap-1 text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md w-full font-bold border border-emerald-200 transition-colors shadow-sm"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Liberar Agente
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {agentesEnCola.length === 0 && (
            <div className="col-span-full text-center py-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
              <p className="text-slate-500 text-xs font-bold">No hay agentes en turno.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalle de Agente */}
      {selectedAgentForModal && (
        <Modal
          isOpen={!!selectedAgentForModal}
          onClose={closeAgentModal}
          title={`Detalle: ${selectedAgentForModal.nombre}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-5 mt-2">
            
            {/* Panel de Horarios */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" /> 
                Registro Horario (Hoy)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Hora Llegada</p>
                  <p className="text-sm font-black text-slate-800">08:45 AM</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Hora Salida</p>
                  <p className="text-sm font-black text-slate-400 italic">-- : --</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 shadow-sm">
                  <p className="text-[10px] text-orange-600 font-bold uppercase">Inicio Refrigerio</p>
                  <p className="text-sm font-black text-orange-900">01:00 PM</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 shadow-sm">
                  <p className="text-[10px] text-orange-600 font-bold uppercase">Fin Refrigerio</p>
                  <p className="text-sm font-black text-orange-900">01:45 PM</p>
                </div>
              </div>
            </div>

            {/* Panel de OATCs */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" /> 
                Atenciones (OATCs) Asignadas
              </h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {getMockOATCs().map(oatc => (
                  <div key={oatc.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-slate-800">{oatc.cliente}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${oatc.estado === 'Completado' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {oatc.estado}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-slate-600 font-medium">{oatc.servicio}</p>
                      <span className="text-[10px] text-slate-400 font-bold">{oatc.hora}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
