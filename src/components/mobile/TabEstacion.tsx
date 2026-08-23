'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wifi, Beaker, CheckCircle2, Clock, Plus, X, Send, Sparkles, 
  Scale, Users, Layers, UserCheck, Scissors, Tag, Package, DollarSign,
  AlertTriangle, Check, ShieldCheck, ChevronRight, Edit3, Trash2, Calendar, 
  UserPlus, ArrowRight, UserX, User, Coffee
} from 'lucide-react';
import { ModalNfcScan } from './ModalNfcScan';
import { TabCola } from './TabCola';
import { TabBar } from './TabBar';
import { OatcPhaseStepper, FaseOatc } from '@/components/ui/OatcPhaseStepper';
import { ModalCatalogoPicker } from './ModalCatalogoPicker';
import {
  ModalRechazoAsesoria,
  ModalDerivarTicketCruzado,
  ModalEditarPrecioItem,
  ModalSelectorEstacion,
  ModalSolicitarInsumosLab,
  ModalTiempoExposicion
} from './estacion';
import { 
  OatcTicket, ItemTicket, obtenerTicketsDeOatc, crearTicketAnidado, 
  actualizarPrecioItemTicket, cambiarFaseOatc, iniciarServicioConProforma,
  rechazarAsesoria, derivarTicketCruzado, iniciarTiempoExposicionTicket, reanudarServicioTicket, finalizarTicketIndividual
} from '@/services/tickets';
import { createClient } from '@/lib/supabase/client';

interface TabEstacionProps {
  estacionNombre: string;
  agenteNombre: string;
  oatcActiva?: any | null;
  estadoOperativo?: string;
  onMarcarAsistencia?: (nuevoEstado: string, motivo: string) => void;
  onEstacionVinculada: (nombre: string) => void;
  onServicioFinalizado: () => void;
  onRefrescar?: () => void;
}

const ESTACIONES_PREDEFINIDAS = [
  'Sillón #01 (Principal)',
  'Sillón #02 (Principal)',
  'Sillón #03 (Corte)',
  'Sillón #04 (Estación Central)',
  'Lavadero Head Spa #01',
  'Lavadero Head Spa #02',
  'Mesa Manicura #01',
  'Mesa Manicura #02',
  'Cabina Facial / Cosmiatría'
];

const MOTIVOS_RECHAZO = [
  'Presupuesto no aceptado por el cliente',
  'Falta de tiempo del cliente para el servicio completo',
  'Prueba técnica / de sensibilidad no apta',
  'Cliente prefiere reprogramar para otra fecha',
  'Incompatibilidad con tratamiento previo',
  'Otro motivo personalizado'
];

export function TabEstacion({
  estacionNombre,
  agenteNombre,
  oatcActiva,
  estadoOperativo,
  onMarcarAsistencia,
  onEstacionVinculada,
  onServicioFinalizado,
  onRefrescar
}: TabEstacionProps) {
  const [subTab, setSubTab] = useState<'silla' | 'bar' | 'cola'>('silla');
  const [modalNfcOpen, setModalNfcOpen] = useState(false);
  const [modalSelectorEstacionOpen, setModalSelectorEstacionOpen] = useState(false);
  const [modalLabOpen, setModalLabOpen] = useState(false);
  
  // Modales de ciclo de vida
  const [modalRechazoOpen, setModalRechazoOpen] = useState(false);
  const [motivoRechazoSeleccionado, setMotivoRechazoSeleccionado] = useState(MOTIVOS_RECHAZO[0]);
  const [detalleRechazoInput, setDetalleRechazoInput] = useState('');

  // Modal Cross-Selling / Añadir Ticket con Triple Destino
  const [modalAddTicketOpen, setModalAddTicketOpen] = useState(false);
  const [destinoTicket, setDestinoTicket] = useState<'PROPIO' | 'COLEGA' | 'RECEPCION'>('PROPIO');
  const [colegaSeleccionadoId, setColegaSeleccionadoId] = useState('');
  const [colegaSeleccionadoNombre, setColegaSeleccionadoNombre] = useState('');
  const [colaboradoresStaff, setColaboradoresStaff] = useState<any[]>([]);

  // Edición de precio inline
  const [modalEditPrecioOpen, setModalEditPrecioOpen] = useState(false);
  const [editItemTarget, setEditItemTarget] = useState<{ ticketId?: string; itemIndex: number; item: ItemTicket; esProforma?: boolean } | null>(null);
  const [nuevoPrecioInput, setNuevoPrecioInput] = useState<number>(0);
  const [motivoCortesiaInput, setMotivoCortesiaInput] = useState('Cortesía de Fidelización de Cartera');

  const [feedback, setFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tickets, setTickets] = useState<OatcTicket[]>([]);
  const [proformaItems, setProformaItems] = useState<ItemTicket[]>([]);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);

  // Modal Selector de Catálogo Oficial
  const [modalCatalogoOpen, setModalCatalogoOpen] = useState(false);
  const [contextoCatalogo, setContextoCatalogo] = useState<'proforma' | 'cross_selling'>('proforma');

  // Tiempo de Exposición
  const [modalTiempoExposicionOpen, setModalTiempoExposicionOpen] = useState(false);
  const [minutosExposicionInput, setMinutosExposicionInput] = useState<number>(30);
  const [motivoExposicionInput, setMotivoExposicionInput] = useState('Tinte / Coloración Global');
  const [ticketSeleccionadoParaExpo, setTicketSeleccionadoParaExpo] = useState<OatcTicket | null>(null);

  // Formulario para nuevo ítem / ticket
  const [nuevoItemNombre, setNuevoItemNombre] = useState('');
  const [nuevoItemTipo, setNuevoItemTipo] = useState<'servicio' | 'producto'>('servicio');
  const [nuevoItemPrecio, setNuevoItemPrecio] = useState<number>(45);

  // Cargar lista de compañeros staff para derivación
  useEffect(() => {
    const cargarStaff = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('agentes')
        .select('id, nombre, especialidad, rol')
        .eq('estado', 'ACTIVO')
        .order('nombre', { ascending: true });
      if (data) {
        setColaboradoresStaff(data.filter((a: any) => a.nombre !== agenteNombre));
      }
    };
    cargarStaff();
  }, [agenteNombre]);

  // Cargar tickets anidados e inicializar proforma
  const cargarTickets = useCallback(async () => {
    if (!oatcActiva?.id) {
      setTickets([]);
      setProformaItems([]);
      return;
    }
    try {
      const data = await obtenerTicketsDeOatc(oatcActiva.id);
      
      // Auto-inicializar items de proforma si venían en punto_partida
      if (oatcActiva.punto_partida && Array.isArray(oatcActiva.punto_partida)) {
        const itemsInit: ItemTicket[] = oatcActiva.punto_partida.map((p: any) => ({
          nombre: p.nombre,
          tipo: (p.tipo_bien === 'producto' ? 'producto' : 'servicio') as any,
          precio_base: Number(p.precio || p.precio_venta || 0),
          precio_final: Number(p.precio || p.precio_venta || 0),
          cantidad: Number(p.cantidad || 1),
          es_cortesia: false
        }));
        setProformaItems(itemsInit);
      }

      setTickets(data);
    } catch (e) {
      console.warn('Advertencia cargando tickets:', e);
    }
  }, [oatcActiva?.id, oatcActiva?.punto_partida]);

  useEffect(() => {
    cargarTickets();

    if (!oatcActiva?.id) return;
    const supabase = createClient();
    const channel = supabase.channel(`realtime-tickets-${oatcActiva.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc_tickets', filter: `oatc_id=eq.${oatcActiva.id}` }, () => {
        cargarTickets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cargarTickets, oatcActiva?.id]);

  // Cronómetro en vivo
  useEffect(() => {
    if (!oatcActiva?.created_at) {
      setTiempoTranscurrido(0);
      return;
    }
    const calcular = () => {
      const inicio = new Date(oatcActiva.hora_inicio_atencion || oatcActiva.created_at).getTime();
      const min = Math.max(1, Math.floor((Date.now() - inicio) / 60000));
      setTiempoTranscurrido(min);
    };
    calcular();
    const timer = setInterval(calcular, 30000);
    return () => clearInterval(timer);
  }, [oatcActiva?.created_at, oatcActiva?.hora_inicio_atencion]);

  const handleNfcExitoso = (tag: any) => {
    const nombreFinal = tag.nombre || (tag.tipo === 'ESTACION' ? `Estación ${tag.id}` : 'Sillón #04 (Estación Central)');
    onEstacionVinculada(nombreFinal);
    setFeedback(`¡Estación física "${nombreFinal}" validada con Web NFC!`);
    setTimeout(() => setFeedback(''), 3500);
  };

  const handleSeleccionarEstacionManual = (nombre: string) => {
    onEstacionVinculada(nombre);
    setModalSelectorEstacionOpen(false);
    setFeedback(`¡Estación cambiada a "${nombre}"!`);
    setTimeout(() => setFeedback(''), 3500);
  };

  // --- TRANSICIÓN: Iniciar Servicio Aceptando Proforma ---
  const handleComenzarServicio = async () => {
    if (!oatcActiva?.id) return;
    setIsProcessing(true);
    try {
      const itemsFinales = proformaItems.length > 0 ? proformaItems : (tickets[0]?.items || [{
        nombre: 'Servicio General',
        tipo: 'servicio',
        precio_base: 45,
        precio_final: 45,
        cantidad: 1,
        es_cortesia: false
      }]);

      await iniciarServicioConProforma({
        oatcId: oatcActiva.id,
        items: itemsFinales,
        estacionNombre,
        agenteNombre,
        agenteId: oatcActiva.agente_id,
        ticketIdExistente: tickets[0]?.id
      });

      if (onRefrescar) onRefrescar();
      setFeedback('¡Proforma aceptada! El servicio ha comenzado oficialmente.');
      cargarTickets();
      setTimeout(() => setFeedback(''), 3500);
    } catch (e) {
      console.error('Error al comenzar servicio:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RECHAZO DE ASESORÍA ---
  const handleConfirmarRechazo = async (agendarCita: boolean = false) => {
    if (!oatcActiva?.id) return;
    setIsProcessing(true);
    try {
      await rechazarAsesoria({
        oatcId: oatcActiva.id,
        motivo: motivoRechazoSeleccionado,
        detalle: detalleRechazoInput,
        crearLeadCrm: agendarCita,
        agenteId: oatcActiva.agente_id,
        agenteNombre,
        clienteNombre: oatcActiva.cliente_nombre
      });

      setModalRechazoOpen(false);
      if (agendarCita) {
        setFeedback(`¡Asesoría cancelada y Lead registrado en CRM para contactar a ${oatcActiva.cliente_nombre}!`);
      } else {
        setFeedback('¡Asesoría cancelada y notificada a Recepción!');
      }

      if (onRefrescar) onRefrescar();
      onServicioFinalizado();
    } catch (e) {
      console.error('Error al rechazar asesoría:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- HELPER: DETECCIÓN INTELIGENTE DE EXPOSICIÓN & INSUMOS ---
  const getInfoTicket = (t: OatcTicket) => {
    let requiereExpo = false;
    let requiereInsumos = false;
    let minutosSugeridos = 30;
    let motivoSugerido = 'Tratamiento Químico';

    (t.items || []).forEach(item => {
      if (item.atributos?.requiere_exposicion) {
        requiereExpo = true;
        if (item.atributos?.tiempo_exposicion_sugerido_min) {
          minutosSugeridos = Number(item.atributos.tiempo_exposicion_sugerido_min);
        }
        motivoSugerido = item.nombre;
      }
      if (item.atributos?.requiere_insumos) {
        requiereInsumos = true;
      }

      const nombreLow = item.nombre.toLowerCase();
      if (
        nombreLow.includes('balayage') ||
        nombreLow.includes('mechas') ||
        nombreLow.includes('color') ||
        nombreLow.includes('tinte') ||
        nombreLow.includes('fusio-dose') ||
        nombreLow.includes('keratina') ||
        nombreLow.includes('hidrafacial') ||
        nombreLow.includes('head spa')
      ) {
        requiereExpo = true;
        requiereInsumos = true;
        motivoSugerido = item.nombre;
        if (nombreLow.includes('balayage')) minutosSugeridos = 35;
        else if (nombreLow.includes('fusio-dose')) minutosSugeridos = 15;
        else if (nombreLow.includes('hidrafacial') || nombreLow.includes('head spa')) minutosSugeridos = 20;
        else minutosSugeridos = 30;
      }
    });

    return { requiereExpo, requiereInsumos, minutosSugeridos, motivoSugerido };
  };

  // Abrir modal de exposición para un ticket específico
  const handleAbrirModalExposicion = (t: OatcTicket) => {
    setTicketSeleccionadoParaExpo(t);
    const info = getInfoTicket(t);
    setMinutosExposicionInput(info.minutosSugeridos);
    setMotivoExposicionInput(info.motivoSugerido);
    setModalTiempoExposicionOpen(true);
  };

  // --- TIEMPO DE EXPOSICIÓN QUÍMICO POR TICKET ---
  const handleIniciarExposicion = async () => {
    if (!oatcActiva?.id) return;
    const tId = ticketSeleccionadoParaExpo?.id || tickets[0]?.id;
    if (!tId) return;

    setIsProcessing(true);
    try {
      await iniciarTiempoExposicionTicket({
        ticketId: tId,
        oatcId: oatcActiva.id,
        agenteId: oatcActiva.agente_id,
        agenteNombre,
        minutos: minutosExposicionInput,
        motivo: motivoExposicionInput,
        estacionNombre
      });
      setModalTiempoExposicionOpen(false);
      setFeedback(`¡Tiempo de exposición de ${minutosExposicionInput} min iniciado! Estás libre para atenciones express.`);
      if (onRefrescar) onRefrescar();
      cargarTickets();
      setTimeout(() => setFeedback(''), 4000);
    } catch (e) {
      console.error('Error al iniciar exposición:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReanudarServicioTicket = async (t: OatcTicket) => {
    if (!oatcActiva?.id || !t.id) return;
    setIsProcessing(true);
    try {
      await reanudarServicioTicket({
        ticketId: t.id,
        oatcId: oatcActiva.id,
        agenteId: oatcActiva.agente_id,
        agenteNombre,
        estacionNombre
      });
      setFeedback('¡Servicio reanudado! Continúa con el lavado, matiz o peinado.');
      if (onRefrescar) onRefrescar();
      cargarTickets();
      setTimeout(() => setFeedback(''), 3500);
    } catch (e) {
      console.error('Error al reanudar servicio:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- FINALIZACIÓN INDIVIDUAL CON EVALUACIÓN MULTI-TICKET ---
  const handleFinalizarTicketIndividual = async (t: OatcTicket) => {
    if (!oatcActiva?.id || !t.id) return;
    setIsProcessing(true);
    try {
      const res = await finalizarTicketIndividual({
        ticketId: t.id,
        oatcId: oatcActiva.id,
        agenteId: oatcActiva.agente_id,
        agenteNombre
      });

      if (res.todosFinalizados) {
        setFeedback('¡Todos los servicios finalizados! Orden enviada a Caja para cobro.');
        if (onRefrescar) onRefrescar();
        onServicioFinalizado();
      } else {
        setFeedback(`¡Tu ticket ha sido finalizado y estás libre! Quedan ${res.ticketsRestantes} ticket(s) en curso de tus colegas.`);
        if (onRefrescar) onRefrescar();
        cargarTickets();
      }
      setTimeout(() => setFeedback(''), 4000);
    } catch (e) {
      console.error('Error al finalizar ticket individual:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- SELECCIÓN DIRECTA DEL CATÁLOGO DE BIENES ---
  const handleSeleccionarDelCatalogo = (bien: {
    id?: string;
    nombre: string;
    tipo: 'servicio' | 'producto';
    precio: number;
    categoria?: string;
    atributos?: Record<string, any>;
  }) => {
    if (contextoCatalogo === 'proforma') {
      const newItem: ItemTicket = {
        bien_id: bien.id,
        nombre: bien.nombre,
        tipo: bien.tipo,
        categoria: bien.categoria,
        precio_base: bien.precio,
        precio_final: bien.precio,
        cantidad: 1,
        es_cortesia: false,
        atributos: bien.atributos
      };
      setProformaItems(prev => [...prev, newItem]);
      setFeedback(`¡"${bien.nombre}" añadido a la proforma!`);
      setTimeout(() => setFeedback(''), 3000);
    } else if (contextoCatalogo === 'cross_selling') {
      setNuevoItemNombre(bien.nombre);
      setNuevoItemTipo(bien.tipo);
      setNuevoItemPrecio(bien.precio);
      setFeedback(`¡"${bien.nombre}" seleccionado del catálogo!`);
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  // --- CROSS-SELLING: Añadir o Derivar Ticket ---
  const handleCrearNuevoTicketCruzado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoItemNombre.trim() || !oatcActiva?.id) return;

    try {
      const esCortesia = nuevoItemPrecio === 0;
      await derivarTicketCruzado({
        oatcId: oatcActiva.id,
        destino: destinoTicket,
        colegaId: colegaSeleccionadoId,
        colegaNombre: colegaSeleccionadoNombre,
        tipoTicket: nuevoItemTipo,
        estacionNombre,
        solicitadoPor: agenteNombre,
        items: [{
          nombre: nuevoItemNombre.trim(),
          tipo: nuevoItemTipo,
          precio_base: nuevoItemPrecio,
          precio_final: nuevoItemPrecio,
          es_cortesia: esCortesia,
          cantidad: 1
        }]
      });

      setModalAddTicketOpen(false);
      setNuevoItemNombre('');
      
      let msg = '¡Nuevo ticket anidado a tu atención!';
      if (destinoTicket === 'COLEGA') msg = `¡Invitación enviada al móvil de ${colegaSeleccionadoNombre}!`;
      if (destinoTicket === 'RECEPCION') msg = '¡Ticket derivado al panel de Recepción para asignación!';
      
      setFeedback(msg);
      cargarTickets();
      setTimeout(() => setFeedback(''), 4000);
    } catch (e) {
      console.error('Error al derivar ticket cruzado:', e);
    }
  };



  const handleEliminarItemProforma = (index: number) => {
    if (proformaItems.length <= 1) {
      alert('La proforma debe contener al menos 1 servicio o producto.');
      return;
    }
    setProformaItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleGuardarEdicionPrecio = async () => {
    if (!editItemTarget) return;

    // Si estamos en asesoría (editando proforma en memoria)
    if (editItemTarget.esProforma) {
      setProformaItems(prev => {
        const copia = [...prev];
        if (copia[editItemTarget.itemIndex]) {
          copia[editItemTarget.itemIndex] = {
            ...copia[editItemTarget.itemIndex],
            precio_final: nuevoPrecioInput,
            es_cortesia: nuevoPrecioInput === 0
          };
        }
        return copia;
      });
      setModalEditPrecioOpen(false);
      setFeedback('¡Precio de proforma actualizado!');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }

    // Si estamos en servicio activo (actualizando base de datos)
    if (editItemTarget.ticketId) {
      try {
        await actualizarPrecioItemTicket(
          editItemTarget.ticketId,
          editItemTarget.itemIndex,
          nuevoPrecioInput,
          motivoCortesiaInput
        );
        setModalEditPrecioOpen(false);
        setFeedback(nuevoPrecioInput === 0 ? '⚠️ Precio editado a S/ 0.00 (Cortesía enviada a validación).' : '¡Precio actualizado con éxito!');
        cargarTickets();
        setTimeout(() => setFeedback(''), 4000);
      } catch (e) {
        console.error('Error actualizando precio:', e);
      }
    }
  };

  const faseActual = (oatcActiva?.estado_proceso || 'EN_ESPERA') as FaseOatc;
  const totalProforma = proformaItems.reduce((acc, i) => acc + Number(i.precio_final || 0), 0);
  const totalConsolidadoOatc = tickets.reduce((acc, t) => acc + Number(t.monto_total || 0), 0);

  const esFueraDeTurno = 
    !estadoOperativo ||
    estadoOperativo.toUpperCase().includes('FUERA') || 
    estadoOperativo.toUpperCase() === 'INACTIVO' ||
    estadoOperativo.toUpperCase() === 'DESCONECTADO';

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* 3 Sub-Tabs Principales en Estación: Silla, Bar y Cola */}
      <div className="flex gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
        <button
          type="button"
          onClick={() => setSubTab('silla')}
          className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            subTab === 'silla'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{esFueraDeTurno ? '⏰ Mi Turno' : '🛋️ Mi Silla'}</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('bar')}
          className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            subTab === 'bar'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>🍹 Bar & Café</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('cola')}
          className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            subTab === 'cola'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>👥 Cola</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 1. Vista: Mi Silla Activa / Mi Turno */}
      {subTab === 'silla' && (
        <div className="space-y-4 animate-in fade-in">
          
          {/* Si está Fuera de Turno: Muestra la Botonera de Asistencia y Turno Completa */}
          {esFueraDeTurno ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-xl">
              <div className="text-center py-1 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/30">
                  WFM & Control Horario
                </span>
                <h3 className="text-base font-black text-white mt-2">Botonera de Asistencia y Turno</h3>
                <p className="text-xs text-slate-400 max-w-[280px] mx-auto">
                  Valida tu estado para activar tu estación de trabajo y recibir atenciones en tiempo real.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onMarcarAsistencia?.('DISPONIBLE', 'Llegada / Inicio de Turno')}
                  className="p-4 bg-emerald-950/40 border-2 border-emerald-500/50 hover:bg-emerald-900/50 rounded-2xl text-center space-y-1.5 transition active:scale-95 cursor-pointer shadow-lg shadow-emerald-950/50 group"
                >
                  <span className="text-3xl block group-hover:scale-110 transition-transform">👋</span>
                  <span className="text-xs font-black text-emerald-300 block tracking-wide">YA LLEGUÉ</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Inicio de Turno</span>
                </button>

                <button
                  type="button"
                  onClick={() => onMarcarAsistencia?.('REFRIGERIO', 'Pausa Refrigerio')}
                  className="p-4 bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/40 rounded-2xl text-center space-y-1.5 transition active:scale-95 cursor-pointer shadow-lg shadow-amber-950/50 group"
                >
                  <span className="text-3xl block group-hover:scale-110 transition-transform">🍕</span>
                  <span className="text-xs font-black text-amber-300 block tracking-wide">VOY A COMER</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Pausa Refrigerio</span>
                </button>

                <button
                  type="button"
                  onClick={() => onMarcarAsistencia?.('DISPONIBLE', 'Retorno de Refrigerio')}
                  className="p-4 bg-indigo-950/40 border border-indigo-500/30 hover:bg-indigo-900/40 rounded-2xl text-center space-y-1.5 transition active:scale-95 cursor-pointer shadow-lg shadow-indigo-950/50 group"
                >
                  <span className="text-3xl block group-hover:scale-110 transition-transform">🔄</span>
                  <span className="text-xs font-black text-indigo-300 block tracking-wide">REGRESÉ</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Fin de Refrigerio</span>
                </button>

                <button
                  type="button"
                  onClick={() => onMarcarAsistencia?.('FUERA_DE_TURNO', 'Fin de Jornada')}
                  className="p-4 bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/40 rounded-2xl text-center space-y-1.5 transition active:scale-95 cursor-pointer shadow-lg shadow-rose-950/50 group"
                >
                  <span className="text-3xl block group-hover:scale-110 transition-transform">🏁</span>
                  <span className="text-xs font-black text-rose-300 block tracking-wide">ACABÓ MI DÍA</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Fin de Jornada</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setModalNfcOpen(true)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700"
              >
                <Wifi className="w-3.5 h-3.5 text-indigo-400" /> Validar con Tag NFC de Sede
              </button>
            </div>
          ) : (
            /* Cuando el colaborador YA ESTÁ EN TURNO: Muestra la Estación Física y la OATC */
            <>
              {/* Tarjeta de Estación Física (Híbrida: Táctil + NFC Opcional) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-2 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Estación Física de Trabajo
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setModalSelectorEstacionOpen(true)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition"
                    >
                      Cambiar
                    </button>
                    <button
                      onClick={() => setModalNfcOpen(true)}
                      className="text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all active:scale-95"
                    >
                      <Wifi className="w-3 h-3" /> NFC
                    </button>
                  </div>
                </div>
                <p className="text-sm font-black text-white">{estacionNombre}</p>
              </div>

          {/* OATC Maestra con Stepper y Flujo de Fases */}
          {oatcActiva ? (
            <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-3xl p-5 space-y-4 shadow-xl">
              
              {/* Header OATC */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Viaje del Cliente (#OATC-{oatcActiva.id.slice(0, 4)})
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">{oatcActiva.cliente_nombre}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">Tiempo</span>
                  <span className="text-xs font-black text-indigo-400 font-mono">{tiempoTranscurrido} min</span>
                </div>
              </div>

              {/* Stepper Cromático de 4 Fases */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                <OatcPhaseStepper
                  faseActual={faseActual}
                  tiempoMinutos={tiempoTranscurrido}
                />
              </div>

              {/* ========================================================================= */}
              {/* BLOQUE A: FASE ASESORÍA / DIAGNÓSTICO (Edición In-Situ de Proforma) */}
              {/* ========================================================================= */}
              {faseActual === 'ASESORIA' && (
                <div className="p-4 bg-purple-950/30 border border-purple-500/40 rounded-2xl space-y-3 animate-in fade-in">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" /> 📝 Proforma en Asesoría & Diagnóstico
                      </span>
                      <p className="text-[11px] text-slate-400">Pacta con el cliente el servicio, tiempo y presupuesto:</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setContextoCatalogo('proforma');
                        setModalCatalogoOpen(true);
                      }}
                      className="text-[10px] bg-purple-600 hover:bg-purple-500 text-white font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition"
                    >
                      <Sparkles className="w-3 h-3" /> + Catálogo
                    </button>
                  </div>

                  {/* Lista de Ítems de la Proforma */}
                  <div className="space-y-1.5 pt-1">
                    {(proformaItems.length > 0 ? proformaItems : [{ nombre: 'Corte Clásico & Peinado', precio_final: 45, tipo: 'servicio' } as any]).map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-purple-900/50 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {item.tipo === 'producto' ? <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Scissors className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                          <span className="font-semibold text-slate-200 truncate">{item.nombre}</span>
                          {item.es_cortesia && (
                            <span className="text-[8px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.2 rounded border border-amber-500/30 shrink-0">
                              Cortesía
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditItemTarget({ itemIndex: idx, item, esProforma: true });
                              setNuevoPrecioInput(item.precio_final);
                              setModalEditPrecioOpen(true);
                            }}
                            className="font-mono font-black text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1 bg-purple-950/60 px-2 py-1 rounded-lg border border-purple-800/60"
                          >
                            <span>S/ {Number(item.precio_final || 0).toFixed(2)}</span>
                            <Edit3 className="w-3 h-3 text-purple-400" />
                          </button>

                          {proformaItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleEliminarItemProforma(idx)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition"
                              title="Eliminar de proforma"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Proforma & Botones de Acción de Asesoría */}
                  <div className="pt-3 border-t border-purple-900/60 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-bold">Total Presupuesto Proforma:</span>
                      <span className="text-lg font-black text-purple-300 font-mono">
                        S/ {totalProforma.toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setModalRechazoOpen(true)}
                        disabled={isProcessing}
                        className="p-3 bg-slate-800/90 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800/60 font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                      >
                        <UserX className="w-4 h-4 text-rose-400" /> No Acepta Proforma
                      </button>

                      <button
                        type="button"
                        onClick={handleComenzarServicio}
                        disabled={isProcessing}
                        className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95 disabled:opacity-50"
                      >
                        <Scissors className="w-4 h-4" /> Comenzar Servicio
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================================= */}
              {/* BLOQUE B: FASE EN SERVICIO & POR COBRAR (Ejecución Activa & Cross-Selling) */}
              {/* ========================================================================= */}
              {faseActual !== 'ASESORIA' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tickets de Servicio & Venta ({tickets.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalAddTicketOpen(true)}
                      className="text-[10px] bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 transition active:scale-95"
                    >
                      <Plus className="w-3 h-3" /> + Añadir Ticket / Derivar
                    </button>
                  </div>

                  {tickets.map((t, tIdx) => {
                    const esMiTicket = t.agente_nombre === agenteNombre;
                    const infoTicket = getInfoTicket(t);

                    return (
                      <div key={t.id} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
                        
                        {/* Header del Ticket */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-black text-[10px] flex items-center justify-center">
                              #{tIdx + 1}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                                <span>{t.agente_nombre}</span>
                                {esMiTicket && (
                                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.2 rounded border border-indigo-500/30">
                                    TÚ
                                  </span>
                                )}
                              </p>
                              <span className="text-[9px] text-slate-400">{t.estacion_nombre || 'Estación'}</span>
                            </div>
                          </div>

                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            t.requiere_validacion
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                              : t.estado_ticket === 'EN_EXPOSICION'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                              : t.estado_ticket === 'EN_PROCESO'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : t.estado_ticket === 'FINALIZADO'
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {t.requiere_validacion 
                              ? '⚠️ Requiere Validación' 
                              : t.estado_ticket === 'EN_EXPOSICION'
                              ? '⏳ En Pose'
                              : t.estado_ticket === 'FINALIZADO'
                              ? '✅ Finalizado'
                              : t.estado_ticket}
                          </span>
                        </div>

                        {/* Ítems del Ticket */}
                        <div className="space-y-1.5 pt-1">
                          {t.items?.map((item, iIdx) => (
                            <div 
                              key={iIdx} 
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs hover:border-slate-700 transition"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {item.tipo === 'producto' ? <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Scissors className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                                <span className="font-semibold text-slate-200 truncate">{item.nombre}</span>
                                {item.es_cortesia && (
                                  <span className="text-[8px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.2 rounded border border-amber-500/30 shrink-0">
                                    Cortesía S/ 0.00
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditItemTarget({ ticketId: t.id, itemIndex: iIdx, item, esProforma: false });
                                  setNuevoPrecioInput(item.precio_final);
                                  setModalEditPrecioOpen(true);
                                }}
                                className="font-mono font-black text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/40 px-2 py-1 rounded-lg border border-indigo-800/40 transition shrink-0"
                              >
                                <span>S/ {Number(item.precio_final || 0).toFixed(2)}</span>
                                <Edit3 className="w-3 h-3 text-slate-500" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Acciones Contextuales del Ticket para el especialista */}
                        {esMiTicket && t.estado_ticket !== 'FINALIZADO' && (
                          <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                            {t.estado_ticket === 'EN_EXPOSICION' ? (
                              <button
                                type="button"
                                onClick={() => handleReanudarServicioTicket(t)}
                                disabled={isProcessing}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
                              >
                                <Scissors className="w-3.5 h-3.5" /> ▶️ Reanudar Mi Servicio (Terminar Pose)
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 w-full flex-wrap">
                                {infoTicket.requiereInsumos && (
                                  <button
                                    type="button"
                                    onClick={() => setModalLabOpen(true)}
                                    className="flex-1 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition whitespace-nowrap"
                                  >
                                    <Beaker className="w-3.5 h-3.5 text-sky-400" /> Pedir Insumos
                                  </button>
                                )}

                                {infoTicket.requiereExpo && (
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirModalExposicion(t)}
                                    className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition whitespace-nowrap"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Exposición ({infoTicket.minutosSugeridos}m)
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleFinalizarTicketIndividual(t)}
                                  disabled={isProcessing}
                                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-md active:scale-95 transition whitespace-nowrap disabled:opacity-50"
                                >
                                  <Check className="w-3.5 h-3.5" /> Finalizar Mi Ticket
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {t.estado_ticket === 'FINALIZADO' && (
                          <div className="pt-1 text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Servicio completado por {t.agente_nombre}. Colaborador liberado.</span>
                          </div>
                        )}

                      </div>
                    );
                  })}

                  {/* Consolidado OATC Limpio (Sin duplicados) */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold">Total Consolidado OATC:</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      S/ {totalConsolidadoOatc.toFixed(2)}
                    </span>
                  </div>

                </div>
              )}

            </div>
          ) : (
            /* Estado Libre */
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl mx-auto text-slate-400">
                🛋️
              </div>
              <div>
                <h4 className="text-sm font-black text-white">Estación Libre</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
                  No tienes una orden de atención activa en este momento. La próxima atención asignada desde Recepción o la Cola de Piso aparecerá automáticamente aquí.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubTab('cola')}
                className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" /> Ver Cola en Vivo
              </button>
            </div>
          )}
          </>
          )}

        </div>
      )}

      {/* 2. Vista: Bar & Cafetería */}
      {subTab === 'bar' && (
        <div className="animate-in fade-in">
          <TabBar clienteNombre={oatcActiva?.cliente_nombre} />
        </div>
      )}

      {/* 3. Vista: Cola en Vivo Incrustada */}
      {subTab === 'cola' && (
        <div className="animate-in fade-in">
          <TabCola miNombre={agenteNombre} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALES AUXILIARES ATÓMICOS */}
      {/* ========================================================================= */}

      {/* Modal 1: Rechazo de Asesoría */}
      <ModalRechazoAsesoria
        isOpen={modalRechazoOpen}
        onClose={() => setModalRechazoOpen(false)}
        motivoSeleccionado={motivoRechazoSeleccionado}
        setMotivoSeleccionado={setMotivoRechazoSeleccionado}
        detalleInput={detalleRechazoInput}
        setDetalleInput={setDetalleRechazoInput}
        onConfirmarRechazo={handleConfirmarRechazo}
        isProcessing={isProcessing}
        motivosList={MOTIVOS_RECHAZO}
      />

      {/* Modal 2: Cross-Selling / Añadir Ticket con Triple Destino */}
      <ModalDerivarTicketCruzado
        isOpen={modalAddTicketOpen}
        onClose={() => setModalAddTicketOpen(false)}
        destinoTicket={destinoTicket}
        setDestinoTicket={setDestinoTicket}
        colegaSeleccionadoId={colegaSeleccionadoId}
        setColegaSeleccionadoId={setColegaSeleccionadoId}
        setColegaSeleccionadoNombre={setColegaSeleccionadoNombre}
        colaboradoresStaff={colaboradoresStaff}
        nuevoItemNombre={nuevoItemNombre}
        setNuevoItemNombre={setNuevoItemNombre}
        nuevoItemTipo={nuevoItemTipo}
        setNuevoItemTipo={setNuevoItemTipo}
        nuevoItemPrecio={nuevoItemPrecio}
        setNuevoItemPrecio={setNuevoItemPrecio}
        onAbrirCatalogo={() => {
          setContextoCatalogo('cross_selling');
          setModalCatalogoOpen(true);
        }}
        onSubmit={handleCrearNuevoTicketCruzado}
      />

      {/* Modal 3: Edición de Precio Inline & Cortesía */}
      <ModalEditarPrecioItem
        isOpen={modalEditPrecioOpen}
        onClose={() => setModalEditPrecioOpen(false)}
        editItemTarget={editItemTarget}
        nuevoPrecioInput={nuevoPrecioInput}
        setNuevoPrecioInput={setNuevoPrecioInput}
        motivoCortesiaInput={motivoCortesiaInput}
        setMotivoCortesiaInput={setMotivoCortesiaInput}
        onGuardarPrecio={handleGuardarEdicionPrecio}
      />

      {/* Modal 4: Selector de Estaciones Táctil */}
      <ModalSelectorEstacion
        isOpen={modalSelectorEstacionOpen}
        onClose={() => setModalSelectorEstacionOpen(false)}
        estaciones={ESTACIONES_PREDEFINIDAS}
        estacionActual={estacionNombre}
        onSeleccionarEstacion={handleSeleccionarEstacionManual}
      />

      {/* Modal 5: Lector NFC Opcional */}
      <ModalNfcScan
        isOpen={modalNfcOpen}
        tipoAccion="Vinculación de Estación Física"
        onClose={() => setModalNfcOpen(false)}
        onSuccess={handleNfcExitoso}
      />

      {/* Modal 6: Solicitud de Insumos WMS */}
      <ModalSolicitarInsumosLab
        isOpen={modalLabOpen}
        onClose={() => setModalLabOpen(false)}
        onEnviarPedido={async (insumoTexto: string) => {
          try {
            const supabase = createClient();
            const { useAppStore } = await import('@/store/useAppStore');
            const sedeId = useAppStore.getState().sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';

            await supabase.from('pedidos_insumos').insert([{
              agente_id: oatcActiva?.agente_id || null,
              agente_nombre: agenteNombre,
              insumo_solicitado: insumoTexto,
              estado: 'PENDIENTE',
              sede_id: sedeId
            }]);

            setModalLabOpen(false);
            setFeedback('🧪 ¡Fórmula enviada con éxito al Laboratorio!');
            setTimeout(() => setFeedback(''), 4000);
          } catch (e) {
            console.error('Error enviando pedido a laboratorio:', e);
            setModalLabOpen(false);
          }
        }}
      />

      {/* Modal 7: Iniciar Tiempo de Exposición Químico */}
      <ModalTiempoExposicion
        isOpen={modalTiempoExposicionOpen}
        onClose={() => setModalTiempoExposicionOpen(false)}
        minutos={minutosExposicionInput}
        setMinutos={setMinutosExposicionInput}
        motivo={motivoExposicionInput}
        setMotivo={setMotivoExposicionInput}
        onIniciarExposicion={handleIniciarExposicion}
        isProcessing={isProcessing}
      />

      {/* Modal 9: Buscador Inteligente del Catálogo Oficial */}
      <ModalCatalogoPicker
        isOpen={modalCatalogoOpen}
        tipoInicial={contextoCatalogo === 'proforma' ? 'servicio' : nuevoItemTipo}
        titulo={contextoCatalogo === 'proforma' ? 'Añadir a Proforma desde Catálogo' : 'Seleccionar del Catálogo Oficial'}
        onClose={() => setModalCatalogoOpen(false)}
        onSelectBien={handleSeleccionarDelCatalogo}
      />

    </div>
  );
}
