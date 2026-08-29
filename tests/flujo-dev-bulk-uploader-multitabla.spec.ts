import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Importador Dinámico Multi-Tabla en Panel del Desarrollador', () => {
  test('Apertura de modal de carga masiva, selección dinámica de tablas y verificación de dropzone', async ({ page }) => {
    // 1. Login como SUPERADMIN
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const btnSuperadmin = page.locator('button:has-text("👑 SUPERADMIN")');
    await btnSuperadmin.scrollIntoViewIfNeeded();
    await btnSuperadmin.click();

    // 2. Esperar redirección al workspace
    await page.waitForURL(/\/recepcion|\/admin|\/caja/i, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 3. Navegar a /dev
    await page.goto('/dev');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 4. Abrir modal de Importación Masiva
    const btnImportar = page.locator('button:has-text("Importar Sedes Excel")');
    await expect(btnImportar).toBeVisible();
    await btnImportar.click();

    // 5. Verificar que el modal se abra con el selector de tablas
    await expect(page.locator('text=Carga Masiva de Datos').first()).toBeVisible();
    await expect(page.locator('text=Tabla Destino:').first()).toBeVisible();

    const selectTabla = page.locator('select').first();
    await expect(selectTabla).toBeVisible();

    // 6. Cambiar tabla a 'clientes'
    await selectTabla.selectOption('clientes');
    await expect(page.locator('h3:has-text("clientes")').first()).toBeVisible();

    // 7. Cambiar tabla a 'cuentas_financieras'
    await selectTabla.selectOption('cuentas_financieras');
    await expect(page.locator('h3:has-text("cuentas_financieras")').first()).toBeVisible();

    // 8. Cambiar tabla a 'bienes'
    await selectTabla.selectOption('bienes');
    await expect(page.locator('h3:has-text("bienes")').first()).toBeVisible();

    // 9. Verificar dropzone
    await expect(page.locator('text=Haz clic para seleccionar o arrastra tu archivo Excel').first()).toBeVisible();

    // 10. Cancelar y cerrar modal
    await page.click('button:has-text("Cancelar")');
    await expect(page.locator('text=Carga Masiva de Datos')).not.toBeVisible();
  });
});
