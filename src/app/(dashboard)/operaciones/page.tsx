'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, RefreshCw } from 'lucide-react';
import { obtenerTicketsAsignados, pedirInsumo, solicitarInicioAtencion, solicitarFinAtencion, actualizarServiciosOatc, validarPin, solicitarPreCobro } from '@/services/operaciones';
import { Bien, obtenerCatalogo } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import PanelWFM from '@/components/wfm/PanelWFM';
import { useUIStore } from '@/store/useUIStore';
import { useAppStore } from '@/store/useAppStore';
import RecursosPanel from './components/RecursosPanel';

// Sub-componentes refactorizados
import PinValidationModal from '@/components/operaciones/PinValidationModal';
import AddServiceModal from '@/components/operaciones/AddServiceModal';
import OperacionesHistorialTab from '@/components/operaciones/OperacionesHistorialTab';
import TicketOperativoCard, { OATCExtended } from '@/components/operaciones/TicketOperativoCard';

type PendingAction = 'START_ATTENTION' | 'END_ATTENTION' | 'PRE_COBRO' | null;

export default function WorkspaceOperativoPage() {
  const [tickets, setTickets] = useState<OATCExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPersonalMode, setIsPersonalMode] = useState(false);
  const [miAgenteId, setMiAgenteId] = useState('');
  const supabase = createClient();
  const router = useRouter();
  const { showAlert } = useUIStore();
  const sedeActiva = useAppStore((state) => state.sedeActiva);

  // Modales
  const [showLabModal, setShowLabModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);

  // Seguridad PIN
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedOatc, setSelectedOatc] = useState<OATCExtended | null>(null);

  // Catálogo Real
  const [catalogo, setCatalogo] = useState<Bien[]>([]);
  const [searchCat, setSearchCat] = useState('');

  // Lab
  const [insumo, setInsumo] = useState('');
  const [cabinaSolicitante, setCabinaSolicitante] = useState('');
  const [isEnviando, setIsEnviando] = useState(false);
  const [mensajeOk, setMensajeOk] = useState('');

  // Historial & Tabs
  const [activeTab, setActiveTab] = useState<'piso' | 'historial'>('piso');
  const [historialTickets, setHistorialTickets] = useState<any[]>([]);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);
  const [isKioskoTablet, setIsKioskoTablet] = useState(false);

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
          setTimeout(() => router.push('/perfil'), 1500);
          return;
        }
        isPersonal = true;
        personalId = agente.id;
      }
    }

    setIsPersonalMode(isPersonal);
    setMiAgenteId(personalId);

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
    const channel = supabase.channel('realtime-operaciones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (activeTab === 'historial') cargarHistorial();
  }, [activeTab, fechaInicio, fechaFin, miAgenteId, sedeActiva]);

  const cargarHistorial = async () => {
    setIsLoadingHistorial(true);
    let query = supabase.from('oatc').select('*')
      .in('estado_proceso', ['FINALIZADO', 'POR_COBRAR', 'PRE_COBRADO', 'CANCELADO'])
      .order('created_at', { ascending: false });

    if (isPersonalMode && miAgenteId) {
      query = query.eq('agente_id', miAgenteId);
    } else if (sedeActiva?.id) {
      query = query.eq('sede_id', sedeActiva.id);
    }

    if (fechaInicio) query = query.gte('created_at', `${fechaInicio}T00:00:00.000Z`);
    if (fechaFin) query = query.lte('created_at', `${fechaFin}T23:59:59.999Z`);

    const { data, error } = await query;
    if (!error && data) setHistorialTickets(data);
    setIsLoadingHistorial(false);
  };

  const requerirPinParaAccion = async (action: PendingAction, oatc: OATCExtended | null = null) => {
    setPendingAction(action);
    setSelectedOatc(oatc);

    if (isPersonalMode) {
      if (action === 'START_ATTENTION' && oatc?.id) await solicitarInicioAtencion(oatc.id, 'STAFF');
      else if (action === 'END_ATTENTION' && oatc?.id) await solicitarFinAtencion(oatc, 'STAFF');
      else if (action === 'PRE_COBRO' && oatc?.id) await solicitarPreCobro(oatc.id);
      cargarTickets();
      return;
    }

    setPin('');
    setPinError(false);
    setShowPinModal(true);
  };

  const verificarPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) { setPinError(true); return; }
    const agent = await validarPin(pin);
    if (!agent) { setPinError(true); return; }

    setShowPinModal(false);
    setPinError(false);

    if (pendingAction === 'START_ATTENTION' && selectedOatc?.id) await solicitarInicioAtencion(selectedOatc.id, agent.rol);
    else if (pendingAction === 'END_ATTENTION' && selectedOatc?.id) await solicitarFinAtencion(selectedOatc, agent.rol);
    else if (pendingAction === 'PRE_COBRO' && selectedOatc?.id) await solicitarPreCobro(selectedOatc.id);
    cargarTickets();
  };

  const handleActionClick = (oatc: OATCExtended, action: string) => {
    if (action === 'LAB') {
      setSelectedOatc(oatc);
      setShowLabModal(true);
    } else {
      requerirPinParaAccion(action as PendingAction, oatc);
    }
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
        cargarTickets();
        setSelectedOatc({ ...selectedOatc, punto_partida: nuevosServicios });
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
        setSelectedOatc({ ...selectedOatc, punto_partida: currentServicios });
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
      setTimeout(() => { setMensajeOk(''); setShowLabModal(false); }, 2000);
    } else {
      showAlert('Error enviando a Lab', 'error');
    }
    setIsEnviando(false);
  };
  
  const actualizarPrecioServicio = async (index: number, newPrice: number) => {
    if (selectedOatc?.id) {
      const currentServicios = [...(selectedOatc.punto_partida || [])];
      currentServicios[index] = { ...currentServicios[index], precio: newPrice, precio_venta: newPrice, monto: newPrice };
      const ok = await actualizarServiciosOatc(selectedOatc.id, currentServicios);
      if (ok) {
        cargarTickets();
        setSelectedOatc({ ...selectedOatc, punto_partida: currentServicios });
      }
    }
  };

  return (
    <div className={`max-w-7xl mx-auto space-y-6 ${isKioskoTablet ? 'p-2 sm:p-4 bg-slate-900/90 rounded-3xl text-white' : ''}`}>
      {/* Header Modo Quiosco / Tablet */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center p-5 rounded-2xl border shadow-sm gap-4 transition-colors ${
        isKioskoTablet ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3.5 rounded-2xl text-white shadow-lg shadow-indigo-500/30 shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isKioskoTablet ? 'text-white' : 'text-gray-900'}`}>
                Workspace Operativo
              </h1>
              {isKioskoTablet && (
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  📱 Modo Estación
                </span>
              )}
            </div>
            <p className={`text-xs ${isKioskoTablet ? 'text-slate-400' : 'text-gray-500'}`}>
              Control de Piso y Atenciones Asignadas en Vivo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={cargarTickets}
            className={`px-4 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all ${
              isKioskoTablet 
                ? 'bg-slate-800 border-slate-700 text-indigo-300 hover:bg-slate-700' 
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refrescar
          </button>
        </div>
      </div>

      {/* Tabs Principales */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('piso')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'piso'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🎯 Atenciones en Piso ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'historial'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🧪 Solicitud de Recursos / Insumos
        </button>
      </div>

      {/* Atenciones Content */}
      {activeTab === 'piso' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tickets.map((t) => (
            <TicketOperativoCard
              key={t.id}
              oatc={t}
              isPersonalMode={isPersonalMode}
              miAgenteId={miAgenteId}
              handleActionClick={handleActionClick}
              openAddServiceModal={(oatc) => {
                setSelectedOatc(oatc);
                setShowAddServiceModal(true);
              }}
            />
          ))}
          {tickets.length === 0 && !isLoading && (
            <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 space-y-2">
              <span className="text-4xl block">📋</span>
              <p className="font-bold text-gray-800 text-lg">No hay atenciones asignadas</p>
              <p className="text-sm text-gray-500">Los tickets asignados a tu usuario aparecerán aquí en vivo.</p>
            </div>
          )}
        </div>
      )}

      {/* Recursos Content */}
      {activeTab === 'historial' && (
        <div className="h-full">
          <RecursosPanel />
        </div>
      )}

      {/* Modales Refactorizados */}
      <PinValidationModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        pin={pin}
        setPin={setPin}
        pinError={pinError}
        handleConfirmPin={verificarPin}
        pendingAction={pendingAction}
        selectedOatcClienteNombre={selectedOatc?.cliente_nombre}
      />

      <AddServiceModal
        isOpen={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        selectedOatc={selectedOatc}
        catalogo={catalogo}
        searchCat={searchCat}
        setSearchCat={setSearchCat}
        handleAgregarServicio={confirmarNuevoServicio}
        handleRemoverServicio={removerServicio}
        handleUpdatePrecio={actualizarPrecioServicio}
      />

      {/* Modal Laboratorio */}
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
    </div>
  );
}
