import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Finanzas, Tesorería & Caja y Bancos', () => {
  test('Login como Admin y verificación del Workspace de Finanzas', async ({ page }) => {
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

    // 3. Navegar a /finanzas
    await page.goto('/finanzas');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 4. Verificar encabezado principal
    const heading = page.locator('h1');
    await expect(heading).toContainText(/Finanzas/i, { timeout: 10000 });

    // 5. Verificar pestañas principales de Tesorería
    await expect(page.locator('button:has-text("Cuentas & Bancos")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Movimientos & Caja Chica")').first()).toBeVisible();

    // 6. Abrir modal de Nuevo Gasto / Ingreso
    const btnNuevo = page.locator('button:has-text("Nuevo Gasto / Ingreso")').first();
    await btnNuevo.click();
    await expect(page.locator('text=Registrar Movimiento de Tesorería')).toBeVisible();
    
    // Cerrar modal
    await page.click('button:has-text("Cancelar")');

    // 7. Abrir modal de Transferencia
    const btnTransf = page.locator('button:has-text("Transferir Fondos")').first();
    await btnTransf.click();
    await expect(page.locator('text=Transferencia entre Cuentas')).toBeVisible();
    await page.click('button:has-text("Cancelar")');
  });
});
