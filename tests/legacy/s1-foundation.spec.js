import { test, expect } from '@playwright/test';
import { setupConsoleCheck, setupNetworkCheck, loginAs, resetData } from './helpers/test-utils.js';

test.describe('Slice S1: Foundation & Architecture Core', () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
  });

  test('S1-01: App loads cleanly with zero console errors and zero external requests', async ({ page }) => {
    const assertNoErrors = setupConsoleCheck(page);
    const assertNoExternal = setupNetworkCheck(page);

    await page.goto('/#/');
    await page.waitForLoadState('domcontentloaded');

    const heading = page.locator('h1');
    await expect(heading).toContainText('Healthcare Financing');

    assertNoErrors();
    assertNoExternal();
  });

  test('S1-02: Public pages PUB-01 to PUB-07 render expected content', async ({ page }) => {
    // PUB-01 Home
    await page.goto('/#/');
    await expect(page.locator('body')).toContainText('Important Regulatory Disclosure');

    // PUB-02 How it works
    await page.goto('/#/how-it-works');
    await expect(page.locator('h1')).toContainText('How Medical Financing Facilitation Works');
    await expect(page.locator('body')).toContainText('Step 1: Case Creation at Hospital Desk');

    // PUB-03 Hospitals
    await page.goto('/#/hospitals');
    await expect(page.locator('h1')).toContainText('Partner Hospitals');
    await expect(page.locator('body')).toContainText('Sahyadri Care Super Specialty Hospital');

    // PUB-04 Lenders
    await page.goto('/#/lenders');
    await expect(page.locator('h1')).toContainText('Regulated Lender Partners');
    await expect(page.locator('body')).toContainText('CareFinance Capital NBFC');

    // PUB-05 Fees
    await page.goto('/#/fees');
    await expect(page.locator('body')).toContainText('Zero Fee from LSP');

    // PUB-06 Privacy
    await page.goto('/#/privacy');
    await expect(page.locator('h1')).toContainText('Privacy Notice');

    // PUB-07 Grievance
    await page.goto('/#/grievance');
    await expect(page.locator('h1')).toContainText('Grievance Redressal');
  });

  test('S1-03: Role Switcher changes active user and displays context', async ({ page }) => {
    await page.goto('/#/');
    await loginAs(page, 'USR-SUNITA'); // Hospital Finance

    const bannerText = await page.locator('#current-user-context').textContent();
    expect(bannerText).toContain('Sunita Patil');
    expect(bannerText).toContain('HOSPITAL_FINANCE');
  });

  test('S1-04: RBAC & ABAC route guard blocks unauthorized direct access', async ({ page }) => {
    // Switch to Borrower
    await loginAs(page, 'BOR-B1');

    // Attempt direct URL navigation to Admin Dashboard
    await page.goto('/#/admin/dashboard');
    await page.waitForTimeout(100);

    // Expect Permission Denied screen
    const alert = page.locator('.alert-error');
    await expect(alert).toContainText('Access Denied (403)');
    await expect(alert).toContainText('BORROWER');

    // Check audit log recorded the denial
    const logs = await page.evaluate(() => window.__LSP_STORE__.getState().audit_logs);
    const denialLog = logs.find(l => l.action === 'ACCESS_DENIED_ROUTE');
    expect(denialLog).toBeTruthy();
    expect(denialLog.actor_role).toBe('BORROWER');
  });

  test('S1-05: State machines throw error on invalid transitions', async ({ page }) => {
    await page.goto('/#/');

    const result = await page.evaluate(() => {
      try {
        // Attempt illegal transition: DRAFT directly to DISBURSED
        const { validateTransition, CASE_TRANSITIONS } = window.__LSP_STORE__.constructor;
        // Test states directly
        const states = window.__LSP_STATES__;
        return { success: true };
      } catch (e) {
        return { error: e.message };
      }
    });

    // Test transition error directly via store
    const transitionError = await page.evaluate(async () => {
      try {
        const { validateTransition, CASE_TRANSITIONS } = await import('./js/states.js');
        validateTransition(CASE_TRANSITIONS, 'FinancingCase', 'CASE-TEST', 'DRAFT', 'DISBURSED');
        return { failed: false };
      } catch (err) {
        return { failed: true, message: err.message, statusCode: err.statusCode };
      }
    });

    expect(transitionError.failed).toBe(true);
    expect(transitionError.statusCode).toBe(409);
    expect(transitionError.message).toContain('Cannot transition from \'DRAFT\' to \'DISBURSED\'');
  });
});

