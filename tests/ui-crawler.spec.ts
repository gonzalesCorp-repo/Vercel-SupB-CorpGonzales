import { test, expect } from '@playwright/test';

// Test accounts in Sandbox
const accounts = [
  { name: 'SUPERADMIN', email: 'cristian@gonzales.page', pass: '123456', defaultRoute: '/recepcion' },
  { name: 'RECEPCION', email: 'socrates@vaikuntha.com', pass: '123456', defaultRoute: '/recepcion' },
  { name: 'CAJA', email: 'tales@vaikuntha.com', pass: '123456', defaultRoute: '/caja' },
  { name: 'STAFF', email: 'democrito@vaikuntha.com', pass: '123456', defaultRoute: '/mobile' }
];

for (const account of accounts) {
  test.describe(`Automated UI/UX Button & Console Crawler - [${account.name}]`, () => {
    
    test(`Login and click all active buttons on ${account.defaultRoute}`, async ({ page }) => {
      test.setTimeout(120000); // 2 minutes timeout for page button click loops
      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];

      // Listen for uncaught JavaScript exceptions
      page.on('pageerror', (exception) => {
        consoleErrors.push(exception.message);
      });

      // Listen for failed network requests (HTTP 4xx/5xx or blockages)
      page.on('requestfailed', (request) => {
        const failure = request.failure();
        failedRequests.push(`${request.url()} - ${failure ? failure.errorText : 'Failed'}`);
      });

      // Navigate to login
      await page.goto('/login');
      await expect(page).toHaveTitle(/Create Next App|Vaikuntha/i);

      // Fill credentials and submit
      await page.fill('input[type="email"]', account.email);
      await page.fill('input[type="password"]', account.pass);
      await page.click('button[type="submit"]');

      // Wait for navigation to the role's default dashboard route
      await page.waitForURL(new RegExp(account.defaultRoute, 'i'), { timeout: 15000 });
      console.log(`Successfully logged in as ${account.name} on ${account.defaultRoute}`);

      // Allow 2 seconds for JS/Zustand hydration
      await page.waitForTimeout(2000);

      // Collect all interactive elements (buttons, links, clickable items)
      const buttons = page.locator('button, a[href], [role="button"]');
      const count = await buttons.count();
      console.log(`Found ${count} interactive elements on ${account.defaultRoute}`);

      // Click each element that is visible, enabled, and safe to click
      for (let i = 0; i < count; i++) {
        const btn = buttons.nth(i);
        
        try {
          if (await btn.isVisible() && await btn.isEnabled()) {
            const text = (await btn.innerText()) || (await btn.getAttribute('title')) || `Element #${i}`;
            
            // Skip logout button to prevent session loss
            if (text.toLowerCase().includes('salir') || text.toLowerCase().includes('logout')) {
              console.log(`Skipping logout button: "${text}"`);
              continue;
            }

            console.log(`Clicking interactive element: "${text.trim()}"`);
            
            // Click with a small timeout to prevent hanging
            await btn.click({ timeout: 5000 });
            
            // Wait 500ms for UI changes or dynamic rendering
            await page.waitForTimeout(500);

            // Handle opened modals/dialogs (close them to keep crawling surface active)
            const closeBtn = page.locator('button:has-text("Cerrar"), button:has-text("Cancelar"), [aria-label="Close"], .close-modal');
            if (await closeBtn.isVisible()) {
              await closeBtn.first().click({ timeout: 2000 });
              await page.waitForTimeout(2000);
            }
          }
        } catch (clickErr) {
          // Log click failures but do not block the test runner from completing the audit
          console.log(`Warning: Failed to click element #${i} - ${clickErr.message}`);
        }
      }

      // Assertions
      if (consoleErrors.length > 0) {
        console.error(`Detected ${consoleErrors.length} Uncaught JS Console Errors for role ${account.name}:`, consoleErrors);
      }
      if (failedRequests.length > 0) {
        console.warn(`Detected ${failedRequests.length} Network failures for role ${account.name}:`, failedRequests);
      }

      expect(consoleErrors.length).toBe(0);
    });
  });
}
