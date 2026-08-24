import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Ingreso Central vinculado a Facturas de Compras y Catálogo Categórico', () => {
  test('Apertura de Ingreso Central, vinculación de Factura de Compra, filtro categórico y confirmación de recepción', async ({ page }) => {
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

    // 3. Navegar a /lab/ingreso (Ingreso Central)
    await page.goto('/lab/ingreso');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 4. Verificar encabezado
    const heading = page.locator('h1');
    await expect(heading).toContainText(/Ingreso Central/i, { timeout: 10000 });

    // 5. Verificar selector de Facturas de Compras vinculadas
    await expect(page.locator('text=Vincular Factura:').first()).toBeVisible();
    await expect(page.locator('button:has-text("🧾 Factura de Compra")').first()).toBeVisible();
    await expect(page.locator('button:has-text("✍️ Guía / Manual")').first()).toBeVisible();

    // 6. Probar filtros por categoría en Catálogo de Bienes
    await expect(page.locator('button:has-text("🛍️ Retail")').first()).toBeVisible();
    await expect(page.locator('button:has-text("🧪 Insumos Lab")').first()).toBeVisible();
    await expect(page.locator('button:has-text("🔧 Repuestos")').first()).toBeVisible();

    // Clic en Insumos Lab
    await page.click('button:has-text("🧪 Insumos Lab")');
    await page.waitForTimeout(500);

    // 7. Agregar un bien a la recepción
    const primerBtnAgregar = page.locator('button[title="Agregar a la recepción"]').first();
    await expect(primerBtnAgregar).toBeVisible();
    await primerBtnAgregar.click();

    // Clic en Retail y agregar otro producto
    await page.click('button:has-text("🛍️ Retail")');
    await page.waitForTimeout(500);
    const segundoBtnAgregar = page.locator('button[title="Agregar a la recepción"]').first();
    await segundoBtnAgregar.click();

    // 8. Verificar que aparezcan en la tabla de Detalle de Recepción con sus badges
    await expect(page.locator('text=Total de la Recepción').first()).toBeVisible();

    // 9. Confirmar Ingreso a Central
    const btnConfirmar = page.locator('button:has-text("Confirmar Ingreso a Central")').first();
    await expect(btnConfirmar).toBeEnabled();
    await btnConfirmar.click();
    await page.waitForTimeout(1000);
  });
});
