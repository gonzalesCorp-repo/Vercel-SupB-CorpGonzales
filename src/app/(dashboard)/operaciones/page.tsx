'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, PlayCircle, PlusCircle, CheckCircle, RefreshCw, Beaker, Search, Lock, Plus, Trash2, XCircle, CreditCard, Clock, Calendar } from 'lucide-react';
import { obtenerTicketsAsignados, pedirInsumo, PedidoInsumo, solicitarInicioAtencion, solicitarFinAtencion, actualizarServiciosOatc, validarPin, solicitarPreCobro } from '@/services/operaciones';
import { OATC, Bien, obtenerCatalogo } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import PanelWFM from '@/components/wfm/PanelWFM';
import { useUIStore } from '@/store/useUIStore';
import { useAppStore } from '@/store/useAppStore';
import RecursosPanel from './components/RecursosPanel';

// Extendemos OATC localmente para la demo
interface OATCExtended extends OATC {
  estado_ui?: 'Espera' | 'En Curso' | 'Finalizado';
  codigo_ticket?: string;
}

// Tipo de acción pendiente tras el PIN
type PendingAction = 'START_ATTENTION' | 'END_ATTENTION' | 'PRE_COBRO' | null;

export default function WorkspaceOperativoPage() {
  const [tickets, setTickets] = useState<OATCExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPersonalMode, setIsPersonalMode] = useState(false);
  const [miAgenteId, setMiAgenteId] = useState('');
  const supabase = createClient();
  const router = useRouter();
  const { showAlert, showConfirm } = useUIStore();
  const sedeActiva = useAppStore((state) => state.sedeActiva);
  
  // Modales
  const [showLabModal, setShowLabModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  
  // Estados para PIN (Seguridad)
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedOatc, setSelectedOatc] = useState<OATCExtended | null>(null);

  // Catálogo Real
  const [catalogo, setCatalogo] = useState<Bien[]>([]);
  const [searchCat, setSearchCat] = useState('');

  // Estados para Lab
  const [insumo, setInsumo] = useState('');
  const [cabinaSolicitante, setCabinaSolicitante] = useState('');
  const [isEnviando, setIsEnviando] = useState(false);
  const [mensajeOk, setMensajeOk] = useState('');

  // Estados para Historial
  const [activeTab, setActiveTab] = useState<'piso' | 'historial'>('piso');
  const [historialTickets, setHistorialTickets] = useState<any[]>([]);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);

  const cargarTickets = async () => {
    setIsLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    let isPersonal = false;
    let personalId = '';
    
    if (user?.email) {
      const { data: agente } = await supabase.from('agentes').select('id, rol, pin').eq('email', user.email).single();
      if (agente && agente.rol === 'STAFF') {
        if (!agente.pin) {
          showAlert("Aún no has configurado tu PIN Operativo. Por favor créalo ahora.", "warning");
          setTimeout(() => {
            router.push('/perfil');
          }, 1500);
          return;
        }
        isPersonal = true;
        personalId = agente.id;
      }
    }
    
    setIsPersonalMode(isPersonal);
    setMiAgenteId(personalId);

    // Traer tickets y catálogo en paralelo
    const [dataTickets, dataCatalogo] = await Promise.all([
      obtenerTicketsAsignados('ALL'),
      obtenerCatalogo('servicio')
    ]);

    setCatalogo(dataCatalogo);
    setTickets(isPersonal ? dataTickets.filter(t => t.agente_id === personalId) : dataTickets);
    setIsLoading(false);
  };

  useEffect(() => {
    cargarTickets();
    
    // Realtime Suscripción
    const channel = supabase.channel('realtime-operaciones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarTickets())
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'historial') {
      cargarHistorial();
    }
  }, [activeTab, fechaInicio, fechaFin, miAgenteId, sedeActiva]);

  const cargarHistorial = async () => {
    setIsLoadingHistorial(true);
    
    let query = supabase.from('oatc').select('*')
      .in('estado_proceso', ['FINALIZADO', 'POR_COBRAR', 'PRE_COBRADO', 'CANCELADO'])
      .order('created_at', { ascending: false });
      
    if (isPersonalMode && miAgenteId) {
      query = query.eq('agente_id', miAgenteId);
    } else {
      if (sedeActiva?.id) {
        query = query.eq('sede_id', sedeActiva.id);
      }
    }

    if (fechaInicio) query = query.gte('created_at', `${fechaInicio}T00:00:00.000Z`);
    if (fechaFin) query = query.lte('created_at', `${fechaFin}T23:59:59.999Z`);

    const { data, error } = await query;
    if (!error && data) {
      setHistorialTickets(data);
    }
    setIsLoadingHistorial(false);
  };

  // --- Handlers de Acciones de Tarjeta ---

  // --- Flujo Centralizado de PIN (Seguridad) ---

  const requerirPinParaAccion = async (action: PendingAction, oatc: OATCExtended | null = null) => {
    setPendingAction(action);
    setSelectedOatc(oatc);
    
    if (isPersonalMode) {
      // Saltar PIN en modo personal y ejecutar directo como STAFF
      if (action === 'START_ATTENTION' && oatc?.id) {
         await solicitarInicioAtencion(oatc.id, 'STAFF');
      } else if (action === 'END_ATTENTION' && oatc?.id) {
         await solicitarFinAtencion(oatc, 'STAFF');
      } else if (action === 'PRE_COBRO' && oatc?.id) {
         await solicitarPreCobro(oatc.id);
      }
      cargarTickets();
      return;
    }

    setPin('');
    setPinError(false);
    setShowPinModal(true);
  };

  const verificarPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setPinError(true);
      return;
    }

    const agent = await validarPin(pin);
    if (!agent) {
      setPinError(true);
      return;
    }

    setShowPinModal(false);
    setPinError(false);
    
    if (pendingAction === 'START_ATTENTION' && selectedOatc?.id) {
       await solicitarInicioAtencion(selectedOatc.id, agent.rol);
    } else if (pendingAction === 'END_ATTENTION' && selectedOatc?.id) {
       await solicitarFinAtencion(selectedOatc, agent.rol);
    } else if (pendingAction === 'PRE_COBRO' && selectedOatc?.id) {
       await solicitarPreCobro(selectedOatc.id);
    }
    cargarTickets();
  };

  const confirmarNuevoServicio = async (bien: Bien) => {
    if (selectedOatc?.id) {
      const currentServicios = selectedOatc.punto_partida || [];
      const newServicio = {
        servicio_id: bien.id,
        nombre: bien.nombre,
        precio: bien.precio_venta,
        cantidad: 1,
        categoria: bien.categoria,
        tipo_bien: bien.tipo_bien
      };
      
      const nuevosServicios = [...currentServicios, newServicio];
      const ok = await actualizarServiciosOatc(selectedOatc.id, nuevosServicios);
      if (ok) {
        setSearchCat('');
        showAlert("Servicio añadido correctamente.", "success");
        cargarTickets(); // recargar para ver los cambios
        
        // Update local selectedOatc so modal stays up-to-date while open
        setSelectedOatc({...selectedOatc, punto_partida: nuevosServicios});
      } else {
        showAlert("Error añadiendo el servicio.", "error");
      }
    }
  };

  const removerServicio = async (index: number) => {
    if (selectedOatc?.id) {
      const currentServicios = [...(selectedOatc.punto_partida || [])];
      currentServicios.splice(index, 1);
      const ok = await actualizarServiciosOatc(selectedOatc.id, currentServicios);
      if (ok) {
        showAlert("Servicio eliminado correctamente.", "success");
        cargarTickets();
        setSelectedOatc({...selectedOatc, punto_partida: currentServicios});
      }
    }
  };

  const handlePedirInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumo || !selectedOatc?.id || !selectedOatc?.agente_id) return;
    
    setIsEnviando(true);
    
    const pedido = {
      oatc_id: selectedOatc.id,
      agente_id: selectedOatc.agente_id,
      insumos_solicitados: [{ nombre: insumo, ubicacion: cabinaSolicitante }]
    };
    
    const success = await pedirInsumo(pedido);
    
    if (success) {
      setMensajeOk('¡Pedido enviado a Laboratorio!');
      setInsumo('');
      setCabinaSolicitante('');
      setTimeout(() => {
        setMensajeOk('');
        setShowLabModal(false);
      }, 2000);
    } else {
      showAlert('Error enviando a Lab', 'error');
    }
    setIsEnviando(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Modo Quiosco */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-900 p-3 rounded-xl text-white shadow-md">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workspace Operativo</h1>
            <p className="text-sm text-gray-500 font-medium">Panel Compartido - Operaciones de Piso</p>
          </div>
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
          <div className="w-full md:w-auto">
            <PanelWFM isPersonalMode={isPersonalMode} miAgenteId={miAgenteId} />
          </div>
          <button onClick={cargarTickets} className="p-2.5 text-gray-500 bg-gray-100 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition shadow-sm">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-6">
        <button
          onClick={() => setActiveTab('piso')}
          className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
            activeTab === 'piso' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Workspace Operativo
        </button>
        
        {!isPersonalMode && (
          <button 
            onClick={() => setActiveTab('historial')}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'historial' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="w-4 h-4" /> Recursos
          </button>
        )}
      </div>

      {/* Contenido Atenciones en Piso */}
      {activeTab === 'piso' && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-gray-800">Atenciones en Piso</h2>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
        
        {isLoading ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-gray-200">Cargando...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-gray-200 shadow-sm text-gray-500 font-medium">
            No hay atenciones activas en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tickets.map(ticket => {
              const isEnCurso = ticket.estado_proceso === 'EN_CURSO' || ticket.estado_proceso === 'PRE_COBRADO';
              
              return (
                <div key={ticket.id} className={`bg-white rounded-2xl border ${isEnCurso ? 'border-indigo-200 shadow-md' : 'border-gray-200 shadow-sm'} overflow-hidden transition-all`}>
                  
                  {/* Info Header */}
                  <div className={`p-4 border-b ${isEnCurso ? 'bg-indigo-50' : 'bg-gray-50'} flex justify-between items-start`}>
                      <div>
                        {ticket.codigo_ticket && (
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            {ticket.codigo_ticket}
                          </span>
                        )}
                        <h3 className="text-xl font-black text-gray-800 mt-0.5">{ticket.cliente_nombre}</h3>
                        <p className="text-sm text-gray-600 mt-1"><span className="font-semibold text-gray-400">Atendido por:</span> {ticket.agente_nombre}</p>
                      </div>
                     <div>
                       {ticket.estado_proceso === 'PENDIENTE_CONFIRMACION' ? (
                         <span className="px-3 py-1 bg-orange-100 text-orange-700 font-bold text-xs rounded-full uppercase tracking-widest flex items-center gap-1">
                           <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span> Autorización Pndte
                         </span>
                       ) : isEnCurso ? (
                         <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-xs rounded-full uppercase tracking-widest flex items-center gap-1">
                           <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> {ticket.estado_proceso === 'PRE_COBRADO' ? 'Pagado y En Curso' : 'En Curso'}
                         </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 font-bold text-xs rounded-full uppercase tracking-widest">
                            {ticket.estado_proceso === 'ASESORIA' ? 'Asesoría' : ticket.estado_proceso || 'En Espera'}
                          </span>
                        )}
                     </div>
                  </div>

                  {/* Servicios */}
                  <div className="p-4 bg-white">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Servicios Solicitados</p>
                    <ul className="space-y-1 mb-4">
                        {ticket.punto_partida?.map((srv: any, i: number) => (
                          <li key={i} className="flex justify-between items-center text-sm font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                            <span>{srv.nombre}</span>
                            <span className="text-gray-400 font-bold">x{srv.cantidad || 1}</span>
                          </li>
                        ))}
                    </ul>
                    
                    {/* Panel de Botones Táctiles */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      
                      {!isEnCurso && ticket.estado_proceso !== 'PENDIENTE_INICIO' && (
                        <button 
                          onClick={() => requerirPinParaAccion('START_ATTENTION', ticket)}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                          <PlayCircle className="w-5 h-5" /> Iniciar
                        </button>
                      )}

                      {isEnCurso && ticket.estado_proceso !== 'PENDIENTE_TERMINO' && (
                        <>
                          <button 
                            onClick={() => { setSelectedOatc(ticket); setShowAddServiceModal(true); }}
                            className="flex-1 bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 text-gray-600 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                          >
                            <PlusCircle className="w-5 h-5" /> Extra / Editar
                          </button>
                          
                          <button 
                            onClick={() => { setSelectedOatc(ticket); setShowLabModal(true); }}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                            title="Laboratorio"
                          >
                            <Beaker className="w-5 h-5" /> Lab
                          </button>
                          
                          {ticket.estado_pago !== 'Pagado' && ticket.estado_pago !== 'COBRADO' && ticket.estado_proceso !== 'PENDIENTE_PRE_COBRO' && ticket.estado_proceso !== 'PRE_COBRADO' && (
                            <button 
                              onClick={() => requerirPinParaAccion('PRE_COBRO', ticket)}
                              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                            >
                              <CreditCard className="w-5 h-5" /> Pre-Cobrar
                            </button>
                          )}
                          
                          <button 
                            onClick={() => requerirPinParaAccion('END_ATTENTION', ticket)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                          >
                            <CheckCircle className="w-5 h-5" /> Terminar
                          </button>
                        </>
                      )}
                      
                      {ticket.estado_proceso === 'PENDIENTE_INICIO' && (
                         <div className="w-full text-center text-sm font-bold text-indigo-600 bg-indigo-50 py-3 rounded-xl border border-indigo-200 animate-pulse">
                           ⏳ Esperando autorización para Iniciar...
                         </div>
                      )}
                      {ticket.estado_proceso === 'PENDIENTE_PRE_COBRO' && (
                         <div className="w-full text-center text-sm font-bold text-orange-600 bg-orange-50 py-3 rounded-xl border border-orange-200 animate-pulse">
                           ⏳ Esperando autorización de Pre-Cobro...
                         </div>
                      )}
                      {ticket.estado_proceso === 'PENDIENTE_TERMINO' && (
                         <div className="w-full text-center text-sm font-bold text-emerald-600 bg-emerald-50 py-3 rounded-xl border border-emerald-200 animate-pulse">
                           ⏳ Esperando autorización para Terminar...
                         </div>
                      )}
                      
                      {ticket.cambios_pendientes?.motivo_rechazo && (
                        <div className="w-full mt-2 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                          <p className="flex items-center gap-1"><XCircle className="w-4 h-4" /> Solicitud Rechazada</p>
                          <p className="font-normal mt-1">{ticket.cambios_pendientes.motivo_rechazo}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </>
      )}

      {/* Contenido Recursos (Portal de Empleados) */}
      {activeTab === 'historial' && (
        <div className="h-full">
          <RecursosPanel />
        </div>
      )}

      {/* MODAL GLOBAL DE SEGURIDAD: Solicitar PIN */}
      <Modal isOpen={showPinModal} onClose={() => setShowPinModal(false)} title="Autorización Requerida" maxWidth="max-w-sm">
        <form onSubmit={verificarPin} className="space-y-5 mt-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-4 rounded-full text-red-600">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          <h3 className="font-bold text-gray-800 text-lg">Ingrese su PIN Operativo</h3>
          <p className="text-sm text-gray-500">
            {pendingAction === 'START_ATTENTION' 
              ? `Autorización para INICIAR el servicio de ${selectedOatc?.cliente_nombre}.`
              : pendingAction === 'END_ATTENTION'
              ? `Autorización para TERMINAR el servicio de ${selectedOatc?.cliente_nombre}.`
              : pendingAction === 'PRE_COBRO'
              ? `Autorización para PRE-COBRAR a ${selectedOatc?.cliente_nombre}.`
              : `Autorización requerida.`}
          </p>
          
          <input 
            type="password" 
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full text-center text-3xl tracking-[1em] font-black border-b-2 border-gray-300 focus:border-indigo-600 focus:outline-none py-2 bg-transparent"
            autoFocus
          />
          {pinError && <p className="text-red-500 text-sm font-bold">PIN incorrecto. Intente nuevamente.</p>}

          <button 
             type="submit" 
             className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-colors shadow-md"
           >
             Verificar y Continuar
           </button>
        </form>
      </Modal>

      {/* MODAL: Solicitud a Laboratorio */}
      <Modal isOpen={showLabModal} onClose={() => setShowLabModal(false)} title="Solicitud a Laboratorio (Autorizada)" maxWidth="max-w-md">
        <form onSubmit={handlePedirInsumo} className="space-y-5 mt-2">
           <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Insumo Necesario</label>
             <input 
               type="text" 
               value={insumo}
               onChange={(e) => setInsumo(e.target.value)}
               placeholder="Ej: Tinte Rubio 7.1, Oxidante 20vol..." 
               className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
               required
               autoFocus
             />
           </div>
           <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Ubicación / Cabina Solicitante</label>
             <input 
               type="text" 
               value={cabinaSolicitante}
               onChange={(e) => setCabinaSolicitante(e.target.value)}
               placeholder="Ej: Tocador 4, Cabina VIP..." 
               className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
               required
             />
           </div>
           
           {mensajeOk && (
             <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm font-bold border border-emerald-200 text-center">
               {mensajeOk}
             </div>
           )}

           <button 
             type="submit" 
             disabled={isEnviando}
             className="w-full bg-orange-600 text-white font-bold py-3.5 rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-md text-lg"
           >
             {isEnviando ? 'Enviando...' : 'Enviar Solicitud Urgente'}
           </button>
        </form>
      </Modal>

      {/* MODAL: Añadir/Editar Servicio */}
      <Modal isOpen={showAddServiceModal} onClose={() => setShowAddServiceModal(false)} title={`Servicios de: ${selectedOatc?.cliente_nombre}`} maxWidth="max-w-xl">
        <div className="space-y-4 mt-2">
           
           <h3 className="font-bold text-gray-700">Servicios Actuales</h3>
           <div className="space-y-2 mb-6">
             {selectedOatc?.punto_partida?.map((srv: any, idx: number) => (
               <div key={idx} className="flex justify-between items-center p-3 border border-gray-200 rounded-xl bg-gray-50">
                 <div>
                   <p className="font-bold text-gray-800">{srv.nombre}</p>
                   <p className="text-xs text-gray-500">Precio: ${srv.precio}</p>
                 </div>
                 <button onClick={() => removerServicio(idx)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Eliminar servicio">
                   <Trash2 className="w-5 h-5" />
                 </button>
               </div>
             ))}
             {(!selectedOatc?.punto_partida || selectedOatc.punto_partida.length === 0) && (
               <p className="text-sm text-gray-500 italic">No hay servicios asociados.</p>
             )}
           </div>

           <hr className="border-gray-200" />
           <h3 className="font-bold text-gray-700 mt-4">Añadir Nuevo Servicio</h3>

           <div className="relative mb-4">
              <input 
                type="text" 
                value={searchCat}
                onChange={(e) => setSearchCat(e.target.value)}
                placeholder="Buscar en catálogo..." 
                className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 bg-gray-50" 
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
           </div>
           
           <div className="space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
             {catalogo
               .filter(b => b.nombre.toLowerCase().includes(searchCat.toLowerCase()))
               .map((bien) => (
               <div key={bien.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer">
                 <div>
                   <p className="font-bold text-gray-800">{bien.nombre}</p>
                   <p className="text-xs text-gray-500">Precio Ref: ${bien.precio_venta}</p>
                 </div>
                 <button onClick={() => confirmarNuevoServicio(bien)} className="bg-indigo-100 text-indigo-700 p-2 rounded-lg hover:bg-indigo-200 transition-colors" title="Añadir">
                   <Plus className="w-5 h-5" />
                 </button>
               </div>
             ))}
             {catalogo.length === 0 && (
               <p className="text-center text-gray-500 py-4">No hay servicios disponibles.</p>
             )}
           </div>
        </div>
      </Modal>

    </div>
  );
}
