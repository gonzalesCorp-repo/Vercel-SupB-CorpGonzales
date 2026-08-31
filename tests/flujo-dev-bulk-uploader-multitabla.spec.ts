import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Importador Dinámico Multi-Tabla con Jerarquía y Advertencias de FK', () => {
  test('Apertura de modal, visualización de optgroups por nivel y verificación de advertencia jerárquica', async ({ page }) => {
    // 1. Login como SUPERADMIN
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const btnSuperadmin = page.locator('button:has-text("👑 SUPERADMIN")');
    await btnSuperadmin.scrollIntoViewIfNeeded();
    await btnSuperadmin.click();

    // 2. Esperar redirección al workspace
    await page.waitForURL(/\/recepcion|\/admin|\/caja/i, { timeout: 30000 });
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

    // 5. Verificar encabezado y banner de jerarquía
    await expect(page.locator('text=Carga Masiva de Datos').first()).toBeVisible();
    await expect(page.locator('text=Regla de Jerarquía:').first()).toBeVisible();

    const selectTabla = page.locator('select').first();
    await expect(selectTabla).toBeVisible();

    // 6. Cambiar a una tabla de Nivel 1 (clientes)
    await selectTabla.selectOption('clientes');
    await expect(page.locator('h3:has-text("clientes")').first()).toBeVisible();

    // 7. Cambiar a una tabla de Nivel 2 (agentes)
    await selectTabla.selectOption('agentes');
    await expect(page.locator('h3:has-text("agentes")').first()).toBeVisible();

    // 8. Cambiar a la nueva tabla puente de Nivel 3 (sedes_asignaciones)
    await selectTabla.selectOption('sedes_asignaciones');
    await expect(page.locator('h3:has-text("sedes_asignaciones")').first()).toBeVisible();

    // 9. Verificar dropzone de carga
    await expect(page.locator('text=Haz clic para seleccionar o arrastra tu archivo Excel').first()).toBeVisible();

    // 10. Cancelar y cerrar modal
    await page.click('button:has-text("Cancelar")');
    await expect(page.locator('text=Carga Masiva de Datos')).not.toBeVisible();
  });
});
