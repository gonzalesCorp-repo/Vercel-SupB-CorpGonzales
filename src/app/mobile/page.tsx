'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, PlayCircle, PlusCircle, CheckCircle, RefreshCw, Beaker, 
  Search, Lock, CreditCard, Clock, LogOut, Shield, DollarSign,
  Check, ArrowRight, Activity, MapPin, Sparkles
} from 'lucide-react';
import { 
  obtenerTicketsAsignados, solicitarInicioAtencion, 
  solicitarFinAtencion, solicitarPreCobro, pedirInsumo 
} from '@/services/operaciones';
import { OATC, Bien, obtenerCatalogo } from '@/services/recepcion';
import { cambiarEstadoAgente } from '@/services/agentes';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/useUIStore';
import { useAppStore } from '@/store/useAppStore';

interface OATCExtended extends OATC {
  codigo_ticket?: string;
  monto_total?: number;
}

export default function DedicatedMobileViewPage() {
  const [activeTab, setActiveTab] = useState<'tickets' | 'wfm' | 'comisiones' | 'perfil'>('tickets');
  const [tickets, setTickets] = useState<OATCExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [agente, setAgente] = useState<any>(null);
  const [estadoActual, setEstadoActual] = useState<string>('DISPONIBLE');
  const [catalogo, setCatalogo] = useState<Bien[]>([]);

  const supabase = createClient();
  const router = useRouter();
  const { showAlert } = useUIStore();
  const sedeActiva = useAppStore((state) => state.sedeActiva);

  const cargarDatosMobile = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      router.push('/login');
      return;
    }

    // Traer datos del agente
    const { data: agenteData } = await supabase
      .from('agentes')
      .select('*')
      .ilike('email', user.email.trim())
      .single();

    if (agenteData) {
      setAgente(agenteData);
      setEstadoActual(agenteData.estado || 'DISPONIBLE');

      // Traer tickets asignados a este operario
      const allTickets = await obtenerTicketsAsignados('ALL');
      const misTickets = allTickets.filter(t => t.agente_id === agenteData.id);
      setTickets(misTickets);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    cargarDatosMobile();

    // Realtime channel
    const channel = supabase.channel('realtime-mobile-view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarDatosMobile())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agentes' }, () => cargarDatosMobile())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!agente) return;
    try {
      await cambiarEstadoAgente(agente.id, nuevoEstado);
      setEstadoActual(nuevoEstado);
      showAlert(`Estado cambiado a ${nuevoEstado}`, 'success');
      cargarDatosMobile();
    } catch (err: any) {
      showAlert(`Error: ${err.message}`, 'error');
    }
  };

  const handleIniciarAtencion = async (oatc: OATCExtended) => {
    if (!oatc.id) return;
    try {
      await solicitarInicioAtencion(oatc.id, agente?.rol || 'STAFF');
      showAlert('Atención iniciada correctamente', 'success');
      cargarDatosMobile();
    } catch (err: any) {
      showAlert(`Error: ${err.message}`, 'error');
    }
  };

  const handleTerminarAtencion = async (oatc: OATCExtended) => {
    if (!oatc.id) return;
    try {
      await solicitarFinAtencion(oatc, agente?.rol || 'STAFF');
      showAlert('Atención completada', 'success');
      cargarDatosMobile();
    } catch (err: any) {
      showAlert(`Error: ${err.message}`, 'error');
    }
  };

  const handlePreCobro = async (oatc: OATCExtended) => {
    if (!oatc.id) return;
    try {
      await solicitarPreCobro(oatc.id);
      showAlert('Pre-cobro solicitado', 'success');
      cargarDatosMobile();
    } catch (err: any) {
      showAlert(`Error: ${err.message}`, 'error');
    }
  };

  const ticketActivo = tickets.find(t => t.estado_proceso === 'EN_CURSO' || t.estado_proceso === 'PRE_COBRADO' || t.estado_proceso === 'ASESORIA');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 select-none">
      
      {/* Top Mobile Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-indigo-500/20">
            {agente?.nombre ? agente.nombre.charAt(0) : 'V'}
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 leading-tight">
              {agente?.nombre || 'Cargando...'}
            </h1>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <MapPin className="w-3 h-3 inline" /> {sedeActiva?.nombre || 'Sede Principal'}
            </span>
          </div>
        </div>

        <button 
          onClick={cargarDatosMobile}
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 active:scale-95 transition-transform"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 space-y-4 max-w-md mx-auto w-full">
        
        {/* Quick WFM Status Selector */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" /> Estado en Piso (WFM)
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              estadoActual === 'DISPONIBLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              estadoActual === 'OCUPADO' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {estadoActual}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button 
              onClick={() => handleCambiarEstado('DISPONIBLE')}
              className={`py-3 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
                estadoActual === 'DISPONIBLE'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              Disponible
            </button>

            <button 
              onClick={() => handleCambiarEstado('PAUSA')}
              className={`py-3 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
                estadoActual === 'PAUSA'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Pausa
            </button>

            <button 
              onClick={() => handleCambiarEstado('INACTIVO')}
              className={`py-3 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 border transition-all active:scale-95 ${
                estadoActual === 'INACTIVO'
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              Fin Turno
            </button>
          </div>
        </section>

        {/* Tab 1: Ticket Activo & Asignaciones */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            {ticketActivo ? (
              <div className="bg-gradient-to-b from-indigo-900/40 to-slate-900 border border-indigo-500/40 rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest">
                      🔥 Atención en Curso
                    </span>
                    <h2 className="text-2xl font-black text-white mt-2">{ticketActivo.cliente_nombre}</h2>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                    {ticketActivo.codigo_ticket || 'TKT-LIVE'}
                  </span>
                </div>

                <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Servicios:</span>
                  {ticketActivo.punto_partida?.map((srv: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm font-semibold text-slate-200">
                      <span>{srv.nombre}</span>
                      <span className="text-indigo-400 font-bold">${srv.precio}</span>
                    </div>
                  ))}
                </div>

                {/* Acciones Móviles Grandes (Touch Targets 56px+) */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button 
                    onClick={() => handlePreCobro(ticketActivo)}
                    className="py-3.5 px-4 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition-all"
                  >
                    <CreditCard className="w-5 h-5" /> Pre-Cobrar
                  </button>

                  <button 
                    onClick={() => handleTerminarAtencion(ticketActivo)}
                    className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <CheckCircle className="w-5 h-5" /> Finalizar
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-200 text-base">Sin atención activa en este momento</h3>
                <p className="text-xs text-slate-400">
                  Mantente en estado <span className="text-emerald-400 font-bold">DISPONIBLE</span> para recibir tu próximo cliente desde Recepción.
                </p>
              </div>
            )}

            {/* Cola de Pendientes */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
                Tus Atenciones Pendientes ({tickets.filter(t => t.estado_proceso !== 'EN_CURSO' && t.estado_proceso !== 'FINALIZADO').length})
              </h3>
              
              {tickets.filter(t => t.estado_proceso !== 'EN_CURSO' && t.estado_proceso !== 'FINALIZADO').map(tkt => (
                <div key={tkt.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{tkt.cliente_nombre}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{tkt.punto_partida?.[0]?.nombre || 'Servicio General'}</p>
                  </div>
                  <button 
                    onClick={() => handleIniciarAtencion(tkt)}
                    className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <PlayCircle className="w-4 h-4" /> Iniciar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Estado WFM */}
        {activeTab === 'wfm' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Registro de Actividad y Piso
            </h3>
            <p className="text-xs text-slate-400">
              Usa los botones superiores para pausar tu turno o indicar disponibilidad a Recepción.
            </p>
          </div>
        )}

        {/* Tab 3: Comisiones del Día */}
        {activeTab === 'comisiones' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" /> Resumen de Productividad
              </h3>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Hoy
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Servicios Realizados</span>
                <p className="text-2xl font-black text-white mt-1">
                  {tickets.filter(t => t.estado_proceso === 'FINALIZADO' || t.estado_proceso === 'PRE_COBRADO').length}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Generado</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  ${tickets.reduce((sum, t) => sum + (t.monto_total || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Mi Perfil */}
        {activeTab === 'perfil' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white mx-auto shadow-xl">
              {agente?.nombre?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">{agente?.nombre}</h3>
              <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">{agente?.rol || 'OPERARIO'}</p>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/login');
                }}
                className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold text-xs rounded-2xl border border-red-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Mobile Navigation Bar (Apple/Android standard 64px) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-2xl border-t border-slate-800 px-6 py-2 flex justify-around items-center max-w-md mx-auto shadow-2xl">
        <button 
          onClick={() => setActiveTab('tickets')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'tickets' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
        >
          <PlayCircle className="w-5 h-5" />
          <span className="text-[10px]">Atención</span>
        </button>

        <button 
          onClick={() => setActiveTab('wfm')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'wfm' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px]">Estado</span>
        </button>

        <button 
          onClick={() => setActiveTab('comisiones')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'comisiones' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px]">Resumen</span>
        </button>

        <button 
          onClick={() => setActiveTab('perfil')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'perfil' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Perfil</span>
        </button>
      </nav>
    </div>
  );
}
