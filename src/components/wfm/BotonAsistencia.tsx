'use client';

import { useState, useEffect } from 'react';
import { Clock, Loader2, Send } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { obtenerConfigPeticiones, ConfigPeticion } from '@/services/wfmConfig';
import { solicitarAsistencia, obtenerMiPeticionPendiente, Peticion } from '@/services/peticiones';
import { createClient } from '@/lib/supabase/client';

export default function BotonAsistencia() {
  const [configs, setConfigs] = useState<ConfigPeticion[]>([]);
  const [peticionPendiente, setPeticionPendiente] = useState<Peticion | null>(null);
  const [miEstado, setMiEstado] = useState<string>('INACTIVO');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const [confData, miPeticion, agenteData] = await Promise.all([
      obtenerConfigPeticiones(),
      obtenerMiPeticionPendiente(),
      user ? supabase.from('agentes').select('estado').eq('email', user.email).single() : Promise.resolve({ data: null })
    ]);
    setConfigs(confData);
    setPeticionPendiente(miPeticion);
    if (agenteData.data) {
      setMiEstado(agenteData.data.estado);
    }
  };

  useEffect(() => {
    cargarDatos();

    const channelCola = supabase.channel('realtime-cola-operativo')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cola_peticiones' }, () => {
        cargarDatos();
      })
      .subscribe();
      
    const channelAgentes = supabase.channel('realtime-agentes-operativo')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agentes' }, () => {
        cargarDatos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelCola);
      supabase.removeChannel(channelAgentes);
    };
  }, []);

  const handleSolicitar = async (tipo_id: string) => {
    setIsLoading(true);
    try {
      await solicitarAsistencia(tipo_id);
      setIsModalOpen(false);
      await cargarDatos();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (peticionPendiente) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between shadow-sm animate-pulse">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-orange-500" />
          <div>
            <h4 className="font-bold text-orange-800 text-sm">Esperando Aprobación</h4>
            <p className="text-xs text-orange-600">Recepción está revisando tu solicitud de: <b>{peticionPendiente.config_peticiones?.nombre}</b></p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'DISPONIBLE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REFRIGERIO': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'ADMINISTRATIVO': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {miEstado !== 'INACTIVO' && !peticionPendiente && (
        <div className={`px-4 py-2.5 rounded-xl border flex items-center justify-center font-bold text-sm shadow-sm ${getStatusColor(miEstado)}`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${miEstado === 'DISPONIBLE' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`}></span>
            ESTADO: {miEstado}
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
      >
        <Clock className="w-5 h-5" />
        {miEstado === 'INACTIVO' ? 'Marcar Asistencia / Ingreso' : 'Solicitar Permiso WFM'}
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enviar Solicitud a Recepción" maxWidth="max-w-sm">
        <div className="space-y-3">
          <p className="text-sm text-slate-500 mb-4">Selecciona el tipo de permiso o solicitud. Recepción será notificada inmediatamente.</p>
          
          {configs.map(conf => (
            <button
              key={conf.id}
              onClick={() => handleSolicitar(conf.id)}
              disabled={isLoading}
              className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group"
            >
              <div>
                <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-700">{conf.nombre}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5 font-semibold">
                  {conf.penaliza_cola ? 'Sale de la Cola' : 'Mantiene su posición'}
                </div>
              </div>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Send className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
