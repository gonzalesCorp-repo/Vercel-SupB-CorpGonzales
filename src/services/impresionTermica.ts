/**
 * ==============================================================================
 * SERVICIO DE IMPRESIÓN TÉRMICA TRI-MODAL (VAIKUNTHA ERP)
 * ==============================================================================
 * Gestiona el despacho a impresoras térmicas ESC/POS mediante 4 canales:
 * 1. USB_SERIAL (Web Serial API en Chromium / Chrome / Edge)
 * 2. BLUETOOTH_BLE (Web Bluetooth API)
 * 3. WIFI_LAN_CLOUD (Cola Supabase Realtime para Agente Local TCP 9100)
 * 4. BROWSER_HTML (Diálogo de impresión universal del sistema operativo)
 */

import { EscPosBuilder, AnchoPapel } from '@/lib/thermal/EscPosBuilder';
import { createClient } from '@/lib/supabase/client';

export type CanalImpresion = 'USB_SERIAL' | 'BLUETOOTH_BLE' | 'WIFI_LAN_CLOUD' | 'BROWSER_HTML';

export interface ThermalPrinterConfig {
  canal: CanalImpresion;
  ancho: AnchoPapel;
  baudRate: number; // 9600, 19200, 38400, 115200 (Default 9600 o 38400)
  abrirCajonAutomatico: boolean;
  cortarPapelAutomatico: boolean;
  ipImpresoraLan?: string; // ej: 192.168.1.200
  puertoLan?: number; // Default 9100
  nombreImpresora?: string;
}

export interface ItemTicketImpresion {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface PagoTicketImpresion {
  metodo: string;
  monto: number;
}

export interface ImpresionTicketPayload {
  sedeNombre: string;
  sedeRuc?: string;
  sedeDireccion?: string;
  sedeTelefono?: string;
  tipoComprobante: 'BOLETA DE VENTA' | 'FACTURA' | 'NOTA DE VENTA' | 'TICKET PROFORMA' | 'COMANDA BAR';
  serieNumero: string;
  fechaHora: string;
  clienteNombre: string;
  clienteDoc?: string;
  cajeroNombre?: string;
  items: ItemTicketImpresion[];
  subtotal: number;
  igv: number;
  total: number;
  descuento?: number;
  pagos?: PagoTicketImpresion[];
  mensajePie?: string;
  qrTexto?: string;
}

const STORAGE_KEY = 'vaikuntha_thermal_printer_config';

export const DEFAULT_PRINTER_CONFIG: ThermalPrinterConfig = {
  canal: 'USB_SERIAL',
  ancho: '58mm',
  baudRate: 9600,
  abrirCajonAutomatico: true,
  cortarPapelAutomatico: true,
  ipImpresoraLan: '192.168.1.200',
  puertoLan: 9100,
  nombreImpresora: 'Impresora Térmica POS'
};

/**
 * Verifica si el navegador soporta la Web Serial API (USB)
 */
export function isWebSerialSupported(): boolean {
  return typeof window !== 'undefined' && 'serial' in navigator;
}

/**
 * Verifica si el navegador soporta la Web Bluetooth API (BLE)
 */
export function isWebBluetoothSupported(): boolean {
  return typeof window !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * Recupera la configuración guardada de la impresora en localStorage
 */
export function obtenerConfiguracionImpresora(): ThermalPrinterConfig {
  if (typeof window === 'undefined') return DEFAULT_PRINTER_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRINTER_CONFIG;
    return { ...DEFAULT_PRINTER_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRINTER_CONFIG;
  }
}

/**
 * Guarda la configuración de la impresora en localStorage
 */
export function guardarConfiguracionImpresora(config: Partial<ThermalPrinterConfig>): ThermalPrinterConfig {
  const current = obtenerConfiguracionImpresora();
  const updated = { ...current, ...config };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

/**
 * Construye el binario ESC/POS estándar a partir de un payload de comprobante
 */
export function compilarTicketEscPos(
  payload: ImpresionTicketPayload,
  config: ThermalPrinterConfig
): Uint8Array {
  const builder = new EscPosBuilder({
    ancho: config.ancho,
    abrirCajon: config.abrirCajonAutomatico,
    cortarPapel: config.cortarPapelAutomatico
  });

  // 1. Encabezado
  builder
    .alinear('center')
    .tamanoDoble(true)
    .negrita(true)
    .linea(payload.sedeNombre)
    .tamanoDoble(false)
    .negrita(false);

  if (payload.sedeRuc) builder.linea(`RUC: ${payload.sedeRuc}`);
  if (payload.sedeDireccion) builder.linea(payload.sedeDireccion);
  if (payload.sedeTelefono) builder.linea(`Tel: ${payload.sedeTelefono}`);

  builder.separador('=');

  // 2. Datos del Comprobante
  builder
    .alinear('center')
    .negrita(true)
    .linea(payload.tipoComprobante)
    .linea(payload.serieNumero)
    .negrita(false)
    .separador('-');

  // 3. Cliente y Fecha
  builder
    .alinear('left')
    .filaDosColumnas('Fecha:', payload.fechaHora)
    .filaDosColumnas('Cliente:', payload.clienteNombre);

  if (payload.clienteDoc) {
    builder.filaDosColumnas('Doc/RUC:', payload.clienteDoc);
  }
  if (payload.cajeroNombre) {
    builder.filaDosColumnas('Atendido por:', payload.cajeroNombre);
  }

  builder.separador('-');

  // 4. Cabecera de Tabla
  builder.filaDosColumnas('CANT / DESCRIPCION', 'TOTAL (S/)');
  builder.separador('-');

  // 5. Items
  for (const item of payload.items) {
    const totalItemStr = `S/ ${Number(item.total || 0).toFixed(2)}`;
    builder.filaItem(item.cantidad, item.nombre, totalItemStr);
  }

  builder.separador('=');

  // 6. Totales
  builder
    .alinear('right')
    .filaDosColumnas('Subtotal:', `S/ ${Number(payload.subtotal || 0).toFixed(2)}`);

  if (payload.descuento && payload.descuento > 0) {
    builder.filaDosColumnas('Descuento:', `- S/ ${Number(payload.descuento).toFixed(2)}`);
  }

  builder
    .filaDosColumnas('IGV (18%):', `S/ ${Number(payload.igv || 0).toFixed(2)}`)
    .negrita(true)
    .tamanoDoble(config.ancho === '80mm')
    .filaDosColumnas('TOTAL:', `S/ ${Number(payload.total || 0).toFixed(2)}`)
    .tamanoDoble(false)
    .negrita(false);

  // 7. Pagos
  if (payload.pagos && payload.pagos.length > 0) {
    builder.separador('-');
    builder.alinear('left').negrita(true).linea('MEDIOS DE PAGO:').negrita(false);
    for (const p of payload.pagos) {
      builder.filaDosColumnas(`• ${p.metodo}`, `S/ ${Number(p.monto || 0).toFixed(2)}`);
    }
  }

  // 8. Pie de página
  builder.separador('=');
  builder
    .alinear('center')
    .linea(payload.mensajePie || 'Gracias por su preferencia')
    .linea('Vaikuntha Enterprise ERP')
    .alimentarLineas(2);

  if (config.cortarPapelAutomatico) {
    builder.cortePapel(false);
  }

  return builder.compilar();
}

/**
 * CANAL 1: Despacho vía Web Serial API (USB Directo en Chrome/Edge)
 */
export async function imprimirViaWebSerial(
  bytes: Uint8Array,
  baudRate: number = 9600
): Promise<{ success: boolean; error?: string }> {
  if (!isWebSerialSupported()) {
    return { success: false, error: 'Web Serial API no soportada en este navegador. Usa Google Chrome o Microsoft Edge en escritorio.' };
  }

  try {
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate });

    const writer = port.writable.getWriter();
    await writer.write(bytes);
    writer.releaseLock();
    await port.close();

    return { success: true };
  } catch (err: any) {
    if (err?.name === 'NotFoundError') {
      return { success: false, error: 'No se seleccionó ningún puerto de impresora.' };
    }
    return { success: false, error: err?.message || 'Error al comunicarse con la impresora USB.' };
  }
}

/**
 * CANAL 2: Despacho vía Web Bluetooth API (BLE Inalámbrico)
 */
export async function imprimirViaWebBluetooth(
  bytes: Uint8Array
): Promise<{ success: boolean; error?: string }> {
  if (!isWebBluetoothSupported()) {
    return { success: false, error: 'Web Bluetooth API no soportada en este navegador.' };
  }

  try {
    // Servicios estándar de impresoras térmicas BLE chinas (AliExpress / POS Printers)
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
        { services: ['49535343-fe7d-4ae5-8fa9-9fafd205e455'] },
        { services: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2'] }
      ],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2'
      ]
    });

    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    if (!services || services.length === 0) {
      throw new Error('No se encontraron servicios de impresión en el dispositivo Bluetooth.');
    }

    const characteristics = await services[0].getCharacteristics();
    const writeChar = characteristics.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);

    if (!writeChar) {
      throw new Error('No se encontró característica de escritura BLE.');
    }

    // Enviar en bloques de 20 bytes (límite estándar MTU BLE)
    const chunkSize = 20;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      await writeChar.writeValue(chunk);
    }

    await device.gatt.disconnect();
    return { success: true };
  } catch (err: any) {
    if (err?.name === 'NotFoundError') {
      return { success: false, error: 'Emparejamiento Bluetooth cancelado.' };
    }
    return { success: false, error: err?.message || 'Error al imprimir por Bluetooth.' };
  }
}

/**
 * CANAL 3: Despacho a Cola en la Nube Supabase Realtime (Wi-Fi/LAN TCP 9100)
 */
export async function encolarImpresionCloud(
  payload: ImpresionTicketPayload,
  config: ThermalPrinterConfig,
  sedeId: string = 'd954b259-69a0-4546-9156-2f6ad392853f'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const bytes = compilarTicketEscPos(payload, config);
    // Convertir Uint8Array a Base64 para transporte seguro JSON
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(bytes)));

    const job = {
      sede_id: sedeId,
      tipo_ticket: payload.tipoComprobante,
      ip_destino: config.ipImpresoraLan || '192.168.1.200',
      puerto_destino: config.puertoLan || 9100,
      ancho: config.ancho,
      payload_base64: base64,
      estado: 'PENDIENTE',
      created_at: new Date().toISOString()
    };

    // 1. Insertar en tabla de cola
    const { error: dbError } = await supabase.from('impresiones_cola').insert([job]);
    if (dbError) {
      console.warn('[encolarImpresionCloud] Advertencia DB:', dbError.message);
    }

    // 2. Emitir broadcast Realtime para el agente local
    const channel = supabase.channel(`realtime-print-${sedeId}`);
    await channel.send({
      type: 'broadcast',
      event: 'NUEVA_IMPRESION',
      payload: job
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al encolar impresión en la nube.' };
  }
}

/**
 * CANAL 4: Fallback Universal HTML / Diálogo de Impresión de Sistema
 */
export function imprimirViaIframeHtml(
  payload: ImpresionTicketPayload,
  config: ThermalPrinterConfig
): { success: boolean } {
  if (typeof window === 'undefined') return { success: false };

  const anchoMm = config.ancho === '80mm' ? '72mm' : '48mm';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>${payload.tipoComprobante} - ${payload.serieNumero}</title>
        <style>
          @page {
            size: ${config.ancho} auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', monospace;
            width: ${anchoMm};
            margin: 0 auto;
            padding: 8px 4px;
            font-size: 11px;
            line-height: 1.2;
            color: #000;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .title { font-size: 13px; font-weight: 900; }
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .double-divider { border-top: 1px solid #000; margin: 5px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
        </style>
      </head>
      <body>
        <div class="center title">${payload.sedeNombre}</div>
        ${payload.sedeRuc ? `<div class="center">RUC: ${payload.sedeRuc}</div>` : ''}
        ${payload.sedeDireccion ? `<div class="center">${payload.sedeDireccion}</div>` : ''}
        ${payload.sedeTelefono ? `<div class="center">Tel: ${payload.sedeTelefono}</div>` : ''}
        <div class="double-divider"></div>
        <div class="center bold">${payload.tipoComprobante}</div>
        <div class="center bold">${payload.serieNumero}</div>
        <div class="divider"></div>
        <div class="row"><span>Fecha:</span><span>${payload.fechaHora}</span></div>
        <div class="row"><span>Cliente:</span><span>${payload.clienteNombre}</span></div>
        ${payload.clienteDoc ? `<div class="row"><span>Doc:</span><span>${payload.clienteDoc}</span></div>` : ''}
        ${payload.cajeroNombre ? `<div class="row"><span>Cajero:</span><span>${payload.cajeroNombre}</span></div>` : ''}
        <div class="divider"></div>
        <div class="row bold"><span>CANT / DESCRIPCION</span><span>TOTAL</span></div>
        <div class="divider"></div>
        ${payload.items.map(it => `
          <div class="row">
            <span>${it.cantidad}x ${it.nombre}</span>
            <span>S/ ${Number(it.total).toFixed(2)}</span>
          </div>
        `).join('')}
        <div class="double-divider"></div>
        <div class="row"><span>Subtotal:</span><span>S/ ${Number(payload.subtotal).toFixed(2)}</span></div>
        ${payload.descuento ? `<div class="row"><span>Descuento:</span><span>- S/ ${Number(payload.descuento).toFixed(2)}</span></div>` : ''}
        <div class="row"><span>IGV (18%):</span><span>S/ ${Number(payload.igv).toFixed(2)}</span></div>
        <div class="row bold" style="font-size: 13px;"><span>TOTAL:</span><span>S/ ${Number(payload.total).toFixed(2)}</span></div>
        ${payload.pagos && payload.pagos.length > 0 ? `
          <div class="divider"></div>
          <div class="bold">PAGOS:</div>
          ${payload.pagos.map(p => `<div class="row"><span>• ${p.metodo}</span><span>S/ ${Number(p.monto).toFixed(2)}</span></div>`).join('')}
        ` : ''}
        <div class="double-divider"></div>
        <div class="center" style="margin-top: 6px;">${payload.mensajePie || 'Gracias por su preferencia'}</div>
        <div class="center" style="font-size: 9px; margin-top: 2px;">Vaikuntha Enterprise ERP</div>
      </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return { success: false };

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 300);

  return { success: true };
}

/**
 * DISPATCHER UNIVERSAL: Imprime el ticket según el canal seleccionado en la configuración
 */
export async function imprimirTicketUniversal(
  payload: ImpresionTicketPayload,
  configOverride?: Partial<ThermalPrinterConfig>,
  sedeId?: string
): Promise<{ success: boolean; canalUsado: CanalImpresion; error?: string }> {
  const config = { ...obtenerConfiguracionImpresora(), ...(configOverride || {}) };

  // Fallback forzoso si se solicita USB/BLE pero el navegador no lo soporta
  if (config.canal === 'USB_SERIAL' && !isWebSerialSupported()) {
    imprimirViaIframeHtml(payload, config);
    return { success: true, canalUsado: 'BROWSER_HTML' };
  }

  if (config.canal === 'BLUETOOTH_BLE' && !isWebBluetoothSupported()) {
    imprimirViaIframeHtml(payload, config);
    return { success: true, canalUsado: 'BROWSER_HTML' };
  }

  const bytes = compilarTicketEscPos(payload, config);

  if (config.canal === 'USB_SERIAL') {
    const res = await imprimirViaWebSerial(bytes, config.baudRate);
    if (!res.success) {
      // Fallback a HTML si el usuario canceló o hubo error
      return { success: false, canalUsado: 'USB_SERIAL', error: res.error };
    }
    return { success: true, canalUsado: 'USB_SERIAL' };
  }

  if (config.canal === 'BLUETOOTH_BLE') {
    const res = await imprimirViaWebBluetooth(bytes);
    if (!res.success) {
      return { success: false, canalUsado: 'BLUETOOTH_BLE', error: res.error };
    }
    return { success: true, canalUsado: 'BLUETOOTH_BLE' };
  }

  if (config.canal === 'WIFI_LAN_CLOUD') {
    const res = await encolarImpresionCloud(payload, config, sedeId);
    return { success: res.success, canalUsado: 'WIFI_LAN_CLOUD', error: res.error };
  }

  // Fallback por defecto: BROWSER_HTML
  imprimirViaIframeHtml(payload, config);
  return { success: true, canalUsado: 'BROWSER_HTML' };
}

/**
 * Genera un comprobante de prueba para verificar conectividad con la impresora
 */
export function generarPayloadPrueba(config: ThermalPrinterConfig): ImpresionTicketPayload {
  return {
    sedeNombre: 'VAIKUNTHA SALON & SPA',
    sedeRuc: '20601234567',
    sedeDireccion: 'Av. Conquistadores 450, San Isidro',
    sedeTelefono: '(01) 421-9876',
    tipoComprobante: 'TICKET PROFORMA',
    serieNumero: 'TEST-0001',
    fechaHora: new Date().toLocaleString('es-PE'),
    clienteNombre: 'Cliente de Prueba (AliExpress)',
    clienteDoc: '88888888',
    cajeroNombre: 'Cajero Principal',
    items: [
      { nombre: 'Prueba Corte Termico ESC/POS', cantidad: 1, precioUnitario: 35.0, total: 35.0 },
      { nombre: 'Test Calibracion 58mm/80mm', cantidad: 1, precioUnitario: 15.0, total: 15.0 }
    ],
    subtotal: 42.37,
    igv: 7.63,
    total: 50.0,
    pagos: [{ metodo: 'EFECTIVO', monto: 50.0 }],
    mensajePie: '¡Prueba de impresion exitosa!'
  };
}
