import { test, expect } from '@playwright/test';
import { setupConsoleCheck, setupNetworkCheck, loginAs, resetData, lenderSandbox } from './helpers/test-utils.js';

test.describe('Slice S6: Multi-Drawdown & Subsequent Demands (AT-10, AT-11, AT-12, J2, J11)', () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
  });

  test('AT-10 & J11: Single-disbursement product rejects subsequent tranche; guides to new application', async ({ page }) => {
    // Setup CASE-1001 with Lender A (single disbursement product PROD-01)
    await page.evaluate(() => {
      const store = window.__LSP_STORE__;
      store.linkCase('HF-7K3M-9QX2', 'TOK-DEMO-B1-VALID', 'BOR-B1');
      store.recordConsent('CASE-1001', 'BOR-B1', [
        { purpose: 'ALL', category: 'ALL', recipient: 'ALL', granted: true }
      ]);
      const app = store.submitApplication({
        caseId: 'CASE-1001',
        borrowerId: 'BOR-B1',
        lenderId: 'LENDER-A',
        productId: 'PROD-01', // Single disbursement
        monthlyIncome: 80000,
        employmentType: 'SALARIED',
        declaredObligations: 0
      });
      window.__LENDER_ADAPTER__.approveApplication(app.app_id);
    });

    // Executive logs in and attempts to add subsequent demand
    await loginAs(page, 'USR-PRIYA');
    await page.goto('/#/executive/new-demand/CASE-1001');

    // Verify rejection warning is rendered
    const errorBox = page.locator('[data-testid="single-disbursement-error"]');
    await expect(errorBox).toBeVisible();
    await expect(errorBox).toContainText('Subsequent Drawdown Not Supported (AT-10)');
    await expect(errorBox).toContainText('SINGLE UPFRONT DISBURSEMENT ONLY');
    await expect(errorBox).toContainText('Resolution: Direct the borrower to initiate a new financing application');

    // Attempting createFundingRequest via store also throws
    const throwResult = await page.evaluate(() => {
      try {
        window.__LSP_STORE__.createFundingRequest('DEM-1001-1');
        return { failed: false };
      } catch (e) {
        return { failed: true, message: e.message };
      }
    });
    expect(throwResult.failed).toBe(true);
    expect(throwResult.message).toContain('does not support staged drawdowns');
  });

  test('AT-11: Multi-drawdown facility: funding request bound to demand, borrower authorises, drawdown ref stored', async ({ page }) => {
    // Setup CASE-1002 with Lender B (multi-drawdown facility PROD-02)
    await page.evaluate(() => {
      const store = window.__LSP_STORE__;
      store.recordConsent('CASE-1002', 'BOR-B2', [
        { purpose: 'ALL', category: 'ALL', recipient: 'ALL', granted: true }
      ]);
      const app = store.submitApplication({
        caseId: 'CASE-1002',
        borrowerId: 'BOR-B2',
        lenderId: 'LENDER-B',
        productId: 'PROD-02', // Multi-drawdown
        monthlyIncome: 120000,
        employmentType: 'SALARIED',
        declaredObligations: 10000
      });
      window.__LENDER_ADAPTER__.approveApplication(app.app_id);
      window.__LENDER_ADAPTER__.acceptLoanAgreement('CASE-1002', 'BOR-B2');

      // Create funding request against initial demand
      store.createFundingRequest('DEM-1002-1');
    });

    // Borrower B2 logs in to review and authorise
    await loginAs(page, 'BOR-B2');
    await page.goto('/#/borrower/overview');

    // Check banner for pending drawdown authorization
    await expect(page.locator('body')).toContainText('requires your authorization');

    const freqId = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().funding_requests[0].funding_request_id;
    });

    await page.goto(`/#/borrower/drawdown/${freqId}`);
    await expect(page.locator('h1')).toContainText('Authorise Drawdown Request (BOR-10)');
    await expect(page.locator('body')).toContainText('₹75,000');

    // Borrower clicks authorise
    await page.click('[data-testid="btn-auth-drawdown"]');

    // Check Drawdown record was created with status REQUESTED
    const dd = await page.evaluate(freqId => {
      return window.__LSP_STORE__.getState().drawdowns.find(d => d.funding_request_id === freqId);
    }, freqId);

    expect(dd).toBeTruthy();
    expect(dd.status).toBe('REQUESTED');
    expect(dd.amount).toBe(75000);

    // Lender approves drawdown in sandbox
    await lenderSandbox.approveDrawdown(page, dd.drawdown_id);

    const approvedDd = await page.evaluate(ddId => {
      return window.__LSP_STORE__.getState().drawdowns.find(d => d.drawdown_id === ddId);
    }, dd.drawdown_id);

    expect(approvedDd.status).toBe('APPROVED');
  });

  test('AT-12: Demand changes after authorisation: history kept; amendment recorded', async ({ page }) => {
    await page.evaluate(() => {
      const store = window.__LSP_STORE__;
      store.amendOrCancelDemand('DEM-1002-1', 'DISPUTE', 'Hospital corrected procedure code estimate');
    });

    const demand = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().demands.find(d => d.demand_id === 'DEM-1002-1');
    });

    expect(demand.state).toBe('DISPUTED');
    expect(demand.amendment_reason).toBe('Hospital corrected procedure code estimate');

    // Verify audit log has the event
    const logs = await page.evaluate(() => window.__LSP_STORE__.getState().audit_logs);
    const event = logs.find(l => l.action === 'DEMAND_DISPUTED');
    expect(event).toBeTruthy();
  });

  test('J2: Patient differs from borrower (B2, Lender B): 3 demands, separate authorisations, patient sees no loan data', async ({ page }) => {
    // 1. Borrower B2 (Amit Shah) setup with Lender B facility
    await page.evaluate(() => {
      const store = window.__LSP_STORE__;
      store.recordConsent('CASE-1002', 'BOR-B2', [
        { purpose: 'ALL', category: 'ALL', recipient: 'ALL', granted: true }
      ]);
      const app = store.submitApplication({
        caseId: 'CASE-1002',
        borrowerId: 'BOR-B2',
        lenderId: 'LENDER-B',
        productId: 'PROD-02',
        monthlyIncome: 150000,
        employmentType: 'SALARIED',
        declaredObligations: 0
      });
      window.__LENDER_ADAPTER__.approveApplication(app.app_id, { amount: 300000 });
      window.__LENDER_ADAPTER__.acceptLoanAgreement('CASE-1002', 'BOR-B2');

      // Demand 1: Admission advance ₹75,000 (already in seed as DEM-1002-1)
      const freq1 = store.createFundingRequest('DEM-1002-1');
      store.authoriseFundingRequest(freq1.funding_request_id, 'BOR-B2');
      const dd1 = store.getState().drawdowns.find(d => d.funding_request_id === freq1.funding_request_id);
      window.__LENDER_ADAPTER__.approveDrawdown(dd1.drawdown_id);
      window.__LENDER_ADAPTER__.confirmDisbursement({
        caseId: 'CASE-1002',
        demandId: 'DEM-1002-1',
        amount: 75000,
        beneficiaryId: 'BENEF-01'
      });

      // Demand 2: Pre-procedure ₹1,00,000
      const dem2 = {
        demand_id: 'DEM-1002-2',
        case_id: 'CASE-1002',
        beneficiary_id: 'BENEF-01',
        amount: 100000,
        currency: 'INR',
        type: 'PRE_PROCEDURE',
        evidence_ref: 'EST-SURGERY-88',
        state: 'VERIFIED',
        created_at: new Date().toISOString()
      };
      store.update(s => ({ ...s, demands: [...s.demands, dem2] }));
      const freq2 = store.createFundingRequest('DEM-1002-2');
      store.authoriseFundingRequest(freq2.funding_request_id, 'BOR-B2');
      const dd2 = store.getState().drawdowns.find(d => d.funding_request_id === freq2.funding_request_id);
      window.__LENDER_ADAPTER__.approveDrawdown(dd2.drawdown_id);
      window.__LENDER_ADAPTER__.confirmDisbursement({
        caseId: 'CASE-1002',
        demandId: 'DEM-1002-2',
        amount: 100000,
        beneficiaryId: 'BENEF-01'
      });

      // Demand 3: Interim bill ₹40,000 - Lender rejects this one
      const dem3 = {
        demand_id: 'DEM-1002-3',
        case_id: 'CASE-1002',
        beneficiary_id: 'BENEF-01',
        amount: 40000,
        currency: 'INR',
        type: 'INTERIM_BILL',
        evidence_ref: 'EST-INTERIM-91',
        state: 'VERIFIED',
        created_at: new Date().toISOString()
      };
      store.update(s => ({ ...s, demands: [...s.demands, dem3] }));
      const freq3 = store.createFundingRequest('DEM-1002-3');
      store.authoriseFundingRequest(freq3.funding_request_id, 'BOR-B2');
      const dd3 = store.getState().drawdowns.find(d => d.funding_request_id === freq3.funding_request_id);
      window.__LENDER_ADAPTER__.rejectDrawdown(dd3.drawdown_id, 'Limit threshold exceeded for interim bill');
    });

    // 2. Hospital confirms receipt for the two approved disbursements
    await loginAs(page, 'USR-SUNITA');
    await page.goto('/#/hospital/receipts');

    // Confirm both pending receipts
    page.on('dialog', dialog => dialog.accept('HOS-CONFIRM-RECEIPT'));
    const confirmButtons = page.locator('[data-action="confirm-receipt"]');
    const count = await confirmButtons.count();
    for (let i = 0; i < count; i++) {
      await confirmButtons.first().click();
      await page.waitForTimeout(100);
    }

    // 3. Security & Privacy Assertion: Patient Viewer accesses case summary
    // Patient Kishore Shah attempts to view loan data
    await page.evaluate(() => {
      const patientUser = {
        user_id: 'USR-PATIENT-KISHORE',
        name: 'Kishore Shah',
        role: 'PATIENT_VIEWER',
        org_id: 'HOSP-01',
        status: 'ACTIVE'
      };
      window.__LSP_STORE__.update(s => ({
        ...s,
        users: [...s.users, patientUser],
        currentUserId: patientUser.user_id
      }));
    });

    // Attempt direct URL to borrower loan info or KFS
    await page.goto('/#/borrower/loan/CASE-1002');
    await page.waitForTimeout(100);

    // Expect Permission Denied (403)
    const alert = page.locator('.alert-error');
    await expect(alert).toContainText('Access Denied (403)');
    await expect(alert).toContainText('PATIENT_VIEWER');

    // Check DOM has NO loan information (assert on DOM content, not just visibility)
    const domHtml = await page.content();
    expect(domHtml).not.toContain('Sanctioned Loan Facility');
    expect(domHtml).not.toContain('Monthly EMI');
    expect(domHtml).not.toMatch(/\bPaid\b/);
  });
});

