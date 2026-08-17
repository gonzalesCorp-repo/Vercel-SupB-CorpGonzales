import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Gobernanza Visual & Catálogo de Skins (SuperAdmin)', () => {
  const account = {
    email: 'cristian@gonzales.page',
    pass: '123456',
    route: '/admin/config'
  };

  test('Login como SuperAdmin, acceso a /admin/config y cambio de skins', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('console', (msg) => console.log(`[BROWSER]: ${msg.text()}`));

    // 1. Iniciar Sesión con botón rápido sandbox o credenciales
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const quickBtn = page.locator('button:has-text("👑 SUPERADMIN")');
    if (await quickBtn.isVisible()) {
      await quickBtn.click();
    } else {
      await page.fill('input[type="email"]', account.email);
      await page.fill('input[type="password"]', account.pass);
      await page.click('button[type="submit"]');
    }

    // Esperar 1 segundo y revisar si hay mensaje de error en pantalla
    await page.waitForTimeout(1000);
    const errorAlert = page.locator('.bg-red-50');
    if (await errorAlert.isVisible()) {
      console.log('LOGIN ERROR ON SCREEN:', await errorAlert.innerText());
    }

    // 2. Esperar que complete el login y navegar a /admin/config
    await page.waitForURL(/\/(recepcion|admin)/i, { timeout: 15000 });
    await page.goto(account.route);
    await page.waitForLoadState('domcontentloaded');

    // 3. Verificar título y sección de Gobernanza Visual
    const title = page.locator('h1');
    await expect(title).toContainText(/Configuración Quirúrgica por Sede/i, { timeout: 10000 });

    const skinsSection = page.locator('text=Gobernanza Visual & Catálogo de Skins');
    await expect(skinsSection.first()).toBeVisible();

    // 4. Probar cambio de pestaña de skins
    const btnCyberpunk = page.locator('button:has-text("Gaming & Cyberpunk")');
    if (await btnCyberpunk.isVisible()) {
      await btnCyberpunk.click();
      await page.waitForTimeout(500);

      const skinCard = page.locator('text=CYBERPUNK 2077');
      await expect(skinCard.first()).toBeVisible();
    }

    expect(consoleErrors.length).toBe(0);
  });
});
