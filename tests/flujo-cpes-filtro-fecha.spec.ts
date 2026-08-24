import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Bandeja de CPEs Emitidos con Filtro por Fecha en Workspace Venta', () => {
  test('Apertura de bandeja de CPEs, filtro por fecha predeterminada Hoy, Ayer, Todos y cálculo de facturación', async ({ page }) => {
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

    // 4. Abrir la bandeja de CPEs Emitidos
    const btnCpes = page.locator('button:has-text("📄 CPEs Emitidos")').first();
    await expect(btnCpes).toBeVisible();
    await btnCpes.click();

    // 5. Verificar elementos del Drawer de CPEs
    await expect(page.locator('text=CPEs Emitidos').first()).toBeVisible();
    await expect(page.locator('button:has-text("📅 Hoy")').first()).toBeVisible();
    await expect(page.locator('button:has-text("📅 Ayer")').first()).toBeVisible();
    await expect(page.locator('button:has-text("🌐 Todos")').first()).toBeVisible();
    await expect(page.locator('text=Facturado Hoy').first()).toBeVisible();

    // 6. Probar clic en "📅 Ayer"
    await page.click('button:has-text("📅 Ayer")');
    await expect(page.locator('text=Facturado Ayer').first()).toBeVisible();

    // 7. Probar clic en "🌐 Todos"
    await page.click('button:has-text("🌐 Todos")');
    await expect(page.locator('text=Total Histórico').first()).toBeVisible();

    // 8. Probar clic en "📆 Fecha"
    await page.click('button:has-text("📆 Fecha")');
    await expect(page.locator('input[type="date"]').first()).toBeVisible();

    // 9. Volver a "📅 Hoy"
    await page.click('button:has-text("📅 Hoy")');
    await expect(page.locator('text=Facturado Hoy').first()).toBeVisible();

    // 10. Cerrar bandeja
    await page.click('button:has-text("Cerrar Bandeja")');
  });
});
