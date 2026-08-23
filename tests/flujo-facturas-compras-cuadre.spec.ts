import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Facturas de Compras, Calendario de Pagos & Cuadre del Día', () => {
  test('Registro de factura a crédito (30d), visualización de calendario y aceptación en cuadre', async ({ page }) => {
    // 1. Iniciar Sesión como Admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const btnAdmin = page.locator('button:has-text("🏢 ADMIN (Platón)")');
    await btnAdmin.scrollIntoViewIfNeeded();
    await btnAdmin.click();

    // 2. Esperar redirección al workspace
    await page.waitForURL(/\/recepcion|\/admin|\/caja/i, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 3. Navegar a /finanzas
    await page.goto('/finanzas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 4. Esperar encabezado principal
    const heading = page.locator('h1');
    await expect(heading).toContainText(/Finanzas/i, { timeout: 10000 });

    // 5. Ir a la pestaña Facturas de Compras & AP
    const tabCompras = page.locator('button:has-text("Facturas de Compras & AP")').first();
    await expect(tabCompras).toBeVisible();
    await tabCompras.click();

    // 6. Verificar KPIs de Cuentas por Pagar
    await expect(page.locator('text=Total por Pagar (AP)').first()).toBeVisible();
    await expect(page.locator('text=Facturas Vencidas').first()).toBeVisible();

    // 7. Abrir Modal de Nueva Factura de Compra
    const btnNuevaFactura = page.locator('button:has-text("Nueva Factura de Compra")').first();
    await btnNuevaFactura.click();
    await expect(page.locator('text=Registrar Factura de Compra / Proveedor')).toBeVisible();

    // Completar formulario de compra a crédito (30 días)
    await page.fill('input[placeholder="20512345678"]', '20491823741');
    await page.fill('input[placeholder="Ej. L\'Oréal Perú S.A."]', 'Proveedor E2E Cosméticos S.A.C.');
    await page.fill('input[placeholder="004821"]', '009812');
    await page.fill('input[placeholder="0.00"] >> nth=2', '1180'); // Total

    // Guardar Factura
    await page.click('button:has-text("Registrar Compra")');
    await page.waitForTimeout(1000);

    // 8. Cambiar a sub-pestaña Calendario de Pagos
    await page.click('button:has-text("Calendario de Pagos")');
    await expect(page.locator('text=Dom').first()).toBeVisible();
    await expect(page.locator('text=Hoy').first()).toBeVisible();

    // 9. Cambiar a sub-pestaña Bandeja Cuadre del Día
    await page.click('button:has-text("Bandeja Cuadre del Día")');
    await expect(page.locator('text=Bandeja de Aprobación para el Cuadre del Día')).toBeVisible();

    // Si hay botón de aceptar en cuadre, hacer clic
    const btnAceptarCuadre = page.locator('button:has-text("✓ Aceptar")').first();
    if (await btnAceptarCuadre.isVisible()) {
      await btnAceptarCuadre.click();
      await page.waitForTimeout(1000);
    }
  });
});
