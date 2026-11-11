import { test } from '@playwright/test';
import { loginAs, resetData } from './helpers/test-utils.js';

test.describe('Capture Required Production Screenshots for /docs/screens/', () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
  });

  test('Capture key screens (EXE-01, EXE-02, EXE-06, BOR-02, BOR-06, BOR-08, BOR-09, HOS-02, OPS-01, ADM-01)', async ({ page }) => {
    // 1. EXE-01: Executive Dashboard
    await loginAs(page, 'USR-PRIYA');
    await page.goto('http://localhost:3000/#/executive/dashboard');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'docs/screens/EXE-01.png', fullPage: true });

    // 2. EXE-02: New Case Wizard
    await page.goto('http://localhost:3000/#/executive/cases/new');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'docs/screens/EXE-02.png', fullPage: true });

    // 3. EXE-06: Invitation Screen
    await page.goto('http://localhost:3000/#/executive/cases/CASE-1001/invite');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'docs/screens/EXE-06.png', fullPage: true });

    // 4. BOR-02: Borrower Linking Gate (Mobile View 360x640)
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('http://localhost:3000/#/borrower/link');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'docs/screens/BOR-02.png', fullPage: true });

    // 5. BOR-06: Unbundled Purpose-Specific Consent
    await page.evaluate(() => {
      window.__LSP_STORE__.linkCase('HF-7K3M-9QX2', 'TOK-DEMO-B1-VALID', 'BOR-B1');
    });
    await loginAs(page, 'BOR-B1');
    await page.goto('http://localhost:3000/#/borrower/consent');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'docs/screens/BOR-06.png', fullPage: true });

    // Record consent and application to show BOR-08 & BOR-09
    await page.evaluate(() => {
      const store = window.__LSP_STORE__;
      store.recordConsent('CASE-1001', 'BOR-B1', [
        { purpose: 'ALL', category: 'ALL', recipient: 'ALL', granted: true }
      ]);
      const app = store.submitApplication({
        caseId: 'CASE-1001',
        borrowerId: 'BOR-B1',
        lenderId: 'LENDER-A',
        productId: 'PROD-01',
        monthlyIncome: 85000,
        employmentType: 'SALARIED',
        declaredObligations: 0
      });
      window.__LENDER_ADAPTER__.approveApplication(app.app_id);
    });

    // 6. BOR-08: Objective Lender Offers Comparison
    await page.goto('http://localhost:3000/#/borrower/offers');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'docs/screens/BOR-08.png', fullPage: true });

    // 7. BOR-09: KFS & Loan Agreement Screen
    await page.goto('http://localhost:3000/#/borrower/kfs/CASE-1001');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'docs/screens/BOR-09.png', fullPage: true });

    // Switch back to desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // 8. HOS-02: Hospital Finance Dashboard
    await loginAs(page, 'USR-SUNITA');
    await page.goto('http://localhost:3000/#/hospital/dashboard');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'docs/screens/HOS-02.png', fullPage: true });

    // 9. OPS-01: Operations Workbench
    await loginAs(page, 'USR-VIKRAM');
    await page.goto('http://localhost:3000/#/ops/dashboard');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'docs/screens/OPS-01.png', fullPage: true });

    // 10. ADM-01: Admin Dashboard
    await loginAs(page, 'USR-ADITI');
    await page.goto('http://localhost:3000/#/admin/dashboard');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'docs/screens/ADM-01.png', fullPage: true });
  });
});

