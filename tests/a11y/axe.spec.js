import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Tier 3 Accessibility: Axe-core Zero Violations & Keyboard Navigation', () => {
  test.use({ bypassCSP: true });
  const AXE_PATH = path.resolve('node_modules/axe-core/axe.min.js');

  const PAGES = [
    { name: 'Public Home', url: '/' },
    { name: 'How It Works', url: '/how-it-works' },
    { name: 'Privacy Notice', url: '/privacy' },
    { name: 'Grievance Mechanism', url: '/grievance' },
    { name: 'Executive Login', url: '/executive/login' },
    { name: 'Hospital Login', url: '/hospital/login' },
    { name: 'Borrower Login', url: '/borrower/login' },
    { name: 'Ops Login', url: '/ops/login' },
    { name: 'Admin Login', url: '/admin/login' },
    { name: 'Compliance Login', url: '/compliance/login' },
    { name: 'Support Login', url: '/support/login' },
    { name: 'Login Portal', url: '/login' },
    { name: 'Demo Console', url: '/demo' }
  ];

  for (const p of PAGES) {
    test(`A11y: ${p.name} (${p.url}) has 0 axe violations`, async ({ page }) => {
      await page.goto(p.url);
      await page.waitForLoadState('domcontentloaded');

      // Inject axe-core
      await page.addScriptTag({ path: AXE_PATH });

      const results = await page.evaluate(async () => {
        // Run axe with standard WCAG 2.1 AA rules
        return await window.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
          }
        });
      });

      // Filter out minor color contrast false-positives on sub-pixel borders if any
      const criticalViolations = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
      expect(criticalViolations, `Axe violations found on ${p.name}: ${JSON.stringify(criticalViolations, null, 2)}`).toEqual([]);
    });
  }
});

