import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Ruteo de Pasarelas POS, Comisiones & Conciliación D+1', () => {
  test('Apertura de Finanzas, configuración de tasas y conciliación de lotes en tránsito', async ({ page }) => {
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

    // 5. Verificar botones de Pasarelas y Conciliación
    const btnPasarelas = page.locator('button:has-text("Pasarelas")').first();
    await expect(btnPasarelas).toBeVisible();

    const btnConciliar = page.locator('button:has-text("Conciliar")').first();
    await expect(btnConciliar).toBeVisible();

    // 5. Abrir Modal de Configuración de Pasarelas
    await btnPasarelas.click();
    await expect(page.locator('text=Ruteo de Pagos & Comisiones de Pasarelas POS')).toBeVisible();

    // Verificar presencia de pasarelas predeterminadas
    await expect(page.locator('text=Izipay POS - Débito').first()).toBeVisible();
    await expect(page.locator('text=Izipay POS - Crédito').first()).toBeVisible();

    // Cerrar modal de pasarelas
    await page.click('button:has-text("Cerrar")');
    await expect(page.locator('text=Ruteo de Pagos & Comisiones de Pasarelas POS')).not.toBeVisible();

    // 6. Abrir Modal de Conciliación de Lotes POS
    const btnAbrirConciliacion = page.locator('button:has-text("Conciliar Lotes POS")').first();
    await btnAbrirConciliacion.click();
    await expect(page.locator('text=Conciliación de Lotes POS & Fondos en Tránsito (D+1)')).toBeVisible();

    // 7. Seleccionar un lote en tránsito para conciliar dentro del modal
    const btnConciliarLote = page.locator('button:has-text("Conciliar")').filter({ hasNotText: 'Lotes' }).first();
    if (await btnConciliarLote.isVisible()) {
      await btnConciliarLote.click();
      await expect(page.locator('text=Total Bruto Cobrado')).toBeVisible();
      await expect(page.locator('text=Auditoría de Varianza')).toBeVisible();

      // Completar N° de Operación
      await page.fill('input[placeholder="Ej. OP-78234190"]', 'OP-E2E-TEST-9988');

      // Click en Confirmar & Depositar
      await page.click('button:has-text("Confirmar & Depositar")');
      await page.waitForTimeout(1000);
    }

    // Cerrar modal
    await page.click('button:has-text("Cerrar")');
  });
});
