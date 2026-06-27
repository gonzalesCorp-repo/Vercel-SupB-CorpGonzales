'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, PauseCircle, PlayCircle, Clock, FileText, CheckCircle, XCircle, Inbox, Power } from 'lucide-react';
import { obtenerTodosLosAgentes, cambiarEstadoAgente } from '@/services/agentes';
import { Agente } from '@/services/recepcion';
import { obtenerPeticionesPendientesPorSede, resolverPeticion, Peticion } from '@/services/peticiones';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '@/components/ui/Modal';
import { OATC, obtenerOatcsActivosDelDia } from '@/services/recepcion';

export default function QueueMonitor() {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [peticiones, setPeticiones] = useState<Peticion[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [activeOATCs, setActiveOATCs] = useState<OATC[]>([]);
  
  const supabase = createClient();

  const cargarDatos = async () => {
    setIsRefreshing(true);
    const [dataAgentes, dataPeticiones] = await Promise.all([
      obtenerTodosLosAgentes(),
      obtenerPeticionesPendientesPorSede()
    ]);
    setAgentes(dataAgentes);
    setPeticiones(dataPeticiones);
    setIsRefreshing(false);
  };

  useEffect(() => {
    cargarDatos();
    
    const channelAgentes = supabase.channel('realtime-agentes-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agentes' }, () => cargarDatos())
      .subscribe();
      
    const channelPeticiones = supabase.channel('realtime-peticiones-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cola_peticiones' }, () => cargarDatos())
      .subscribe();
      
    return () => {
      supabase.removeChannel(channelAgentes);
      supabase.removeChannel(channelPeticiones);
    };
  }, []);

  const handleResolver = async (pet: Peticion, estado: 'APROBADO' | 'RECHAZADO') => {
    const es_operativo = pet.agentes?.rol === 'STAFF';
    const penaliza_cola = pet.config_peticiones?.penaliza_cola || false;
    
    await resolverPeticion(pet.id, estado, pet.agente_id, penaliza_cola, es_operativo);
    
    // Si aprueba y NO penaliza, le ponemos el badge
    if (estado === 'APROBADO' && !penaliza_cola) {
      await supabase.from('agentes').update({ badge: pet.config_peticiones?.nombre }).eq('id', pet.agente_id);
    }

    cargarDatos();
  };

  const handleCambiarEstadoManual = async (id: string, estado: string) => {
    await cambiarEstadoAgente(id, estado);
    cargarDatos();
  };

  const handleClearBadge = async (id: string) => {
    await supabase.from('agentes').update({ badge: null }).eq('id', id);
    cargarDatos();
  };

  const handleCerrarDia = async () => {
    setIsRefreshing(true);
    const oatcsData = await obtenerOatcsActivosDelDia();
    setActiveOATCs(oatcsData);
    setIsRefreshing(false);
    setShowAuditModal(true);
  };

  const handleForzarCierre = async () => {
    if (confirm('¿Forzar el cierre? Esto vaciará la cola y cancelará atenciones colgadas.')) {
      setIsRefreshing(true);
      await supabase.from('agentes').update({ estado: 'INACTIVO', badge: null }).neq('estado', 'INACTIVO');
      // Podriamos tambien iterar y cerrar OATCs pero por ahora reseteamos cola
      setShowAuditModal(false);
      cargarDatos();
    }
  };

  const agentesEnCola = agentes.filter(a => a.estado !== 'INACTIVO' && a.estado !== 'ADMINISTRATIVO');

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[600px]">
      
      {/* HEADER COLA */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            Monitor de Cola
          </h3>
          <p className="text-xs text-slate-500 font-medium">Asistencia y Disponibilidad en Piso</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleCerrarDia}
            className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors border border-purple-100 font-medium text-sm shadow-sm"
            title="Auditoría de Cierre (Timbre)"
          >
            <Power className="w-4 h-4" />
            <span className="hidden sm:inline">Timbre de Cierre</span>
          </button>
          <button 
            onClick={cargarDatos}
            className="p-2 bg-white text-slate-500 rounded-lg hover:bg-slate-100 hover:text-indigo-600 transition-colors border border-slate-200 shadow-sm"
            title="Refrescar Cola"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* BUZON DE ENTRADA (WFM INBOX) */}
      {peticiones.length > 0 && (
        <div className="bg-indigo-50 border-b border-indigo-100 p-4 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Inbox className="w-5 h-5 text-indigo-600" />
            <h4 className="font-bold text-indigo-900 text-sm">Buzón de Solicitudes WFM ({peticiones.length})</h4>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {peticiones.map(pet => (
              <div key={pet.id} className="bg-white p-3 rounded-xl shadow-sm border border-indigo-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-sm">{pet.agentes?.nombre} <span className="text-xs text-slate-400 font-normal">({pet.agentes?.rol})</span></div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${pet.config_peticiones?.color}`}>
                      {pet.config_peticiones?.nombre}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Hace {formatDistanceToNow(new Date(pet.created_at), { locale: es })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleResolver(pet, 'RECHAZADO')} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                    <XCircle className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleResolver(pet, 'APROBADO')} className="p-1.5 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors shadow-sm bg-emerald-50/50">
                    <CheckCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LISTA DE AGENTES EN COLA ACTIVA */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4">
        {agentesEnCola.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
            <Clock className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">La cola de piso está vacía.</p>
            <p className="text-xs text-slate-400 max-w-[250px] mt-2">Los agentes deben enviar su solicitud de Inicio de Turno para aparecer aquí.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agentesEnCola.map((agente, index) => {
              const colors = getStatusColor(agente.estado);
              const isDisp = agente.estado === 'DISPONIBLE';
              
              return (
                <div 
                  key={agente.id} 
                  className={`bg-white rounded-xl border-l-4 ${colors.border} border-y border-r border-slate-200 shadow-sm overflow-hidden flex flex-col`}
                >
                  <div className={`px-4 py-3 ${colors.bgHdr} flex justify-between items-center`}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="bg-white text-slate-800 text-xs font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm border border-slate-100">
                          {index + 1}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm">{agente.nombre}</h4>
                      </div>
                    </div>
                    
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${colors.badgeBg} ${colors.badgeTxt}`}>
                      {agente.estado}
                    </span>
                  </div>

                  <div className={`px-4 py-3 flex items-center justify-between bg-white border-t border-slate-50`}>
                    <div className="flex flex-col gap-1">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        En turno
                      </div>
                      
                      {/* BADGE DE ALERTA "PASAR LA VOZ" */}
                      {(agente as any).badge && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 animate-pulse">
                            🚨 {(agente as any).badge}
                          </span>
                          <button 
                            onClick={() => handleClearBadge(agente.id)}
                            className="text-[10px] text-slate-400 hover:text-red-500 font-bold underline"
                          >
                            Quitar alerta
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {isDisp ? (
                        <button onClick={() => handleCambiarEstadoManual(agente.id, 'REFRIGERIO')} className="p-1.5 text-slate-400 hover:bg-orange-50 hover:text-orange-600 rounded-md transition-colors" title="Pasar a Refrigerio">
                          <PauseCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => handleCambiarEstadoManual(agente.id, 'DISPONIBLE')} className="p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-md transition-colors" title="Retornar a Disponible">
                          <PlayCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleCambiarEstadoManual(agente.id, 'INACTIVO')} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors" title="Sacar de Cola (Fin de Turno)">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal isOpen={showAuditModal} onClose={() => setShowAuditModal(false)} title="Auditoría de Cierre (Timbre)">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Revisa los elementos colgados antes de forzar el cierre del día. Lo ideal es que los operarios cierren sus propios tickets.
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h4 className="font-bold text-orange-800 text-sm mb-2">Agentes Aún en Cola ({agentesEnCola.length})</h4>
            <ul className="text-xs text-orange-700 space-y-1 ml-4 list-disc">
              {agentesEnCola.length === 0 ? <li>Ninguno</li> : agentesEnCola.map(a => <li key={a.id}>{a.nombre} ({a.estado})</li>)}
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-bold text-blue-800 text-sm mb-2">Órdenes de Atención sin Finalizar ({activeOATCs.length})</h4>
            <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
              {activeOATCs.length === 0 ? <li>Ninguna</li> : activeOATCs.map(o => <li key={o.id}>{o.cliente_nombre} - {o.agente_nombre || 'Sin Agente'} ({o.estado_proceso})</li>)}
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button onClick={() => setShowAuditModal(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-bold transition-colors">
              Cancelar
            </button>
            <button onClick={handleForzarCierre} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-colors shadow-sm">
              Forzar Cierre de Cola
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
