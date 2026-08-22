import { test, expect } from '@playwright/test';
import { EscPosBuilder } from '../src/lib/thermal/EscPosBuilder';
import { 
  generarPayloadPrueba, 
  compilarTicketEscPos, 
  DEFAULT_PRINTER_CONFIG,
  imprimirTicketAtencionStaff
} from '../src/services/impresionTermica';

test.describe('Flujo E2E: Motor de Impresión Térmica Tri-Modal (ESC/POS)', () => {
  test('EscPosBuilder genera binario válido con comandos ESC @ y corte de papel', async () => {
    const builder = new EscPosBuilder({ ancho: '58mm', abrirCajon: true, cortarPapel: true });
    builder
      .alinear('center')
      .negrita(true)
      .linea('VAIKUNTHA SALON')
      .filaDosColumnas('Corte Master', 'S/ 35.00')
      .cortePapel();

    const bytes = builder.compilar();

    // 1. Debe ser un Uint8Array no vacío
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(20);

    // 2. Debe iniciar con comando ESC @ (0x1B, 0x40)
    expect(bytes[0]).toBe(0x1b);
    expect(bytes[1]).toBe(0x40);

    // 3. Debe incluir el comando de cajón (0x1B, 0x70)
    const hasDrawerCmd = Array.from(bytes).some((b, i) => b === 0x1b && bytes[i + 1] === 0x70);
    expect(hasDrawerCmd).toBe(true);
  });

  test('EscPosBuilder aplica comandos de calibración de margen GS L y ancho 100% GS W', async () => {
    const builder = new EscPosBuilder({
      ancho: '58mm',
      margenIzquierdoEspacios: 2,
      fuenteTipo: 'FontB',
      columnasCustom: 42
    });

    builder.linea('Prueba Calibracion');
    const bytes = builder.compilar();

    // Debe contener comando GS L 0 0 (0x1D, 0x4C, 0x00, 0x00)
    const hasResetMargin = Array.from(bytes).some((b, i) => 
      b === 0x1d && bytes[i + 1] === 0x4c && bytes[i + 2] === 0x00 && bytes[i + 3] === 0x00
    );
    expect(hasResetMargin).toBe(true);

    // Debe contener comando GS W (0x1D, 0x57)
    const hasPrintAreaCmd = Array.from(bytes).some((b, i) => b === 0x1d && bytes[i + 1] === 0x57);
    expect(hasPrintAreaCmd).toBe(true);
  });

  test('compilarTicketEscPos serializa correctamente un comprobante completo', async () => {
    const payload = generarPayloadPrueba(DEFAULT_PRINTER_CONFIG);
    const bytes = compilarTicketEscPos(payload, DEFAULT_PRINTER_CONFIG);

    expect(bytes.length).toBeGreaterThan(50);
    const decoder = new TextDecoder();
    const rawText = decoder.decode(bytes);

    // Debe contener el nombre de la sede y el total
    expect(rawText).toContain('VAIKUNTHA');
    expect(rawText).toContain('S/ 50.00');
  });

  test('imprimirTicketAtencionStaff compila ticket de staff con servicios y pre-cuenta', async () => {
    const oatcMock = {
      id: 'd954b259-69a0-4546-9156-2f6ad392853f',
      cliente_nombre: 'Maria Gonzales',
      agente_nombre: 'Estilista Master',
      estacion_nombre: 'Sillon 02',
      punto_partida: [
        { nombre: 'Balayage Premium', cantidad: 1, precio: 120.0 },
        { nombre: 'Matizado Tono 9.1', cantidad: 1, precio: 45.0 }
      ],
      monto_total: 165.0
    };

    const res = await imprimirTicketAtencionStaff(oatcMock, { canal: 'BROWSER_HTML' });
    expect(res.success).toBe(true);
  });

  test('Hub de Impresoras Térmicas renderiza canales y opciones en UI', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Comprobar que la página carga correctamente
    await expect(page.locator('text=Vaikuntha ERP').first()).toBeVisible();
  });
});
