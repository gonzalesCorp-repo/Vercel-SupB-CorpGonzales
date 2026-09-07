'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
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
import { getBrandingForSede } from '@/config/branding';

import dynamic from 'next/dynamic';

// Subcomponentes Modulares Stitch + Opal AI
import { KioskModo, KioskStaffTab, ColaboradorKiosk } from '@/components/kiosk/types';
import { KioskHeader } from '@/components/kiosk/KioskHeader';
import { KioskHeroWelcome } from '@/components/kiosk/KioskHeroWelcome';
import { KioskVipCheckIn } from '@/components/kiosk/KioskVipCheckIn';

const KioskLoadingSkeleton = () => (
  <div className="w-full flex-1 flex flex-col items-center justify-center p-8 space-y-4 animate-pulse" role="status" aria-label="Iniciando módulo táctil...">
    <div className="w-20 h-20 rounded-full bg-slate-200/60 dark:bg-slate-800/60" />
    <div className="h-6 w-48 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl" />
    <div className="h-4 w-64 bg-slate-200/40 dark:bg-slate-800/40 rounded-lg" />
  </div>
);

const KioskVipHub = dynamic(
  () => import('@/components/kiosk/KioskVipHub').then(m => m.KioskVipHub),
  { loading: () => <KioskLoadingSkeleton /> }
);

const KioskStaffDirectory = dynamic(
  () => import('@/components/kiosk/KioskStaffDirectory').then(m => m.KioskStaffDirectory),
  { loading: () => <KioskLoadingSkeleton /> }
);

const KioskStaffStation = dynamic(
  () => import('@/components/kiosk/KioskStaffStation').then(m => m.KioskStaffStation),
  { loading: () => <KioskLoadingSkeleton /> }
);

const KioskPinModal = dynamic(
  () => import('@/components/kiosk/KioskPinModal').then(m => m.KioskPinModal)
);

export default function KioskoDualPage() {
  const [modo, setModo] = useState<KioskModo>('HOME');
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
  const [clientesFrecuentes, setClientesFrecuentes] = useState<any[]>([]);

  // ================= ESTADO STAFF & TERMINAL TÁCTIL =================
  const [colaboradores, setColaboradores] = useState<ColaboradorKiosk[]>([]);
  const [solicitudesAsistencia, setSolicitudesAsistencia] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  
  // Colaborador Activo en la Terminal del Tótem
  const [colaboradorActivo, setColaboradorActivo] = useState<ColaboradorKiosk | null>(null);
  const [staffTab, setStaffTab] = useState<KioskStaffTab>('oatc');
  const [oatcActiva, setOatcActiva] = useState<any | null>(null);
  const [loadingOatc, setLoadingOatc] = useState(false);
  const [estacionSeleccionada, setEstacionSeleccionada] = useState('Sillón #01 (Entrada)');

  // Modal de Seguridad PIN
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
  const [barEnviando, setBarEnviando] = useState(false);

  const cargarDatosStaff = useCallback(async () => {
    const sedeId = sedeActiva?.id || '';
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

  const cargarClientesFrecuentes = useCallback(async () => {
    const supabase = createClient();
    try {
      let q = supabase
        .from('clientes')
        .select('id, nombre, dni, celular, saldo_credito, created_at')
        .order('created_at', { ascending: false })
        .limit(6);

      if (sedeActiva?.id) {
        q = q.or(`sede_id.eq.${sedeActiva.id},sede_id.is.null`);
      }

      const { data } = await q;
      setClientesFrecuentes(data || []);
    } catch (e) {
      console.error('Error cargando clientes frecuentes en Kiosko:', e);
    }
  }, [sedeActiva?.id]);

  const ejecutarBusquedaCliente = useCallback(async (termino: string) => {
    if (!termino.trim()) return;
    setBuscandoCliente(true);
    try {
      const perfil = await obtenerPerfilCompletoCliente(termino);
      if (perfil) {
        setClienteVip(perfil);
      } else {
        setClienteVip(null);
        setNuevoClienteForm({ nombre: '', dni: termino, celular: '' });
      }
    } catch (e) {
      console.error('Error buscando cliente en Kiosko:', e);
    } finally {
      setBuscandoCliente(false);
    }
  }, []);

  useEffect(() => {
    cargarDatosStaff();
    cargarClientesFrecuentes();

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

    const channelClientes = supabase.channel('totem-live-clientes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
        cargarClientesFrecuentes();
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
      supabase.removeChannel(channelClientes);
      supabase.removeChannel(channelOatc);
    };
  }, [cargarDatosStaff, cargarClientesFrecuentes, colaboradorActivo?.id, cargarOatcColaborador, clienteVip?.cliente?.dni, ejecutarBusquedaCliente]);

  const handleSeleccionarColaborador = (colab: ColaboradorKiosk) => {
    setColaboradorActivo(colab);
    setStaffTab('oatc');
    cargarOatcColaborador(colab.id);
  };

  const handleBuscarClienteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ejecutarBusquedaCliente(busquedaCliente);
  };

  const handleRegistrarLlegadaCliente = async () => {
    if (!clienteVip?.cliente) return;
    setAccionTurnoEnviando(true);

    try {
      const supabase = createClient();
      const sedeId = sedeActiva?.id || '';

      const { error } = await supabase
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
      await ejecutarBusquedaCliente(clienteVip.cliente.dni || clienteVip.cliente.nombre);

    } catch (err: any) {
      setFeedback(`Error al registrar llegada: ${err.message}`);
    } finally {
      setAccionTurnoEnviando(false);
    }
  };

  const handlePedirBebidaCliente = async (bebida: string) => {
    if (!clienteVip?.cliente) return;
    try {
      const supabase = createClient();
      const sedeId = sedeActiva?.id || '';

      await supabase.from('cola_peticiones').insert([{
        sede_id: sedeId,
        tipo_id: '5ef41109-0c11-469c-b79d-2e2e74a79d25',
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

  const handleCrearNuevoCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoClienteForm.nombre.trim()) return;
    setGuardandoCliente(true);

    try {
      const creado = await crearCliente({
        nombre: nuevoClienteForm.nombre.trim(),
        dni: nuevoClienteForm.dni.trim() || undefined,
        celular: nuevoClienteForm.celular.trim() || undefined,
        sede_id: sedeActiva?.id || ''
      });

      if (creado) {
        setShowNuevoClienteModal(false);
        setFeedback(`✨ ¡Bienvenido/a a ${branding.brandName}, ${creado.nombre}! Has ganado 100 ${branding.loyalty?.pointsName || 'Puntos'}.`);
        setTimeout(() => setFeedback(''), 6000);
        await ejecutarBusquedaCliente(creado.dni || creado.nombre);
      }
    } catch (err: any) {
      setFeedback(`Error creando cliente: ${err.message}`);
    } finally {
      setGuardandoCliente(false);
    }
  };

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

      const fallbackPinDni = (agenteDb as any).dni && String((agenteDb as any).dni).length >= 4 ? String((agenteDb as any).dni).slice(-4) : null;
      const pinValido = 
        (agenteDb.pin && agenteDb.pin === pinIngresado) ||
        (!agenteDb.pin && fallbackPinDni && pinIngresado === fallbackPinDni);

      if (!pinValido) {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([100, 100, 100]);
        }
        setPinError(`❌ PIN incorrecto para ${agenteDb.nombre}. Intenta nuevamente.`);
        setPinIngresado('');
        setPinVerificando(false);
        return;
      }

      // PIN Correcto
      setPinModalOpen(false);
      setPinIngresado('');

      if (solicitudParaValidar) {
        const sedeId = sedeActiva?.id || '';
        const sedeNombre = sedeActiva?.nombre || branding.brandName || 'Gloss Salón';
        const tipoMov = solicitudParaValidar.config_peticiones?.tipo_movimiento || 'ENTRADA';

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
        const sedeId = sedeActiva?.id || '';
        const sedeNombre = sedeActiva?.nombre || branding.brandName || 'Gloss Salón';

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

  const handleEnviarLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colaboradorActivo) return;
    setLabEnviando(true);

    try {
      const supabase = createClient();
      await supabase.from('pedidos_insumos').insert([{
        agente_id: colaboradorActivo.id,
        agente_nombre: colaboradorActivo.nombre,
        sede_id: sedeActiva?.id || '',
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

  const handleEnviarBar = async (bebida: string) => {
    if (!colaboradorActivo) return;
    setBarEnviando(true);
    try {
      const supabase = createClient();
      
      if (oatcActiva?.id) {
        const itemsActuales = Array.isArray(oatcActiva.punto_partida) ? oatcActiva.punto_partida : [];
        const nuevoItemBebida = {
          id: `bar_${Date.now()}`,
          nombre: `Cortesía Bar: ${bebida}`,
          precio: 0.00,
          precio_venta: 0.00,
          tipo: 'BEBIDA_CORTESIA',
          solicitado_por: colaboradorActivo.nombre,
          fecha: new Date().toISOString()
        };
        
        await supabase
          .from('oatc')
          .update({
            punto_partida: [...itemsActuales, nuevoItemBebida]
          })
          .eq('id', oatcActiva.id);
      }

      await supabase.from('cola_peticiones').insert([{
        agente_id: colaboradorActivo.id,
        sede_id: sedeActiva?.id || null,
        estado: 'PENDIENTE',
        oatc_id: oatcActiva?.id || null
      }]);

      setFeedback(`🍹 ${bebida} solicitada como cortesía para ${oatcActiva?.cliente_nombre || 'el cliente'}.`);
      setTimeout(() => setFeedback(''), 5000);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setBarEnviando(false);
    }
  };

  const handleVolverHome = () => {
    setModo('HOME');
    setClienteVip(null);
    setColaboradorActivo(null);
    setPinModalOpen(false);
    setPinIngresado('');
    setBusquedaCliente('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between p-4 sm:p-6 select-none">
      
      {/* Header Kiosko */}
      <KioskHeader
        branding={branding}
        modo={modo}
        onVolverHome={handleVolverHome}
      />

      {/* MODO HOME: Selección Principal */}
      {modo === 'HOME' && (
        <KioskHeroWelcome
          branding={branding}
          onSelectModo={(m) => {
            setModo(m);
            if (m === 'STAFF') cargarDatosStaff();
          }}
        />
      )}

      {/* MODO CLIENTE: VIP Check-in + Hub Interactivo */}
      {modo === 'CLIENTE' && (
        <div className="max-w-4xl mx-auto w-full space-y-6 py-4">
          {feedback && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{feedback}</span>
            </div>
          )}

          {!clienteVip ? (
            <KioskVipCheckIn
              busquedaCliente={busquedaCliente}
              setBusquedaCliente={setBusquedaCliente}
              buscandoCliente={buscandoCliente}
              onBuscarSubmit={handleBuscarClienteSubmit}
              onEjecutarBusqueda={ejecutarBusquedaCliente}
              clientesFrecuentes={clientesFrecuentes}
              onOpenNuevoCliente={() => setShowNuevoClienteModal(true)}
              showNuevoClienteModal={showNuevoClienteModal}
              onCloseNuevoClienteModal={() => setShowNuevoClienteModal(false)}
              nuevoClienteForm={nuevoClienteForm}
              setNuevoClienteForm={setNuevoClienteForm}
              guardandoCliente={guardandoCliente}
              onCrearNuevoClienteSubmit={handleCrearNuevoCliente}
              branding={branding}
            />
          ) : (
            <KioskVipHub
              clienteVip={clienteVip}
              branding={branding}
              onCambiarCliente={() => setClienteVip(null)}
              accionTurnoEnviando={accionTurnoEnviando}
              onRegistrarLlegada={handleRegistrarLlegadaCliente}
              onPedirBebida={handlePedirBebidaCliente}
            />
          )}
        </div>
      )}

      {/* MODO STAFF: Directorio + Estación de Trabajo */}
      {modo === 'STAFF' && (
        <div className="max-w-4xl mx-auto w-full space-y-5 py-2">
          {feedback && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{feedback}</span>
            </div>
          )}

          {!colaboradorActivo ? (
            <KioskStaffDirectory
              solicitudesAsistencia={solicitudesAsistencia}
              loadingData={loadingData}
              onRefreshStaff={cargarDatosStaff}
              onSolicitarPinParaPeticion={handleSolicitarPinParaPeticion}
              colaboradores={colaboradores}
              onSeleccionarColaborador={handleSeleccionarColaborador}
            />
          ) : (
            <KioskStaffStation
              colaboradorActivo={colaboradorActivo}
              onCambiarColaborador={() => setColaboradorActivo(null)}
              estacionSeleccionada={estacionSeleccionada}
              setEstacionSeleccionada={setEstacionSeleccionada}
              staffTab={staffTab}
              setStaffTab={setStaffTab}
              loadingOatc={loadingOatc}
              oatcActiva={oatcActiva}
              onSolicitarPreCobro={handleSolicitarPreCobro}
              labInsumo={labInsumo}
              setLabInsumo={setLabInsumo}
              labGramos={labGramos}
              setLabGramos={setLabGramos}
              labOxidante={labOxidante}
              setLabOxidante={setLabOxidante}
              labEnviando={labEnviando}
              onEnviarLab={handleEnviarLab}
              barEnviando={barEnviando}
              onEnviarBar={handleEnviarBar}
              onSolicitarPinParaMarcacion={handleSolicitarPinParaMarcacion}
            />
          )}
        </div>
      )}

      {/* Modal de PIN Global */}
      <KioskPinModal
        isOpen={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false);
          setPinIngresado('');
          setPinError('');
        }}
        solicitudParaValidar={solicitudParaValidar}
        colaboradorParaAccion={colaboradorParaAccion}
        tipoMovimientoParaAccion={tipoMovimientoParaAccion}
        pinIngresado={pinIngresado}
        pinError={pinError}
        pinVerificando={pinVerificando}
        onTeclaPin={handleTeclaPin}
        onBorrarPin={handleBorrarPin}
        onConfirmarPin={handleConfirmarPin}
      />

      {/* Footer Kiosko */}
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
