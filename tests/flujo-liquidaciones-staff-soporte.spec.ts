import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Liquidaciones Quirúrgicas (Staff vs Soporte) & Contratos Remunerativos', () => {
  test('Verificación de Liquidaciones Staff y Configuración de Contratos', async ({ page }) => {
    // 1. Iniciar Sesión como Admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const btnAdmin = page.locator('button:has-text("🏢 ADMIN (Platón)")');
    await btnAdmin.scrollIntoViewIfNeeded();
    await btnAdmin.click();

    await page.waitForURL(/\/recepcion|\/admin|\/caja/i, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 2. Navegar a /finanzas/liquidaciones-staff
    await page.goto('/finanzas/liquidaciones-staff');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 3. Verificar encabezado y KPIs de Staff
    await expect(page.locator('h1')).toContainText(/Liquidaciones de Personal Staff/i, { timeout: 10000 });
    await expect(page.locator('text=Staff Activo en Piso').first()).toBeVisible();

    // 4. Abrir Modal de Configuración Remunerativa
    const btnSliders = page.locator('button[title="Configurar Contrato / % Comisiones"]').first();
    if (await btnSliders.isVisible()) {
      await btnSliders.click();
      await expect(page.locator('text=Esquema de Remuneración')).toBeVisible();
      await page.click('button:has-text("Cancelar")');
    }

    // 5. Navegar a /finanzas/liquidaciones-soporte
    await page.goto('/finanzas/liquidaciones-soporte');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 6. Verificar encabezado de Soporte
    await expect(page.locator('h1')).toContainText(/Liquidaciones de Personal de Soporte/i, { timeout: 10000 });
    await expect(page.locator('text=Personal de Soporte').first()).toBeVisible();
  });
});
