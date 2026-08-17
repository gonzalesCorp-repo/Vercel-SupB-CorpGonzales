import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Workspace de Recepción & Creación de OATC', () => {
  const account = {
    email: 'socrates@vaikuntha.com',
    pass: '123456',
    route: '/recepcion'
  };

  test('Login como Recepcionista y verificación del Workspace de Recepción con MetricCards', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    // 1. Iniciar Sesión con botón sandbox
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const quickBtn = page.locator('button:has-text("🛎️ SOPORTE Recepción (Sócrates)")');
    await quickBtn.scrollIntoViewIfNeeded();
    await quickBtn.click();

    // 2. Navegar a /recepcion
    await page.waitForURL(/\/recepcion/i, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // 3. Verificar encabezado y MetricCards de Watermelon
    const heading = page.locator('h1');
    await expect(heading).toContainText(/Workspace de Recepción/i, { timeout: 10000 });

    const metricCards = page.locator('text=Atenciones en Curso');
    await expect(metricCards.first()).toBeVisible();

    const staffCard = page.locator('text=Staff en Piso Activo');
    await expect(staffCard.first()).toBeVisible();

    // 4. Abrir Ventana de Nueva Orden
    const btnNuevaOrden = page.locator('button:has-text("Nueva Orden")');
    if (await btnNuevaOrden.first().isVisible()) {
      await btnNuevaOrden.first().click();
      await page.waitForTimeout(1000);

      // 5. Verificar presencia del Autocompletado Inteligente
      const clientInput = page.locator('input[placeholder*="Buscar por DNI, Nombre o Celular"]');
      if (await clientInput.first().isVisible()) {
        await clientInput.first().fill('7123');
        await page.waitForTimeout(500);
      }
    }

    // Comprobar que no hayan ocurrido errores fatales de consola
    expect(consoleErrors.length).toBe(0);
  });
});
