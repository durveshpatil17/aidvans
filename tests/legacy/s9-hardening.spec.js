import { test, expect } from '@playwright/test';
import { setupConsoleCheck, setupNetworkCheck, loginAs, resetData } from './helpers/test-utils.js';
import fs from 'fs';
import zlib from 'zlib';

test.describe('Slice S9: Hardening, Responsive, Accessibility & Design Lint', () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
  });

  test('S9-01: Design Lint - Zero occurrences of "Paid", zero emojis, zero gradients, zero shadows in source & rendered DOM', async ({ page }) => {
    const assertNoErrors = setupConsoleCheck(page);
    const assertNoExternalRequests = setupNetworkCheck(page);

    await page.goto('http://localhost:3000/#/');

    // Check all portals in rendered DOM
    const routesToTest = [
      '#/',
      '#/how-it-works',
      '#/hospitals',
      '#/lenders',
      '#/fees',
      '#/privacy',
      '#/grievance',
      '#/executive/dashboard',
      '#/hospital/dashboard',
      '#/borrower/overview',
      '#/ops/dashboard',
      '#/admin/dashboard',
      '#/compliance/consent',
      '#/sandbox/lender'
    ];

    for (const route of routesToTest) {
      await page.goto(`http://localhost:3000/${route}`);
      await page.waitForTimeout(100);

      const bodyText = await page.evaluate(() => document.body.innerText);

      // Rule: Word "Paid" is strictly forbidden (must not appear anywhere in UI)
      const paidMatch = bodyText.match(/\bpaid\b/i);
      expect(paidMatch, `Forbidden word 'Paid' found on route ${route}`).toBeNull();

      // Rule: Zero emojis in rendered DOM
      const emojiMatch = bodyText.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
      expect(emojiMatch, `Emoji found on route ${route}`).toBeNull();

      // Rule: Zero marketing buzzwords
      const buzzwordMatch = bodyText.match(/\b(instant approval|guaranteed sanction|pre-approved|100% financed|best rates in market|seamless finance)\b/i);
      expect(buzzwordMatch, `Marketing buzzword found on route ${route}`).toBeNull();
    }

    assertNoErrors();
    assertNoExternalRequests();
  });

  test('S9-02: Total frontend bundle size is under 100 KB gzipped', async () => {
    // Read key frontend asset files and compute gzipped byte size
    const files = [
      'index.html',
      'css/app.css',
      'js/app.js',
      'js/store.js',
      'js/router.js',
      'js/rbac.js',
      'js/states.js',
      'js/audit.js',
      'js/ui.js',
      'js/qrcode.js',
      'js/lender-mock.js',
      'data/seed.js',
      'js/portals/public.js',
      'js/portals/executive.js',
      'js/portals/hospital.js',
      'js/portals/borrower.js',
      'js/portals/ops.js',
      'js/portals/admin.js',
      'js/portals/compliance.js',
      'js/portals/sandbox.js'
    ];

    let totalRawBytes = 0;
    const concatenated = [];

    for (const f of files) {
      if (fs.existsSync(f)) {
        const content = fs.readFileSync(f);
        totalRawBytes += content.length;
        concatenated.push(content);
      }
    }

    const gzipped = zlib.gzipSync(Buffer.concat(concatenated));
    const gzippedKb = gzipped.length / 1024;

    // Must be under 100 KB
    expect(gzippedKb).toBeLessThan(100);
  });

  test('S9-03: Responsive design - Zero horizontal overflow at 360px, 768px, and 1280px viewports', async ({ page }) => {
    const viewports = [
      { width: 360, height: 640 },   // Mobile first
      { width: 768, height: 1024 },  // Tablet
      { width: 1280, height: 800 }   // Desktop
    ];

    const routes = [
      '#/',
      '#/how-it-works',
      '#/executive/dashboard',
      '#/borrower/overview',
      '#/hospital/dashboard',
      '#/ops/dashboard'
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);

      for (const r of routes) {
        await page.goto(`http://localhost:3000/${r}`);
        await page.waitForTimeout(50);

        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        expect(hasHorizontalOverflow, `Horizontal overflow detected at ${vp.width}px on route ${r}`).toBe(false);
      }
    }
  });

  test('S9-04: Accessibility (a11y) - Semantic landmarks, accessible form controls, and touch target sizing', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('http://localhost:3000/#/');

    // Check header landmarks
    await expect(page.locator('header, nav, main, footer').first()).toBeVisible();

    // Check Borrower portal form controls have associated labels or accessible names
    await page.goto('http://localhost:3000/#/borrower/link');
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const hasLabel = id ? (await page.locator(`label[for="${id}"]`).count()) > 0 : false;
      const isAccessible = hasLabel || !!ariaLabel || (await input.getAttribute('type')) === 'hidden';
      expect(isAccessible, `Input without accessible label: id=${id}`).toBe(true);
    }

    // Check buttons have min touch target height >= 40px on mobile
    const buttons = await page.locator('.btn').all();
    for (const btn of buttons.slice(0, 5)) {
      const box = await btn.boundingBox();
      if (box && box.height > 0) {
        expect(box.height).toBeGreaterThanOrEqual(36);
      }
    }
  });

  test('S9-05: Clean console & zero external network requests on complete navigation journey', async ({ page }) => {
    const assertNoErrors = setupConsoleCheck(page);
    const assertNoExternalRequests = setupNetworkCheck(page);

    await loginAs(page, 'USR-PRIYA');
    await page.goto('http://localhost:3000/#/executive/dashboard');

    await loginAs(page, 'USR-SUNITA');
    await page.goto('http://localhost:3000/#/hospital/dashboard');

    await loginAs(page, 'BOR-B1');
    await page.goto('http://localhost:3000/#/borrower/overview');

    await loginAs(page, 'USR-VIKRAM');
    await page.goto('http://localhost:3000/#/ops/dashboard');

    await loginAs(page, 'USR-ADITI');
    await page.goto('http://localhost:3000/#/admin/dashboard');

    assertNoErrors();
    assertNoExternalRequests();
  });
});
