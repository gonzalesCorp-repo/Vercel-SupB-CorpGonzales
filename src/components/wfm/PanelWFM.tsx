'use client';

import { useState, useEffect } from 'react';
import { Clock, Coffee, LogOut, MoreHorizontal, Loader2, Send, CheckCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { obtenerConfigPeticiones, ConfigPeticion } from '@/services/wfmConfig';
import { solicitarAsistenciaKiosko, obtenerPeticionPendientePorAgente, Peticion, obtenerHistorialWFMDelDia } from '@/services/peticiones';
import { obtenerAgentesDisponibles, Agente } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const CORE_WFM = {
  ASISTENCIA: '11111111-1111-1111-1111-111111111111',
  REFRIGERIO: '22222222-2222-2222-2222-222222222222',
  SALIDA: '33333333-3333-3333-3333-333333333333'
};

interface PanelWFMProps {
  isPersonalMode?: boolean;
  miAgenteId?: string;
}

export default function PanelWFM({ isPersonalMode = false, miAgenteId = '' }: PanelWFMProps) {
  const [configs, setConfigs] = useState<ConfigPeticion[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  
  // Kiosk mode state
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedAgenteId, setSelectedAgenteId] = useState<string>('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Specific agent state after selection
  const [peticionPendiente, setPeticionPendiente] = useState<Peticion | null>(null);
  const [miEstado, setMiEstado] = useState<string>('INACTIVO');
  const [miPosicionCola, setMiPosicionCola] = useState<number | null>(null);
  const [miUltimoCambio, setMiUltimoCambio] = useState<string | null>(null);
  const [historialWfm, setHistorialWfm] = useState<Peticion[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isOtrasOpen, setIsOtrasOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    cargarDatosGenerales();
    
    // We listen to changes to cola and agentes to update UI if a user has selected their profile
    const channelCola = supabase.channel('realtime-cola-wfm')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cola_peticiones' }, () => {
        if (isPersonalMode && miAgenteId) checkAgenteStatus(miAgenteId);
        else if (selectedAgenteId) checkAgenteStatus(selectedAgenteId);
      })
      .subscribe();
      
    const channelAgentes = supabase.channel('realtime-agentes-wfm')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agentes' }, () => {
        if (isPersonalMode && miAgenteId) checkAgenteStatus(miAgenteId);
        else if (selectedAgenteId) checkAgenteStatus(selectedAgenteId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelCola);
      supabase.removeChannel(channelAgentes);
    };
  }, [selectedAgenteId, isPersonalMode, miAgenteId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (peticionPendiente) {
      interval = setInterval(() => {
        const diff = new Date().getTime() - new Date(peticionPendiente.created_at).getTime();
        const left = Math.max(0, 180000 - diff); // 3 minutes
        setTimeLeft(left);
      }, 1000);
    } else {
      setTimeLeft(null);
    }
    return () => clearInterval(interval);
  }, [peticionPendiente]);

  useEffect(() => {
    if (isPersonalMode && miAgenteId) {
      checkAgenteStatus(miAgenteId);
    }
  }, [isPersonalMode, miAgenteId]);

  const cargarDatosGenerales = async () => {
    const [confData, ags] = await Promise.all([
      obtenerConfigPeticiones(),
      obtenerAgentesDisponibles()
    ]);
    setConfigs(confData.filter(c => !Object.values(CORE_WFM).includes(c.id)));
    // Filtramos solo los staff que pueden operar
    setAgentes(ags.filter(a => a.rol === 'STAFF'));
  };

  const checkAgenteStatus = async (agId: string) => {
    const [miPeticion, agenteData, historial, operativosActivos] = await Promise.all([
      obtenerPeticionPendientePorAgente(agId),
      supabase.from('agentes').select('estado, ultimo_cambio_estado').eq('id', agId).single(),
      obtenerHistorialWFMDelDia(agId),
      obtenerAgentesDisponibles() // We reuse this to get the queue
    ]);
    
    setPeticionPendiente(miPeticion);
    if (agenteData.data) {
      setMiEstado(agenteData.data.estado);
      setMiUltimoCambio(agenteData.data.ultimo_cambio_estado);
    }
    setHistorialWfm(historial);
    
    // Calculate Queue Position if DISPONIBLE
    if (agenteData.data?.estado === 'DISPONIBLE') {
      const operativos = operativosActivos
        .filter(a => a.estado !== 'INACTIVO' && a.rol === 'STAFF')
        .sort((a,b) => new Date((a as any).ultimo_cambio_estado || a.created_at).getTime() - new Date((b as any).ultimo_cambio_estado || b.created_at).getTime());
      
      const idx = operativos.findIndex(a => a.id === agId);
      if (idx !== -1) setMiPosicionCola(idx + 1);
      else setMiPosicionCola(null);
    } else {
      setMiPosicionCola(null);
    }
  };

  const handleActionClick = async (actionId: string | null) => {
    if (actionId === 'OTRAS') {
      setIsOtrasOpen(true);
      return;
    }

    if (isPersonalMode && miAgenteId && actionId) {
      // Direct execution without PIN
      setIsLoading(true);
      try {
        await solicitarAsistenciaKiosko(actionId, miAgenteId);
        alert("Solicitud enviada a Recepción.");
        checkAgenteStatus(miAgenteId);
      } catch (err: any) {
        alert(err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setSelectedAction(actionId);
    setSelectedAgenteId('');
    setPin('');
    setPinError(false);
    setIsModalOpen(true);
  };

  const confirmarAccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgenteId) {
      alert("Selecciona tu nombre");
      return;
    }
    if (pin.length < 4 || pin === '0000') {
      setPinError(true);
      return;
    }

    setIsLoading(true);
    try {
      if (selectedAction) {
        await solicitarAsistenciaKiosko(selectedAction, selectedAgenteId);
        setIsModalOpen(false);
        setIsOtrasOpen(false);
        alert("Solicitud enviada a Recepción.");
        checkAgenteStatus(selectedAgenteId);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionName = (id: string | null) => {
    if (id === CORE_WFM.ASISTENCIA) return "Marcar Asistencia";
    if (id === CORE_WFM.REFRIGERIO) return "Refrigerio";
    if (id === CORE_WFM.SALIDA) return "Marcar Salida";
    const found = configs.find(c => c.id === id);
    return found ? found.nombre : '';
  };

  const formatTimeLeft = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getFormatBadge = (hist: Peticion[], targetId: string) => {
    const pet = hist.reverse().find(p => p.tipo_id === targetId && p.estado === 'APROBADO');
    if (!pet || !pet.resolved_at) return null;
    return format(new Date(pet.resolved_at), 'hh:mm a');
  };

  const renderWfmButton = (
    id: string, 
    icon: React.ReactNode, 
    label: string, 
    colorClass: string,
    isLocked: boolean,
    lockedLabel: string
  ) => {
    const isPending = peticionPendiente?.tipo_id === id;
    
    if (isPending) {
      return (
        <button disabled className="flex-1 md:flex-none flex flex-col items-center justify-center gap-1 bg-indigo-50 text-indigo-500 px-4 py-1.5 rounded-xl font-bold border border-indigo-200 shadow-sm opacity-90 cursor-not-allowed min-w-[120px]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Esperando...</span>
          {timeLeft !== null && <span className="text-[10px] font-mono">{formatTimeLeft(timeLeft)}</span>}
        </button>
      );
    }

    if (isLocked) {
      return (
        <button disabled className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-400 px-4 py-2.5 rounded-xl font-bold cursor-not-allowed min-w-[120px]">
          <CheckCircle className="w-5 h-5" />
          <span className="hidden lg:inline">{lockedLabel}</span>
        </button>
      );
    }

    return (
      <button 
        onClick={() => handleActionClick(id)}
        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors shadow-sm min-w-[120px] ${colorClass}`}
      >
        {icon}
        <span className="hidden lg:inline">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Header Info (Queue & Badges) solo en Personal Mode */}
      {isPersonalMode && miEstado !== 'INACTIVO' && (
        <div className="flex flex-wrap items-center gap-4 bg-indigo-50 border border-indigo-100 px-4 py-3 rounded-xl shadow-sm w-full">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-indigo-900 uppercase">Posición en Cola</span>
            <span className="text-xl font-black text-indigo-600">
              {miPosicionCola !== null ? `#${miPosicionCola}` : 'No en cola'}
            </span>
          </div>
          
          <div className="h-8 w-px bg-indigo-200 mx-2 hidden sm:block"></div>
          
          <div className="flex gap-3 text-xs font-medium text-indigo-800">
            {getFormatBadge(historialWfm, CORE_WFM.ASISTENCIA) && (
              <div className="flex flex-col bg-white px-2 py-1 rounded shadow-sm border border-indigo-50">
                <span className="text-[10px] text-slate-500 uppercase">Ingreso</span>
                <span>{getFormatBadge(historialWfm, CORE_WFM.ASISTENCIA)}</span>
              </div>
            )}
            {getFormatBadge(historialWfm, CORE_WFM.REFRIGERIO) && (
              <div className="flex flex-col bg-white px-2 py-1 rounded shadow-sm border border-indigo-50">
                <span className="text-[10px] text-slate-500 uppercase">Refrigerio</span>
                <span>{getFormatBadge(historialWfm, CORE_WFM.REFRIGERIO)}</span>
              </div>
            )}
          </div>
          
          {miUltimoCambio && (
             <div className="ml-auto text-[10px] text-indigo-400 font-medium text-right">
               Actualizado:<br/>{format(new Date(miUltimoCambio), 'hh:mm a')}
             </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap md:flex-nowrap items-center justify-end gap-2 w-full">
        {renderWfmButton(
          CORE_WFM.ASISTENCIA, 
          <Clock className="w-5 h-5" />, 
          "Asistencia", 
          "bg-emerald-100 hover:bg-emerald-200 text-emerald-700",
          miEstado !== 'INACTIVO' && miEstado !== 'REFRIGERIO',
          "Turno Iniciado"
        )}

        {renderWfmButton(
          CORE_WFM.REFRIGERIO, 
          <Coffee className="w-5 h-5" />, 
          "Refrigerio", 
          "bg-orange-100 hover:bg-orange-200 text-orange-700",
          miEstado === 'INACTIVO' || miEstado === 'REFRIGERIO',
          "En Refrigerio"
        )}

        {renderWfmButton(
          CORE_WFM.SALIDA, 
          <LogOut className="w-5 h-5" />, 
          "Salida", 
          "bg-red-100 hover:bg-red-200 text-red-700",
          miEstado === 'INACTIVO',
          "Turno Finalizado"
        )}

      <button 
        onClick={() => handleActionClick('OTRAS')}
        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="hidden lg:inline">Opciones</span>
      </button>
      </div>

      {/* Modal Kiosko Principal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Identificación: ${getActionName(selectedAction)}`} maxWidth="max-w-sm">
        <form onSubmit={confirmarAccion} className="space-y-4">
          <p className="text-sm text-slate-500 mb-2">Selecciona tu nombre e ingresa tu PIN de seguridad para enviar la solicitud.</p>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tu Nombre</label>
            <select 
              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={selectedAgenteId}
              onChange={(e) => {
                setSelectedAgenteId(e.target.value);
                if (e.target.value) checkAgenteStatus(e.target.value);
              }}
              required
            >
              <option value="">-- Seleccionar --</option>
              {agentes.map(ag => (
                <option key={ag.id} value={ag.id}>{ag.nombre}</option>
              ))}
            </select>
          </div>

          {selectedAgenteId && peticionPendiente && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2 shadow-sm animate-pulse">
              <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-bold text-orange-800 text-xs">Petición en curso</h4>
                <p className="text-xs text-orange-600">Recepción está revisando tu solicitud actual. Debes esperar.</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tu PIN</label>
            <input 
              type="password"
              maxLength={4}
              className={`w-full p-3 border rounded-xl text-center text-xl tracking-widest outline-none transition-all ${pinError ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500'}`}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              required
            />
            {pinError && <p className="text-red-500 text-xs mt-1 text-center font-medium">PIN incorrecto (usa cualquier PIN que no sea 0000)</p>}
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !!peticionPendiente || !selectedAgenteId}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Enviar a Recepción
          </button>
        </form>
      </Modal>

      {/* Modal Otras Opciones */}
      <Modal isOpen={isOtrasOpen} onClose={() => setIsOtrasOpen(false)} title="Otras Solicitudes WFM" maxWidth="max-w-sm">
        <div className="space-y-3">
          <p className="text-sm text-slate-500 mb-4">Selecciona el tipo de permiso. Se te pedirá tu PIN a continuación.</p>
          
          {configs.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No hay configuraciones extra creadas por el admin.</p>}
          
          {configs.map(conf => (
            <button
              key={conf.id}
              onClick={() => {
                setIsOtrasOpen(false);
                handleActionClick(conf.id);
              }}
              className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group"
            >
              <div>
                <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-700">{conf.nombre}</div>
              </div>
              <Send className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </button>
          ))}
        </div>
      </Modal>

    </div>
  );
}
