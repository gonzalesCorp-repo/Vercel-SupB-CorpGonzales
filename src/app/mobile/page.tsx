'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Coffee, Zap, Users, Calendar, Plus, RefreshCw, LogOut, 
  Search, CheckCircle2, Clock, MapPin, ChevronRight, UserPlus, 
  CalendarPlus, Utensils, AlertTriangle, ShieldCheck, Heart, Sparkles,
  Minus, PlayCircle, CreditCard, Beaker, X, ArrowRight, BarChart2, 
  History, User, Sun, Moon, Edit3, Filter, Users2, Layers, CheckCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/useUIStore';
import { useAppStore } from '@/store/useAppStore';
import { cambiarEstadoAgente } from '@/services/agentes';
import { obtenerTicketsAsignados, solicitarInicioAtencion, solicitarFinAtencion, solicitarPreCobro } from '@/services/operaciones';
import { buscarClientes, crearCliente, Cliente } from '@/services/clientes';
import { OATC, Agente, obtenerAgentesDisponibles } from '@/services/recepcion';

interface OATCExtended extends OATC {
  codigo_ticket?: string;
  monto_total?: number;
}

export default function DedicatedMobileViewPage() {
  // Tabs Principales (1: Inicio, 2: Turno, 3: Clientes, 4: Agenda)
  const [mainTab, setMainTab] = useState<'inicio' | 'turno' | 'clientes' | 'agenda'>('inicio');
  
  // Vistas Secundarias (disparadas desde el FAB Speed Dial): 'historico' | 'metricas' | 'perfil' | null
  const [activeSecondaryView, setActiveSecondaryView] = useState<'historico' | 'metricas' | 'perfil' | null>(null);

  // Sub-tabs de Inicio (Alertas vs Bar)
  const [inicioSubTab, setInicioSubTab] = useState<'alertas' | 'bar'>('alertas');

  // Estados Generales
  const [agente, setAgente] = useState<any>(null);
  const [estadoActual, setEstadoActual] = useState<string>('DISPONIBLE');
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<OATCExtended[]>([]);
  const [colegas, setColegas] = useState<Agente[]>([]);
  
  // Modal de Disponibilidad de Colegas
  const [showColegasModal, setShowColegasModal] = useState(false);
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>('TODAS');

  // Estado Bar
  const [barOrder, setBarOrder] = useState<{ cafe: number; infusion: number; agua: number }>({
    cafe: 0,
    infusion: 0,
    agua: 0
  });

  // Estado Clientes CRM
  const [queryCliente, setQueryCliente] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
  const [showAddClienteModal, setShowAddClienteModal] = useState(false);
  const [newClienteForm, setNewClienteForm] = useState({ nombre: '', dni: '', celular: '', email: '' });

  // Modales y FAB Speed Dial
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Filtros de Rango de Producción (Histórico & Métricas)
  const [fechaDesde, setFechaDesde] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState<string>(new Date().toISOString().split('T')[0]);

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

    // Cargar datos del agente
    const { data: agenteData } = await supabase
      .from('agentes')
      .select('*')
      .ilike('email', user.email.trim())
      .single();

    if (agenteData) {
      setAgente(agenteData);
      setEstadoActual(agenteData.estado || 'DISPONIBLE');

      // Cargar tickets de atenciones
      const allTickets = await obtenerTicketsAsignados('ALL');
      const misTickets = allTickets.filter(t => t.agente_id === agenteData.id);
      setTickets(misTickets);
    }

    // Cargar lista global de colegas de la sede para el modal de equipo
    const listaAgentes = await obtenerAgentesDisponibles();
    setColegas(listaAgentes);

    setIsLoading(false);
  };

  useEffect(() => {
    cargarDatosMobile();

    const channel = supabase.channel('realtime-mobile-pilot-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarDatosMobile())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agentes' }, () => cargarDatosMobile())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Búsqueda de Clientes
  useEffect(() => {
    if (queryCliente.trim().length >= 2) {
      handleBuscarClientes();
    } else {
      setClientesEncontrados([]);
    }
  }, [queryCliente]);

  const handleBuscarClientes = async () => {
    const res = await buscarClientes(queryCliente);
    setClientesEncontrados(res);
  };

  // Handlers WFM / Alertas Rápidas
  const handleAlertaRapidaWFM = async (accion: string, nuevoEstado: string) => {
    if (!agente) return;
    try {
      await cambiarEstadoAgente(agente.id, nuevoEstado);
      setEstadoActual(nuevoEstado);
      showAlert(`Alerta enviada a Recepción: ${accion}`, 'success');
      cargarDatosMobile();
    } catch (err: any) {
      showAlert(`Error: ${err.message}`, 'error');
    }
  };

  // Handler Pedido Bar
  const handleEnviarPedidoBar = async () => {
    const totalItems = barOrder.cafe + barOrder.infusion + barOrder.agua;
    if (totalItems === 0) {
      showAlert('Selecciona al menos 1 bebida', 'warning');
      return;
    }
    showAlert(`Pedido de Bar enviado a Recepción (${totalItems} bebidas)`, 'success');
    setBarOrder({ cafe: 0, infusion: 0, agua: 0 });
  };

  // Handler Crear Cliente
  const handleCrearCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClienteForm.nombre.trim()) return;
    const res = await crearCliente(newClienteForm);
    if (res) {
      showAlert('Cliente registrado con éxito', 'success');
      setShowAddClienteModal(false);
      setNewClienteForm({ nombre: '', dni: '', celular: '', email: '' });
      setQueryCliente(res.nombre);
    } else {
      showAlert('Error registrando cliente', 'error');
    }
  };

  const ticketActivo = tickets.find(t => t.estado_proceso === 'EN_CURSO' || t.estado_proceso === 'PRE_COBRADO' || t.estado_proceso === 'ASESORIA');

  // Calcular la posición del turno del usuario en la cola global
  const misColegasEnCola = colegas.filter(c => c.estado !== 'INACTIVO');
  const miPosicionEnCola = agente ? misColegasEnCola.findIndex(c => c.id === agente.id) + 1 : 1;

  // Filtrar colegas por especialidad para el modal
  const colegasFiltrados = colegas.filter(c => {
    if (filtroEspecialidad === 'TODAS') return true;
    return (c as any).especialidad?.toUpperCase().includes(filtroEspecialidad.toUpperCase());
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-28 select-none font-sans">
      
      {/* 🚀 Top Header (Piloto Refactored Impeccable UI) */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-2xl border-b border-slate-800/80 px-4 py-3 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={() => setActiveSecondaryView('perfil')}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 p-[2px] shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-white text-base">
                {agente?.nombre ? agente.nombre.charAt(0) : 'K'}
              </div>
            </div>
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${
              estadoActual === 'DISPONIBLE' ? 'bg-emerald-400' : 'bg-amber-400'
            }`} />
          </div>

          <div>
            <h1 className="font-black text-sm text-slate-100 leading-tight">
              {agente?.nombre || 'Koko Vascones'}
            </h1>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 inline text-indigo-400" />
              {sedeActiva?.nombre || 'Sede RD'}
            </p>
          </div>
        </div>

        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/login');
          }}
          className="px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-bold text-xs active:scale-95 transition-all"
        >
          Salir
        </button>
      </header>

      {/* 📱 Main Body Content */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        
        {/* ================= VISTA SECUNDARIA: HISTÓRICO (Screenshot 7) ================= */}
        {activeSecondaryView === 'historico' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
              <h2 className="text-sm font-black text-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" /> HISTÓRICO DE PRODUCCIÓN
              </h2>
              <button onClick={() => setActiveSecondaryView(null)} className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtrar Rango */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  📅 FILTRAR RANGO DE PRODUCCIÓN
                </span>
                <button 
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setFechaDesde(today);
                    setFechaHasta(today);
                  }}
                  className="text-[10px] font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 rounded-full"
                >
                  Limpiar Filtro
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Desde:</label>
                  <input 
                    type="date" 
                    value={fechaDesde} 
                    onChange={e => setFechaDesde(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Hasta:</label>
                  <input 
                    type="date" 
                    value={fechaHasta} 
                    onChange={e => setFechaHasta(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                TOTAL DE REGISTROS: <span className="text-indigo-400">3</span>
              </span>
              <button onClick={cargarDatosMobile} className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition">
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refrescar
              </button>
            </div>

            {/* Lista Histórico Exacta del Piloto */}
            <div className="space-y-3">
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">#18</span>
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">7:11 PM</span>
                  </div>
                  <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full">TURNO</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-300">👤 Nombre: <span className="text-white font-black">POR ASIGNAR</span></p>
                  <p className="text-[11px] text-slate-400">🕒 Orden: 02/08/2026 • 3:41 PM</p>
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">#9</span>
                    <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">CANCELADO: 12:58 PM</span>
                  </div>
                  <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full">TURNO</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-300">👤 Nombre: <span className="text-white font-black">POR ASIGNAR</span></p>
                  <p className="text-[11px] text-slate-400">🕒 Orden: 02/08/2026 • 12:56 PM • <span className="text-amber-400 font-bold">⚠️ Motivo: p...</span></p>
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">#cita 04:00</span>
                    <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">CANCELADO: 4:43 PM</span>
                  </div>
                  <span className="text-[10px] font-black text-purple-400 bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full">CITA</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-300">👤 Nombre: <span className="text-white font-black">Eliana</span></p>
                  <p className="text-[11px] text-slate-400">🕒 Orden: 02/08/2026 • 12:01 PM • <span className="text-amber-400 font-bold">⚠️ Motivo: c...</span></p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= VISTA SECUNDARIA: MÉTRICAS (Screenshot 8) ================= */}
        {activeSecondaryView === 'metricas' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
              <h2 className="text-sm font-black text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-purple-400" /> MÉTRICAS Y DESEMPEÑO
              </h2>
              <button onClick={() => setActiveSecondaryView(null)} className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Banner Blue Gradient */}
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-2xl space-y-4 relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[10px] font-black tracking-widest uppercase text-blue-200">DESEMPEÑO DEL PERÍODO</span>
                <h3 className="text-4xl font-black tracking-tight">14</h3>
                <p className="text-xs text-blue-100 font-medium">Atenciones Asignadas</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold text-blue-100 flex items-center gap-1">👥 CLIENTES ÚNICOS</span>
                  <p className="text-xl font-black mt-0.5">0</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold text-blue-100 flex items-center gap-1">📌 EFECTIVIDAD</span>
                  <p className="text-xs font-bold text-blue-200 mt-1">Ver Reportes</p>
                </div>
              </div>
            </div>

            {/* Desglose de Servicios */}
            <div className="space-y-3 pt-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">DESGLOSE DE SERVICIOS</span>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Peinados y Cepillados</span>
                  <p className="text-3xl font-black text-indigo-400 mt-1">2</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Colorimetría</span>
                  <p className="text-3xl font-black text-purple-400 mt-1">7</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
                <span className="text-[10px] font-bold uppercase text-slate-400">Corte y Diseño</span>
                <p className="text-3xl font-black text-pink-400 mt-1">5</p>
              </div>
            </div>

            {/* Ventas e Insumos en Construcción */}
            <div className="bg-slate-900/60 border border-dashed border-slate-800 p-6 rounded-3xl text-center space-y-2">
              <span className="text-3xl block">🚧</span>
              <h4 className="font-bold text-xs text-slate-300">Ventas e Insumos</h4>
              <p className="text-[10px] text-slate-500">Módulo en construcción. Próximamente conexión con GS (Luxury/RD).</p>
            </div>
          </motion.div>
        )}

        {/* ================= VISTA SECUNDARIA: PERFIL DEL USUARIO (Screenshot 9) ================= */}
        {activeSecondaryView === 'perfil' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
              <h2 className="text-sm font-black text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-pink-400" /> PERFIL DEL OPERARIO
              </h2>
              <button onClick={() => setActiveSecondaryView(null)} className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Card Principal de Perfil */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xl font-black text-white">{agente?.nombre || 'Koko Vascones'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    Sede RD | ⏰ 9:00 am - 8:00 pm
                  </p>
                </div>
                <button className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold">
                  Editar
                </button>
              </div>

              {/* Campos Configuración exactos del Piloto */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-slate-400">APODO (NICKNAME)</span>
                  <span className="font-black text-white flex items-center gap-1">{agente?.nombre || 'Koko Vascones'} <Edit3 className="w-3.5 h-3.5 text-slate-500" /></span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-slate-400">PIN SECRETO</span>
                  <span className="font-black text-white tracking-widest flex items-center gap-1">**** <Edit3 className="w-3.5 h-3.5 text-slate-500" /></span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-slate-400">DÍA DE DESCANSO</span>
                  <span className="font-black text-emerald-400 flex items-center gap-1">Lunes <Edit3 className="w-3.5 h-3.5 text-slate-500" /></span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-slate-400">DNI</span>
                  <span className="font-black text-slate-400 flex items-center gap-1">--- <Edit3 className="w-3.5 h-3.5 text-slate-500" /></span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-slate-400">CELULAR</span>
                  <span className="font-black text-slate-400 flex items-center gap-1">--- <Edit3 className="w-3.5 h-3.5 text-slate-500" /></span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-slate-400">CUMPLEAÑOS</span>
                  <span className="font-black text-slate-400 flex items-center gap-1">--- <Edit3 className="w-3.5 h-3.5 text-slate-500" /></span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-slate-400">GÉNERO</span>
                  <span className="font-black text-slate-400 flex items-center gap-1">--- <Edit3 className="w-3.5 h-3.5 text-slate-500" /></span>
                </div>
              </div>

              {/* Botón Cambiar Tema */}
              <button 
                onClick={() => showAlert('Modo de tema alternado', 'info')}
                className="w-full py-3.5 rounded-2xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Sun className="w-4 h-4 text-amber-400" /> Modo Claro / Oscuro
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= TAB 1: INICIO (ALERTAS & BAR) ================= */}
        {mainTab === 'inicio' && activeSecondaryView === null && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            
            {/* Sub Tabs: Alertas vs Bar */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner">
              <button
                onClick={() => setInicioSubTab('alertas')}
                className={`py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
                  inicioSubTab === 'alertas'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bell className="w-4 h-4" /> Alertas
              </button>

              <button
                onClick={() => setInicioSubTab('bar')}
                className={`py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
                  inicioSubTab === 'bar'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coffee className="w-4 h-4" /> Bar
              </button>
            </div>

            {/* SECCIÓN ALERTAS INMEDIATAS */}
            {inicioSubTab === 'alertas' && (
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-2xl backdrop-blur-xl">
                <div className="text-center space-y-1">
                  <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
                    🚨 PANEL DE ALERTAS INMEDIATAS
                  </span>
                  <p className="text-xs text-slate-400 font-medium">
                    Presiona para notificar al panel de recepción al instante.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={() => handleAlertaRapidaWFM('YA LLEGUÉ', 'DISPONIBLE')}
                    className="p-5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all group"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">👋</span>
                    <span className="font-black text-xs text-slate-100 tracking-wider">YA LLEGUÉ</span>
                  </button>

                  <button 
                    onClick={() => handleAlertaRapidaWFM('VOY A COMER', 'PAUSA')}
                    className="p-5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 hover:border-amber-500/50 flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all group"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">🍕</span>
                    <span className="font-black text-xs text-slate-100 tracking-wider">VOY A COMER</span>
                  </button>

                  <button 
                    onClick={() => handleAlertaRapidaWFM('REGRESÉ', 'DISPONIBLE')}
                    className="p-5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 hover:border-blue-500/50 flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all group"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">🔄</span>
                    <span className="font-black text-xs text-slate-100 tracking-wider">REGRESÉ</span>
                  </button>

                  <button 
                    onClick={() => handleAlertaRapidaWFM('ACABÓ MI DÍA', 'INACTIVO')}
                    className="p-5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 hover:border-red-500/50 flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all group"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">🏁</span>
                    <span className="font-black text-xs text-slate-100 tracking-wider">ACABÓ MI DÍA</span>
                  </button>
                </div>
              </div>
            )}

            {/* SECCIÓN BAR */}
            {inicioSubTab === 'bar' && (
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-2xl backdrop-blur-xl">
                <div className="text-center space-y-1">
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
                    🍹 SECCIÓN BAR
                  </span>
                  <p className="text-xs text-slate-400 font-medium">
                    Agrega las cantidades deseadas y envía el pedido completo.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">☕</span>
                      <span className="font-bold text-sm text-slate-200">Café</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setBarOrder(p => ({ ...p, cafe: Math.max(0, p.cafe - 1) }))} className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 font-black flex items-center justify-center active:scale-90 transition">-</button>
                      <span className="font-black text-base w-4 text-center text-purple-400">{barOrder.cafe}</span>
                      <button onClick={() => setBarOrder(p => ({ ...p, cafe: p.cafe + 1 }))} className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center shadow-lg active:scale-90 transition">+</button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍵</span>
                      <span className="font-bold text-sm text-slate-200">Infusión</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setBarOrder(p => ({ ...p, infusion: Math.max(0, p.infusion - 1) }))} className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 font-black flex items-center justify-center active:scale-90 transition">-</button>
                      <span className="font-black text-base w-4 text-center text-purple-400">{barOrder.infusion}</span>
                      <button onClick={() => setBarOrder(p => ({ ...p, infusion: p.infusion + 1 }))} className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center shadow-lg active:scale-90 transition">+</button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💧</span>
                      <span className="font-bold text-sm text-slate-200">Agua</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setBarOrder(p => ({ ...p, agua: Math.max(0, p.agua - 1) }))} className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 font-black flex items-center justify-center active:scale-90 transition">-</button>
                      <span className="font-black text-base w-4 text-center text-purple-400">{barOrder.agua}</span>
                      <button onClick={() => setBarOrder(p => ({ ...p, agua: p.agua + 1 }))} className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center shadow-lg active:scale-90 transition">+</button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleEnviarPedidoBar}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition-all mt-2"
                >
                  Enviar Pedido a Recepción
                </button>
              </div>
            )}

          </motion.div>
        )}

        {/* ================= TAB 2: TURNO (CON POSICIÓN DE TURNO Y BOTÓN DE EQUIPO COLEGAS) ================= */}
        {mainTab === 'turno' && activeSecondaryView === null && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                ATENCIONES EN CURSO: <span className="text-indigo-400">{tickets.length}</span>
              </span>

              <button 
                onClick={cargarDatosMobile}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refrescar
              </button>
            </div>

            {/* Tarjeta de Estado Actual + Posición del Turno + Botón Colegas 👥 */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex justify-between items-center shadow-xl">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">ESTADO ACTUAL</span>
                <h3 className="text-xl font-black text-emerald-400 mt-0.5">{estadoActual}</h3>
                
                {/* Posición del turno en la operación */}
                <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
                  <span>🎯 Tu Posición en Piso:</span>
                  <span className="text-white font-black text-sm">#{miPosicionEnCola > 0 ? miPosicionEnCola : 1}</span>
                </div>
              </div>

              {/* Botón Ícono de Personas / Equipo (👥) que abre Modal de Disponibilidad Colegas */}
              <button 
                onClick={() => setShowColegasModal(true)}
                className="p-3.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl border border-indigo-400/30 shadow-lg shadow-indigo-600/30 active:scale-90 transition flex flex-col items-center gap-0.5"
                title="Ver Disponibilidad del Equipo"
              >
                <Users2 className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase">Equipo</span>
              </button>
            </div>

            {/* Lista de Atenciones */}
            {ticketActivo ? (
              <div className="bg-gradient-to-b from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 space-y-4 shadow-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest">
                      ⚡ Atención Activa
                    </span>
                    <h2 className="text-2xl font-black text-white mt-2">{ticketActivo.cliente_nombre}</h2>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                    {ticketActivo.codigo_ticket || 'OATC-LIVE'}
                  </span>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Servicios:</span>
                  {ticketActivo.punto_partida?.map((srv: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm font-semibold text-slate-200">
                      <span>{srv.nombre}</span>
                      <span className="text-indigo-400 font-bold">${srv.precio}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={async () => {
                      if (!ticketActivo.id) return;
                      await solicitarPreCobro(ticketActivo.id);
                      showAlert('Pre-cobro solicitado', 'success');
                      cargarDatosMobile();
                    }}
                    className="py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-amber-600/30 active:scale-95 transition-all"
                  >
                    Pre-Cobrar
                  </button>

                  <button 
                    onClick={async () => {
                      if (!ticketActivo.id) return;
                      await solicitarFinAtencion(ticketActivo, agente?.rol || 'STAFF');
                      showAlert('Atención Finalizada', 'success');
                      cargarDatosMobile();
                    }}
                    className="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                  >
                    Finalizar
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-xl">
                <span className="text-4xl block">📂</span>
                <h3 className="font-bold text-slate-200 text-base">Sin asignaciones</h3>
                <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
                  No se encontraron tareas registradas para el rango seleccionado.
                </p>
              </div>
            )}

          </motion.div>
        )}

        {/* ================= TAB 3: CLIENTES ================= */}
        {mainTab === 'clientes' && activeSecondaryView === null && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                🔎 BÚSQUEDA GLOBAL DE CLIENTES
              </span>

              <div className="relative">
                <input 
                  type="text" 
                  value={queryCliente}
                  onChange={(e) => setQueryCliente(e.target.value)}
                  placeholder="DNI, Nombre, Apellido, Celular..." 
                  className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 pl-10 pr-4 py-3.5 rounded-2xl text-xs border border-slate-800 focus:outline-none focus:border-emerald-500 transition"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-4" />
              </div>
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                CLIENTES ENCONTRADOS: <span className="text-emerald-400">{clientesEncontrados.length}</span>
              </span>
            </div>

            <button 
              onClick={() => setShowAddClienteModal(true)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Agregar nuevo cliente
            </button>

            {clientesEncontrados.length > 0 ? (
              <div className="space-y-3 pt-2">
                {clientesEncontrados.map(c => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center shadow-lg">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{c.nombre}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">DNI: {c.dni || 'N/A'} • Cel: {c.celular || 'N/A'}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      CRM
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-xl">
                <span className="text-4xl block">📂</span>
                <h3 className="font-bold text-slate-200 text-base">Sin asignaciones</h3>
                <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
                  No se encontraron registros para la búsqueda ingresada.
                </p>
              </div>
            )}

          </motion.div>
        )}

        {/* ================= TAB 4: AGENDA ================= */}
        {mainTab === 'agenda' && activeSecondaryView === null && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                TOTAL DE REGISTROS: <span className="text-purple-400">4</span>
              </span>

              <button 
                onClick={cargarDatosMobile}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-purple-400 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refrescar
              </button>
            </div>

            <button 
              onClick={() => showAlert('Módulo de Citas activado', 'info')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Registrar Cita
            </button>

            <span className="text-xs font-black uppercase tracking-wider text-slate-400 px-1 block pt-2">
              HISTÓRICO
            </span>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">📅 15/02/2026</span>
                  <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase">COMPLETADA</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-100">👤 Cliente: <span className="font-normal text-slate-300">yolanda</span></p>
                    <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">CITA</span>
                  </div>
                  <p className="text-xs text-slate-400">💼 Colorimetria</p>
                  <p className="text-xs text-slate-400 pt-1">📅 Cita: 15/02/2026 a las 9:00 AM</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">📅 27/01/2026</span>
                  <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase">COMPLETADA</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-100">👤 Cliente: <span className="font-normal text-slate-300">Nelly Flores</span></p>
                    <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">CITA</span>
                  </div>
                  <p className="text-xs text-slate-400">💼 Corte y diseño</p>
                  <p className="text-xs text-slate-400 pt-1">📅 Cita: 27/01/2026 a las 11:00 AM</p>
                </div>
              </div>
            </div>

          </motion.div>
        )}

      </main>

      {/* 🔮 Speed Dial FAB Button (+) / (X) (Exactamente como en Screenshot 6 del Piloto) */}
      <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
        
        {/* Sub-botones Speed Dial Flotantes */}
        <AnimatePresence>
          {isFabOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex items-center gap-4 mb-4"
            >
              {/* Opción Histórico */}
              <button 
                onClick={() => { setIsFabOpen(false); setActiveSecondaryView('historico'); }}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-indigo-500/40 text-indigo-400 shadow-xl flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black text-slate-200 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-800">Historial</span>
              </button>

              {/* Opción Métricas */}
              <button 
                onClick={() => { setIsFabOpen(false); setActiveSecondaryView('metricas'); }}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform -translate-y-3"
              >
                <div className="w-13 h-13 rounded-2xl bg-slate-900 border border-purple-500/40 text-purple-400 shadow-xl flex items-center justify-center">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <span className="text-[9px] font-black text-slate-200 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-800">Métricas</span>
              </button>

              {/* Opción Perfil */}
              <button 
                onClick={() => { setIsFabOpen(false); setActiveSecondaryView('perfil'); }}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-pink-500/40 text-pink-400 shadow-xl flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black text-slate-200 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-800">Perfil</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB Principal (+) que rota a (X) */}
        <motion.button
          onClick={() => setIsFabOpen(!isFabOpen)}
          animate={{ rotate: isFabOpen ? 45 : 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-black flex items-center justify-center shadow-2xl shadow-purple-500/50 border-2 border-slate-950 active:scale-90 transition-transform"
        >
          <Plus className="w-7 h-7" />
        </motion.button>
      </div>

      {/* 📱 Bottom Navigation Bar (4 Tabs del Piloto) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-2xl border-t border-slate-800/80 px-4 py-2 flex justify-around items-center max-w-md mx-auto shadow-2xl">
        <button 
          onClick={() => { setActiveSecondaryView(null); setMainTab('inicio'); }}
          className={`flex flex-col items-center gap-1 transition-all ${
            mainTab === 'inicio' && activeSecondaryView === null ? 'text-red-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px]">Inicio</span>
        </button>

        <button 
          onClick={() => { setActiveSecondaryView(null); setMainTab('turno'); }}
          className={`flex flex-col items-center gap-1 transition-all ${
            mainTab === 'turno' && activeSecondaryView === null ? 'text-amber-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Zap className="w-5 h-5" />
          <span className="text-[10px]">Turno</span>
        </button>

        <div className="w-8"></div> {/* Espacio para el FAB central */}

        <button 
          onClick={() => { setActiveSecondaryView(null); setMainTab('clientes'); }}
          className={`flex flex-col items-center gap-1 transition-all ${
            mainTab === 'clientes' && activeSecondaryView === null ? 'text-emerald-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Clientes</span>
        </button>

        <button 
          onClick={() => { setActiveSecondaryView(null); setMainTab('agenda'); }}
          className={`flex flex-col items-center gap-1 transition-all ${
            mainTab === 'agenda' && activeSecondaryView === null ? 'text-purple-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Agenda</span>
        </button>
      </nav>

      {/* ================= MODAL: DISPONIBILIDAD DEL EQUIPO / COLEGAS (👥 Icon Touch) ================= */}
      <AnimatePresence>
        {showColegasModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white">
                    <Users2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-100">Disponibilidad del Equipo</h3>
                    <p className="text-[10px] text-slate-400">Posición Global y por Especialidad</p>
                  </div>
                </div>
                <button onClick={() => setShowColegasModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filtro por Especialidades */}
              <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-2">
                {['TODAS', 'COLORIMETRIA', 'CORTE', 'PEINADOS', 'MANICURE'].map(esp => (
                  <button
                    key={esp}
                    onClick={() => setFiltroEspecialidad(esp)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase whitespace-nowrap transition-all ${
                      filtroEspecialidad === esp 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                    }`}
                  >
                    {esp}
                  </button>
                ))}
              </div>

              {/* Lista de Colegas en Piso */}
              <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
                {colegasFiltrados.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-6">No hay operarios en esta especialidad.</p>
                ) : (
                  colegasFiltrados.map((col, idx) => {
                    const isSelf = agente && col.id === agente.id;
                    return (
                      <div 
                        key={col.id} 
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                          isSelf 
                            ? 'bg-indigo-950/60 border-indigo-500/50 shadow-md' 
                            : 'bg-slate-950/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center border ${
                            isSelf ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                              {col.nombre} {isSelf && <span className="text-[9px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded">TÚ</span>}
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              {(col as any).especialidad || 'Estilista / Barbería'}
                            </p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                          col.estado === 'DISPONIBLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          col.estado === 'OCUPADO' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {col.estado}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Agregar Cliente CRM */}
      <AnimatePresence>
        {showAddClienteModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-slate-100"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-black text-sm text-slate-100 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" /> Nuevo Cliente CRM
                </h3>
                <button onClick={() => setShowAddClienteModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCrearCliente} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nombre Completo *</label>
                  <input 
                    type="text"
                    required
                    value={newClienteForm.nombre}
                    onChange={e => setNewClienteForm({ ...newClienteForm, nombre: e.target.value })}
                    placeholder="Ej. Yolanda Flores"
                    className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">DNI / Identificación</label>
                  <input 
                    type="text"
                    value={newClienteForm.dni}
                    onChange={e => setNewClienteForm({ ...newClienteForm, dni: e.target.value })}
                    placeholder="Ej. 74839201"
                    className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Celular / WhatsApp</label>
                  <input 
                    type="text"
                    value={newClienteForm.celular}
                    onChange={e => setNewClienteForm({ ...newClienteForm, celular: e.target.value })}
                    placeholder="Ej. 987654321"
                    className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-500/30 active:scale-95 transition-all mt-2"
                >
                  Guardar Cliente
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
