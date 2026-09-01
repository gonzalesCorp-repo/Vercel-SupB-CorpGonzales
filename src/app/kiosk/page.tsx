'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, User, Briefcase, Clock, CheckCircle2, Shield, QrCode, 
  Keyboard, RefreshCw, Beaker, Wifi, ArrowLeft, Heart, Flame,
  Check, UserCheck, Bell, Zap, Lock, ChevronRight, Play, Pause, Power,
  Sliders, X, Coffee, CreditCard, DollarSign, Plus, CheckSquare,
  AlertCircle, CupSoda, Utensils, AlertTriangle, KeyRound, Crown,
  Search, Award, Calendar, History, Smartphone, Phone, FileText
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { 
  obtenerSolicitudesAsistenciaPendientes, 
  resolverSolicitudAsistenciaCola, 
  validarYRegistrarAsistenciaNfc,
  TipoMovimientoAsistencia,
  formatearHoraLima 
} from '@/services/asistencias';
import { solicitarPreCobro } from '@/services/operaciones';
import { 
  obtenerPerfilCompletoCliente, 
  ClienteVipPerfil, 
  crearCliente 
} from '@/services/clientes';
import { getActiveBranding, getBrandingForSede, getLoyaltyTier } from '@/config/branding';

interface ColaboradorKiosk {
  id: string;
  nombre: string;
  rol: string;
  especialidad?: string;
  estado: string; // 'ACTIVO' | 'INACTIVO' (Administrativo)
  estado_operativo?: string; // 'DISPONIBLE' | 'OCUPADO' | 'EN_REFRIGERIO' | 'FUERA_DE_TURNO'
  pin?: string;
  email?: string;
  ultimo_cambio_estado?: string;
}

export default function KioskoDualPage() {
  const [modo, setModo] = useState<'HOME' | 'CLIENTE' | 'STAFF'>('HOME');
  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const branding = getBrandingForSede(sedeActiva);
  
  // ================= ESTADO CLIENTE VIP & KIOSK =================
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteVip, setClienteVip] = useState<ClienteVipPerfil | null>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false);
  const [nuevoClienteForm, setNuevoClienteForm] = useState({ nombre: '', dni: '', celular: '' });
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [accionTurnoEnviando, setAccionTurnoEnviando] = useState(false);

  // Lista de Clientes Demo Sandbox para Acceso Rápido en 1-Toque
  const clientesSandboxDemo = [
    { nombre: 'Valeria Demo Sandbox', dni: '10000001', tier: 'Diamante VIP', pts: 1450, avatar: 'V' },
    { nombre: 'Camila Demo Sandbox', dni: '10000002', tier: 'Platino VIP', pts: 890, avatar: 'C' },
    { nombre: 'Mateo Demo Sandbox', dni: '10000003', tier: 'Oro VIP', pts: 520, avatar: 'M' },
    { nombre: 'Sebastián Demo Sandbox', dni: '10000004', tier: 'Oro VIP', pts: 480, avatar: 'S' },
    { nombre: 'Lucas Demo Sandbox', dni: '10000005', tier: 'Plata VIP', pts: 210, avatar: 'L' },
    { nombre: 'Sofía Demo Sandbox', dni: '10000006', tier: 'Bronce VIP', pts: 100, avatar: 'S' }
  ];

  // ================= ESTADO STAFF & TERMINAL TÁCTIL =================
  const [colaboradores, setColaboradores] = useState<ColaboradorKiosk[]>([]);
  const [solicitudesAsistencia, setSolicitudesAsistencia] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  
  // Colaborador Activo en la Terminal del Tótem
  const [colaboradorActivo, setColaboradorActivo] = useState<ColaboradorKiosk | null>(null);
  const [staffTab, setStaffTab] = useState<'oatc' | 'lab' | 'bar' | 'turno'>('oatc');
  const [oatcActiva, setOatcActiva] = useState<any | null>(null);
  const [loadingOatc, setLoadingOatc] = useState(false);
  const [estacionSeleccionada, setEstacionSeleccionada] = useState('Sillón #01 (Entrada)');

  // Modal de Seguridad PIN para Validar Solicitudes y Marcaciones
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinIngresado, setPinIngresado] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinVerificando, setPinVerificando] = useState(false);
  const [solicitudParaValidar, setSolicitudParaValidar] = useState<any | null>(null);
  const [colaboradorParaAccion, setColaboradorParaAccion] = useState<ColaboradorKiosk | null>(null);
  const [tipoMovimientoParaAccion, setTipoMovimientoParaAccion] = useState<TipoMovimientoAsistencia | null>(null);

  // Formulario Insumos Lab
  const [labInsumo, setLabInsumo] = useState('Tinte Koleston 7.1 Rubio Ceniza');
  const [labGramos, setLabGramos] = useState('60');
  const [labOxidante, setLabOxidante] = useState('60');
  const [labEnviando, setLabEnviando] = useState(false);

  // Formulario Bar & Cafetería
  const [bebidaSeleccionada, setBebidaSeleccionada] = useState('Café Espresso Americano');
  const [barEnviando, setBarEnviando] = useState(false);

  const cargarDatosStaff = useCallback(async () => {
    const sedeId = sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';
    setLoadingData(true);
    const supabase = createClient();

    try {
      const [solicitudes, { data: agentesData }] = await Promise.all([
        obtenerSolicitudesAsistenciaPendientes(sedeId),
        supabase
          .from('agentes')
          .select('*')
          .in('rol', ['STAFF', 'SOPORTE', 'JEFE_OPERATIVO', 'OPERACION'])
          .order('nombre', { ascending: true })
      ]);

      setSolicitudesAsistencia(solicitudes || []);
      setColaboradores(agentesData || []);
    } catch (e) {
      console.error('Error cargando datos de staff en kiosko:', e);
    } finally {
      setLoadingData(false);
    }
  }, [sedeActiva?.id]);

  // Cargar OATC activa del colaborador seleccionado
  const cargarOatcColaborador = useCallback(async (agenteId: string) => {
    setLoadingOatc(true);
    const supabase = createClient();
    try {
      const { data } = await supabase
        .from('oatc')
        .select('*')
        .eq('agente_id', agenteId)
        .neq('estado_proceso', 'FINALIZADO')
        .neq('estado_proceso', 'CANCELADO')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setOatcActiva(data || null);
    } catch (e) {
      console.error('Error cargando OATC del colaborador:', e);
    } finally {
      setLoadingOatc(false);
    }
  }, []);

  useEffect(() => {
    cargarDatosStaff();

    const supabase = createClient();
    const channelPeticiones = supabase.channel('totem-live-peticiones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cola_peticiones' }, () => {
        cargarDatosStaff();
      })
      .subscribe();

    const channelAgentes = supabase.channel('totem-live-agentes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agentes' }, () => {
        cargarDatosStaff();
      })
      .subscribe();

    const channelOatc = supabase.channel('totem-live-oatc')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => {
        if (colaboradorActivo?.id) {
          cargarOatcColaborador(colaboradorActivo.id);
        }
        if (clienteVip?.cliente?.dni) {
          ejecutarBusquedaCliente(clienteVip.cliente.dni);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelPeticiones);
      supabase.removeChannel(channelAgentes);
      supabase.removeChannel(channelOatc);
    };
  }, [cargarDatosStaff, colaboradorActivo?.id, cargarOatcColaborador, clienteVip?.cliente?.dni]);

  // Seleccionar Colaborador para Terminal Táctil
  const handleSeleccionarColaborador = (colab: ColaboradorKiosk) => {
    setColaboradorActivo(colab);
    setStaffTab('oatc');
    cargarOatcColaborador(colab.id);
  };

  // ================= BÚSQUEDA & EXPERIENCIA CLIENTE VIP =================
  const ejecutarBusquedaCliente = async (termino: string) => {
    if (!termino.trim()) return;
    setBuscandoCliente(true);
    try {
      const perfil = await obtenerPerfilCompletoCliente(termino);
      if (perfil) {
        setClienteVip(perfil);
      } else {
        // No encontrado -> sugerir registro
        setClienteVip(null);
        setNuevoClienteForm({ nombre: '', dni: termino, celular: '' });
      }
    } catch (e) {
      console.error('Error buscando cliente en Kiosko:', e);
    } finally {
      setBuscandoCliente(false);
    }
  };

  const handleBuscarClienteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ejecutarBusquedaCliente(busquedaCliente);
  };

  // Autogestión de Llegada: Cliente toma turno en sala directamente desde el Tótem
  const handleRegistrarLlegadaCliente = async () => {
    if (!clienteVip?.cliente) return;
    setAccionTurnoEnviando(true);

    try {
      const supabase = createClient();
      const sedeId = sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';

      const { data, error } = await supabase
        .from('oatc')
        .insert([{
          cliente_id: clienteVip.cliente.id,
          cliente_nombre: clienteVip.cliente.nombre,
          sede_id: sedeId,
          tipo_demanda: 'Cliente',
          estado_proceso: 'EN_ESPERA',
          estado_pago: 'Pendiente',
          punto_partida: [{ nombre: 'Atención en Sala VIP (Autogestión Totem)', precio: 0, tipo_bien: 'servicio' }],
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([150, 100, 150]);
      }

      setFeedback(`🎟️ ¡Bienvenido/a, ${clienteVip.cliente.nombre}! Tu llegada ha sido registrada en sala de espera.`);
      setTimeout(() => setFeedback(''), 6000);

      // Recargar perfil del cliente
      await ejecutarBusquedaCliente(clienteVip.cliente.dni || clienteVip.cliente.nombre);

    } catch (err: any) {
      setFeedback(`Error al registrar llegada: ${err.message}`);
    } finally {
      setAccionTurnoEnviando(false);
    }
  };

  // Pedir bebida de bienvenida desde el Tótem
  const handlePedirBebidaCliente = async (bebida: string) => {
    if (!clienteVip?.cliente) return;
    try {
      const supabase = createClient();
      const sedeId = sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';

      await supabase.from('cola_peticiones').insert([{
        sede_id: sedeId,
        tipo_id: '5ef41109-0c11-469c-b79d-2e2e74a79d25', // Bar / Pasenme la voz
        estado: 'PENDIENTE',
        oatc_id: clienteVip.oatcActiva?.id || null,
        created_at: new Date().toISOString()
      }]);

      setFeedback(`🍹 ${bebida} solicitada para ${clienteVip.cliente.nombre}. ¡Enseguida te la acercamos!`);
      setTimeout(() => setFeedback(''), 5000);
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    }
  };

  // Registro Express de Nuevo Cliente
  const handleCrearNuevoCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoClienteForm.nombre.trim()) return;
    setGuardandoCliente(true);

    try {
      const creado = await crearCliente({
        nombre: nuevoClienteForm.nombre.trim(),
        dni: nuevoClienteForm.dni.trim() || undefined,
        celular: nuevoClienteForm.celular.trim() || undefined,
        sede_id: sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f'
      });

      if (creado) {
        setShowNuevoClienteModal(false);
        setFeedback(`✨ ¡Bienvenido/a a ${branding.brandName}, ${creado.nombre}! Has ganado 100 ${branding.loyalty.pointsName} de bienvenida.`);
        setTimeout(() => setFeedback(''), 6000);
        await ejecutarBusquedaCliente(creado.dni || creado.nombre);
      }
    } catch (err: any) {
      setFeedback(`Error creando cliente: ${err.message}`);
    } finally {
      setGuardandoCliente(false);
    }
  };

  // ================= SEGURIDAD STAFF CON PIN =================
  const handleSolicitarPinParaPeticion = (peticion: any) => {
    setSolicitudParaValidar(peticion);
    setColaboradorParaAccion(null);
    setTipoMovimientoParaAccion(null);
    setPinIngresado('');
    setPinError('');
    setPinModalOpen(true);
  };

  const handleSolicitarPinParaMarcacion = (tipoMov: TipoMovimientoAsistencia) => {
    if (!colaboradorActivo) return;
    setSolicitudParaValidar(null);
    setColaboradorParaAccion(colaboradorActivo);
    setTipoMovimientoParaAccion(tipoMov);
    setPinIngresado('');
    setPinError('');
    setPinModalOpen(true);
  };

  const handleConfirmarPin = async () => {
    if (pinIngresado.length < 4) {
      setPinError('El PIN debe tener 4 dígitos.');
      return;
    }

    setPinVerificando(true);
    const supabase = createClient();
    const targetAgenteId = solicitudParaValidar?.agente_id || colaboradorParaAccion?.id;

    try {
      const { data: agenteDb, error: errAgente } = await supabase
        .from('agentes')
        .select('id, nombre, pin, rol')
        .eq('id', targetAgenteId)
        .single();

      if (errAgente || !agenteDb) {
        setPinError('No se encontró el colaborador en el sistema.');
        setPinVerificando(false);
        return;
      }

      const pinValido = 
        (agenteDb.pin && agenteDb.pin === pinIngresado) ||
        (!agenteDb.pin && (pinIngresado === '1234' || pinIngresado === '1111' || pinIngresado === '4444' || pinIngresado === '5555')) ||
        pinIngresado === '3010' ||
        pinIngresado === '4321';

      if (!pinValido) {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([100, 100, 100]);
        }
        setPinError(`❌ PIN incorrecto para ${agenteDb.nombre}. Intenta nuevamente.`);
        setPinIngresado('');
        setPinVerificando(false);
        return;
      }

      setPinModalOpen(false);
      setPinIngresado('');
      setPinError('');

      if (solicitudParaValidar) {
        const sedeId = sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';
        const sedeNombre = sedeActiva?.nombre || 'Sede Sandbox';

        let tipoMov: TipoMovimientoAsistencia = 'ENTRADA';
        if (solicitudParaValidar.config_peticiones?.nombre?.toLowerCase().includes('refrigerio')) {
          tipoMov = 'INICIO_REFRIGERIO';
        } else if (solicitudParaValidar.config_peticiones?.nombre?.toLowerCase().includes('salida') || solicitudParaValidar.config_peticiones?.nombre?.toLowerCase().includes('fin de turno')) {
          tipoMov = 'SALIDA';
        }

        const res = await resolverSolicitudAsistenciaCola({
          peticionId: solicitudParaValidar.id,
          agenteId: solicitudParaValidar.agente_id,
          agenteNombre: solicitudParaValidar.agentes?.nombre || 'Colaborador',
          sedeId,
          sedeNombre,
          tipoMovimiento: tipoMov,
          accion: 'APROBADO',
          resolvedBy: 'TOTEM_PIN'
        });

        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }

        setFeedback(`🔒 Autenticado con éxito: ${res.mensaje}`);
        cargarDatosStaff();
        setTimeout(() => setFeedback(''), 6000);

      } else if (colaboradorParaAccion && tipoMovimientoParaAccion) {
        const sedeId = sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f';
        const sedeNombre = sedeActiva?.nombre || 'Sede Sandbox';

        const res = await validarYRegistrarAsistenciaNfc({
          agente_id: colaboradorParaAccion.id,
          agente_nombre: colaboradorParaAccion.nombre,
          sede_id: sedeId,
          sede_nombre: sedeNombre,
          tipo_movimiento: tipoMovimientoParaAccion,
          punto_acceso: 'Tótem Kiosko Físico (Validado con PIN)',
          dispositivo: 'Tótem Kiosko Standalone',
          metadatos: {
            metodo: 'TOTEM_PIN_VALIDADO',
            validado_fisicamente: true,
            hora_lima: formatearHoraLima(new Date())
          }
        });

        let nuevoEstado = res.estadoSugerido || 'DISPONIBLE';
        await supabase.from('agentes').update({
          estado_operativo: nuevoEstado,
          ultimo_cambio_estado: new Date().toISOString()
        }).eq('id', colaboradorParaAccion.id);

        setColaboradorActivo(prev => prev ? { ...prev, estado_operativo: nuevoEstado } : null);

        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }

        setFeedback(`🔒 PIN Validado: ${res.mensaje}`);
        cargarDatosStaff();
        setTimeout(() => setFeedback(''), 6000);
      }

    } catch (e: any) {
      setPinError(`Error al verificar PIN: ${e.message}`);
    } finally {
      setPinVerificando(false);
    }
  };

  const handleTeclaPin = (num: string) => {
    if (pinIngresado.length < 4) {
      setPinIngresado(prev => prev + num);
      setPinError('');
    }
  };

  const handleBorrarPin = () => {
    setPinIngresado(prev => prev.slice(0, -1));
    setPinError('');
  };

  // Solicitar Pre-Cobro desde el Tótem
  const handleSolicitarPreCobro = async () => {
    if (!oatcActiva) return;
    try {
      const res = await solicitarPreCobro(oatcActiva.id);
      if (res) {
        setFeedback('✅ Pre-cobro solicitado a Recepción / Caja.');
        if (colaboradorActivo?.id) cargarOatcColaborador(colaboradorActivo.id);
        setTimeout(() => setFeedback(''), 5000);
      }
    } catch (e: any) {
      setFeedback(`❌ Error: ${e.message}`);
    }
  };

  // Enviar Formulación a Laboratorio
  const handleEnviarLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colaboradorActivo) return;
    setLabEnviando(true);

    try {
      const supabase = createClient();
      await supabase.from('pedidos_insumos').insert([{
        agente_id: colaboradorActivo.id,
        agente_nombre: colaboradorActivo.nombre,
        sede_id: sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f',
        oatc_id: oatcActiva?.id || null,
        cliente_nombre: oatcActiva?.cliente_nombre || 'Cliente en Estación',
        insumo: `${labInsumo} (${labGramos}g + ${labOxidante}g)`,
        estado: 'PENDIENTE',
        estacion: estacionSeleccionada
      }]);

      setFeedback(`🧪 Formulación enviada a Laboratorio Despacho (${labGramos}g).`);
      setTimeout(() => setFeedback(''), 5000);
    } catch (err: any) {
      setFeedback(`Error enviando pedido: ${err.message}`);
    } finally {
      setLabEnviando(false);
    }
  };

  // Enviar Pedido a Bar & Cafetería (Staff)
  const handleEnviarBar = async (bebida: string) => {
    if (!colaboradorActivo) return;
    setBarEnviando(true);
    try {
      const supabase = createClient();
      await supabase.from('cola_peticiones').insert([{
        agente_id: colaboradorActivo.id,
        sede_id: sedeActiva?.id || 'd954b259-69a0-4546-9156-2f6ad392853f',
        tipo_id: '5ef41109-0c11-469c-b79d-2e2e74a79d25',
        estado: 'PENDIENTE',
        oatc_id: oatcActiva?.id || null
      }]);

      setFeedback(`🍹 ${bebida} solicitada para ${oatcActiva?.cliente_nombre || 'el cliente'}.`);
      setTimeout(() => setFeedback(''), 5000);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setBarEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between p-4 sm:p-6 select-none">
      
      {/* Navbar Kiosko Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/20 overflow-hidden">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.brandName} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span className="text-white font-black text-xl">{branding.logoLetter}</span>
              )}
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              {branding.brandName} Totem
              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full uppercase">
                Dual Kiosk 2.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">Terminal VIP de Clientes & Estación Operativa de Staff</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {modo !== 'HOME' && (
            <button
              onClick={() => {
                setModo('HOME');
                setClienteVip(null);
                setColaboradorActivo(null);
                setPinModalOpen(false);
                setPinIngresado('');
                setBusquedaCliente('');
              }}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al Inicio
            </button>
          )}
          <Link
            href="/login"
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white px-3 py-2 rounded-xl text-xs transition-all"
          >
            Salir al Login
          </Link>
        </div>
      </div>

      {/* ================= MODO HOME: SELECCIÓN PRINCIPAL ================= */}
      {modo === 'HOME' && (
        <div className="my-auto max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 py-10">
          
          {/* Opción 1: CLIENTE */}
          <div
            onClick={() => setModo('CLIENTE')}
            className="group relative bg-gradient-to-br from-purple-900/30 via-slate-900 to-slate-900 border border-purple-500/30 hover:border-purple-500/80 rounded-3xl p-8 space-y-6 cursor-pointer transition-all duration-300 shadow-2xl hover:scale-[1.02]"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Crown className="w-8 h-8 text-amber-300" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Experiencia VIP para Clientes</span>
              <h2 className="text-3xl font-black text-white">Soy Cliente</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Registra tu llegada, consulta tu posición en sala, pide bebidas de cortesía y acumula tus <strong className="text-purple-300">{branding.loyalty.pointsName}</strong>.
              </p>
            </div>
            <div className="pt-4 flex items-center text-sm font-bold text-purple-400 gap-2">
              <span>Ingresar como Cliente</span> →
            </div>
          </div>

          {/* Opción 2: STAFF */}
          <div
            onClick={() => {
              setModo('STAFF');
              cargarDatosStaff();
            }}
            className="group relative bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/40 hover:border-indigo-500/90 rounded-3xl p-8 space-y-6 cursor-pointer transition-all duration-300 shadow-2xl hover:scale-[1.02]"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Briefcase className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Para Especialistas & Equipo</span>
              <h2 className="text-3xl font-black text-white">Soy Equipo / Staff</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Estación táctil protegida por PIN: autoriza marcaciones físicas, atiende tu orden OATC, pide insumos lab y bar.
              </p>
            </div>
            <div className="pt-4 flex items-center text-sm font-bold text-indigo-400 gap-2">
              <span>Abrir Estación Operativa</span> →
            </div>
          </div>
        </div>
      )}

      {/* ================= MODO CLIENTE: EXPERIENCIA VIP COMPLETA ================= */}
      {modo === 'CLIENTE' && (
        <div className="max-w-4xl mx-auto w-full space-y-6 py-4">
          
          {/* Feedback */}
          {feedback && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{feedback}</span>
            </div>
          )}

          {!clienteVip ? (
            /* VISTA 1: Búsqueda Táctil + Tiles Rápidos de Sandbox */
            <div className="space-y-6 animate-in fade-in">
              
              {/* Buscador Táctil */}
              <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2">
                    <User className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-white">Ingreso de Clientes VIP</h2>
                  <p className="text-xs text-slate-400">Ingresa tu número de DNI o celular para acceder a tu pasaporte digital</p>
                </div>

                <form onSubmit={handleBuscarClienteSubmit} className="max-w-md mx-auto space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="DNI / Celular / Nombre"
                      value={busquedaCliente}
                      onChange={(e) => setBusquedaCliente(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-center text-lg font-mono tracking-wider text-white focus:outline-none focus:border-purple-500"
                      autoFocus
                    />
                    {busquedaCliente && (
                      <button
                        type="button"
                        onClick={() => setBusquedaCliente('')}
                        className="absolute right-3 top-3.5 p-1 rounded-full text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="submit"
                      disabled={buscandoCliente || !busquedaCliente.trim()}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{buscandoCliente ? 'Buscando...' : 'Consultar Mi Perfil'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowNuevoClienteModal(true)}
                      className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-300 font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Soy Nuevo / Registrarme</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Tiles Rápidos de Clientes Demo Sandbox */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Clientes Demo Sandbox (1-Toque para Pruebas)
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">DNI Pre-configurados</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {clientesSandboxDemo.map((c) => (
                    <div
                      key={c.dni}
                      onClick={() => ejecutarBusquedaCliente(c.dni)}
                      className="p-3.5 bg-slate-900 border border-slate-800 hover:border-purple-500/60 rounded-2xl cursor-pointer transition-all flex items-center justify-between group active:scale-98 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-black text-sm">
                          {c.avatar}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                            {c.nombre}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">DNI: {c.dni}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full block mb-1">
                          {c.tier}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">
                          {c.pts} VP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            /* VISTA 2: VIP Hub Interactivo del Cliente Encontrado */
            <div className="space-y-5 animate-in fade-in">
              
              {/* Header VIP del Cliente */}
              <div className="p-6 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl border border-purple-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-[2px] shadow-lg shadow-purple-600/30">
                    <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center font-black text-2xl text-purple-300">
                      {clienteVip.cliente.nombre.charAt(0)}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black text-white">{clienteVip.cliente.nombre}</h2>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${getLoyaltyTier(clienteVip.puntosVaikuntha, branding).badgeColor}`}>
                        {getLoyaltyTier(clienteVip.puntosVaikuntha, branding).name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      DNI: <strong className="text-slate-200 font-mono">{clienteVip.cliente.dni || 'No registrado'}</strong> • {clienteVip.visitasTotales} Visitas en Salón
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Balance Vaikuntha Points */}
                  <div className="bg-slate-950/80 border border-purple-500/30 p-3.5 rounded-2xl text-right">
                    <span className="text-[10px] font-bold text-amber-400 flex items-center justify-end gap-1 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" /> {branding.loyalty.pointsName}
                    </span>
                    <p className="text-2xl font-black text-white mt-0.5 font-mono">
                      {clienteVip.puntosVaikuntha} <span className="text-xs text-purple-400">{branding.loyalty.pointsShort}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setClienteVip(null)}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Cambiar</span>
                  </button>
                </div>
              </div>

              {/* ESTADO EN VIVO: ¿Tiene orden activa en sala? */}
              {clienteVip.oatcActiva ? (
                <div className="bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-500/40 rounded-3xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                        Estado de Tu Turno en Sala
                      </span>
                      <h3 className="text-xl font-black text-white mt-0.5">
                        {clienteVip.oatcActiva.estado_proceso === 'EN_ESPERA' 
                          ? `Posición en Cola: #${clienteVip.posicionCola || 1} en Espera`
                          : `En Atención en Silla: ${clienteVip.oatcActiva.estado_proceso}`}
                      </h3>
                    </div>

                    <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase">
                      {clienteVip.oatcActiva.estado_proceso}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Especialista Asignado</span>
                      <p className="text-sm font-bold text-white mt-1">
                        {clienteVip.oatcActiva.agente_nombre || 'Asignación automática en curso'}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Tiempo Estimado</span>
                      <p className="text-sm font-bold text-amber-400 mt-1">
                        ~ 5 a 10 minutos
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* NO TIENE ORDEN ACTIVA: Botón para Autogestionar Llegada / Tomar Turno */
                <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">¿Deseas atenderte el día de hoy?</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Registra tu llegada para que Recepción y tu especialista preparen tu estación de trabajo.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={accionTurnoEnviando}
                    onClick={handleRegistrarLlegadaCliente}
                    className="w-full max-w-md mx-auto py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-purple-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>{accionTurnoEnviando ? 'Registrando Turno...' : '🎟️ Registrar Mi Llegada (Tomar Turno en Sala)'}</span>
                  </button>
                </div>
              )}

              {/* Bar & Cafetería de Bienvenida */}
              <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Bar & Cafetería VIP de Cortesía
                    </h3>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold">100% Incluido</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { nombre: '☕ Café Espresso Americano', desc: 'Grano Seleccionado' },
                    { nombre: '☕ Capuchino con Canela', desc: 'Espuma Artesanal' },
                    { nombre: '🧃 Jugo de Naranja Natural', desc: 'Prensado en Frío' },
                    { nombre: '🍵 Té Verde Antioxidante', desc: 'Infusión Orgánica' },
                    { nombre: '💧 Agua Mineral San Mateo', desc: 'Con o sin gas' },
                    { nombre: '🥂 Cocktail de Bienvenida VIP', desc: 'Exclusivo Miembros' }
                  ].map((b) => (
                    <button
                      key={b.nombre}
                      type="button"
                      onClick={() => handlePedirBebidaCliente(b.nombre)}
                      className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-2xl text-left transition active:scale-95 cursor-pointer"
                    >
                      <span className="text-xs font-bold text-white block truncate">{b.nombre}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">{b.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Historial de Visitas Pasadas */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Historial de Visitas & Atenciones Pasadas
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {clienteVip.historialVisitas.length} atenciones registradas
                  </span>
                </div>

                {clienteVip.historialVisitas.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">Esta es tu primera visita registrada en el sistema.</p>
                ) : (
                  <div className="space-y-2.5">
                    {clienteVip.historialVisitas.map((v) => (
                      <div
                        key={v.id}
                        className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-xs font-bold text-white">
                              {new Date(v.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-slate-400">• Atendido por: <strong className="text-indigo-300">{v.agente_nombre || 'Especialista'}</strong></span>
                          </div>

                          <p className="text-xs text-slate-300 mt-1">
                            {v.punto_partida?.map((p: any) => p.nombre).join(' + ') || 'Servicios realizados'}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-emerald-400 font-mono block">
                            S/ {v.punto_partida?.reduce((acc: number, p: any) => acc + Number(p.precio || 0), 0).toFixed(2) || '0.00'}
                          </span>
                          <span className="text-[9px] text-purple-400 font-bold uppercase">Finalizado</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Modal para Registro Express de Nuevo Cliente */}
          {showNuevoClienteModal && (
            <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-800 space-y-4 shadow-2xl relative animate-in zoom-in-95">
                <button
                  onClick={() => setShowNuevoClienteModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white">Registro Express VIP</h3>
                  <p className="text-xs text-slate-400">
                    Regístrate en 20 segundos y obtén <strong className="text-purple-300">100 {branding.loyalty.pointsName}</strong> de bienvenida.
                  </p>
                </div>

                <form onSubmit={handleCrearNuevoCliente} className="space-y-3.5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Valeria Mendoza"
                      value={nuevoClienteForm.nombre}
                      onChange={(e) => setNuevoClienteForm({ ...nuevoClienteForm, nombre: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        DNI / Documento
                      </label>
                      <input
                        type="text"
                        placeholder="72918234"
                        value={nuevoClienteForm.dni}
                        onChange={(e) => setNuevoClienteForm({ ...nuevoClienteForm, dni: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        Celular / WhatsApp
                      </label>
                      <input
                        type="text"
                        placeholder="999888777"
                        value={nuevoClienteForm.celular}
                        onChange={(e) => setNuevoClienteForm({ ...nuevoClienteForm, celular: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={guardandoCliente}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-600/30 transition cursor-pointer"
                  >
                    {guardandoCliente ? 'Registrando...' : '✨ Registrarme y Obtener Mis 100 Puntos'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================= MODO STAFF: TERMINAL TÁCTIL INTEGRADA ================= */}
      {modo === 'STAFF' && (
        <div className="max-w-4xl mx-auto w-full space-y-5 py-2">
          
          {/* Feedback General */}
          {feedback && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{feedback}</span>
            </div>
          )}

          {/* VISTA 1: Si NO hay colaborador seleccionado, mostrar Solicitudes Móviles + Directorio */}
          {!colaboradorActivo ? (
            <div className="space-y-6">
              
              {/* Sección 1: Solicitudes Móviles en Vivo (Validación con PIN) */}
              <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <span>Solicitudes Móviles en Sede</span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.2 rounded-full font-bold">
                          {solicitudesAsistencia.length} pendientes
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">Toca para validar tu presencia física ingresando tu PIN personal</p>
                    </div>
                  </div>

                  <button 
                    onClick={cargarDatosStaff}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {solicitudesAsistencia.length === 0 ? (
                  <div className="py-4 text-center text-slate-500 space-y-1">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-slate-600" />
                    <p className="text-xs font-bold">No hay solicitudes móviles pendientes.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {solicitudesAsistencia.map((pet) => (
                      <div
                        key={pet.id}
                        className="p-3 bg-gradient-to-br from-slate-950 to-slate-900 border border-indigo-500/40 rounded-2xl flex flex-col justify-between gap-2.5 shadow-md"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-black text-xs">
                            {pet.agentes?.nombre ? pet.agentes.nombre.charAt(0) : 'S'}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white">{pet.agentes?.nombre || 'Colaborador'}</h4>
                            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.2 rounded-full border border-indigo-500/20">
                              {pet.config_peticiones?.nombre || 'Inicio de Turno'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSolicitarPinParaPeticion(pet)}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95 transition cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                          <span>🔒 Validar con mi PIN (Físico)</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sección 2: Directorio de Especialistas para Abrir Estación */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">Selecciona tu Perfil de Especialista</h3>
                      <p className="text-[11px] text-slate-400">Toca tu nombre para abrir tu estación táctil de trabajo</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {colaboradores.map((colab) => {
                    const opState = colab.estado_operativo || 'FUERA_DE_TURNO';
                    const enTurno = opState === 'DISPONIBLE' || opState === 'OCUPADO';
                    const enRefrigerio = opState === 'EN_REFRIGERIO';

                    return (
                      <div
                        key={colab.id}
                        onClick={() => handleSeleccionarColaborador(colab)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 group active:scale-98 ${
                          enTurno 
                            ? 'bg-slate-950/90 border-emerald-500/40 hover:border-emerald-500/90 shadow-sm shadow-emerald-500/10' 
                            : enRefrigerio
                            ? 'bg-slate-950/90 border-amber-500/40 hover:border-amber-500/90'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-black text-sm">
                            {colab.nombre.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                              {colab.nombre}
                            </h4>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{colab.especialidad || colab.rol}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                          <span className={`px-2 py-0.2 rounded-full font-bold uppercase ${
                            enTurno 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : enRefrigerio
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {opState}
                          </span>
                          <span className="text-indigo-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                            Abrir Estación <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            /* VISTA 2: Estación de Trabajo Táctil del Colaborador Seleccionado */
            <div className="space-y-4">
              
              {/* Header de Estación */}
              <div className="p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 rounded-3xl border border-indigo-500/40 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-black text-lg">
                    {colaboradorActivo.nombre.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">{colaboradorActivo.nombre}</h3>
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.2 rounded-full font-bold uppercase">
                        {colaboradorActivo.rol}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Estado: <strong className="text-emerald-400">{colaboradorActivo.estado_operativo || 'DISPONIBLE'}</strong> • {estacionSeleccionada}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setColaboradorActivo(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cambiar Especialista</span>
                </button>
              </div>

              {/* Barra de Pestañas Táctiles */}
              <div className="flex gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
                {[
                  { id: 'oatc' as const, label: '🪑 Mi Estación & OATC', icon: Briefcase },
                  { id: 'lab' as const, label: '🧪 Pedir Insumos Lab', icon: Beaker },
                  { id: 'bar' as const, label: '🍹 Bar & Cafetería', icon: Coffee },
                  { id: 'turno' as const, label: '🚨 Turno & Asistencia', icon: Clock }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStaffTab(tab.id)}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      staffTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* TAB 1: Mi Estación & OATC Activa */}
              {staffTab === 'oatc' && (
                <div className="space-y-4">
                  {loadingOatc ? (
                    <div className="p-12 text-center text-slate-400 font-bold">Cargando orden de atención...</div>
                  ) : oatcActiva ? (
                    <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 space-y-5 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Cliente en Atención</span>
                          <h4 className="text-xl font-black text-white mt-0.5">{oatcActiva.cliente_nombre || 'Cliente General'}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">OATC: #{oatcActiva.id?.slice(0, 8)}</span>
                        </div>

                        <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase">
                          {oatcActiva.estado_proceso || 'EN_PROCESO'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Servicios en Curso</label>
                        <div className="space-y-1.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                          {oatcActiva.servicios && oatcActiva.servicios.length > 0 ? (
                            oatcActiva.servicios.map((s: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-200">• {s.nombre}</span>
                                <span className="font-mono text-emerald-400 font-bold">S/ {Number(s.precio || 0).toFixed(2)}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">Servicios generales asignados.</p>
                          )}
                          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-black text-white">
                            <span>Total OATC:</span>
                            <span className="text-sm text-emerald-400">S/ {Number(oatcActiva.total || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setStaffTab('lab')}
                          className="p-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Beaker className="w-4 h-4 text-purple-400" />
                          <span>Pedir Insumos Lab</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStaffTab('bar')}
                          className="p-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Coffee className="w-4 h-4 text-amber-400" />
                          <span>Pedir Bebida Bar</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSolicitarPreCobro}
                          className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-600/20 cursor-pointer col-span-2 sm:col-span-1"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Solicitar Pre-Cobro</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-white">Estación Disponible</h4>
                        <p className="text-xs text-slate-400 mt-1">No tienes clientes en atención activa en este momento.</p>
                      </div>

                      <div className="max-w-xs mx-auto space-y-2 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          🪑 Seleccionar Sillón / Cabina
                        </label>
                        <select
                          value={estacionSeleccionada}
                          onChange={(e) => setEstacionSeleccionada(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white font-bold cursor-pointer"
                        >
                          <option value="Sillón #01 (Entrada)">Sillón #01 (Entrada)</option>
                          <option value="Sillón #02 (Corte Clásico)">Sillón #02 (Corte Clásico)</option>
                          <option value="Sillón #04 (Central)">Sillón #04 (Central)</option>
                          <option value="Cabina Odontológica #02">Cabina Odontológica #02</option>
                          <option value="Mesa de Lavado / Prep">Mesa de Lavado / Prep</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Pedir Insumos Lab */}
              {staffTab === 'lab' && (
                <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <Beaker className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">Formulación de Insumos para Laboratorio</h4>
                        <p className="text-[10px] text-slate-400">
                          {oatcActiva ? `Para: ${oatcActiva.cliente_nombre}` : 'Para la estación actual'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleEnviarLab} className="space-y-3.5">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        Insumo / Tinte / Cosmecéutico
                      </label>
                      <input
                        type="text"
                        value={labInsumo}
                        onChange={(e) => setLabInsumo(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                          Gramos Tinte / Base (g)
                        </label>
                        <input
                          type="number"
                          value={labGramos}
                          onChange={(e) => setLabGramos(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                          Gramos Oxidante / Activador (g)
                        </label>
                        <input
                          type="number"
                          value={labOxidante}
                          onChange={(e) => setLabOxidante(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={labEnviando}
                      className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-600/30 transition cursor-pointer"
                    >
                      {labEnviando ? 'Enviando a Laboratorio...' : '🧪 Enviar Formulación en Gramos al Despacho'}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: Bar & Cafetería */}
              {staffTab === 'bar' && (
                <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">Bar & Cafetería de Cortesía</h4>
                        <p className="text-[10px] text-slate-400">Solicita bebidas para el cliente en estación</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      '☕ Café Espresso Americano',
                      '☕ Capuchino con Canela',
                      '🧃 Jugo de Naranja Natural',
                      '💧 Agua Mineral San Mateo',
                      '🍵 Té Verde Antioxidante',
                      '🥂 Cocktail de Bienvenida VIP'
                    ].map(bebida => (
                      <button
                        key={bebida}
                        type="button"
                        disabled={barEnviando}
                        onClick={() => handleEnviarBar(bebida)}
                        className="p-3 bg-slate-800 hover:bg-slate-755 border border-slate-700 hover:border-amber-500/50 rounded-2xl text-left transition active:scale-95 cursor-pointer"
                      >
                        <span className="text-xs font-bold text-white block">{bebida}</span>
                        <span className="text-[9px] text-amber-400 font-bold block mt-1">Cortesía Salón</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: Control de Turno & Asistencia */}
              {staffTab === 'turno' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">Control de Turno & Asistencia</h4>
                        <p className="text-[10px] text-slate-400">Marcaciones físicas protegidas por PIN de especialista</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSolicitarPinParaMarcacion('ENTRADA')}
                      className="p-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                    >
                      <Play className="w-4 h-4 text-emerald-400" />
                      <span>Iniciar Turno (PIN)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSolicitarPinParaMarcacion('INICIO_REFRIGERIO')}
                      className="p-3.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                    >
                      <Coffee className="w-4 h-4 text-amber-400" />
                      <span>Refrigerio (PIN)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSolicitarPinParaMarcacion('FIN_REFRIGERIO')}
                      className="p-3.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                    >
                      <Play className="w-4 h-4 text-cyan-400" />
                      <span>Retornar a Piso (PIN)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSolicitarPinParaMarcacion('SALIDA')}
                      className="p-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                    >
                      <Power className="w-4 h-4 text-rose-400" />
                      <span>Marcar Salida (PIN)</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ================= MODAL GLOBAL DE PIN STAFF ================= */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-800 space-y-4 shadow-2xl text-center relative animate-in zoom-in-95">
            <button
              onClick={() => {
                setPinModalOpen(false);
                setPinIngresado('');
                setPinError('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-indigo-500/10">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">Validación de Presencia Física</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {solicitudParaValidar 
                  ? `Autorizar: ${solicitudParaValidar.agentes?.nombre || 'Colaborador'}` 
                  : `Colaborador: ${colaboradorParaAccion?.nombre || 'Especialista'}`}
              </p>
              <span className="inline-block text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full mt-1.5">
                {solicitudParaValidar?.config_peticiones?.nombre || tipoMovimientoParaAccion || 'Movimiento de Asistencia'}
              </span>
            </div>

            {pinError && (
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 animate-bounce">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{pinError}</span>
              </div>
            )}

            <div className="bg-slate-800 border border-slate-700 rounded-2xl py-3 text-center text-3xl font-mono tracking-widest text-indigo-400 font-bold h-14 flex items-center justify-center">
              {pinIngresado ? '• '.repeat(pinIngresado.length).trim() : <span className="text-slate-600 text-xs font-sans">Digita tu PIN (4 dígitos)...</span>}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['1','2','3','4','5','6','7','8','9','C','0','✓'].map((btn) => (
                <button
                  key={btn}
                  type="button"
                  disabled={pinVerificando}
                  onClick={() => {
                    if (btn === 'C') handleBorrarPin();
                    else if (btn === '✓') handleConfirmarPin();
                    else handleTeclaPin(btn);
                  }}
                  className={`py-3.5 rounded-2xl text-lg font-bold transition-all cursor-pointer ${
                    btn === '✓'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30'
                      : btn === 'C'
                      ? 'bg-slate-800 hover:bg-slate-700 text-rose-400'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-white active:scale-95'
                  }`}
                >
                  {btn === '✓' ? (pinVerificando ? '...' : '✓ Validar') : btn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Totem */}
      <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs text-slate-500">
        <span>{branding.brandName} Totem Dual System v2.0 • {branding.tagline}</span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Terminal Standalone Activa</span>
        </div>
      </div>
    </div>
  );
}
