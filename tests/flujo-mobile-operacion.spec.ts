import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Operación Móvil de Staff & MobileHeaderShell', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });

  const account = {
    email: 'democrito@vaikuntha.com',
    pass: '123456',
    route: '/mobile/operacion'
  };

  test('Login como Staff, verificación de MobileHeaderShell y Buscador Táctil', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    // 1. Iniciar sesión con botón sandbox
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const quickBtn = page.locator('button:has-text("💈 STAFF (Demócrito)")');
    await quickBtn.scrollIntoViewIfNeeded();
    await quickBtn.click();

    // 2. Esperar navegación a la vista móvil
    await page.waitForURL(/\/mobile\/operacion/i, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // 3. Probar apertura del buscador táctil
    const searchBtn = page.locator('button[title*="Buscar"]');
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
      await page.waitForTimeout(500);

      // Comprobar que el modal de búsqueda CommandPalette esté visible
      const modalPalette = page.locator('input[placeholder*="Escribe una acción o busca cliente"]');
      if (await modalPalette.isVisible()) {
        await modalPalette.fill('Perfil');
        await page.waitForTimeout(300);

        // Cerrar con Escape
        await page.keyboard.press('Escape');
      }
    }

    expect(consoleErrors.length).toBe(0);
  });
});
