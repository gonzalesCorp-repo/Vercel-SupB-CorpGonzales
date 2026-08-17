'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Briefcase, Zap, Beaker, Award, Clock, CheckCircle2, 
  ChevronRight, Wifi, ShieldCheck, LogOut, Disc, Smartphone, 
  BellRing, CalendarPlus, UserX, X, User, DollarSign, 
  Calendar, Layers, Users, Coffee, Sparkles, Radio 
} from 'lucide-react';
import Link from 'next/link';
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

import { MobileHeaderShell } from '@/components/layout/MobileHeaderShell';
import { CommandPalette, CommandItem } from '@/components/ui/watermelon-patterns/command-palette';
import { AnimatedNumber } from '@/components/ui/motion-primitives/animated-number';

export default function MobileOperacionPage() {
  const router = useRouter();
  const { clearSede, sedeActiva } = useAppStore();
  const { showAlert } = useUIStore();
  
  // Pestaña activa: ESTACIÓN por defecto
  const [activeHub, setActiveHub] = useState<MainHubTab>('estacion');
  
  // Modal de control de turno, asistencia y búsqueda táctil
  const [modalTurnoOpen, setModalTurnoOpen] = useState(false);
  const [modalLiquidacionOpen, setModalLiquidacionOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sedeConfig, setSedeConfig] = useState<SedeFeatureToggles | null>(null);

  const [agente, setAgente] = useState({
    id: '682826e5-0324-4af8-ae58-fe2580d265f9',
    nombre: 'Diógenes de Sinope',
    rol: 'STAFF',
    especialidad: 'Estilismo & Capilar',
    estado: 'ACTIVO',
    estado_operativo: 'FUERA_DE_TURNO',
    estacion: 'Sillón #04 (Estación Central)',
    comisionesHoy: 185.50,
    serviciosCompletados: 4,
    clienteActual: null as string | null
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
      const email = typeof window !== 'undefined' ? (localStorage.getItem('vaikuntha_user_email') || 'diogenes@vaikuntha.com') : 'diogenes@vaikuntha.com';
      const { data } = await supabase.from('agentes').select('*').ilike('email', email).maybeSingle();
      if (data) {
        currentId = data.id;
        currentNombre = data.nombre;
        setAgente(prev => ({
          ...prev,
          id: data.id,
          nombre: data.nombre,
          rol: data.rol,
          especialidad: data.especialidad || prev.especialidad,
          estado_operativo: data.estado_operativo || 'FUERA_DE_TURNO'
        }));

        loadGamification(data.id);
        cargarOatcActiva(data.id, data.nombre);
      }
    }

    syncAgente();

    const channelOatcName = `mobile-oatc-${currentId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const channelAgenteName = `mobile-agente-${currentId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

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

    return () => {
      try {
        supabase.removeChannel(channelOatc);
        supabase.removeChannel(channelAgente);
      } catch (e) {
        console.warn('Error removiendo canales móviles:', e);
      }
    };
  }, [cargarOatcActiva, loadGamification]);

  // 📡 PROCESADOR AUTOMÁTICO DE ESCANEO WEB NFC EN SEGUNDO PLANO
  const handleTagNfcEscaneado = useCallback(async (payload: NfcPayloadParsed) => {
    // Caso 1: Tag de Estación Física
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

    // Caso 2: Tag de Asistencia / Sede (Determinación inteligente del movimiento)
    let tipoMovimiento: TipoMovimientoAsistencia = 'ENTRADA';
    const estadoActual = (agente.estado_operativo || '').toUpperCase();

    if (estadoActual.includes('FUERA') || estadoActual === 'INACTIVO') {
      tipoMovimiento = 'ENTRADA';
    } else if (estadoActual === 'DISPONIBLE') {
      tipoMovimiento = 'INICIO_REFRIGERIO';
    } else if (estadoActual === 'EN_REFRIGERIO' || estadoActual === 'REFRIGERIO') {
      tipoMovimiento = 'FIN_REFRIGERIO';
    } else {
      tipoMovimiento = 'ENTRADA';
    }

    try {
      const res = await validarYRegistrarAsistenciaNfc({
        agente_id: agente.id,
        agente_nombre: agente.nombre,
        sede_id: sedeActiva?.id,
        sede_nombre: sedeActiva?.nombre,
        tipo_movimiento: tipoMovimiento,
        nfc_tag_id: payload.id,
        nfc_tag_raw: payload.raw,
        punto_acceso: payload.nombre,
        dispositivo: 'Web NFC Background Auto-Reader',
        metadatos: { metodo: 'WEB_NFC', serialNumber: payload.serialNumber }
      });

      if (res.ok && res.estadoSugerido) {
        setAgente(prev => ({ ...prev, estado_operativo: res.estadoSugerido! }));
        showAlert(res.mensaje, 'success');
      } else {
        showAlert(res.mensaje, res.duplicado ? 'info' : 'warning');
      }
    } catch (err: any) {
      console.error('Error procesando marcación NFC:', err);
      showAlert('No se pudo procesar la marcación NFC.', 'error');
    }
  }, [agente.id, agente.nombre, agente.estado_operativo, sedeActiva, sedeConfig, showAlert]);

  // Hook de escucha continua Web NFC en segundo plano
  const { isSupported: isNfcSupported, isListening: isNfcListening } = useNfcBackgroundListener({
    enabled: true,
    onTagScanned: handleTagNfcEscaneado
  });

  // 🔘 PROCESADOR MANUAL DE MARCACIÓN (Opción "0 Automatizaciones" táctil)
  const handleMarcarAsistenciaManual = async (nuevoEstado: string, motivo: string) => {
    let tipoMovimiento: TipoMovimientoAsistencia = 'ENTRADA';
    if (nuevoEstado === 'REFRIGERIO' || nuevoEstado === 'EN_REFRIGERIO') {
      tipoMovimiento = 'INICIO_REFRIGERIO';
    } else if (motivo.toLowerCase().includes('fin') || motivo.toLowerCase().includes('retorno')) {
      tipoMovimiento = 'FIN_REFRIGERIO';
    } else if (nuevoEstado.includes('FUERA') || motivo.toLowerCase().includes('salida') || motivo.toLowerCase().includes('acabó')) {
      tipoMovimiento = 'SALIDA';
    } else {
      tipoMovimiento = 'ENTRADA';
    }

    try {
      const res = await validarYRegistrarAsistenciaNfc({
        agente_id: agente.id,
        agente_nombre: agente.nombre,
        sede_id: sedeActiva?.id,
        sede_nombre: sedeActiva?.nombre,
        tipo_movimiento: tipoMovimiento,
        punto_acceso: 'Botonera Manual Móvil',
        dispositivo: 'Botón Táctil 1-Tap',
        metadatos: { metodo: 'DIGITAL_1TAP', motivo }
      });

      if (res.ok && res.estadoSugerido) {
        setAgente(prev => ({ ...prev, estado_operativo: res.estadoSugerido! }));
        setModalTurnoOpen(false);
        showAlert(res.mensaje, 'success');
      } else {
        showAlert(res.mensaje, res.duplicado ? 'info' : 'warning');
      }
    } catch (err) {
      console.error(err);
      showAlert('Error al registrar asistencia manual.', 'error');
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
    return { label: 'FUERA DE TURNO', bg: 'bg-slate-800 border-slate-700 text-slate-400', dot: 'bg-slate-500' };
  };

  const badgeInfo = getBadgeEstado(agente.estado_operativo);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-start max-w-md mx-auto pb-28 font-sans select-none">
      
      {/* 📱 HEADER PRINCIPAL (MobileHeaderShell Compacto) */}
      <MobileHeaderShell
        agenteNombre={agente.nombre}
        estacionNombre={agente.estacion}
        estadoOperativo={agente.estado_operativo}
        badgeLabel={badgeInfo.label}
        badgeBg={badgeInfo.bg}
        badgeDot={badgeInfo.dot}
        isNfcListening={isNfcListening}
        isNfcSupported={isNfcSupported}
        onOpenTurno={() => setModalTurnoOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenCuenta={() => setActiveHub('cuenta')}
        onLogout={async () => {
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
        }}
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
        ]}
      />

      {/* 📦 CONTENIDO DINÁMICO SEGÚN PESTAÑA SELECCIONADA */}
      <main className="p-4 flex-1 space-y-4">
        
        {/* 1. 💈 ESTACIÓN (Hub Principal con Sub-Tabs: Silla, Bar y Cola) */}
        {activeHub === 'estacion' && (
          <TabEstacion
            estacionNombre={agente.estacion}
            agenteNombre={agente.nombre}
            oatcActiva={oatcActiva}
            estadoOperativo={agente.estado_operativo}
            onMarcarAsistencia={handleMarcarAsistenciaManual}
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
          <TabCarteraCRM />
        )}

        {/* 4. 📊 LIQUIDACIÓN & AUDITORÍA */}
        {activeHub === 'liquidacion' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Producción de Hoy</span>
                <div className="text-2xl font-black text-white">
                  <AnimatedNumber value={agente.comisionesHoy} prefix="S/ " decimals={2} />
                </div>
              </div>
              <button
                onClick={() => setModalLiquidacionOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs shadow-md transition cursor-pointer"
              >
                Ver Comprobantes
              </button>
            </div>
            <TabHistorialAuditoria />
          </div>
        )}

        {/* 5. 👤 MI CUENTA STAFF 360 */}
        {activeHub === 'cuenta' && (
          <StaffPerfilView
            agente={agente}
            gamProfile={gamProfile}
            hallOfFame={hallOfFame}
          />
        )}

      </main>

      {/* 📱 BARRA DE NAVEGACIÓN INFERIOR iOS CENTER HUB */}
      <MobileAppleNav
        activeHub={activeHub}
        onSelectHub={setActiveHub}
      />

      {/* MODAL CONTROL DE ASISTENCIA / TURNO */}
      {modalTurnoOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black text-white">Control de Turno & Asistencia</h3>
              </div>
              <button onClick={() => setModalTurnoOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleMarcarAsistenciaManual('DISPONIBLE', 'Llegada / Inicio de Turno')}
                className="p-4 bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/40 rounded-2xl text-center space-y-1 transition cursor-pointer"
              >
                <span className="text-2xl block">👋</span>
                <span className="text-xs font-black text-emerald-300 block">YA LLEGUÉ</span>
                <span className="text-[10px] text-slate-400">Inicio de Turno</span>
              </button>

              <button
                onClick={() => handleMarcarAsistenciaManual('REFRIGERIO', 'Pausa Refrigerio')}
                className="p-4 bg-amber-950/40 border border-amber-500/40 hover:bg-amber-900/40 rounded-2xl text-center space-y-1 transition cursor-pointer"
              >
                <span className="text-2xl block">🍕</span>
                <span className="text-xs font-black text-amber-300 block">VOY A COMER</span>
                <span className="text-[10px] text-slate-400">Pausa Refrigerio</span>
              </button>

              <button
                onClick={() => handleMarcarAsistenciaManual('DISPONIBLE', 'Retorno de Refrigerio')}
                className="p-4 bg-indigo-950/40 border border-indigo-500/40 hover:bg-indigo-900/40 rounded-2xl text-center space-y-1 transition cursor-pointer"
              >
                <span className="text-2xl block">🔄</span>
                <span className="text-xs font-black text-indigo-300 block">REGRESÉ</span>
                <span className="text-[10px] text-slate-400">Fin de Refrigerio</span>
              </button>

              <button
                onClick={() => handleMarcarAsistenciaManual('FUERA_DE_TURNO', 'Fin de Jornada')}
                className="p-4 bg-rose-950/40 border border-rose-500/40 hover:bg-rose-900/40 rounded-2xl text-center space-y-1 transition cursor-pointer"
              >
                <span className="text-2xl block">🏁</span>
                <span className="text-xs font-black text-rose-300 block">ACABÓ MI DÍA</span>
                <span className="text-[10px] text-slate-400">Salida del Salón</span>
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

    </div>
  );
}
