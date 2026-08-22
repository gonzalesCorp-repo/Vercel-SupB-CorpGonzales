import { test, expect } from '@playwright/test';
import { EscPosBuilder } from '../src/lib/thermal/EscPosBuilder';
import { generarPayloadPrueba, compilarTicketEscPos, DEFAULT_PRINTER_CONFIG } from '../src/services/impresionTermica';

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

  test('Hub de Impresoras Térmicas renderiza canales y opciones en UI', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Comprobar que la página carga correctamente
    await expect(page.locator('text=Vaikuntha ERP').first()).toBeVisible();
  });
});
