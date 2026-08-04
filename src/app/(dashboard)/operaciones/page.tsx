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
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full uppercase tracking-wider">
                  Modo Tablet Kiosko
                </span>
              )}
            </div>
            <p className={`text-sm font-medium ${isKioskoTablet ? 'text-slate-400' : 'text-gray-500'}`}>
              Estación de Piso y Atención Táctil
            </p>
          </div>
        </div>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsKioskoTablet(!isKioskoTablet)}
            className={`px-4 py-3 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 border transition-all shadow-md ${
              isKioskoTablet
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
            }`}
          >
            📟 {isKioskoTablet ? 'Vista Estándar' : 'Modo Tablet / Tótem'}
          </button>

          <div className="w-full md:w-auto">
            <PanelWFM isPersonalMode={isPersonalMode} miAgenteId={miAgenteId} />
          </div>
          <button onClick={cargarTickets} className="p-3 text-gray-500 bg-gray-100 dark:bg-slate-800 rounded-xl hover:text-indigo-600 transition shadow-sm">
            <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Piso Content */}
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
              {tickets.map((ticket) => (
                <TicketOperativoCard
                  key={ticket.id}
                  oatc={ticket}
                  isPersonalMode={isPersonalMode}
                  miAgenteId={miAgenteId}
                  handleActionClick={handleActionClick}
                  openAddServiceModal={(oatc) => {
                    setSelectedOatc(oatc);
                    setShowAddServiceModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </>
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
