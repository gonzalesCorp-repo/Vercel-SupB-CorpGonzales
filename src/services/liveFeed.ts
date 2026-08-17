import { createClient } from '@/lib/supabase/client';

export type LiveFeedType = 'OATC' | 'WFM' | 'PETICION' | 'ESPERA' | 'TALLER';
export type LiveFeedColor = 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';

export interface LiveFeedItem {
  id: string;
  tipo: LiveFeedType;
  mensaje: string;
  detalle?: string;
  icono: string;
  color: LiveFeedColor;
  timestamp: Date;
  accionHref?: string;
  accionTexto?: string;
  leido?: boolean;
}

type LiveFeedCallback = (items: LiveFeedItem[]) => void;

class LiveFeedService {
  private static instance: LiveFeedService;
  private items: LiveFeedItem[] = [];
  private listeners: Set<LiveFeedCallback> = new Set();
  private supabase = createClient();
  private channel: any = null;
  private currentSedeId: string | null = null;
  private esperasInterval: any = null;
  private soundEnabled: boolean = true;

  private constructor() {
    if (typeof window !== 'undefined') {
      const savedSound = localStorage.getItem('vaikuntha_live_feed_sound');
      this.soundEnabled = savedSound !== null ? savedSound === 'true' : true;
    }
  }

  public static getInstance(): LiveFeedService {
    if (!LiveFeedService.instance) {
      LiveFeedService.instance = new LiveFeedService();
    }
    return LiveFeedService.instance;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setAudioEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('vaikuntha_live_feed_sound', String(enabled));
    }
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('vaikuntha_live_feed_sound', String(this.soundEnabled));
    }
    return this.soundEnabled;
  }

  public reproducirChime(color: LiveFeedColor) {
    if (!this.soundEnabled || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (color === 'rose' || color === 'amber') {
        // Alerta suave (doble tono)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        // Chime armónico positivo
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // Ignorar errores de audio autoplay si el navegador bloquea
    }
  }

  public getItems(): LiveFeedItem[] {
    return [...this.items];
  }

  public subscribe(sedeId: string, callback: LiveFeedCallback): () => void {
    this.listeners.add(callback);
    callback(this.items);

    if (this.currentSedeId !== sedeId) {
      this.initSede(sedeId);
    }

    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.cleanup();
      }
    };
  }

  private notify() {
    const list = [...this.items];
    this.listeners.forEach(cb => cb(list));
  }

  private addItem(item: LiveFeedItem, playAudio = true) {
    // Evitar duplicados recientes con el mismo mensaje dentro de 10 segundos
    const exists = this.items.some(
      existing => existing.mensaje === item.mensaje && 
      Math.abs(existing.timestamp.getTime() - item.timestamp.getTime()) < 10000
    );

    if (exists) return;

    this.items = [item, ...this.items.slice(0, 39)]; // Mantener últimos 40 eventos
    this.notify();

    if (playAudio) {
      this.reproducirChime(item.color);
    }
  }

  private async initSede(sedeId: string) {
    this.cleanup();
    this.currentSedeId = sedeId;
    this.items = [];

    // 1. Cargar historial inicial reciente
    await this.cargarEventosIniciales(sedeId);

    // 2. Iniciar cálculo de esperas prolongadas
    this.evaluarClientesEnEspera(sedeId);
    this.esperasInterval = setInterval(() => {
      this.evaluarClientesEnEspera(sedeId);
    }, 45000); // Cada 45 segundos

    // 3. Suscripción Supabase Realtime con identificador único de canal
    const uniqueChannelId = `live-feed-${sedeId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newChannel = this.supabase.channel(uniqueChannelId);

    newChannel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'oatc', filter: `sede_id=eq.${sedeId}` },
        (payload: any) => this.handleOatcChange(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cola_peticiones', filter: `sede_id=eq.${sedeId}` },
        (payload: any) => this.handlePeticionChange(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'estaciones_piso', filter: `sede_id=eq.${sedeId}` },
        (payload: any) => this.handleEstacionChange(payload)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'agentes' },
        (payload: any) => this.handleAgenteChange(payload)
      );

    this.channel = newChannel;
    newChannel.subscribe();
  }

  private cleanup() {
    if (this.channel) {
      try {
        this.supabase.removeChannel(this.channel);
      } catch (e) {
        console.warn('[LiveFeedService] Error removiendo canal:', e);
      }
      this.channel = null;
    }
    if (this.esperasInterval) {
      clearInterval(this.esperasInterval);
      this.esperasInterval = null;
    }
    this.currentSedeId = null;
  }

  private async cargarEventosIniciales(sedeId: string) {
    try {
      // Obtener últimas 10 OATCs activas o recientes
      const { data: oatcs } = await this.supabase
        .from('oatc')
        .select('id, cliente_nombre, agente_nombre, estado_proceso, estado_pago, created_at, hora_inicio_atencion, hora_fin_atencion')
        .eq('sede_id', sedeId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (oatcs && oatcs.length > 0) {
        oatcs.forEach((oatc: any) => {
          if (oatc.estado_proceso === 'EN_PROCESO') {
            this.addItem({
              id: `init-oatc-${oatc.id}`,
              tipo: 'OATC',
              mensaje: `💇 ${oatc.agente_nombre || 'Especialista'} atiende a '${oatc.cliente_nombre || 'Cliente'}'`,
              detalle: 'Servicio en proceso',
              icono: 'Scissors',
              color: 'blue',
              timestamp: new Date(oatc.hora_inicio_atencion || oatc.created_at),
              accionHref: '/recepcion',
              accionTexto: 'Ver OATC'
            }, false);
          } else if (oatc.estado_proceso === 'EN_ESPERA') {
            this.addItem({
              id: `init-espera-${oatc.id}`,
              tipo: 'ESPERA',
              mensaje: `🎫 Cliente '${oatc.cliente_nombre}' en sala de espera`,
              detalle: `Asignado a: ${oatc.agente_nombre || 'Por asignar'}`,
              icono: 'Clock',
              color: 'amber',
              timestamp: new Date(oatc.created_at),
              accionHref: '/recepcion',
              accionTexto: 'Asignar'
            }, false);
          } else if (oatc.estado_proceso === 'PRE_COBRADO') {
            this.addItem({
              id: `init-precobro-${oatc.id}`,
              tipo: 'OATC',
              mensaje: `💳 '${oatc.cliente_nombre}' listo para cobro en Caja`,
              detalle: `Atendido por ${oatc.agente_nombre}`,
              icono: 'CreditCard',
              color: 'emerald',
              timestamp: new Date(oatc.hora_fin_atencion || oatc.created_at),
              accionHref: '/caja',
              accionTexto: 'Cobrar'
            }, false);
          }
        });
      }

      // Obtener últimas peticiones pendientes
      const { data: peticiones } = await this.supabase
        .from('cola_peticiones')
        .select('id, estado, created_at, oatc(cliente_nombre), agentes(nombre)')
        .eq('sede_id', sedeId)
        .eq('estado', 'PENDIENTE')
        .order('created_at', { ascending: false })
        .limit(5);

      if (peticiones && peticiones.length > 0) {
        peticiones.forEach((p: any) => {
          this.addItem({
            id: `init-pet-${p.id}`,
            tipo: 'PETICION',
            mensaje: `🛎️ Petición pendiente de ${p.agentes?.nombre || 'Staff'}`,
            detalle: p.oatc?.cliente_nombre ? `Cliente: ${p.oatc.cliente_nombre}` : 'Solicitud operativa',
            icono: 'Bell',
            color: 'rose',
            timestamp: new Date(p.created_at),
            accionHref: '/recepcion',
            accionTexto: 'Resolver'
          }, false);
        });
      }
    } catch (err) {
      console.warn('Error al cargar eventos iniciales de Live Feed:', err);
    }
  }

  private async evaluarClientesEnEspera(sedeId: string) {
    try {
      const { data: enEspera } = await this.supabase
        .from('oatc')
        .select('id, cliente_nombre, agente_nombre, created_at')
        .eq('sede_id', sedeId)
        .eq('estado_proceso', 'EN_ESPERA');

      if (!enEspera || enEspera.length === 0) return;

      const ahora = Date.now();
      enEspera.forEach((item: any) => {
        const creacion = new Date(item.created_at).getTime();
        const minutosEsperando = Math.floor((ahora - creacion) / 60000);

        if (minutosEsperando >= 10) {
          this.addItem({
            id: `espera-prolongada-${item.id}-${minutosEsperando}`,
            tipo: 'ESPERA',
            mensaje: `⏳ Cliente '${item.cliente_nombre || 'Invitado'}' lleva ${minutosEsperando} min esperando.`,
            detalle: `Especialista preferido: ${item.agente_nombre || 'No asignado'}`,
            icono: 'Clock',
            color: 'amber',
            timestamp: new Date(),
            accionHref: '/recepcion',
            accionTexto: 'Ver en Cola'
          }, true);
        }
      });
    } catch (err) {
      console.warn('Error evaluando clientes en espera:', err);
    }
  }

  private handleOatcChange(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT') {
      this.addItem({
        id: `oatc-ins-${newRecord.id}-${Date.now()}`,
        tipo: 'OATC',
        mensaje: `🎫 Nuevo OATC generado para cliente '${newRecord.cliente_nombre || 'Cliente'}'.`,
        detalle: `Demanda: ${newRecord.tipo_demanda || 'Recepción'} • Asignado a: ${newRecord.agente_nombre || 'Por asignar'}`,
        icono: 'UserPlus',
        color: 'blue',
        timestamp: new Date(),
        accionHref: '/recepcion',
        accionTexto: 'Ver Cita'
      });
    } else if (eventType === 'UPDATE') {
      // Cambio a EN_PROCESO
      if (newRecord.estado_proceso === 'EN_PROCESO' && oldRecord.estado_proceso !== 'EN_PROCESO') {
        this.addItem({
          id: `oatc-proc-${newRecord.id}-${Date.now()}`,
          tipo: 'OATC',
          mensaje: `✂️ Estilista '${newRecord.agente_nombre || 'Staff'}' inició servicio con '${newRecord.cliente_nombre}'.`,
          detalle: 'Atención en proceso en estación física',
          icono: 'Scissors',
          color: 'blue',
          timestamp: new Date(),
          accionHref: '/operaciones/supervision',
          accionTexto: 'Ver Piso'
        });
      }
      // Cambio a PRE_COBRADO
      else if (newRecord.estado_proceso === 'PRE_COBRADO' && oldRecord.estado_proceso !== 'PRE_COBRADO') {
        this.addItem({
          id: `oatc-precobro-${newRecord.id}-${Date.now()}`,
          tipo: 'OATC',
          mensaje: `✅ Estilista '${newRecord.agente_nombre || 'Staff'}' finalizó servicio de '${newRecord.cliente_nombre}'.`,
          detalle: 'Orden lista para cobro y emisión en Caja POS',
          icono: 'CheckCircle2',
          color: 'emerald',
          timestamp: new Date(),
          accionHref: '/caja',
          accionTexto: 'Cobrar en Caja'
        });
      }
      // Cambio a FINALIZADO (Cobrado)
      else if (newRecord.estado_proceso === 'FINALIZADO' && oldRecord.estado_proceso !== 'FINALIZADO') {
        this.addItem({
          id: `oatc-fin-${newRecord.id}-${Date.now()}`,
          tipo: 'OATC',
          mensaje: `💵 Cobro completado con éxito para '${newRecord.cliente_nombre}'.`,
          detalle: 'OATC cerrada y estación liberada',
          icono: 'DollarSign',
          color: 'emerald',
          timestamp: new Date(),
          accionHref: '/caja',
          accionTexto: 'Ver Arqueo'
        });
      }
      // Solicitud de Upselling o Cambios pendientes
      else if (newRecord.cambios_pendientes && (!oldRecord.cambios_pendientes || JSON.stringify(newRecord.cambios_pendientes) !== JSON.stringify(oldRecord.cambios_pendientes))) {
        this.addItem({
          id: `oatc-upsell-${newRecord.id}-${Date.now()}`,
          tipo: 'OATC',
          mensaje: `💎 Staff '${newRecord.agente_nombre}' solicitó agregar servicio a '${newRecord.cliente_nombre}'.`,
          detalle: 'Requiere autorización o validación en Recepción',
          icono: 'Sparkles',
          color: 'purple',
          timestamp: new Date(),
          accionHref: '/recepcion',
          accionTexto: 'Aprobar'
        });
      }
    }
  }

  private handlePeticionChange(payload: any) {
    const { eventType, new: newRecord } = payload;

    if (eventType === 'INSERT') {
      this.addItem({
        id: `pet-ins-${newRecord.id}-${Date.now()}`,
        tipo: 'PETICION',
        mensaje: `🔔 Nueva solicitud de asistencia en piso de ${newRecord.agente_nombre || 'Staff'}.`,
        detalle: 'Buzón de autorizaciones / Recepción',
        icono: 'Bell',
        color: 'rose',
        timestamp: new Date(),
        accionHref: '/recepcion',
        accionTexto: 'Ver Buzón'
      });
    }
  }

  private handleEstacionChange(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'UPDATE' && newRecord.estado_ocupacion !== oldRecord.estado_ocupacion) {
      if (newRecord.estado_ocupacion === 'OCUPADO') {
        this.addItem({
          id: `est-ocupada-${newRecord.id}-${Date.now()}`,
          tipo: 'WFM',
          mensaje: `💺 Estación '${newRecord.nombre || newRecord.codigo}' ocupada por ${newRecord.agente_actual_nombre || 'Staff'}.`,
          detalle: 'Monitoreo de Estaciones 2D',
          icono: 'Armchair',
          color: 'blue',
          timestamp: new Date(),
          accionHref: '/operaciones/supervision',
          accionTexto: 'Ver Estación'
        });
      } else if (newRecord.estado_ocupacion === 'LIBRE') {
        this.addItem({
          id: `est-libre-${newRecord.id}-${Date.now()}`,
          tipo: 'WFM',
          mensaje: `✨ Estación '${newRecord.nombre || newRecord.codigo}' liberada y lista.`,
          detalle: 'Disponible para asignación de nuevo cliente',
          icono: 'Sparkles',
          color: 'emerald',
          timestamp: new Date(),
          accionHref: '/operaciones/supervision',
          accionTexto: 'Ver Mapa'
        });
      } else if (newRecord.estado_ocupacion === 'LIMPIEZA') {
        this.addItem({
          id: `est-limp-${newRecord.id}-${Date.now()}`,
          tipo: 'WFM',
          mensaje: `🧹 Estación '${newRecord.nombre || newRecord.codigo}' en proceso de higienización.`,
          detalle: 'Bloqueada temporalmente',
          icono: 'Sparkles',
          color: 'amber',
          timestamp: new Date(),
          accionHref: '/operaciones/supervision',
          accionTexto: 'Supervisar'
        });
      }
    }
  }

  private handleAgenteChange(payload: any) {
    const { new: newRecord, old: oldRecord } = payload;

    if (newRecord.estado_operativo && newRecord.estado_operativo !== oldRecord.estado_operativo) {
      if (newRecord.estado_operativo === 'EN_REFRIGERIO') {
        this.addItem({
          id: `wfm-ref-${newRecord.id}-${Date.now()}`,
          tipo: 'WFM',
          mensaje: `☕ Staff '${newRecord.nombre}' pasó a refrigerio.`,
          detalle: 'Pausa operativa programada',
          icono: 'Coffee',
          color: 'amber',
          timestamp: new Date(),
          accionHref: '/operaciones/supervision',
          accionTexto: 'Ver Staff'
        });
      } else if (newRecord.estado_operativo === 'DISPONIBLE' && oldRecord.estado_operativo === 'FUERA_DE_TURNO') {
        this.addItem({
          id: `wfm-in-${newRecord.id}-${Date.now()}`,
          tipo: 'WFM',
          mensaje: `🚪 Ingreso de '${newRecord.nombre}' a la sede (Turno iniciado).`,
          detalle: 'Marcación de asistencia registrada',
          icono: 'LogIn',
          color: 'emerald',
          timestamp: new Date(),
          accionHref: '/operaciones/supervision',
          accionTexto: 'Ver Asistencia'
        });
      }
    }
  }
}

export const liveFeedService = LiveFeedService.getInstance();
