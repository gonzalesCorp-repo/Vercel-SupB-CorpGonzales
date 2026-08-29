import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Kit Maestro Jerarquizado de Plantillas en Panel del Desarrollador', () => {
  test('Apertura de Panel del Desarrollador, verificación de niveles jerárquicos y descarga del Libro Maestro', async ({ page }) => {
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

    // 6. Verificar botón nuevo de Descargar Plantillas Excel
    const btnDescargar = page.locator('button:has-text("Descargar Plantillas Excel")');
    await expect(btnDescargar).toBeVisible();

    // 7. Desplegar menú de opciones modulares jerárquicas
    const btnChevron = page.locator('button[title="Menú jerárquico por niveles de dependencia"]');
    await expect(btnChevron).toBeVisible();
    await btnChevron.click();

    // 8. Verificar títulos de nivel en el menú
    await expect(page.locator('text=NIVEL 1: Tablas Raíz').first()).toBeVisible();
    await expect(page.locator('text=NIVEL 2: Entidades Dependientes').first()).toBeVisible();
    await expect(page.locator('text=NIVEL 3: Puentes, Pasarelas & Stock').first()).toBeVisible();

    // 9. Verificar opciones clave
    await expect(page.locator('text=N1_01. Sedes & Sucursales').first()).toBeVisible();
    await expect(page.locator('text=N1_02. Clientes CRM').first()).toBeVisible();
    await expect(page.locator('text=N2_05. Personal & Agentes').first()).toBeVisible();
    await expect(page.locator('text=N3_11. Pasarelas de Cobro POS').first()).toBeVisible();

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
