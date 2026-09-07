'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, X, User, DollarSign, Calendar, Users, Coffee
} from 'lucide-react';
import { MobileAppleNav, MainHubTab } from '@/components/mobile/MobileAppleNav';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { registrarLog } from '@/services/logger';
import { TabEstacion } from '@/components/mobile/TabEstacion';
import { TabAgenda } from '@/components/mobile/TabAgenda';
import { TabCarteraCRM } from '@/components/mobile/TabCarteraCRM';
import { TabHistorialAuditoria } from '@/components/mobile/TabHistorialAuditoria';
import StaffPerfilView from '@/components/mobile/staff/StaffPerfilView';
import { ModalLiquidacionStaff } from '@/components/mobile/ModalLiquidacionStaff';
import { createClient } from '@/lib/supabase/client';
import { reproducirChimeNuevaOrden } from '@/lib/audio/chime';
import { useNfcBackgroundListener, NfcPayloadParsed } from '@/hooks/useNfcBackgroundListener';
import { validarYRegistrarAsistenciaNfc, TipoMovimientoAsistencia } from '@/services/asistencias';
import { obtenerConfiguracionSede, SedeFeatureToggles } from '@/services/sedesConfig';
import { obtenerEstadoCuentaContinuo } from '@/services/compensaciones';

import { MobileHeaderShell } from '@/components/layout/MobileHeaderShell';
import { CommandPalette, CommandItem } from '@/components/ui/watermelon-patterns/command-palette';
import { AnimatedNumber } from '@/components/ui/motion-primitives/animated-number';
import { SinSedeBloqueoView } from '@/components/mobile/SinSedeBloqueoView';
import { ModalSelectorSedeMulti, SedeOpcion } from '@/components/mobile/ModalSelectorSedeMulti';

export default function MobileOperacionPage() {
  const router = useRouter();
  const { clearSede, sedeActiva } = useAppStore();
  const { showAlert } = useUIStore();
  
  // Pestaña activa: ESTACIÓN por defecto
  const [activeHub, setActiveHub] = useState<MainHubTab>('estacion');
  
  // Modal de control de turno, asistencia y búsqueda táctil
  const [modalTurnoOpen, setModalTurnoOpen] = useState(false);
  const [modalPuertaNfcOpen, setModalPuertaNfcOpen] = useState(false);
  const [peticionPendiente, setPeticionPendiente] = useState<any>(null);
  const [modalLiquidacionOpen, setModalLiquidacionOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sedeConfig, setSedeConfig] = useState<SedeFeatureToggles | null>(null);

  // Gobernanza de Sedes asignadas
  const [misSedes, setMisSedes] = useState<SedeOpcion[]>([]);
  const [modalMultiSedeOpen, setModalMultiSedeOpen] = useState(false);
  const [sinSedeAsignada, setSinSedeAsignada] = useState(false);

  const [agente, setAgente] = useState({
    id: '',
    nombre: '',
    rol: 'STAFF',
    especialidad: 'Especialista de Salón',
    estado: 'ACTIVO',
    estado_operativo: 'FUERA_DE_TURNO',
    estacion: null as string | null,
    comisionesHoy: 0,
    serviciosCompletados: 0,
    clienteActual: null as string | null,
    atributos: null as any
  });

  const [oatcActiva, setOatcActiva] = useState<any>(null);
  const supabase = createClient();

  const gamProfile = useGamificationStore((state) => state.profile);
  const hallOfFame = useGamificationStore((state) => state.hallOfFame);
  const loadGamification = useGamificationStore((state) => state.loadProfile);

  const cargarOatcActiva = useCallback(async (agenteId: string, agenteNombre: string) => {
    try {
      const { data } = await supabase
        .from('oatc')
        .select('*')
        .or(`agente_id.eq.${agenteId},agente_nombre.ilike.%${agenteNombre}%`)
        .in('estado_proceso', ['EN_ESPERA', 'ASESORIA', 'EN_PROCESO', 'EN_EXPOSICION'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setOatcActiva(data || null);
      if (data) {
        setAgente(prev => ({
          ...prev,
          clienteActual: data.cliente_nombre,
          estado_operativo: data.estado_proceso === 'EN_EXPOSICION' ? 'DISPONIBLE' : 'OCUPADO'
        }));
      } else {
        setAgente(prev => ({
          ...prev,
          clienteActual: null,
          estado_operativo: prev.estado_operativo === 'OCUPADO' ? 'DISPONIBLE' : prev.estado_operativo
        }));
      }
    } catch (e) {
      console.warn('Error cargando OATC activa:', e);
    }
  }, []);

  // Cargar configuración de sede para gobernanza de estaciones
  useEffect(() => {
    async function loadConfig() {
      const cfg = await obtenerConfiguracionSede(sedeActiva?.id);
      setSedeConfig(cfg);
    }
    loadConfig();
  }, [sedeActiva?.id]);

  // Sincronizar agente y Realtime
  useEffect(() => {
    let currentId = agente.id;
    let currentNombre = agente.nombre;

    async function syncAgente() {
      const email = typeof window !== 'undefined' ? localStorage.getItem('vaikuntha_user_email') : null;
      if (!email) {
        router.replace('/login');
        return;
      }

      const { data } = await supabase.from('agentes').select('*').ilike('email', email).maybeSingle();
      if (data) {
        currentId = data.id;
        currentNombre = data.nombre;

        // Cargar todas las sedes asignadas al colaborador en sedes_usuarios
        const { data: suData } = await supabase
          .from('sedes_usuarios')
          .select('sede_id, sedes(id, nombre, direccion)')
          .eq('agente_id', data.id)
          .order('created_at', { ascending: false });

        const sedesEncontradas: SedeOpcion[] = (suData || [])
          .map((r: any) => {
            const s = Array.isArray(r.sedes) ? r.sedes[0] : r.sedes;
            return s && !s.nombre.toLowerCase().includes('sandbox')
              ? { id: s.id, nombre: s.nombre, direccion: s.direccion }
              : null;
          })
          .filter((s: SedeOpcion | null): s is SedeOpcion => !!s);

        setMisSedes(sedesEncontradas);

        // CASO 1: Si no tiene ninguna sede asignada -> Activar pantalla de bloqueo
        if (sedesEncontradas.length === 0) {
          setSinSedeAsignada(true);
          return;
        }

        setSinSedeAsignada(false);

        // CASO 2: Si tiene exactamente 1 sede -> Asignarla automáticamente
        if (sedesEncontradas.length === 1) {
          useAppStore.getState().setSedeActiva({
            id: sedesEncontradas[0].id,
            nombre: sedesEncontradas[0].nombre
          });
        } else {
          // CASO 3: Si tiene múltiples sedes -> Validar si la actual es válida o abrir modal selector
          const sedeActual = useAppStore.getState().sedeActiva;
          if (!sedeActual || !sedesEncontradas.some(s => s.id === sedeActual.id)) {
            useAppStore.getState().setSedeActiva({
              id: sedesEncontradas[0].id,
              nombre: sedesEncontradas[0].nombre
            });
            setModalMultiSedeOpen(true);
          }
        }

        // Cargar comisiones reales de hoy
        const estadoCta = await obtenerEstadoCuentaContinuo(data.id);
        const hoy = new Date().toISOString().split('T')[0];
        const { count: srvCount } = await supabase
          .from('oatc')
          .select('id', { count: 'exact', head: true })
          .or(`agente_id.eq.${data.id},agente_nombre.ilike.%${data.nombre}%`)
          .eq('estado_proceso', 'FINALIZADO')
          .gte('created_at', `${hoy}T00:00:00`);

        setAgente(prev => ({
          ...prev,
          id: data.id,
          nombre: data.nombre,
          rol: data.rol,
          especialidad: data.especialidad || prev.especialidad,
          estado_operativo: data.estado_operativo || 'FUERA_DE_TURNO',
          atributos: data.atributos,
          comisionesHoy: estadoCta.creditosHoy || 0,
          serviciosCompletados: srvCount || 0
        }));

        loadGamification(data.id);
        cargarOatcActiva(data.id, data.nombre);
        cargarPeticionPendiente(data.id);
      }
    }

    syncAgente();

    const channelOatcName = `mobile-oatc-${currentId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const channelAgenteName = `mobile-agente-${currentId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const channelPeticionName = `mobile-peticion-${currentId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const channelOatc = supabase.channel(channelOatcName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, (payload: any) => {
        cargarOatcActiva(currentId, currentNombre);
        if (payload.eventType === 'INSERT') {
          reproducirChimeNuevaOrden();
        }
      })
      .subscribe();

    const channelAgente = supabase.channel(channelAgenteName)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agentes', filter: `id=eq.${currentId}` }, (payload: any) => {
        if (payload.new?.estado_operativo) {
          setAgente(prev => ({ ...prev, estado_operativo: payload.new.estado_operativo }));
        }
      })
      .subscribe();

    const channelPeticion = supabase.channel(channelPeticionName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cola_peticiones', filter: `agente_id=eq.${currentId}` }, () => {
        cargarPeticionPendiente(currentId);
        syncAgente();
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channelOatc);
        supabase.removeChannel(channelAgente);
        supabase.removeChannel(channelPeticion);
      } catch (e) {
        console.warn('Error removiendo canales móviles:', e);
      }
    };
  }, [cargarOatcActiva, loadGamification, supabase]);

  const cargarPeticionPendiente = useCallback(async (agenteId: string) => {
    if (!agenteId) return;
    try {
      const { data } = await supabase
        .from('cola_peticiones')
        .select('*')
        .eq('agente_id', agenteId)
        .eq('estado', 'PENDIENTE')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setPeticionPendiente(data || null);
    } catch (e) {
      console.warn('Error cargando petición pendiente:', e);
    }
  }, [supabase]);

  // ⚡ EJECUTOR DIRECTO DE MARCACIÓN FÍSICA NFC (Puerta Principal y Comedor)
  const ejecutarMarcacionNfcDirecta = useCallback(async (tipoMovimiento: TipoMovimientoAsistencia, puntoAcceso: string, rawTag?: string) => {
    try {
      const res = await validarYRegistrarAsistenciaNfc({
        agente_id: agente.id,
        agente_nombre: agente.nombre,
        sede_id: sedeActiva?.id,
        sede_nombre: sedeActiva?.nombre,
        tipo_movimiento: tipoMovimiento,
        punto_acceso: puntoAcceso,
        nfc_tag_raw: rawTag,
        dispositivo: 'Web NFC Designated Tag',
        metadatos: { metodo: 'WEB_NFC_DESIGNATED', puntoAcceso }
      });

      if (res.ok && res.estadoSugerido) {
        setAgente(prev => ({ ...prev, estado_operativo: res.estadoSugerido! }));
        showAlert(res.mensaje, 'success');
      } else {
        showAlert(res.mensaje, res.duplicado ? 'info' : 'warning');
      }
    } catch (err: any) {
      console.error('Error procesando marcación NFC:', err);
      showAlert('No se pudo procesar la marcación física.', 'error');
    }
  }, [agente.id, agente.nombre, sedeActiva, showAlert]);

  // 📡 PROCESADOR AUTOMÁTICO DE ESCANEO WEB NFC EN SEGUNDO PLANO
  const handleTagNfcEscaneado = useCallback(async (payload: NfcPayloadParsed) => {
    const rawLower = (payload.raw || '').toLowerCase();

    // Caso 0: Ignorar URLs o tags no operativos
    if (payload.tipo === 'DESCONOCIDO' || rawLower.startsWith('http://') || rawLower.startsWith('https://') || rawLower.includes('docs.google.com')) {
      showAlert('Tag no reconocido como punto de control operativo.', 'warning');
      return;
    }

    // Caso 1: Tag de Estación Física (Sillón / Lavadero / Manicura)
    if (payload.tipo === 'ESTACION') {
      const estacionAutoPermitida = sedeConfig?.modoEstaciones === 'AUTOMATICO_IOT';
      if (estacionAutoPermitida) {
        const nombreEstacion = payload.nombre || payload.id || 'Estación de Piso';
        setAgente(prev => ({ ...prev, estacion: nombreEstacion }));
        showAlert(`🛋️ Estación vinculada por NFC: ${nombreEstacion}`, 'success');
        await registrarLog('WFM_ESTACION_NFC', `${agente.nombre} vinculó ${nombreEstacion} vía Web NFC.`);
      } else {
        showAlert(`ℹ️ Tag de estación detectado: ${payload.nombre}. Asignación gobernada por buzón manual.`, 'info');
      }
      return;
    }

    // Caso 2: Tag Físico de Sede
    const estadoActual = (agente.estado_operativo || '').toUpperCase();
    const esPuerta = payload.id === 'PUERTA_PRINCIPAL' || rawLower.includes('puerta') || rawLower.includes('acceso') || rawLower.includes('entrada');
    const esComedor = payload.id === 'COMEDOR_REFRIGERIO' || rawLower.includes('comedor') || rawLower.includes('cafeteria') || rawLower.includes('refrigerio');

    // A. PUERTA PRINCIPAL (Entrada, Salida y Refrigerio fuera)
    if (esPuerta) {
      if (estadoActual.includes('FUERA') || estadoActual === 'INACTIVO' || estadoActual === 'DESCONECTADO') {
        // Marcación de Llegada
        await ejecutarMarcacionNfcDirecta('ENTRADA', 'Puerta Principal (Entrada)', payload.raw);
        return;
      }
      if (estadoActual.includes('REFRIGERIO')) {
        // Retorno de refrigerio fuera
        await ejecutarMarcacionNfcDirecta('FIN_REFRIGERIO', 'Puerta Principal (Retorno Refrigerio)', payload.raw);
        return;
      }
      // Si está disponible u ocupado, preguntar al colaborador si sale a almorzar fuera o fin de turno
      setModalPuertaNfcOpen(true);
      return;
    }

    // B. COMEDOR / CAFETERÍA (Refrigerio interno en sede)
    if (esComedor) {
      if (estadoActual.includes('FUERA') || estadoActual === 'INACTIVO') {
        showAlert('ℹ️ Debes registrar tu Entrada en Puerta Principal antes de iniciar refrigerio.', 'warning');
        return;
      }
      if (estadoActual.includes('REFRIGERIO')) {
        await ejecutarMarcacionNfcDirecta('FIN_REFRIGERIO', 'Comedor (Fin Refrigerio)', payload.raw);
      } else {
        await ejecutarMarcacionNfcDirecta('INICIO_REFRIGERIO', 'Comedor (Inicio Refrigerio)', payload.raw);
      }
      return;
    }

    // C. Otros puntos de control genéricos de sede
    if (estadoActual.includes('FUERA') || estadoActual === 'INACTIVO') {
      await ejecutarMarcacionNfcDirecta('ENTRADA', payload.nombre || 'Punto de Acceso Sede', payload.raw);
    } else {
      showAlert(`ℹ️ ¡Hola ${agente.nombre}! Tu turno ya se encuentra activo en sede.`, 'info');
    }
  }, [agente.id, agente.nombre, agente.estado_operativo, sedeConfig, showAlert, ejecutarMarcacionNfcDirecta]);

  // Hook de escucha continua Web NFC en segundo plano
  const { isSupported: isNfcSupported, isListening: isNfcListening } = useNfcBackgroundListener({
    enabled: true,
    onTagScanned: handleTagNfcEscaneado
  });

  // 🔘 PROCESADOR TÁCTIL: SOLICITUD DE CAMBIO DE TURNO (Petición enviada a Recepción)
  const handleSolicitarCambioTurno = async (nombrePeticion: string, tipoId: string) => {
    if (!agente.id) {
      showAlert('No se puede enviar la solicitud: Colaborador no identificado.', 'error');
      return;
    }

    // Resolver sede garantizada (sedeActiva -> sedes_usuarios -> fallback no-sandbox)
    let targetSedeId = sedeActiva?.id;
    if (!targetSedeId || targetSedeId === 'd954b259-69a0-4546-9156-2f6ad392853f') {
      const { data: su } = await supabase
        .from('sedes_usuarios')
        .select('sede_id, sedes(id, nombre)')
        .eq('agente_id', agente.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (su?.sede_id) {
        targetSedeId = su.sede_id;
        const sedeObj: any = Array.isArray(su.sedes) ? su.sedes[0] : su.sedes;
        if (sedeObj?.id) {
          useAppStore.getState().setSedeActiva({ id: sedeObj.id, nombre: sedeObj.nombre });
        }
      }
    }

    if (!targetSedeId) {
      const { data: sFallback } = await supabase
        .from('sedes')
        .select('id, nombre')
        .not('nombre', 'ilike', '%sandbox%')
        .not('nombre', 'ilike', '%prueba%')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (sFallback?.id) {
        targetSedeId = sFallback.id;
        useAppStore.getState().setSedeActiva({ id: sFallback.id, nombre: sFallback.nombre });
      }
    }

    try {
      const { data, error } = await supabase.from('cola_peticiones').insert([{
        sede_id: targetSedeId,
        agente_id: agente.id,
        tipo_id: tipoId,
        tipo: 'TURNO_PETICION',
        solicitante_nombre: agente.nombre,
        detalle: `Solicitud de ${nombrePeticion}`,
        estado: 'PENDIENTE',
        metadata: { motivo: nombrePeticion, creado_en: new Date().toISOString() }
      }]).select().single();

      if (error) {
        console.error('Error solicitando cambio de turno:', error);
        showAlert('Error al enviar la solicitud a Recepción.', 'error');
        return;
      }

      setPeticionPendiente(data);
      setModalTurnoOpen(false);
      showAlert(`📨 Solicitud de "${nombrePeticion}" enviada a Recepción. Esperando aprobación...`, 'info');
    } catch (err: any) {
      console.error(err);
      showAlert('Error enviando la petición de turno.', 'error');
    }
  };

  const getBadgeEstado = (estado: string) => {
    const s = estado?.toUpperCase() || '';
    if (s.includes('DISPONIBLE')) {
      return { label: 'EN TURNO (DISPONIBLE)', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', dot: 'bg-emerald-400' };
    }
    if (s.includes('OCUPADO')) {
      return { label: 'EN ATENCIÓN (OCUPADO)', bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400', dot: 'bg-indigo-400' };
    }
    if (s.includes('REFRIGERIO')) {
      return { label: 'EN REFRIGERIO', bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400', dot: 'bg-amber-400' };
    }
    return { label: 'FUERA DE TURNO', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400', dot: 'bg-slate-400 dark:bg-slate-500' };
  };

  const badgeInfo = getBadgeEstado(agente.estado_operativo);

  const handleLogout = useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabaseClient = createClient();
    await supabaseClient.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vaikuntha_user_email');
      localStorage.removeItem('vaikuntha_user_role');
      localStorage.removeItem('vaikuntha_user_name');
    }
    clearSede();
    window.location.href = '/login';
  }, [clearSede]);

  // Si el colaborador no tiene ninguna sede asignada en sedes_usuarios -> Bloqueo con contacto a Diana Laiza
  if (sinSedeAsignada) {
    return (
      <SinSedeBloqueoView
        colaboradorNombre={agente.nombre}
        colaboradorEmail={typeof window !== 'undefined' ? localStorage.getItem('vaikuntha_user_email') || '' : ''}
        onReintentar={() => {
          if (typeof window !== 'undefined') window.location.reload();
        }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-start w-full  pb-28 font-sans select-none transition-colors duration-200">
      
      {/* 📱 HEADER PRINCIPAL (MobileHeaderShell Compacto con Sede y Selector Multi-Sede) */}
      <MobileHeaderShell
        agenteNombre={agente.nombre}
        estacionNombre={agente.estacion || undefined}
        sedeNombre={sedeActiva?.nombre}
        tieneMultiSede={misSedes.length > 1}
        onOpenSelectorSede={() => setModalMultiSedeOpen(true)}
        estadoOperativo={agente.estado_operativo}
        badgeLabel={badgeInfo.label}
        badgeBg={badgeInfo.bg}
        badgeDot={badgeInfo.dot}
        isNfcListening={isNfcListening}
        isNfcSupported={isNfcSupported}
        onOpenTurno={() => setModalTurnoOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenCuenta={() => setActiveHub('cuenta')}
        onLogout={handleLogout}
      />

      {/* 🔍 Buscador Táctil Modal / CommandPalette */}
      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        items={[
          {
            id: 'cmd-turno',
            title: 'Control de Turno & Asistencia',
            subtitle: 'Registrar entrada, pausa o salida de jornada',
            category: 'Operaciones',
            icon: <Clock className="w-4 h-4 text-emerald-400" />,
            onSelect: () => setModalTurnoOpen(true),
          },
          {
            id: 'cmd-agenda',
            title: 'Ver Mi Agenda de Citas',
            subtitle: 'Consultar reservas y turnos del día',
            category: 'Navegación',
            icon: <Calendar className="w-4 h-4 text-indigo-400" />,
            onSelect: () => setActiveHub('agenda'),
          },
          {
            id: 'cmd-cartera',
            title: 'Cartera de Clientes & CRM',
            subtitle: 'Historial de visitas y fórmulas técnicas',
            category: 'Navegación',
            icon: <Users className="w-4 h-4 text-purple-400" />,
            onSelect: () => setActiveHub('cartera'),
          },
          {
            id: 'cmd-liquidacion',
            title: 'Mi Liquidación y Comisiones',
            subtitle: 'Producción acumulada y comprobantes',
            category: 'Finanzas',
            icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
            onSelect: () => setActiveHub('liquidacion'),
          },
          {
            id: 'cmd-cuenta',
            title: 'Mi Cuenta & Perfil',
            subtitle: 'Ajustes personales, PIN y preferencias',
            category: 'Configuración',
            icon: <User className="w-4 h-4 text-slate-400" />,
            onSelect: () => setActiveHub('cuenta'),
          },
          {
            id: 'cmd-bar',
            title: 'Workspace de Bar & Cafetería',
            subtitle: 'Gestión de comandas en vivo e insumos propios',
            category: 'Operaciones',
            icon: <Coffee className="w-4 h-4 text-amber-400" />,
            onSelect: () => router.push('/mobile/bar'),
          },
        ]}
      />

      {/* 📦 CONTENIDO DINÁMICO SEGÚN PESTAÑA SELECCIONADA */}
      <main className="p-4 flex-1 space-y-4">
        
        {/* 1. 💈 ESTACIÓN (Hub Principal con Sub-Tabs: Silla, Bar y Cola) */}
        {activeHub === 'estacion' && (
          <TabEstacion
            estacionNombre={agente.estacion || 'Estación de Piso'}
            agenteNombre={agente.nombre}
            oatcActiva={oatcActiva}
            estadoOperativo={agente.estado_operativo}
            peticionPendiente={peticionPendiente}
            onSolicitarCambioTurno={handleSolicitarCambioTurno}
            onEstacionVinculada={(nombre) => setAgente(prev => ({ ...prev, estacion: nombre }))}
            onServicioFinalizado={() => cargarOatcActiva(agente.id, agente.nombre)}
            onRefrescar={() => cargarOatcActiva(agente.id, agente.nombre)}
          />
        )}

        {/* 2. 📅 AGENDA */}
        {activeHub === 'agenda' && (
          <TabAgenda agenteNombre={agente.nombre} agenteRol={agente.rol || 'STAFF'} />
        )}

        {/* 3. 👥 CARTERA CRM */}
        {activeHub === 'cartera' && (
          <TabCarteraCRM agenteId={agente.id} agenteNombre={agente.nombre} />
        )}

        {/* 4. 📊 LIQUIDACIÓN & AUDITORÍA */}
        {activeHub === 'liquidacion' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-xl transition-colors duration-200">
              <div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">Producción de Hoy</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  <AnimatedNumber value={agente.comisionesHoy} prefix="S/ " decimals={2} />
                </div>
              </div>
              <button onClick={() => setModalLiquidacionOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs shadow-md transition cursor-pointer"
              >
                Ver Comprobantes
              </button>
            </div>
            <TabHistorialAuditoria agenteId={agente.id} agenteNombre={agente.nombre} />
          </div>
        )}

        {/* 5. 👤 MI CUENTA STAFF 360 */}
        {activeHub === 'cuenta' && (
          <StaffPerfilView
            agente={agente}
            gamProfile={gamProfile}
            hallOfFame={hallOfFame}
            sedeNombre={sedeActiva?.nombre}
            tieneMultiSede={misSedes.length > 1}
            onOpenSelectorSede={() => setModalMultiSedeOpen(true)}
          />
        )}

      </main>

      {/* 📱 BARRA DE NAVEGACIÓN INFERIOR iOS CENTER HUB */}
      <MobileAppleNav 
        activeHub={activeHub}
        onSelectHub={setActiveHub}
        mostrarCartera={agente.rol === 'SUPERADMIN' || agente.rol === 'ADMIN' || agente.rol === 'SOPORTE'}
      />

      {/* MODAL CONTROL DE ASISTENCIA / TURNO (SOLICITUDES A RECEPCIÓN) */}
      {modalTurnoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl transition-colors duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Control de Turno & Asistencia</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Solicitar cambio de estado a Recepción</p>
                </div>
              </div>
              <button onClick={() => setModalTurnoOpen(false)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {peticionPendiente && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-black">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Solicitud en curso</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Esperando aprobación de: <strong>{peticionPendiente.detalle || 'Cambio de Turno'}</strong>
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSolicitarCambioTurno('Inicio de Turno / Asistencia', '11111111-1111-1111-1111-111111111111')}
                className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-2xl text-center space-y-1 transition active:scale-95 cursor-pointer"
              >
                <span className="text-2xl block">👋</span>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 block">YA LLEGUÉ</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Solicitar Entrada</span>
              </button>

              <button
                type="button"
                onClick={() => handleSolicitarCambioTurno('Refrigerio', '22222222-2222-2222-2222-222222222222')}
                className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-2xl text-center space-y-1 transition active:scale-95 cursor-pointer"
              >
                <span className="text-2xl block">🍕</span>
                <span className="text-xs font-black text-amber-700 dark:text-amber-300 block">VOY A COMER</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Solicitar Refrigerio</span>
              </button>

              <button
                type="button"
                onClick={() => handleSolicitarCambioTurno('Retorno de Servicio', '54c59ee3-12cf-42cd-bfe9-aa400cdef0a4')}
                className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-2xl text-center space-y-1 transition active:scale-95 cursor-pointer"
              >
                <span className="text-2xl block">🔄</span>
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 block">REGRESÉ</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Fin de Refrigerio</span>
              </button>

              <button
                type="button"
                onClick={() => handleSolicitarCambioTurno('Fin de Turno / Salida', '33333333-3333-3333-3333-333333333333')}
                className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-2xl text-center space-y-1 transition active:scale-95 cursor-pointer"
              >
                <span className="text-2xl block">🏁</span>
                <span className="text-xs font-black text-rose-700 dark:text-rose-300 block">ACABÓ MI DÍA</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Solicitar Salida</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PUERTA PRINCIPAL DETECTADA (ELECCIÓN DE ALMUERZO FUERA O SALIDA) */}
      {modalPuertaNfcOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚪</span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Puerta Principal Detectada</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Selecciona tu movimiento en salida física</p>
                </div>
              </div>
              <button onClick={() => setModalPuertaNfcOpen(false)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={async () => {
                  setModalPuertaNfcOpen(false);
                  await ejecutarMarcacionNfcDirecta('INICIO_REFRIGERIO', 'Puerta Principal (Salida a Almorzar fuera)');
                }}
                className="p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-500/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-2xl text-center space-y-1.5 transition active:scale-95 cursor-pointer"
              >
                <span className="text-2xl block">🍕</span>
                <span className="text-xs font-black text-amber-700 dark:text-amber-300 block">SALGO A ALMORZAR</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Pausa Refrigerio</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setModalPuertaNfcOpen(false);
                  await ejecutarMarcacionNfcDirecta('SALIDA', 'Puerta Principal (Fin de Turno)');
                }}
                className="p-4 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-500/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-2xl text-center space-y-1.5 transition active:scale-95 cursor-pointer"
              >
                <span className="text-2xl block">🏁</span>
                <span className="text-xs font-black text-rose-700 dark:text-rose-300 block">ACABÓ MI DÍA</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Fin de Jornada</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE LIQUIDACIÓN Y ESTADO DE CUENTA */}
      <ModalLiquidacionStaff
        isOpen={modalLiquidacionOpen}
        onClose={() => setModalLiquidacionOpen(false)}
        agenteId={agente.id}
        agenteNombre={agente.nombre}
      />

      {/* MODAL SELECTOR MULTI-SEDE PARA COLABORADORES CON MÁS DE 1 SALÓN */}
      <ModalSelectorSedeMulti
        isOpen={modalMultiSedeOpen}
        onClose={() => setModalMultiSedeOpen(false)}
        sedes={misSedes}
        sedeActualId={sedeActiva?.id}
        onSelectSede={(s) => {
          useAppStore.getState().setSedeActiva({ id: s.id, nombre: s.nombre });
          showAlert(`📍 Sede cambiada a: ${s.nombre}`, 'info');
        }}
      />

    </div>
  );
}
