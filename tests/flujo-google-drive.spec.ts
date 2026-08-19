import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Integración Multi-Cuenta Google Drive & Explorador Multimedia', () => {
  test('Panel Multi-Drive en /admin/config y Explorador Multimedia en /recepcion', async ({ page }) => {
    // 1. Iniciar Sesión en Sandbox como SUPERADMIN
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const btnSuper = page.locator('button:has-text("👑 SUPERADMIN")');
    if (await btnSuper.isVisible()) {
      await btnSuper.click();
      await page.waitForURL(/\/(recepcion|admin)/i, { timeout: 15000 });
    } else {
      await page.fill('input[type="email"]', 'cristian@gonzales.page');
      await page.fill('input[type="password"]', '123456');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(recepcion|admin)/i, { timeout: 15000 });
    }

    // 2. Probar Explorador de Google Drive en Recepción
    await page.goto('/recepcion');
    await page.waitForLoadState('domcontentloaded');

    const btnDrive = page.locator('button:has-text("Google Drive")');
    await expect(btnDrive).toBeVisible({ timeout: 10000 });
    await btnDrive.click();

    // 3. Verificar que el Modal de Google Drive se abra
    await expect(page.locator('text=Google Drive Cloud Storage')).toBeVisible();
    await expect(page.locator('button:has-text("Videos 4K")')).toBeVisible();

    // 4. Filtrar por Videos 4K
    await page.locator('button:has-text("Videos 4K")').click();
    await expect(page.locator('text=Balayage_Masterclass_4K_EdicionFinal.mp4')).toBeVisible();

    // 5. Previsualizar archivo de video
    const btnPreview = page.locator('button:has-text("Previsualizar")').first();
    await expect(btnPreview).toBeVisible();
    await btnPreview.click();

    // Verificar reproductor de video embebido
    await expect(page.locator('video')).toBeVisible({ timeout: 5000 });

    // Copiar enlace público
    const btnCopy = page.locator('button:has-text("Copiar Enlace Público")');
    await expect(btnCopy).toBeVisible();
    await btnCopy.click();

    // Cerrar previsualizador y modal
    await page.keyboard.press('Escape');

    // 6. Navegar a /admin/config y verificar Panel Multi-Drive
    await page.goto('/admin/config');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=Gobernanza Multi-Cuenta Google Drive')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Drive Multimedia & Videos 4K')).toBeVisible();
    await expect(page.locator('button:has-text("Conectar Nuevo Drive")')).toBeVisible();
  });
});
