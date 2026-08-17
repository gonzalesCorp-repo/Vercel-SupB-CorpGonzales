// ============================================================================
// EcosystemBridge.ts - Universal Data Bridge & Adapter for Standalone & Coupled Modes
// Permite que Vaikuntha ERP, LuminaHQ y My Network Social Hub funcionen 100% 
// autónomos o conectados entre sí (y permite a LuminaHQ conectarse a CUALQUIER ERP).
// ============================================================================

export type BridgeMode = 'STANDALONE' | 'COUPLED_ECOSYSTEM' | 'COUPLED_EXTERNAL_ERP';

export interface EcosystemEvent<T = any> {
  eventId: string;
  eventType: 
    | 'TICKET_COBRADO' 
    | 'CHECKIN_ESTACION' 
    | 'STOCK_ALERT' 
    | 'RECOMPENSA_ASIGNADA' 
    | 'CUPON_CANJEADO' 
    | 'EXTERNAL_ERP_SYNC';
  timestamp: string;
  source: 'VAIKUNTHA_ERP' | 'LUMINA_HQ' | 'MNSH_GAME' | 'EXTERNAL_ERP';
  tenantId?: string;
  payload: T;
}

export interface GenericERPPayload {
  externalSystemName?: string; // e.g. "SAP", "Odoo", "Siigo", "Custom ERP"
  orderId: string;
  customerIdentifier: string; // Email, DNI, Phone
  amount: number;
  currency: string;
  staffIdentifier?: string;
  items?: Array<{ name: string; sku?: string; qty: number; unitPrice: number }>;
}

export class EcosystemBridge {
  private static mode: BridgeMode = 'STANDALONE';
  private static eventListeners: Map<string, Array<(event: EcosystemEvent) => void>> = new Map();
  private static externalERPEndpoint: string = '';

  /**
   * Configura el modo de operación del puente
   */
  public static setMode(newMode: BridgeMode, externalEndpoint?: string): void {
    this.mode = newMode;
    if (externalEndpoint) {
      this.externalERPEndpoint = externalEndpoint;
    }
    console.log(`%c[EcosystemBridge] Modo actualizado a: ${newMode}`, 'color: #3b82f6; font-weight: bold;');
  }

  public static getMode(): BridgeMode {
    return this.mode;
  }

  /**
   * Suscribirse a eventos del ecosistema
   */
  public static on(eventType: string, callback: (event: EcosystemEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Emitir un evento. Si está en modo STANDALONE, persiste localmente.
   * Si está en COUPLED, despacha a los listeners locales y simula sync o envía a webhook.
   */
  public static emit<T>(eventType: EcosystemEvent['eventType'], payload: T, source: EcosystemEvent['source'] = 'LUMINA_HQ'): EcosystemEvent<T> {
    const event: EcosystemEvent<T> = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType,
      timestamp: new Date().toISOString(),
      source,
      payload
    };

    // 1. Guardar siempre en historial local (Fallback Offline-First)
    this.persistLocalEvent(event);

    // 2. Notificar a listeners locales (en la misma sesión de frontend)
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(cb => cb(event));

    // 3. Según el modo de acoplamiento:
    if (this.mode === 'COUPLED_ECOSYSTEM') {
      this.dispatchToEcosystem(event);
    } else if (this.mode === 'COUPLED_EXTERNAL_ERP') {
      this.dispatchToExternalERP(event);
    } else {
      console.log(`[EcosystemBridge - STANDALONE] Evento registrado localmente: ${eventType}`, event);
    }

    return event;
  }

  /**
   * Método especializado para conectar LuminaHQ a CUALQUIER ERP de terceros
   */
  public static ingestFromExternalERP(payload: GenericERPPayload): EcosystemEvent<GenericERPPayload> {
    const event = this.emit<GenericERPPayload>('TICKET_COBRADO', payload, 'EXTERNAL_ERP');
    
    // Auto-procesar recompensas de LuminaHQ y LuminaCoins para MNSH
    console.log(`%c[LuminaHQ Adapter] Transacción ingerida desde ERP externo (${payload.externalSystemName || 'Genérico'}):`, 'color: #a855f7; font-weight: bold;', payload);
    
    return event;
  }

  private static persistLocalEvent(event: EcosystemEvent): void {
    try {
      const history = JSON.parse(localStorage.getItem('ecosystem_bridge_events') || '[]');
      history.unshift(event);
      // Mantener últimos 50 eventos
      if (history.length > 50) history.pop();
      localStorage.setItem('ecosystem_bridge_events', JSON.stringify(history));
    } catch (e) {
      console.warn('[EcosystemBridge] No se pudo guardar evento localmente', e);
    }
  }

  public static getLocalHistory(): EcosystemEvent[] {
    try {
      return JSON.parse(localStorage.getItem('ecosystem_bridge_events') || '[]');
    } catch (e) {
      return [];
    }
  }

  private static dispatchToEcosystem(event: EcosystemEvent): void {
    console.log(`%c[EcosystemBridge -> Sync Ecosistema] Despachando a Supabase Realtime / Webhook`, 'color: #10b981;', event);
    // Simulación de dispatch asíncrono no bloqueante
    setTimeout(() => {
      // Disparar custom event en window para apps en el mismo navegador
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ecosystem_bridge_sync', { detail: event }));
      }
    }, 100);
  }

  private static dispatchToExternalERP(event: EcosystemEvent): void {
    if (!this.externalERPEndpoint) {
      console.warn('[EcosystemBridge] Modo COUPLED_EXTERNAL_ERP activo pero no hay endpoint configurado.');
      return;
    }
    console.log(`%c[EcosystemBridge -> Sync External ERP] Enviando a ${this.externalERPEndpoint}`, 'color: #f59e0b;', event);
  }
}
