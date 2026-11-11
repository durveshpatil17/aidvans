import { test, expect } from '@playwright/test';
import { setupConsoleCheck, setupNetworkCheck, loginAs, resetData, lenderSandbox } from './helpers/test-utils.js';

test.describe('Slice S5: Offers, KFS, Agreement, Disbursement & Receipt (AT-08, AT-13, J1)', () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
  });

  test('AT-08: Multiple lender offers: objective, unbiased display, KFS links, no ranking', async ({ page }) => {
    // Setup case with sanction
    await page.evaluate(() => {
      const store = window.__LSP_STORE__;
      store.linkCase('HF-7K3M-9QX2', 'TOK-DEMO-B1-VALID', 'BOR-B1');
      store.recordConsent('CASE-1001', 'BOR-B1', [
        { purpose: 'CREDIT_BUREAU', category: 'CREDIT', recipient: 'CIBIL', granted: true },
        { purpose: 'LENDER_TRANSFER', category: 'ORIGINATION', recipient: 'LENDER-A', granted: true }
      ]);
      const app = store.submitApplication({
        caseId: 'CASE-1001',
        borrowerId: 'BOR-B1',
        lenderId: 'LENDER-A',
        productId: 'PROD-01',
        monthlyIncome: 80000,
        employmentType: 'SALARIED',
        declaredObligations: 0
      });
      window.__LENDER_ADAPTER__.approveApplication(app.app_id);
    });

    await loginAs(page, 'BOR-B1');
    await page.goto('/#/borrower/offers/CASE-1001');

    await expect(page.locator('h1')).toContainText('Lender Offers (BOR-08)');
    await expect(page.locator('body')).toContainText('CareFinance Medical Loan');
    await expect(page.locator('[data-testid="btn-review-kfs"]')).toBeVisible();

    // Check no marketing/ranking words (AT-08 constraint)
    const bodyText = (await page.locator('body').textContent()).toLowerCase();
    expect(bodyText).not.toContain('best offer');
    expect(bodyText).not.toContain('top pick');
    expect(bodyText).not.toContain('recommended lender');
    expect(bodyText).not.toContain('sponsored');
  });

  test('AT-13: Transfer confirmed by lender but no hospital receipt: separate statuses, mismatch exception', async ({ page }) => {
    // Setup case through sanction and agreement
    await page.evaluate(() => {
      const store = window.__LSP_STORE__;
      store.linkCase('HF-7K3M-9QX2', 'TOK-DEMO-B1-VALID', 'BOR-B1');
      store.recordConsent('CASE-1001', 'BOR-B1', [
        { purpose: 'CREDIT', category: 'ALL', recipient: 'ALL', granted: true }
      ]);
      const app = store.submitApplication({
        caseId: 'CASE-1001',
        borrowerId: 'BOR-B1',
        lenderId: 'LENDER-A',
        productId: 'PROD-01',
        monthlyIncome: 80000,
        employmentType: 'SALARIED',
        declaredObligations: 0
      });
      window.__LENDER_ADAPTER__.approveApplication(app.app_id);
      window.__LENDER_ADAPTER__.acceptLoanAgreement('CASE-1001', 'BOR-B1');

      // Lender confirms transfer
      window.__LENDER_ADAPTER__.confirmDisbursement({
        caseId: 'CASE-1001',
        demandId: 'DEM-1001-1',
        amount: 125000,
        beneficiaryId: 'BENEF-01'
      });
    });

    // Hospital view: Hospital 1 Finance user logs in and flags mismatch
    await loginAs(page, 'USR-SUNITA');
    await page.goto('/#/hospital/receipts');

    // Confirm receipt screen shows AWAITING_HOSPITAL
    await expect(page.locator('body')).toContainText('AWAITING HOSPITAL');

    // Hospital flags mismatch instead of confirming credit
    page.once('dialog', dialog => dialog.accept('Bank credit not reflected in morning statement'));
    await page.click('[data-testid^="btn-report-mismatch-"]');

    // Receipt status changes to MISMATCH
    await expect(page.locator('body')).toContainText('MISMATCH');

    // Crucial rule: Check that lender disbursement status remains CONFIRMED_BY_LENDER (separate states)
    const disbState = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().disbursements.find(d => d.case_id === 'CASE-1001').status;
    });
    expect(disbState).toBe('CONFIRMED_BY_LENDER');

    // And word "Paid" is strictly absent
    const allText = await page.locator('body').textContent();
    expect(allText).not.toMatch(/\bPaid\b/);
  });

  test('J1: Happy Path End-to-End (B1, Lender A): 6 separate events, zero "Paid"', async ({ page }) => {
    const assertNoErrors = setupConsoleCheck(page);

    // 1. Executive logs in and creates case
    await loginAs(page, 'USR-PRIYA');
    await page.goto('/#/executive/new-case');

    await page.selectOption('[data-testid="hospital-select"]', 'HOSP-01');
    await page.selectOption('[data-testid="branch-select"]', 'BRANCH-01');
    await page.fill('[data-testid="patient-adm-ref"]', 'IPD-J1-001');
    await page.fill('[data-testid="patient-name"]', 'Ramesh Kumar');
    await page.fill('[data-testid="patient-age"]', '34');
    await page.fill('[data-testid="patient-contact"]', '+91 98000 00051');
    await page.selectOption('[data-testid="demand-type"]', 'ADMISSION_ADVANCE');
    await page.fill('[data-testid="demand-amount"]', '125000');
    await page.fill('[data-testid="demand-evidence-ref"]', 'EST-J1-001');

    await page.click('[data-testid="btn-create-case-submit"]');
    await page.waitForURL(/.*#\/executive\/invitation\/.*/);

    const frid = (await page.locator('[data-testid="generated-frid"]').textContent()).trim();
    const rawToken = (await page.locator('[data-testid="invitation-raw-token"]').textContent()).trim();

    // Executive sends invitation
    await page.click('[data-testid="btn-send-invitation"]');

    // 2. Borrower logs in, links case via FRID and token
    await loginAs(page, 'BOR-B1');
    await page.goto(`/#/borrower/link?frid=${encodeURIComponent(frid)}&token=${encodeURIComponent(rawToken)}`);
    await page.click('[data-testid="btn-submit-link"]');

    // 3. Borrower provides unbundled consent
    await page.waitForURL(/.*#\/borrower\/consent\/.*/);
    await page.click('[data-testid="btn-grant-consent"]');

    // 4. Borrower completes application
    await page.waitForURL(/.*#\/borrower\/apply\/.*/);
    await page.fill('[data-testid="input-income"]', '90000');
    await page.click('[data-testid="btn-submit-application"]');

    // 5. KYC mock handoff
    await page.waitForURL(/.*#\/borrower\/kyc\/.*/);
    await page.click('[data-testid="btn-complete-mock-kyc"]');

    // 6. Regulated Lender approves application via Sandbox
    const appId = await page.evaluate(frid => {
      const c = window.__LSP_STORE__.getState().cases.find(x => x.frid === frid);
      return window.__LSP_STORE__.getState().applications.find(a => a.case_id === c.case_id).app_id;
    }, frid);

    await lenderSandbox.approveApplication(page, appId);

    // 7. Borrower reviews KFS and accepts agreement
    await page.goto('/#/borrower/overview');
    await page.click('[data-testid="btn-view-offers"]');
    await page.click('[data-testid="btn-review-kfs"]');
    await page.click('[data-testid="btn-accept-agreement"]');

    // 8. Lender confirms disbursement
    const caseId = await page.evaluate(frid => {
      return window.__LSP_STORE__.getState().cases.find(x => x.frid === frid).case_id;
    }, frid);

    await page.evaluate(caseId => {
      const demand = window.__LSP_STORE__.getState().demands.find(d => d.case_id === caseId);
      window.__LENDER_ADAPTER__.confirmDisbursement({
        caseId,
        demandId: demand.demand_id,
        amount: demand.amount,
        beneficiaryId: demand.beneficiary_id
      });
    }, caseId);

    // 9. Hospital Finance confirms receipt
    await loginAs(page, 'USR-SUNITA');
    await page.goto('/#/hospital/receipts');

    page.once('dialog', dialog => dialog.accept('HOS-ERP-J1-REC-01'));
    await page.click('[data-testid^="btn-confirm-receipt-"]');
    await page.waitForTimeout(100);

    // 10. Executive closes the LSP case
    await loginAs(page, 'USR-PRIYA');
    await page.goto(`/#/executive/close/${caseId}`);

    // Verify closure notice: does not close lender loan
    const closureNotice = page.locator('[data-testid="closure-notice"]');
    await expect(closureNotice).toContainText('CRITICAL NOTICE (AT-27 Rule)');
    await expect(closureNotice).toContainText('DOES NOT CLOSE, CANCEL, OR SETTLE THE BORROWER\'S LOAN ACCOUNT');

    await page.click('[data-testid="btn-confirm-close-case"]');

    // Verify final case status is CLOSED
    await page.goto(`/#/executive/cases/${caseId}`);
    const finalBadge = page.locator('.status-badge').first();
    await expect(finalBadge).toContainText('CLOSED');

    // CRITICAL GLOBAL RULE: The word "Paid" must NOT appear anywhere in the UI
    const renderedBody = await page.locator('body').textContent();
    expect(renderedBody).not.toMatch(/\bPaid\b/);

    assertNoErrors();
  });
});
