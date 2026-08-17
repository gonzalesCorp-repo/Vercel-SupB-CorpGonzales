import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: WMS Laboratorio & Stock Central (/lab/stock)', () => {
  const account = {
    email: 'cristian@gonzales.page',
    pass: '123456',
    route: '/lab/stock'
  };

  test('Verificación de nombres reales, métricas y filtros en /lab/stock', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    // 1. Iniciar sesión con botón sandbox
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const quickBtn = page.locator('button:has-text("👑 SUPERADMIN")');
    await quickBtn.scrollIntoViewIfNeeded();
    await quickBtn.click();

    // 2. Navegar a /lab/stock
    await page.waitForURL(/\/(recepcion|admin)/i, { timeout: 15000 });
    await page.goto(account.route);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // 3. Verificar encabezado y MetricCards
    const title = page.locator('h1');
    await expect(title).toContainText(/Stock & Ubicación/i, { timeout: 10000 });

    const centralCard = page.locator('text=Stock Almacén Central');
    await expect(centralCard.first()).toBeVisible();

    const labCard = page.locator('text=Stock en Laboratorio');
    await expect(labCard.first()).toBeVisible();

    // 4. Verificar buscador
    const searchInput = page.locator('input[placeholder*="Buscar por Nombre, SKU o Marca"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Shampoo');
      await page.waitForTimeout(400);
      await searchInput.fill('');
    }

    // 5. Verificar botón de traslado rápido si hay filas
    const transferBtn = page.locator('button:has-text("Mover a Lab")');
    if (await transferBtn.first().isVisible()) {
      await transferBtn.first().click();
      await page.waitForTimeout(500);

      // Verificar modal de traslado
      const modalHeading = page.locator('text=Traslado Rápido a Laboratorio');
      await expect(modalHeading.first()).toBeVisible();

      // Cerrar modal
      await page.keyboard.press('Escape');
    }

    expect(consoleErrors.length).toBe(0);
  });
});
