'use client';

import { useState, useEffect } from 'react';
import { 
  RefreshCw, PauseCircle, PlayCircle, Clock, FileText, CheckCircle, 
  XCircle, Inbox, Power, Filter, User, Wifi, ChevronDown, ChevronUp,
  UserPlus, Coffee, AlertCircle, Sparkles, ShieldAlert
} from 'lucide-react';
import { cambiarEstadoAgente } from '@/services/agentes';
import { Agente, obtenerAgentesDisponibles, EstadoOperativoTurno } from '@/services/recepcion';
import { obtenerPeticionesPendientesPorSede, resolverPeticion, Peticion } from '@/services/peticiones';
import { registrarMarcacionManualExcepcion } from '@/services/asistencias';
import { useAppStore } from '@/store/useAppStore';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { useUIStore } from '@/store/useUIStore';
import { Modal } from '@/components/ui/Modal';

interface QueueMonitorProps {
  onSelectAgente?: (agente: Agente) => void;
}

export default function QueueMonitor({ onSelectAgente }: QueueMonitorProps) {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [peticiones, setPeticiones] = useState<Peticion[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllAgents, setShowAllAgents] = useState(false); // Toggle entre Solo STAFF vs STAFF + SOPORTE
  const [showFueraDeTurno, setShowFueraDeTurno] = useState(false);
  
  // Modal de Marcación Manual por Excepción
  const [modalExcepcionOpen, setModalExcepcionOpen] = useState(false);
  const [agenteParaExcepcion, setAgenteParaExcepcion] = useState<Agente | null>(null);
  const [tipoMovExcepcion, setTipoMovExcepcion] = useState<'ENTRADA' | 'INICIO_REFRIGERIO' | 'FIN_REFRIGERIO' | 'SALIDA'>('ENTRADA');
  const [motivoExcepcion, setMotivoExcepcion] = useState('Colaborador sin celular / Batería agotada');
  const [isSubmittingExcepcion, setIsSubmittingExcepcion] = useState(false);

  const [tick, setTick] = useState(0);
  
  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const { showAlert } = useUIStore();
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
    
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    
    const sedeKey = sedeActiva?.id || 'default';
    // Suscripciones en tiempo real a todas las fuentes operativas con namespace por sede
    const channelAsistencias = supabase.channel(`realtime-asistencias-queue-${sedeKey}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asistencias_turnos' }, () => cargarDatos())
      .subscribe();

    const channelOatc = supabase.channel(`realtime-oatc-queue-${sedeKey}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarDatos())
      .subscribe();

    const channelAgentes = supabase.channel(`realtime-agentes-queue-${sedeKey}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agentes' }, () => cargarDatos())
      .subscribe();
      
    const channelPeticiones = supabase.channel(`realtime-peticiones-queue-${sedeKey}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cola_peticiones' }, () => cargarDatos())
      .subscribe();
      
    return () => {
      clearInterval(timer);
      supabase.removeChannel(channelAsistencias);
      supabase.removeChannel(channelOatc);
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

  const handleAbrirModalExcepcion = (agente: Agente) => {
    setAgenteParaExcepcion(agente);
    setTipoMovExcepcion('ENTRADA');
    setMotivoExcepcion('Colaborador sin celular / Batería agotada');
    setModalExcepcionOpen(true);
  };

  const handleGuardarExcepcion = async () => {
    if (!agenteParaExcepcion) return;
    setIsSubmittingExcepcion(true);
    try {
      const res = await registrarMarcacionManualExcepcion({
        agenteId: agenteParaExcepcion.id,
        agenteNombre: agenteParaExcepcion.nombre,
        supervisorNombre: 'Recepción / Admin',
        tipoMovimiento: tipoMovExcepcion,
        motivoExcepcion,
        sedeId: sedeActiva?.id,
        sedeNombre: sedeActiva?.nombre
      });

      if (res.ok) {
        showAlert(res.mensaje, 'success');
        setModalExcepcionOpen(false);
        cargarDatos();
      } else {
        showAlert(res.mensaje, 'error');
      }
    } catch (err: any) {
      showAlert('Error registrando excepción: ' + err.message, 'error');
    } finally {
      setIsSubmittingExcepcion(false);
    }
  };

  // Separar Agentes Activos en Piso vs Fuera de Turno
  const agentesFiltrados = agentes.filter(a => showAllAgents ? true : (a.rol === 'STAFF' || !a.rol));
  
  const agentesEnPiso = agentesFiltrados.filter(a => a.estadoOperativo !== 'FUERA_DE_TURNO');
  const agentesFueraDeTurno = agentesFiltrados.filter(a => a.estadoOperativo === 'FUERA_DE_TURNO');

  const getStatusVisuals = (estadoOperativo?: EstadoOperativoTurno) => {
    switch(estadoOperativo) {
      case 'DISPONIBLE': 
        return { 
          border: 'border-emerald-400', 
          bgHdr: 'bg-emerald-50/80 dark:bg-emerald-950/40', 
          badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
          label: 'DISPONIBLE'
        };
      case 'OCUPADO': 
        return { 
          border: 'border-indigo-400', 
          bgHdr: 'bg-indigo-50/80 dark:bg-indigo-950/40', 
          badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
          label: 'EN ATENCIÓN'
        };
      case 'EN_REFRIGERIO': 
        return { 
          border: 'border-amber-400', 
          bgHdr: 'bg-amber-50/80 dark:bg-amber-950/40', 
          badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
          label: 'EN REFRIGERIO'
        };
      default: 
        return { 
          border: 'border-slate-300', 
          bgHdr: 'bg-slate-50 dark:bg-slate-800', 
          badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
          label: 'FUERA DE TURNO'
        };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full min-h-[600px]">
      
      {/* HEADER COLA */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            Monitor de disponibilidad
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botón Filtro */}
          <button 
            onClick={() => setShowAllAgents(!showAllAgents)}
            className={`p-2 rounded-xl transition-all border shadow-xs flex items-center gap-1 text-xs font-bold ${
              showAllAgents 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' 
                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
            title={showAllAgents ? "Filtrar solo STAFF de piso" : "Mostrar también personal de SOPORTE"}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showAllAgents ? 'Todos' : 'Staff'}</span>
          </button>

          {/* Botón Refrescar */}
          <button 
            onClick={cargarDatos}
            className="p-2 bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 rounded-xl transition border border-slate-200 dark:border-slate-700 shadow-xs"
            title="Refrescar Monitor"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* BUZON DE ENTRADA (WFM INBOX) */}
      {peticiones.length > 0 && (
        <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 p-4 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Inbox className="w-4 h-4 text-indigo-600" />
            <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-xs">Solicitudes WFM ({peticiones.length})</h4>
          </div>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {peticiones.map(pet => (
              <div key={pet.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xs border border-indigo-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                    {(pet as any).agente?.nombre || 'Colaborador'} <span className="text-[10px] text-slate-400">({(pet as any).agente?.rol || ''})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${pet.config_peticiones?.color || 'bg-indigo-100 text-indigo-700'}`}>
                      {pet.config_peticiones?.nombre}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {format(new Date(pet.created_at), 'hh:mm a')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleResolver(pet, 'RECHAZADO')} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg">
                    <XCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleResolver(pet, 'APROBADO')} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg bg-emerald-50/50">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LISTA DE AGENTES ACTIVOS EN PISO */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/30">
        {agentesEnPiso.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center p-6 text-slate-400 space-y-2">
            <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-1" />
            <p className="font-bold text-xs text-slate-600 dark:text-slate-300">La cola de piso está vacía.</p>
            <p className="text-[11px] text-slate-400 max-w-[240px] leading-relaxed">
              Los agentes deben marcar su <strong>Inicio de Turno por Web NFC</strong> para entrar al orden de atención.
            </p>
          </div>
        ) : (
          agentesEnPiso.map((agente, index) => {
            const visual = getStatusVisuals(agente.estadoOperativo);
            const isDisp = agente.estadoOperativo === 'DISPONIBLE';
            const isStaff = agente.rol === 'STAFF' || !agente.rol;
            
            let numTurno = '-';
            if (isStaff && isDisp) {
              const priorDispStaff = agentesEnPiso
                .filter(a => (a.rol === 'STAFF' || !a.rol) && a.estadoOperativo === 'DISPONIBLE');
              const pos = priorDispStaff.findIndex(a => a.id === agente.id);
              numTurno = pos >= 0 ? (pos + 1).toString() : '-';
            }
            
            return (
              <div 
                key={agente.id} 
                className={`bg-white dark:bg-slate-800 rounded-2xl border-l-4 ${visual.border} border-y border-r border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden flex flex-col transition-all hover:shadow-md`}
              >
                <div 
                  className={`px-4 py-3 ${visual.bgHdr} flex justify-between items-center cursor-pointer select-none group`}
                  onClick={() => onSelectAgente && onSelectAgente(agente)}
                  title="Haz clic para ver detalles del colaborador"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-black w-6 h-6 flex items-center justify-center rounded-full shadow-xs border border-slate-200 dark:border-slate-700 shrink-0">
                      {isDisp ? numTurno : '•'}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {agente.nombre}
                      </h4>
                      <span className="text-[10px] font-medium text-slate-400 truncate">
                        {agente.oatcActiva 
                          ? `Atendiendo a: ${agente.oatcActiva.cliente_nombre}` 
                          : (agente.especialidad || (agente.rol === 'SOPORTE' ? 'Personal de Soporte' : 'Especialista'))
                        }
                      </span>
                    </div>
                  </div>
                  
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${visual.badgeBg}`}>
                    {visual.label}
                  </span>
                </div>

                <div className="px-4 py-2 flex items-center justify-between bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/50 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[10px]">
                    <Wifi className="w-3 h-3 text-emerald-500" />
                    <span>{agente.horaUltimaMarcacion ? `Marcación: ${agente.horaUltimaMarcacion}` : 'NFC Verificado'}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleAbrirModalExcepcion(agente)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition text-[10px] font-bold flex items-center gap-1"
                      title="Registrar excepción o cambio manual de turno"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Excepción</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* SECCIÓN COLAPSABLE: FUERA DE TURNO / NO PRESENTES */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setShowFueraDeTurno(!showFueraDeTurno)}
            className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 transition"
          >
            <div className="flex items-center gap-2">
              <span>💤 Fuera de Turno / No Presentes</span>
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] px-2 py-0.2 rounded-full">
                {agentesFueraDeTurno.length}
              </span>
            </div>
            {showFueraDeTurno ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFueraDeTurno && (
            <div className="mt-2 space-y-2">
              {agentesFueraDeTurno.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-2">Todo el equipo contratado está presente en piso.</p>
              ) : (
                agentesFueraDeTurno.map(agente => (
                  <div 
                    key={agente.id}
                    className="p-2.5 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <h5 className="font-bold text-slate-700 dark:text-slate-300 text-xs">{agente.nombre}</h5>
                      <span className="text-[10px] text-slate-400">Sin marcación de entrada hoy</span>
                    </div>

                    <button
                      onClick={() => handleAbrirModalExcepcion(agente)}
                      className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                      title="Registrar entrada manual por supervisor"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Ingreso Manual</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>

      {/* MODAL DE MARCACIÓN MANUAL POR EXCEPCIÓN */}
      {modalExcepcionOpen && agenteParaExcepcion && (
        <Modal
          isOpen={modalExcepcionOpen}
          onClose={() => setModalExcepcionOpen(false)}
          title={`Marcación Manual por Excepción`}
        >
          <div className="space-y-4 text-slate-800 dark:text-slate-100">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Esta acción registrará un evento oficial en <strong>asistencias_turnos</strong> auditado a nombre de Supervisión/Recepción.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Colaborador</label>
              <p className="font-black text-sm text-slate-900 dark:text-white">{agenteParaExcepcion.nombre}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tipo de Movimiento</label>
              <select
                value={tipoMovExcepcion}
                onChange={(e) => setTipoMovExcepcion(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
              >
                <option value="ENTRADA">👋 Entrada (Habilitar en Cola de Piso)</option>
                <option value="INICIO_REFRIGERIO">🍕 Inicio Refrigerio</option>
                <option value="FIN_REFRIGERIO">🔄 Fin Refrigerio (Regreso a Piso)</option>
                <option value="SALIDA">🏁 Salida de Turno</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Motivo de la Excepción</label>
              <input
                type="text"
                value={motivoExcepcion}
                onChange={(e) => setMotivoExcepcion(e.target.value)}
                placeholder="Ej. Batería agotada, extravío temporal de teléfono..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalExcepcionOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarExcepcion}
                disabled={isSubmittingExcepcion}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {isSubmittingExcepcion ? 'Registrando...' : 'Confirmar Marcación'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
