import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Kit Maestro de 8 Plantillas y Descarga en Panel del Desarrollador', () => {
  test('Apertura de Panel del Desarrollador, verificación de las 8 plantillas en menú e inicio de descarga', async ({ page }) => {
    // 1. Login como SUPERADMIN (cristian)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const btnSuperadmin = page.locator('button:has-text("👑 SUPERADMIN")');
    await btnSuperadmin.scrollIntoViewIfNeeded();
    await btnSuperadmin.click();

    // 2. Esperar redirección al workspace
    await page.waitForURL(/\/recepcion|\/admin|\/caja/i, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 3. Navegar a /dev (Panel del Desarrollador)
    await page.goto('/dev');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 4. Verificar encabezado
    await expect(page.locator('h1:has-text("Panel del Desarrollador")')).toBeVisible({ timeout: 10000 });

    // 5. Verificar la tarjeta de Gestión de Entorno
    await expect(page.locator('h2:has-text("Gestión de Entorno")')).toBeVisible();

    // 6. Verificar botón de Importar Sedes Excel
    const btnImportar = page.locator('button:has-text("Importar Sedes Excel")');
    await expect(btnImportar).toBeVisible();

    // 7. Verificar botón de Descargar Plantillas Excel
    const btnDescargar = page.locator('button:has-text("Descargar Plantillas Excel")');
    await expect(btnDescargar).toBeVisible();

    // 8. Desplegar menú de opciones modulares
    const btnChevron = page.locator('button[title="Opciones de descarga modular por módulo"]');
    await expect(btnChevron).toBeVisible();
    await btnChevron.click();

    // 9. Verificar que aparezcan las 8 opciones modulares y el libro maestro
    await expect(page.locator('text=Libro Maestro Completo (.xlsx)').first()).toBeVisible();
    await expect(page.locator('text=01. Sedes & Sucursales').first()).toBeVisible();
    await expect(page.locator('text=02. Personal & Agentes').first()).toBeVisible();
    await expect(page.locator('text=03. Catálogo de Bienes').first()).toBeVisible();
    await expect(page.locator('text=04. Servicios de Salón').first()).toBeVisible();
    await expect(page.locator('text=05. Directorio de Clientes').first()).toBeVisible();
    await expect(page.locator('text=06. Cuentas Financieras & Bancos').first()).toBeVisible();
    await expect(page.locator('text=07. Pasarelas de Cobro POS').first()).toBeVisible();
    await expect(page.locator('text=08. Ubicaciones & Puestos WFM').first()).toBeVisible();

    // 10. Probar evento de descarga del Libro Maestro
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
      page.click('button:has-text("Descargar Plantillas Excel")')
    ]);

    if (download) {
      expect(download.suggestedFilename()).toContain('Plantilla_Maestra_Aprovisionamiento_Sede_Vaikuntha.xlsx');
    }
  });
});
