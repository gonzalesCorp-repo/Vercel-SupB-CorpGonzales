import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Operaciones Diarias de Caja & Gastos Delegados en Workspace Venta', () => {
  test('Apertura de Drawer en POS, registro de gasto menor de mostrador y visualización de movimientos', async ({ page }) => {
    // 1. Iniciar Sesión como Admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const btnAdmin = page.locator('button:has-text("🏢 ADMIN (Platón)")');
    await btnAdmin.scrollIntoViewIfNeeded();
    await btnAdmin.click();

    // 2. Esperar redirección al workspace
    await page.waitForURL(/\/recepcion|\/admin|\/caja/i, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 3. Navegar a /caja (Workspace Venta)
    await page.goto('/caja');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 4. Verificar encabezado de Workspace Venta
    const heading = page.locator('h1');
    await expect(heading).toContainText(/Workspace Venta/i, { timeout: 10000 });

    // 5. Abrir Drawer de Operaciones de Caja
    const btnOperaciones = page.locator('button:has-text("Operaciones de Caja")').first();
    await expect(btnOperaciones).toBeVisible();
    await btnOperaciones.click();

    // 6. Verificar elementos dentro del Drawer
    await expect(page.locator('text=Operaciones Diarias de Caja').first()).toBeVisible();
    await expect(page.locator('text=Saldo disponible para operaciones inmediatas').first()).toBeVisible();
    await expect(page.locator('text=➕ Gasto Menor').first()).toBeVisible();
    await expect(page.locator('text=💵 Ingreso No-Venta').first()).toBeVisible();
    await expect(page.locator('text=👥 Liquidar Staff de Piso').first()).toBeVisible();

    // 7. Probar formulario de Gasto Menor
    await page.click('button:has-text("➕ Gasto Menor")');
    await expect(page.locator('text=Registrar Gasto de Caja Chica')).toBeVisible();

    await page.fill('input[placeholder="0.00"]', '15.50');
    await page.fill('input[placeholder="Ej. Compra de 2 bolsas de hielo"]', 'Compra de hielo para salón');
    await page.fill('input[placeholder="Ej. Bodega Don Lucho / Taxi"]', 'Bodega Don Lucho');

    // Confirmar gasto
    await page.click('button:has-text("Confirmar")');
    await page.waitForTimeout(1000);

    // 8. Verificar que el movimiento aparezca en la lista del turno
    await expect(page.locator('text=Compra de hielo para salón').first()).toBeVisible();
  });
});
