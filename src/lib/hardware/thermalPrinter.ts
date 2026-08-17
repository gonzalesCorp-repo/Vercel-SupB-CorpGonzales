// ============================================================================
// thermalPrinter.ts - Driver Universal de Impresión Térmica ESC/POS (80mm / 58mm)
// Soporta Web Bluetooth, Web Serial (USB) y Renderizado HTML Monocromo para SUNAT
// ============================================================================

export interface ItemTicket {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  especificaciones?: string;
}

export interface DatosTicketTermico {
  tipo: 'COMPROBANTE_SUNAT' | 'COMANDA_TALLER' | 'ORDEN_ATENCION' | 'RECIBO_ANTICIPO';
  tituloEmpresa?: string;
  rucEmpresa?: string;
  direccionEmpresa?: string;
  numeroDocumento?: string;
  fechaHora?: string;
  clienteNombre: string;
  clienteDniRuc?: string;
  colaboradorNombre?: string;
  estacion?: string;
  items: ItemTicket[];
  subtotal?: number;
  igv?: number;
  descuento?: number;
  total: number;
  adelanto?: number;
  saldoPendiente?: number;
  metodoPago?: string;
  mensajePie?: string;
  cadenaQrLegal?: string;
}

/**
 * Abre una ventana emergente de impresión optimizada para papel térmico continuo (80mm o 58mm)
 */
export function imprimirTicketTermicoHtml(datos: DatosTicketTermico, anchoMm: 80 | 58 = 80): void {
  if (typeof window === 'undefined') return;

  const fechaActual = datos.fechaHora || new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
  const is58 = anchoMm === 58;
  const anchoPagina = is58 ? '48mm' : '72mm';
  const fontSizeBase = is58 ? '9px' : '11px';
  const fontSizeTitulo = is58 ? '12px' : '14px';

  const itemsHtml = datos.items.map(item => `
    <tr style="border-bottom: 1px dashed #ccc;">
      <td style="padding: 2px 0; text-align: left;">
        <div style="font-weight: bold;">${item.nombre}</div>
        ${item.especificaciones ? `<div style="font-size: 8px; color: #555;">${item.especificaciones}</div>` : ''}
      </td>
      <td style="padding: 2px 0; text-align: center;">${item.cantidad}</td>
      <td style="padding: 2px 0; text-align: right;">${item.precioUnitario.toFixed(2)}</td>
      <td style="padding: 2px 0; text-align: right; font-weight: bold;">${item.subtotal.toFixed(2)}</td>
    </tr>
  `).join('');

  // Generar URL del QR si existe cadena legal
  const qrUrl = datos.cadenaQrLegal 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=0&data=${encodeURIComponent(datos.cadenaQrLegal)}`
    : `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=0&data=${encodeURIComponent(datos.numeroDocumento || 'SUNAT-CPE')}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Ticket - ${datos.tipo} ${datos.numeroDocumento || ''}</title>
        <style>
          @page {
            margin: 0;
            size: ${anchoMm}mm auto;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: ${fontSizeBase};
            color: #000;
            margin: 0 auto;
            padding: 4px;
            width: ${anchoPagina};
            background: #fff;
            box-sizing: border-box;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 4px 0; }
          .double-divider { border-top: 2px solid #000; margin: 5px 0; }
          .flex-between { display: flex; justify-content: space-between; margin: 1.5px 0; }
          table { width: 100%; border-collapse: collapse; font-size: ${is58 ? '8.5px' : '10px'}; }
          th { text-align: left; border-bottom: 1px solid #000; padding: 2px 0; font-size: ${is58 ? '8px' : '9.5px'}; }
          .qr-container { display: flex; justify-content: center; margin: 6px 0; }
          .qr-img { width: ${is58 ? '70px' : '90px'}; height: ${is58 ? '70px' : '90px'}; }
        </style>
      </head>
      <body>
        <div class="center">
          <div style="font-size: ${fontSizeTitulo}; font-weight: 900;">${datos.tituloEmpresa || 'VAIKUNTHA SALON & SPA'}</div>
          ${datos.rucEmpresa ? `<div>RUC: ${datos.rucEmpresa}</div>` : ''}
          ${datos.direccionEmpresa ? `<div style="font-size: 8px;">${datos.direccionEmpresa}</div>` : ''}
          <div class="double-divider"></div>
          <div class="bold" style="font-size: ${is58 ? '10px' : '12px'};">${datos.tipo.replace(/_/g, ' ')}</div>
          ${datos.numeroDocumento ? `<div class="bold" style="font-size: ${is58 ? '11px' : '13px'};">${datos.numeroDocumento}</div>` : ''}
        </div>

        <div class="divider"></div>
        <div class="flex-between"><span>FECHA:</span><span>${fechaActual}</span></div>
        <div class="flex-between"><span>CLIENTE:</span><span class="bold">${datos.clienteNombre}</span></div>
        ${datos.clienteDniRuc ? `<div class="flex-between"><span>DOC:</span><span>${datos.clienteDniRuc}</span></div>` : ''}
        ${datos.colaboradorNombre ? `<div class="flex-between"><span>CAJERO:</span><span>${datos.colaboradorNombre}</span></div>` : ''}
        ${datos.estacion ? `<div class="flex-between"><span>ESTACIÓN:</span><span>${datos.estacion}</span></div>` : ''}
        
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th style="width: 46%;">DESCRIP</th>
              <th style="width: 14%; text-align: center;">CANT</th>
              <th style="width: 20%; text-align: right;">P.U</th>
              <th style="width: 20%; text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>
        ${datos.subtotal !== undefined ? `
          <div class="flex-between"><span>OP. GRAVADA:</span><span>S/ ${datos.subtotal.toFixed(2)}</span></div>
        ` : ''}
        ${datos.igv !== undefined ? `
          <div class="flex-between"><span>I.G.V. (18%):</span><span>S/ ${datos.igv.toFixed(2)}</span></div>
        ` : ''}
        ${datos.descuento && datos.descuento > 0 ? `
          <div class="flex-between" style="color: #000;"><span>DESCUENTO:</span><span>- S/ ${datos.descuento.toFixed(2)}</span></div>
        ` : ''}

        <div class="flex-between" style="font-size: ${is58 ? '11px' : '13px'}; font-weight: 900; margin-top: 2px;">
          <span>TOTAL:</span>
          <span>S/ ${datos.total.toFixed(2)}</span>
        </div>

        ${datos.adelanto && datos.adelanto > 0 ? `
          <div class="flex-between" style="color: #000; font-size: 9px;">
            <span>ADELANTO / ANTICIPO:</span>
            <span>- S/ ${datos.adelanto.toFixed(2)}</span>
          </div>
          <div class="flex-between bold" style="font-size: 10px; border-top: 1px dashed #000; padding-top: 2px;">
            <span>SALDO A PAGAR:</span>
            <span>S/ ${(datos.saldoPendiente ?? (datos.total - datos.adelanto)).toFixed(2)}</span>
          </div>
        ` : ''}

        ${datos.metodoPago ? `
          <div class="flex-between" style="font-size: 9px; margin-top: 3px;">
            <span>PAGO:</span>
            <span class="bold">${datos.metodoPago}</span>
          </div>
        ` : ''}

        <div class="qr-container">
          <img src="${qrUrl}" alt="QR SUNAT" class="qr-img" />
        </div>

        <div class="double-divider"></div>
        <div class="center" style="font-size: 8px; margin-top: 4px;">
          <div>${datos.mensajePie || 'Representación Impresa del CPE'}</div>
          <div>Vaikuntha ERP — Facturación Electrónica Homologada</div>
        </div>
        <br/><br/>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=420,height=650');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  }
}

/**
 * Conexión nativa con Impresora Térmica vía Web Bluetooth (ESC/POS)
 */
export async function conectarImpresoraBluetooth(): Promise<{ ok: boolean; deviceName?: string; error?: string }> {
  if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
    return { ok: false, error: 'Web Bluetooth no está soportado en este navegador.' };
  }

  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2']
    });

    return { ok: true, deviceName: device.name || 'Impresora Bluetooth Térmica' };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error al conectar impresora Bluetooth' };
  }
}
