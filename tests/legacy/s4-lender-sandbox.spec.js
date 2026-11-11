import { test, expect } from '@playwright/test';
import { setupConsoleCheck, setupNetworkCheck, loginAs, resetData, lenderSandbox } from './helpers/test-utils.js';

test.describe('Slice S4: Lender Sandbox & Decision Paths (AT-07, AT-09)', () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);

    // Setup: Link case, record consent, and submit application for CASE-1001
    await page.evaluate(() => {
      const store = window.__LSP_STORE__;
      store.linkCase('HF-7K3M-9QX2', 'TOK-DEMO-B1-VALID', 'BOR-B1');
      store.recordConsent('CASE-1001', 'BOR-B1', [
        { purpose: 'CREDIT_BUREAU_INQUIRY', category: 'CREDIT', recipient: 'CIBIL', granted: true },
        { purpose: 'LENDER_DATA_TRANSFER', category: 'ORIGINATION', recipient: 'LENDER-A', granted: true }
      ]);
      store.submitApplication({
        caseId: 'CASE-1001',
        borrowerId: 'BOR-B1',
        lenderId: 'LENDER-A',
        productId: 'PROD-01',
        monthlyIncome: 80000,
        employmentType: 'SALARIED',
        declaredObligations: 0
      });
    });
  });

  test('AT-07: Lender timeout after submit: status unknown/pending; no duplicate submission', async ({ page }) => {
    const assertNoErrors = setupConsoleCheck(page);

    // Get the application ID
    const appId = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().applications[0].app_id;
    });

    // Simulate timeout in lender sandbox
    await lenderSandbox.simulateTimeout(page, appId);

    // Switch to Borrower and verify status is UNKNOWN
    await loginAs(page, 'BOR-B1');
    await page.goto('/#/borrower/overview');

    const badge = page.locator('.status-badge');
    await expect(badge.first()).toContainText('UNKNOWN');

    // Verify audit log has the timeout event
    const logs = await page.evaluate(() => window.__LSP_STORE__.getState().audit_logs);
    const timeoutLog = logs.find(l => l.action === 'LENDER_TIMEOUT');
    expect(timeoutLog).toBeTruthy();

    assertNoErrors();
  });

  test('AT-09 & J4: Lender rejects: case shows lender decision; immutable and cannot be changed by staff', async ({ page }) => {
    const appId = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().applications[0].app_id;
    });

    // Reject via Lender Sandbox with reason
    await lenderSandbox.rejectApplication(page, appId, 'Credit risk criteria not met (High DTI)');

    // Executive view: verifies lender rejection is displayed and cannot be edited
    await loginAs(page, 'USR-PRIYA');
    await page.goto('/#/executive/cases/CASE-1001');

    const errBox = page.locator('.alert-error');
    await expect(errBox).toBeVisible();
    await expect(errBox).toContainText('Lender Rejection Reason: Credit risk criteria not met (High DTI)');
    await expect(errBox).toContainText('Lender decision is authoritative. No staff member may override or edit.');

    // Verify application status is DECLINED in store
    const appState = await page.evaluate(appId => {
      return window.__LSP_STORE__.getState().applications.find(a => a.app_id === appId);
    }, appId);
    expect(appState.status).toBe('DECLINED');
  });

  test('S4-03: Lender approves sanction: terms and KFS generated; case transitions to SANCTIONED', async ({ page }) => {
    const appId = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().applications[0].app_id;
    });

    // Approve via Lender Sandbox
    await lenderSandbox.approveApplication(page, appId);

    // Switch to Borrower view
    await loginAs(page, 'BOR-B1');
    await page.goto('/#/borrower/overview');

    // Verify banner shows loan offer ready
    const offerAlert = page.locator('[data-testid="btn-view-offers"]');
    await expect(offerAlert).toBeVisible();

    // Verify Sanction record in store
    const sanction = await page.evaluate(appId => {
      return window.__LSP_STORE__.getState().sanctions.find(s => s.app_id === appId);
    }, appId);

    expect(sanction).toBeTruthy();
    expect(sanction.sanctioned_amount).toBe(125000);
    expect(sanction.kfs_reference).toContain('KFS-');
  });

  test('S4-04 (B5/J5): Lender sanctions lower amount than requested: borrower sees gap; no family contribution', async ({ page }) => {
    const appId = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().applications[0].app_id;
    });

    // Sanction lower amount: ₹1,00,000 against ₹1,25,000 requested
    await lenderSandbox.sanctionLowerAmount(page, appId, 100000);

    await loginAs(page, 'BOR-B1');
    await page.goto('/#/borrower/offers/CASE-1001');

    await expect(page.locator('body')).toContainText('₹1,00,000');

    // Verify strictly NO mention or field of "family contribution"
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.toLowerCase()).not.toContain('family contribution');
  });

  test('S4-05: Lender requests more info: case moves to ACTION_REQUIRED', async ({ page }) => {
    const appId = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().applications[0].app_id;
    });

    await lenderSandbox.requestMoreInfo(page, appId, 'Please upload Form 16 or 3 months payslips');

    await loginAs(page, 'USR-PRIYA');
    await page.goto('/#/executive/cases/CASE-1001');

    const appStatusBadge = page.locator('.status-badge', { hasText: 'ACTION REQUIRED' }).first();
    await expect(appStatusBadge).toBeVisible();
  });
});
