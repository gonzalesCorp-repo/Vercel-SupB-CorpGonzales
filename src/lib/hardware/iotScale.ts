// ============================================================================
// iotScale.ts - Driver Universal Tri-Modo para Balanzas IoT
// Soporta: 1) Web Bluetooth (BLE GATT/UART), 2) WiFi Local (WebSocket/HTTP), 3) Web Serial (USB)
// ============================================================================

export type ProtocoloBalanza = 'BLUETOOTH_BLE' | 'WIFI_LOCAL' | 'SERIAL_USB' | 'SIMULACION';

export interface LecturaBalanza {
  pesoGramos: number;
  unidad: 'g' | 'oz' | 'ml' | 'kg';
  estable: boolean;
  bateria?: number;
  timestamp: string;
  protocolo?: ProtocoloBalanza;
  dispositivoNombre?: string;
}

export type CallbackPeso = (lectura: LecturaBalanza) => void;

export interface ConfiguracionBalanza {
  protocolo: ProtocoloBalanza;
  dispositivoNombre?: string;
  wifiIp?: string;
  wifiPuerto?: number;
  serialBaudRate?: number;
  autoReconectar?: boolean;
}

const STORAGE_KEY_SCALE = 'vaikuntha_iot_scale_config';

// Estado global de la conexión activa
let activeWebSocket: WebSocket | null = null;
let activeSerialPort: any = null;
let activeBleServer: any = null;
let activeHttpPollingTimer: NodeJS.Timeout | null = null;

/**
 * Obtener configuración persistida de la balanza
 */
export function obtenerConfiguracionBalanza(): ConfiguracionBalanza {
  if (typeof window === 'undefined') {
    return { protocolo: 'SIMULACION', serialBaudRate: 9600, wifiIp: '192.168.1.150', wifiPuerto: 81 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCALE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error leyendo config de balanza:', e);
  }
  return {
    protocolo: 'SIMULACION',
    dispositivoNombre: 'Balanza Simulada Sandbox',
    wifiIp: '192.168.1.150',
    wifiPuerto: 81,
    serialBaudRate: 9600,
    autoReconectar: false
  };
}

/**
 * Guardar configuración de la balanza
 */
export function guardarConfiguracionBalanza(config: ConfiguracionBalanza) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_SCALE, JSON.stringify(config));
}

/**
 * Desconectar cualquier conexión activa
 */
export function desconectarBalanza() {
  if (activeWebSocket) {
    activeWebSocket.close();
    activeWebSocket = null;
  }
  if (activeHttpPollingTimer) {
    clearInterval(activeHttpPollingTimer);
    activeHttpPollingTimer = null;
  }
  if (activeBleServer && activeBleServer.connected) {
    activeBleServer.disconnect();
    activeBleServer = null;
  }
  if (activeSerialPort) {
    try {
      activeSerialPort.close();
    } catch (e) {}
    activeSerialPort = null;
  }
}

// ----------------------------------------------------------------------------
// 1. MODO WEB BLUETOOTH (BLE GATT / Nordic UART / Standard Weight Scale)
// ----------------------------------------------------------------------------
export async function conectarBalanzaBluetooth(onPeso: CallbackPeso): Promise<{ ok: boolean; deviceName?: string; error?: string }> {
  if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
    return { ok: false, error: 'Web Bluetooth no está disponible en este dispositivo (usa Chrome/Edge con HTTPS).' };
  }

  desconectarBalanza();

  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [
        { services: ['0000181d-0000-1000-8000-00805f9b34fb'] }, // Standard Weight Scale
        { services: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'] }, // Nordic UART BLE
        { namePrefix: 'Scale' },
        { namePrefix: 'Balanza' },
        { namePrefix: 'SF-' },
        { namePrefix: 'ESP32' },
        { namePrefix: 'MiScale' }
      ],
      optionalServices: [
        '0000181d-0000-1000-8000-00805f9b34fb',
        '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
        'battery_service',
        'generic_access'
      ]
    });

    const server = await device.gatt.connect();
    activeBleServer = server;

    device.addEventListener('gattserverdisconnected', () => {
      console.warn('[IoTScale BLE] Balanza desconectada');
      activeBleServer = null;
    });

    // Intentar suscribir a notificaciones de peso
    try {
      // 1. Probar Weight Scale Service (0x181D)
      const service = await server.getPrimaryService('0000181d-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002a98-0000-1000-8000-00805f9b34fb'); // Weight Measurement
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        // Decodificación BLE Weight Measurement: flags en byte 0, peso en bytes 1 y 2 (uint16 little-endian en resolución 0.005kg o 0.1g)
        const flags = value.getUint8(0);
        const isImperial = (flags & 0x01) !== 0;
        const rawWeight = value.getUint16(1, true);
        const pesoGramos = isImperial ? Number((rawWeight * 453.592 / 100).toFixed(1)) : Number((rawWeight * 5).toFixed(1));
        const isStable = (flags & 0x02) === 0;

        onPeso({
          pesoGramos,
          unidad: 'g',
          estable: isStable,
          timestamp: new Date().toISOString(),
          protocolo: 'BLUETOOTH_BLE',
          dispositivoNombre: device.name || 'Balanza BLE'
        });
      });
    } catch (gattrErr) {
      // 2. Fallback a Nordic UART (6E400003-...)
      try {
        const uartService = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
        const txChar = await uartService.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e');
        await txChar.startNotifications();
        const decoder = new TextDecoder();
        txChar.addEventListener('characteristicvaluechanged', (event: any) => {
          const text = decoder.decode(event.target.value);
          const match = text.match(/([0-9]+\.?[0-9]*)/);
          if (match) {
            const gramos = parseFloat(match[1]);
            onPeso({
              pesoGramos: gramos,
              unidad: 'g',
              estable: text.includes('ST') || !text.includes('US'),
              timestamp: new Date().toISOString(),
              protocolo: 'BLUETOOTH_BLE',
              dispositivoNombre: device.name || 'Balanza Nordic UART'
            });
          }
        });
      } catch (uartErr) {
        console.warn('No se pudo suscribir a características estándar BLE, emitiendo confirmación inicial');
      }
    }

    guardarConfiguracionBalanza({
      protocolo: 'BLUETOOTH_BLE',
      dispositivoNombre: device.name || 'Balanza Bluetooth BLE'
    });

    onPeso({
      pesoGramos: 0.0,
      unidad: 'g',
      estable: true,
      timestamp: new Date().toISOString(),
      protocolo: 'BLUETOOTH_BLE',
      dispositivoNombre: device.name || 'Balanza Bluetooth BLE'
    });

    return { ok: true, deviceName: device.name || 'Balanza Digital de Precisión BLE' };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Conexión cancelada o balanza Bluetooth no detectada' };
  }
}

// ----------------------------------------------------------------------------
// 2. MODO WIFI LOCAL (WebSocket / HTTP Polling para ESP32 / Balanzas de Red)
// ----------------------------------------------------------------------------
export async function conectarBalanzaWiFi(
  ip: string,
  puerto: number = 81,
  onPeso: CallbackPeso
): Promise<{ ok: boolean; error?: string }> {
  desconectarBalanza();

  const wsUrl = `ws://${ip.trim()}:${puerto}`;
  console.log(`[IoTScale WiFi] Conectando a ${wsUrl}...`);

  return new Promise((resolve) => {
    try {
      const socket = new WebSocket(wsUrl);
      activeWebSocket = socket;

      const timeout = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          socket.close();
          // Fallback a HTTP REST Polling
          iniciarHttpPolling(ip, puerto, onPeso);
          resolve({ ok: true });
        }
      }, 3000);

      socket.onopen = () => {
        clearTimeout(timeout);
        console.log('[IoTScale WiFi] WebSocket conectado con éxito a la balanza.');
        guardarConfiguracionBalanza({
          protocolo: 'WIFI_LOCAL',
          wifiIp: ip,
          wifiPuerto: puerto,
          dispositivoNombre: `Balanza WiFi ESP32 (${ip})`
        });

        onPeso({
          pesoGramos: 0.0,
          unidad: 'g',
          estable: true,
          timestamp: new Date().toISOString(),
          protocolo: 'WIFI_LOCAL',
          dispositivoNombre: `Balanza WiFi (${ip})`
        });

        resolve({ ok: true });
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onPeso({
            pesoGramos: Number(data.weight || data.peso || data.grams || 0),
            unidad: (data.unit || 'g') as any,
            estable: data.stable !== undefined ? Boolean(data.stable) : true,
            bateria: data.battery,
            timestamp: new Date().toISOString(),
            protocolo: 'WIFI_LOCAL',
            dispositivoNombre: `Balanza WiFi (${ip})`
          });
        } catch (parseErr) {
          const match = event.data.match(/([0-9]+\.?[0-9]*)/);
          if (match) {
            onPeso({
              pesoGramos: parseFloat(match[1]),
              unidad: 'g',
              estable: true,
              timestamp: new Date().toISOString(),
              protocolo: 'WIFI_LOCAL',
              dispositivoNombre: `Balanza WiFi (${ip})`
            });
          }
        }
      };

      socket.onerror = () => {
        clearTimeout(timeout);
        iniciarHttpPolling(ip, puerto, onPeso);
        resolve({ ok: true });
      };

      socket.onclose = () => {
        console.warn('[IoTScale WiFi] WebSocket cerrado.');
      };
    } catch (e: any) {
      resolve({ ok: false, error: e.message || 'Error al conectar balanza WiFi' });
    }
  });
}

function iniciarHttpPolling(ip: string, puerto: number, onPeso: CallbackPeso) {
  if (activeHttpPollingTimer) clearInterval(activeHttpPollingTimer);
  console.log(`[IoTScale WiFi] Iniciando HTTP polling en http://${ip}:${puerto}/weight`);

  activeHttpPollingTimer = setInterval(async () => {
    try {
      const res = await fetch(`http://${ip}:${puerto}/weight`, { signal: AbortSignal.timeout(1200) });
      if (res.ok) {
        const json = await res.json();
        onPeso({
          pesoGramos: Number(json.weight || json.peso || 0),
          unidad: 'g',
          estable: json.stable ?? true,
          timestamp: new Date().toISOString(),
          protocolo: 'WIFI_LOCAL',
          dispositivoNombre: `Balanza WiFi REST (${ip})`
        });
      }
    } catch (err) {
      // Polling silencioso
    }
  }, 500);
}

// ----------------------------------------------------------------------------
// 3. MODO WEB SERIAL (USB)
// ----------------------------------------------------------------------------
export async function conectarBalanzaSerial(
  onPeso: CallbackPeso,
  baudRate: number = 9600
): Promise<{ ok: boolean; error?: string }> {
  if (typeof navigator === 'undefined' || !(navigator as any).serial) {
    return { ok: false, error: 'Web Serial no soportado en este navegador. Usa Chrome o Edge en escritorio.' };
  }

  desconectarBalanza();

  try {
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate });
    activeSerialPort = port;

    const reader = port.readable.getReader();
    const decoder = new TextDecoder();

    guardarConfiguracionBalanza({
      protocolo: 'SERIAL_USB',
      serialBaudRate: baudRate,
      dispositivoNombre: 'Balanza Serial USB'
    });

    (async () => {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            const rawText = decoder.decode(value);
            const match = rawText.match(/([0-9]+\.?[0-9]*)/);
            if (match) {
              const gramos = parseFloat(match[1]);
              onPeso({
                pesoGramos: gramos,
                unidad: 'g',
                estable: rawText.includes('ST') || !rawText.includes('US'),
                timestamp: new Date().toISOString(),
                protocolo: 'SERIAL_USB',
                dispositivoNombre: 'Balanza USB Serial'
              });
            }
          }
        }
      } catch (readErr) {
        console.error('Error leyendo flujo serial:', readErr);
      } finally {
        reader.releaseLock();
      }
    })();

    onPeso({
      pesoGramos: 0.0,
      unidad: 'g',
      estable: true,
      timestamp: new Date().toISOString(),
      protocolo: 'SERIAL_USB',
      dispositivoNombre: 'Balanza USB Serial'
    });

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error al abrir puerto serial USB' };
  }
}

// ----------------------------------------------------------------------------
// 4. MODO SIMULADOR CALIBRADO
// ----------------------------------------------------------------------------
export function simularPesajeBalanza(
  pesoObjetivo: number, 
  onPeso: CallbackPeso, 
  variacionGramos: number = 2.5
): () => void {
  let timer: NodeJS.Timeout;
  let paso = 0;
  const pasosTotales = 5;
  const pesoFinal = Number((pesoObjetivo + (Math.random() * variacionGramos * 2 - variacionGramos)).toFixed(1));

  timer = setInterval(() => {
    paso++;
    const esFinal = paso >= pasosTotales;
    const pesoActual = esFinal 
      ? pesoFinal 
      : Number((pesoFinal * (paso / pasosTotales) + (Math.random() * 0.8 - 0.4)).toFixed(1));

    onPeso({
      pesoGramos: Math.max(0, pesoActual),
      unidad: 'g',
      estable: esFinal,
      timestamp: new Date().toISOString(),
      protocolo: 'SIMULACION',
      dispositivoNombre: 'Simulador IoT Calibrado'
    });

    if (esFinal) {
      clearInterval(timer);
    }
  }, 300);

  return () => clearInterval(timer);
}
