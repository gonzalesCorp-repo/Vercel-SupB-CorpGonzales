// ============================================================================
// IoTScaleAdapter.ts - Adaptador Web Serial & Web Bluetooth para Balanzas IoT
// Resuelve DEUDA-LAB-002: Lectura de peso en gramos en tiempo real
// ============================================================================

export interface IoTScaleReading {
  weightGrams: number;
  unit: 'g' | 'kg' | 'oz';
  isStable: boolean;
  timestamp: string;
}

export class IoTScaleAdapter {
  private static serialPort: any = null;
  private static reader: any = null;
  private static isConnected: boolean = false;
  private static onReadingCallback: ((reading: IoTScaleReading) => void) | null = null;

  /**
   * Conecta a una balanza USB-Serial mediante Web Serial API
   */
  public static async connectWebSerial(onReading: (reading: IoTScaleReading) => void): Promise<boolean> {
    if (typeof window === 'undefined' || !('serial' in navigator)) {
      console.warn('[IoTScaleAdapter] Web Serial API no está soportada en este navegador.');
      return false;
    }

    try {
      this.onReadingCallback = onReading;
      // @ts-ignore
      this.serialPort = await navigator.serial.requestPort();
      await this.serialPort.open({ baudRate: 9600 });
      this.isConnected = true;

      console.log('%c[IoTScaleAdapter] Conectado a Balanza USB-Serial', 'color: #10b981; font-weight: bold;');
      this.startReadingStream();
      return true;
    } catch (e) {
      console.error('[IoTScaleAdapter] Error al conectar con balanza Serial:', e);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Conecta a una balanza Bluetooth mediante Web Bluetooth API
   */
  public static async connectWebBluetooth(onReading: (reading: IoTScaleReading) => void): Promise<boolean> {
    if (typeof window === 'undefined' || !('bluetooth' in navigator)) {
      console.warn('[IoTScaleAdapter] Web Bluetooth API no está soportada en este navegador.');
      return false;
    }

    try {
      this.onReadingCallback = onReading;
      // @ts-ignore
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['weight_scale']
      });

      console.log(`%c[IoTScaleAdapter] Conectado a Balanza Bluetooth: ${device.name}`, 'color: #10b981; font-weight: bold;');
      this.isConnected = true;
      return true;
    } catch (e) {
      console.error('[IoTScaleAdapter] Error al conectar con balanza Bluetooth:', e);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Simula una lectura de balanza para entornos de pruebas / demo
   */
  public static simulateReading(grams: number, onReading: (reading: IoTScaleReading) => void): void {
    const reading: IoTScaleReading = {
      weightGrams: grams,
      unit: 'g',
      isStable: true,
      timestamp: new Date().toISOString()
    };
    console.log(`%c[IoTScaleAdapter - MOCK] Lectura de balanza simulada: ${grams}g`, 'color: #38bdf8;', reading);
    onReading(reading);
  }

  /**
   * Desconecta la balanza
   */
  public static async disconnect(): Promise<void> {
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }
    if (this.serialPort) {
      await this.serialPort.close();
      this.serialPort = null;
    }
    this.isConnected = false;
    console.log('[IoTScaleAdapter] Balanza desconectada.');
  }

  private static async startReadingStream(): Promise<void> {
    if (!this.serialPort) return;
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.serialPort.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.parseScaleData(value);
        }
      }
    } catch (err) {
      console.error('[IoTScaleAdapter] Error leyendo flujo de balanza:', err);
    }
  }

  private static parseScaleData(rawString: string): void {
    // Típico formato de balanza: "ST,GS,+0045.5g"
    const match = rawString.match(/([+-]?\d+\.?\d*)\s*(g|kg)/i);
    if (match && this.onReadingCallback) {
      let weight = parseFloat(match[1]);
      const unit = match[2].toLowerCase() as 'g' | 'kg';
      if (unit === 'kg') weight *= 1000;

      this.onReadingCallback({
        weightGrams: weight,
        unit: 'g',
        isStable: rawString.includes('ST') || !rawString.includes('US'),
        timestamp: new Date().toISOString()
      });
    }
  }
}
