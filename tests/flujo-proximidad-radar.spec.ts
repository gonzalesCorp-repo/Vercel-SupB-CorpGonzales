import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Detección de Proximidad Bidireccional (GPS & Radar)', () => {
  test('Portal Cliente renderiza Banner de Proximidad y Radar en Recepción', async ({ page }) => {
    // 1. Visitar el portal del cliente con ID de prueba
    await page.goto('/cliente?id=b56fd974-9543-41bb-98f9-cfc09fca945e');
    await page.waitForLoadState('domcontentloaded');

    // 2. Verificar presencia del Banner de Proximidad o Radar
    const radarElement = page.locator('text=Radar de Proximidad').or(page.locator('text=¡Bienvenido'));
    await expect(radarElement.first()).toBeVisible({ timeout: 10000 });

    // 3. Probar el Simulador de Distancia Sandbox si está disponible
    const simButton = page.locator('button:has-text("Simulador de Radar GPS")');
    if (await simButton.isVisible()) {
      await simButton.click();
      const btnPuerta = page.locator('button:has-text("10m (Puerta/BLE)")');
      await expect(btnPuerta).toBeVisible();
      await btnPuerta.click();

      // Verificar que el estado cambie a "¡Llegaste a la Sede!"
      await expect(page.locator('text=¡Llegaste a la Sede!').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
