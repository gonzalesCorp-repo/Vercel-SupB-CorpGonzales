'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, PauseCircle, PlayCircle, Clock, FileText, CheckCircle, XCircle, Inbox, Power, Filter } from 'lucide-react';
import { cambiarEstadoAgente } from '@/services/agentes';
import { Agente, obtenerAgentesDisponibles } from '@/services/recepcion';
import { obtenerPeticionesPendientesPorSede, resolverPeticion, Peticion } from '@/services/peticiones';
import { useAppStore } from '@/store/useAppStore';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '@/components/ui/Modal';
import { OATC, obtenerOatcsActivosDelDia } from '@/services/recepcion';

export default function QueueMonitor() {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [peticiones, setPeticiones] = useState<Peticion[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showAllAgents, setShowAllAgents] = useState(false);
  const [activeOATCs, setActiveOATCs] = useState<OATC[]>([]);
  
  const { sedeActiva } = useAppStore();
  const supabase = createClient();

  const cargarDatos = async () => {
    setIsRefreshing(true);
    try {
      const [dataAgentes, dataPeticiones] = await Promise.all([
        obtenerAgentesDisponibles(),
        obtenerPeticionesPendientesPorSede()
      ]);
      setAgentes(dataAgentes);
      setPeticiones(dataPeticiones);
    } catch (error) {
      console.error("Error al cargar datos en QueueMonitor:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    
    // Subscripciones (Idealmente filtradas por sedeId si la tabla lo soporta)
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
  }, [sedeActiva?.id]);

  const handleResolver = async (pet: Peticion, estado: 'APROBADO' | 'RECHAZADO') => {
    try {
      await resolverPeticion(pet, estado);
      
      if (estado === 'APROBADO' && pet.config_peticiones?.estado_destino !== 'INACTIVO') {
        const { error } = await supabase.from('agentes').update({ badge: pet.config_peticiones?.nombre }).eq('id', pet.agente_id);
        if (error) console.error("Error actualizando badge:", error);
      }
    } catch (error) {
      console.error("Error al resolver peticion:", error);
    } finally {
      cargarDatos();
    }
  };

  const handleCambiarEstadoManual = async (id: string, estado: string) => {
    try {
      await cambiarEstadoAgente(id, estado);
      cargarDatos();
    } catch (error: any) {
      console.error(error);
      alert('Error cambiando estado: ' + error.message);
    }
  };

  const handleClearBadge = async (id: string) => {
    try {
      const { error } = await supabase.from('agentes').update({ badge: null }).eq('id', id);
      if (error) console.error("Error al limpiar badge:", error);
    } catch (err) {
      console.error(err);
    } finally {
      cargarDatos();
    }
  };

  const handleCerrarDia = async () => {
    setIsRefreshing(true);
    const oatcsData = await obtenerOatcsActivosDelDia();
    setActiveOATCs(oatcsData);
    setIsRefreshing(false);
    setShowAuditModal(true);
  };

  const handleForzarCierre = async () => {
    if (confirm('¿Forzar el cierre de esta sede? Esto vaciará la cola y cancelará atenciones colgadas solo para los operarios de esta sucursal.')) {
      setIsRefreshing(true);
      try {
        const ids = agentes.map(a => a.id);
        if (ids.length > 0) {
          const { error } = await supabase
            .from('agentes')
            .update({ estado: 'INACTIVO', badge: null })
            .in('id', ids)
            .neq('estado', 'INACTIVO');
            
          if (error) throw error;
        }
        setShowAuditModal(false);
      } catch (error: any) {
        alert('Error forzando cierre: ' + error.message);
      } finally {
        cargarDatos();
      }
    }
  };

  const agentesEnCola = agentes
    .filter(a => a.estado !== 'INACTIVO' && (showAllAgents ? true : a.rol === 'STAFF'))
    .sort((a, b) => {
      // Ordenar por tiempo de ingreso a la cola (los que más tiempo llevan esperando van primero)
      const timeA = new Date((a as any).ultimo_cambio_estado || a.created_at).getTime();
      const timeB = new Date((b as any).ultimo_cambio_estado || b.created_at).getTime();
      return timeA - timeB;
    });
  const agentesColgados = agentes.filter(a => a.estado !== 'INACTIVO');

  const getStatusColor = (estado: string) => {
    switch(estado) {
      case 'DISPONIBLE': return { border: 'border-emerald-300', bgHdr: 'bg-emerald-50', badgeBg: 'bg-emerald-100', badgeTxt: 'text-emerald-800' };
      case 'ASESORANDO': return { border: 'border-yellow-300', bgHdr: 'bg-yellow-50', badgeBg: 'bg-yellow-100', badgeTxt: 'text-yellow-800' };
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
            onClick={() => setShowAllAgents(!showAllAgents)}
            className={`p-2 rounded-lg transition-colors border shadow-sm flex items-center justify-center ${showAllAgents ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            title="Mostrar todos los usuarios"
          >
            <Filter className="w-4 h-4" />
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
                  <div className="font-bold text-slate-800 text-sm">{(pet as any).agente?.nombre || 'Buscando...'} <span className="text-xs text-slate-400 font-normal">({(pet as any).agente?.rol || ''})</span></div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${pet.config_peticiones?.color}`}>
                      {pet.config_peticiones?.nombre}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {format(new Date(pet.created_at), 'hh:mm a')} • Hace {formatDistanceToNow(new Date(pet.created_at), { locale: es })}
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
              const isOperativo = agente.rol === 'STAFF';
              
              // Calcular el número real de turno (solo para operativos)
              let numTurno = '-';
              if (isOperativo) {
                // Contar cuántos STAFF hay antes o en este index
                const priorStaff = agentesEnCola.slice(0, index + 1).filter(a => a.rol === 'STAFF');
                numTurno = priorStaff.length.toString();
              }
              
              return (
                <div 
                  key={agente.id} 
                  className={`bg-white rounded-xl border-l-4 ${colors.border} border-y border-r border-slate-200 shadow-sm overflow-hidden flex flex-col`}
                >
                  <div className={`px-4 py-3 ${colors.bgHdr} flex justify-between items-center`}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="bg-white text-slate-800 text-xs font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm border border-slate-100">
                          {numTurno}
                        </span>
                      <div className="flex flex-col min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate pr-2">{agente.nombre}</h4>
                        {(agente as any).especialidad && (
                          <span className="text-[10px] font-medium text-slate-500 leading-tight pr-2 line-clamp-2" title={(agente as any).especialidad}>
                            {(agente as any).especialidad}
                          </span>
                        )}
                      </div>
                      </div>
                    </div>
                    
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${colors.badgeBg} ${colors.badgeTxt}`}>
                      {agente.estado}
                    </span>
                  </div>

                  <div className={`px-4 py-3 flex items-center justify-between bg-white border-t border-slate-50`}>
                    <div className="flex flex-col gap-1">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {(agente as any).ultimo_cambio_estado ? format(new Date((agente as any).ultimo_cambio_estado), 'hh:mm a') : 'Reciente'}
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
                      <button 
                        onClick={() => handleCambiarEstadoManual(agente.id, isDisp ? 'OCUPADO' : 'DISPONIBLE')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                      >
                        {isDisp ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4 text-emerald-600" />}
                      </button>
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
            <h4 className="font-bold text-orange-800 text-sm mb-2">Agentes Aún en Cola ({agentesColgados.length})</h4>
            <ul className="text-xs text-orange-700 space-y-1 ml-4 list-disc">
              {agentesColgados.length === 0 ? <li>Ninguno</li> : agentesColgados.map(a => <li key={a.id}>{a.nombre} ({a.estado})</li>)}
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
