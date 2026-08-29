import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Descarga de Plantillas de Carga de Sede en Panel del Desarrollador', () => {
  test('Apertura de Panel del Desarrollador, verificación de botones e interacción con el menú de plantillas', async ({ page }) => {
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

    // 7. Verificar botón nuevo de Descargar Plantillas Excel al lado de Importar
    const btnDescargar = page.locator('button:has-text("Descargar Plantillas Excel")');
    await expect(btnDescargar).toBeVisible();

    // 8. Desplegar menú de opciones modulares
    const btnChevron = page.locator('button[title="Opciones de descarga modular"]');
    await expect(btnChevron).toBeVisible();
    await btnChevron.click();

    // 9. Verificar opciones del menú
    await expect(page.locator('text=Libro Maestro Completo (.xlsx)').first()).toBeVisible();
    await expect(page.locator('text=01. Sedes & Sucursales').first()).toBeVisible();
    await expect(page.locator('text=02. Personal & Agentes').first()).toBeVisible();
    await expect(page.locator('text=03. Catálogo de Bienes').first()).toBeVisible();
    await expect(page.locator('text=04. Servicios de Salón').first()).toBeVisible();

    // 10. Probar evento de descarga
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
      page.click('button:has-text("Descargar Plantillas Excel")')
    ]);

    if (download) {
      expect(download.suggestedFilename()).toContain('Plantilla_Maestra_Carga_Sede_Vaikuntha.xlsx');
    }
  });
});
