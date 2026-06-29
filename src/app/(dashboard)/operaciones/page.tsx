'use client';

import { useState, useEffect } from 'react';
import { User, PlayCircle, PlusCircle, CheckCircle, RefreshCw, Beaker, Search, Lock, Plus } from 'lucide-react';
import { obtenerTicketsAsignados, terminarAtencion, pedirInsumo, PedidoInsumo, solicitarCambiosOatc } from '@/services/operaciones';
import { OATC, Bien, obtenerCatalogo } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import PanelWFM from '@/components/wfm/PanelWFM';

// Extendemos OATC localmente para la demo
interface OATCExtended extends OATC {
  estado_ui?: 'Espera' | 'En Curso' | 'Finalizado';
  codigo_ticket?: string;
}

// Tipo de acción pendiente tras el PIN
type PendingAction = 'ADD_SERVICE' | 'LAB_REQUEST' | null;

export default function WorkspaceOperativoPage() {
  const [tickets, setTickets] = useState<OATCExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  
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

  const cargarTickets = async () => {
    setIsLoading(true);
    
    // Traer tickets y catálogo en paralelo
    const [dataTickets, dataCatalogo] = await Promise.all([
      obtenerTicketsAsignados('ALL'),
      obtenerCatalogo('servicio')
    ]);

    setCatalogo(dataCatalogo);
    setTickets(dataTickets);
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

  // --- Handlers de Acciones de Tarjeta ---

  const handleIniciarAtencion = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, estado_ui: 'En Curso' } : t));
  };

  const handleEnviarCaja = async (id: string) => {
    if (confirm("¿Enviar esta orden a Caja para finalizar la cobranza?")) {
      setTickets(prev => prev.filter(t => t.id !== id));
      // En producción: await terminarAtencion(id);
    }
  };

  // --- Flujo Centralizado de PIN (Seguridad) ---

  const requerirPinParaAccion = (action: PendingAction, oatc: OATCExtended | null = null) => {
    setPendingAction(action);
    setSelectedOatc(oatc);
    setPin('');
    setPinError(false);
    setShowPinModal(true);
  };

  const verificarPin = (e: React.FormEvent) => {
    e.preventDefault();
    // Validar PIN (Mock: cualquier PIN de 4 dígitos es válido, menos 0000)
    if (pin.length >= 4 && pin !== '0000') {
      setShowPinModal(false);
      setPinError(false);
      
      // Enrutar a la acción correspondiente tras validar seguridad
      if (pendingAction === 'ADD_SERVICE') {
        setShowAddServiceModal(true);
      } else if (pendingAction === 'LAB_REQUEST') {
        setShowLabModal(true);
      }
      
    } else {
      setPinError(true);
    }
  };

  const confirmarNuevoServicio = async (bien: Bien) => {
    if (selectedOatc?.id) {
      const ok = await solicitarCambiosOatc(selectedOatc.id, bien);
      if (ok) {
        setShowAddServiceModal(false);
        setSearchCat('');
        alert("Solicitud enviada a Recepción para su autorización.");
        cargarTickets(); // recargar para ver el cambio de estado
      } else {
        alert("Error solicitando el servicio extra.");
      }
    }
  };

  const handlePedirInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumo || !cabinaSolicitante) return;
    
    setIsEnviando(true);
    // Mock envío
    setTimeout(() => {
      setMensajeOk('¡Pedido enviado a Laboratorio!');
      setInsumo('');
      setCabinaSolicitante('');
      setTimeout(() => {
        setMensajeOk('');
        setShowLabModal(false);
        setPendingAction(null);
      }, 2000);
      setIsEnviando(false);
    }, 1000);
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
            <PanelWFM />
          </div>
          <button 
            onClick={() => requerirPinParaAccion('LAB_REQUEST')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
          >
            <Beaker className="w-5 h-5" />
            Solicitud a Lab
          </button>
          <button onClick={cargarTickets} className="p-2.5 text-gray-500 bg-gray-100 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition shadow-sm">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid de Atenciones Activas */}
      <div className="space-y-4">
        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          Atenciones en Piso
        </h2>
        
        {isLoading ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-gray-200">Cargando...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-gray-200 shadow-sm text-gray-500 font-medium">
            No hay atenciones activas en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tickets.map(ticket => {
              const isEnCurso = ticket.estado_ui === 'En Curso';
              
              return (
                <div key={ticket.id} className={`bg-white rounded-2xl border ${isEnCurso ? 'border-indigo-200 shadow-md' : 'border-gray-200 shadow-sm'} overflow-hidden transition-all`}>
                  
                  {/* Info Header */}
                  <div className={`p-4 border-b ${isEnCurso ? 'bg-indigo-50' : 'bg-gray-50'} flex justify-between items-start`}>
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{ticket.codigo_ticket || 'S/N'}</span>
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
                           <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> En Curso
                         </span>
                       ) : (
                         <span className="px-3 py-1 bg-yellow-100 text-yellow-700 font-bold text-xs rounded-full uppercase tracking-widest">
                           En Espera
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
                          <span>{srv.servicio}</span>
                          <span className="text-gray-400 font-bold">x{srv.cantidad || 1}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Panel de Botones Táctiles */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      
                      {!isEnCurso && ticket.estado_proceso !== 'PENDIENTE_CONFIRMACION' && (
                        <button 
                          onClick={() => ticket.id && handleIniciarAtencion(ticket.id)}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                          <PlayCircle className="w-5 h-5" /> Iniciar
                        </button>
                      )}

                      {isEnCurso && ticket.estado_proceso !== 'PENDIENTE_CONFIRMACION' && (
                        <>
                          <button 
                            onClick={() => requerirPinParaAccion('ADD_SERVICE', ticket)}
                            className="flex-1 bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 text-gray-600 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                          >
                            <PlusCircle className="w-5 h-5" /> Extra
                          </button>
                          <button 
                            onClick={() => ticket.id && handleEnviarCaja(ticket.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                          >
                            <CheckCircle className="w-5 h-5" /> Terminar
                          </button>
                        </>
                      )}
                      
                      {ticket.estado_proceso === 'PENDIENTE_CONFIRMACION' && (
                         <div className="w-full text-center text-sm font-bold text-orange-600 bg-orange-50 py-3 rounded-xl border border-orange-200">
                           ⏳ Recepción debe autorizar los servicios extra añadidos.
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
            {pendingAction === 'ADD_SERVICE' 
              ? `Para modificar la orden de ${selectedOatc?.cliente_nombre}, identifíquese.` 
              : `Autorización requerida para solicitar insumos urgentes.`}
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

      {/* MODAL: Añadir Servicio (Catálogo Real) */}
      <Modal isOpen={showAddServiceModal} onClose={() => setShowAddServiceModal(false)} title={`Añadir a: ${selectedOatc?.cliente_nombre}`} maxWidth="max-w-xl">
        <div className="space-y-4 mt-2">
           <div className="relative mb-4">
              <input 
                type="text" 
                value={searchCat}
                onChange={(e) => setSearchCat(e.target.value)}
                placeholder="Buscar servicio extra..." 
                className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 bg-gray-50" 
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
           </div>
           
           <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
             {catalogo
               .filter(b => b.nombre.toLowerCase().includes(searchCat.toLowerCase()))
               .map((bien) => (
               <div key={bien.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer">
                 <div>
                   <p className="font-bold text-gray-800">{bien.nombre}</p>
                   <p className="text-xs text-gray-500">Precio Ref: ${bien.precio_venta}</p>
                 </div>
                 <button onClick={() => confirmarNuevoServicio(bien)} className="bg-indigo-100 text-indigo-700 p-2 rounded-lg hover:bg-indigo-200 transition-colors">
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
