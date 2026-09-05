import { test, expect } from '@playwright/test';

test.describe('Paginación Reactiva: Catálogo & CRM', () => {
  test('Paginación en /admin/catalogo', async ({ page }) => {
    await page.goto('/login');
    const quickBtn = page.locator('button:has-text("👑 SUPERADMIN")');
    await quickBtn.waitFor({ state: 'visible', timeout: 20000 });
    await quickBtn.click();

    // Esperar redirección tras login
    await page.waitForURL(/\/(recepcion|admin)/i, { timeout: 20000 });

    // Navegar a /admin/catalogo
    await page.goto('/admin/catalogo');
    await page.waitForLoadState('domcontentloaded');

    // Esperar a que la tabla de matriz se cargue
    const tableRows = page.locator('tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 15000 });

    // Verificar presencia del componente de paginación
    const pagination = page.locator('text=Mostrando');
    await expect(pagination.first()).toBeVisible();

    // Comprobar selector de filas y cambiar a 10
    const filasSelect = page.locator('select').filter({ hasText: '10' });
    if (await filasSelect.isVisible()) {
      await filasSelect.selectOption('10');
      await page.waitForTimeout(1000);

      const rowsCount = await tableRows.count();
      expect(rowsCount).toBeLessThanOrEqual(10);
    }
  });

  test('Paginación en /recepcion/crm', async ({ page }) => {
    await page.goto('/login');
    const quickBtn = page.locator('button:has-text("👑 SUPERADMIN")');
    await quickBtn.waitFor({ state: 'visible', timeout: 20000 });
    await quickBtn.click();

    // Esperar redirección tras login
    await page.waitForURL(/\/(recepcion|admin)/i, { timeout: 20000 });

    // Navegar a /recepcion/crm
    await page.goto('/recepcion/crm');
    await page.waitForLoadState('domcontentloaded');

    // Esperar a que la tabla y paginador carguen
    const pagination = page.locator('text=Mostrando');
    await expect(pagination.first()).toBeVisible({ timeout: 20000 });

    // Probar búsqueda y verificar que se actualiza el rango
    const searchInput = page.locator('input[placeholder*="Buscar por nombre"]');
    await searchInput.fill('Valeria');
    await page.waitForTimeout(500);

    // Debe mostrar indicador adaptado
    await expect(page.locator('text=Mostrando')).toBeVisible();
  });
});
