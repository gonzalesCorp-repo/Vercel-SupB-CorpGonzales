// ============================================================================
// offlineStore.ts - Cola de Transacciones Offline para Vaikuntha ERP
// Resuelve DEUDA-CAJA-001: Previene la pérdida de facturas durante cortes de red.
// ============================================================================

export interface OfflineTransaction {
  id: string;
  type: 'FACTURA_PAYMENT' | 'OATC_UPDATE' | 'INVENTORY_LOG';
  timestamp: string;
  payload: any;
  retryCount: number;
}

const STORAGE_KEY = 'vaikuntha_offline_queue';

export class OfflineStore {
  /**
   * Guarda una transacción fallida en la cola local
   */
  public static enqueue(type: OfflineTransaction['type'], payload: any): OfflineTransaction {
    const queue = this.getQueue();
    const item: OfflineTransaction = {
      id: `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      timestamp: new Date().toISOString(),
      payload,
      retryCount: 0
    };

    queue.push(item);
    this.saveQueue(queue);
    console.log(`%c[OfflineStore] Transacción encolada localmente: ${item.id}`, 'color: #f59e0b; font-weight: bold;', item);
    return item;
  }

  /**
   * Obtiene todos los ítems pendientes en la cola
   */
  public static getQueue(): OfflineTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('[OfflineStore] Error leyendo cola offline', e);
      return [];
    }
  }

  /**
   * Elimina un ítem procesado exitosamente
   */
  public static dequeue(id: string): void {
    const queue = this.getQueue().filter(item => item.id !== id);
    this.saveQueue(queue);
  }

  /**
   * Intenta procesar la cola pendiente contra el servidor
   */
  public static async processQueue(syncFn: (item: OfflineTransaction) => Promise<boolean>): Promise<number> {
    const queue = this.getQueue();
    if (queue.length === 0) return 0;

    let processedCount = 0;
    console.log(`%c[OfflineStore] Intentando sincronizar ${queue.length} transacciones pendientes...`, 'color: #10b981;');

    for (const item of queue) {
      try {
        const success = await syncFn(item);
        if (success) {
          this.dequeue(item.id);
          processedCount++;
        } else {
          item.retryCount++;
          if (item.retryCount > 5) {
            console.error(`[OfflineStore] Ítem ${item.id} superó 5 reintentos. Descartando.`, item);
            this.dequeue(item.id);
          }
        }
      } catch (e) {
        console.warn(`[OfflineStore] Error procesando ${item.id}:`, e);
      }
    }

    return processedCount;
  }

  private static saveQueue(queue: OfflineTransaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('[OfflineStore] Error guardando cola local', e);
    }
  }
}
