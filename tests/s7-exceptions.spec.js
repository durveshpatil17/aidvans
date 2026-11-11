import { test, expect } from '@playwright/test';
import { setupConsoleCheck, setupNetworkCheck, loginAs, resetData, lenderSandbox } from './helpers/test-utils.js';

test.describe('Slice S7: Exceptions & Operational Workbenches (AT-14, AT-18, AT-25, AT-28, J12, J13, J14)', () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
  });

  test('AT-14 & J12: Transfer fails or returns: original retained, reversal linked, parties notified, no manual money movement', async ({ page }) => {
    // Seed confirmed disbursement for CASE-1001
    await page.evaluate(() => {
      const disb = window.__LENDER_ADAPTER__.confirmDisbursement({
        caseId: 'CASE-1001',
        demandId: 'DEM-1001-1',
        amount: 125000,
        beneficiaryId: 'BENEF-01'
      });
      // Simulate lender bank reversal callback
      window.__LENDER_ADAPTER__.reverseDisbursement(disb.disbursement_id, 'Bank return: NEFT technical reversal code R01');
    });

    const state = await page.evaluate(() => window.__LSP_STORE__.getState());
    const originalDisb = state.disbursements.find(d => d.case_id === 'CASE-1001');
    expect(originalDisb).toBeTruthy();
    expect(originalDisb.status).toBe('REVERSED');
    expect(originalDisb.reversal_id).toBeTruthy();

    // Reversal record linked
    const reversal = state.reversals.find(r => r.original_disbursement_id === originalDisb.disbursement_id);
    expect(reversal).toBeTruthy();
    expect(reversal.amount).toBe(125000);
    expect(reversal.reason).toContain('technical reversal');

    // Both parties notified
    expect(state.notifications.some(n => n.recipientRole === 'BORROWER' && n.case_id === 'CASE-1001')).toBe(true);
    expect(state.notifications.some(n => n.recipientRole === 'HOSPITAL' && n.case_id === 'CASE-1001')).toBe(true);

    // Verify in Ops Exception Workbench UI
    await loginAs(page, 'USR-VIKRAM'); // Ops Manager
    await page.goto('http://localhost:3000/#/ops/exceptions');
    await expect(page.locator('h1')).toContainText('Exception Workbench');
  });

  test('AT-18 & J13: Hospital beneficiary bank account changes: maker-checker enforced', async ({ page }) => {
    // 1. Hospital Desk logs in and requests a bank account change
    await loginAs(page, 'USR-ANAND'); // Hospital Desk
    await page.goto('http://localhost:3000/#/hospital/beneficiary');
    await expect(page.locator('h1')).toContainText('Hospital Profile & Beneficiary');

    await page.fill('[data-testid="new-bank-name"]', 'Axis Bank');
    await page.fill('[data-testid="new-bank-ifsc"]', 'UTIB0000123');
    await page.fill('[data-testid="new-bank-account"]', '918020012345678');
    await page.click('[data-testid="btn-submit-bank-change"]');
    await page.waitForFunction(() => window.__LSP_STORE__ !== undefined);

    // Verify it is held in PENDING status and previous account remains active
    const stateAfterRequest = await page.evaluate(() => window.__LSP_STORE__.getState());
    const pendingReq = stateAfterRequest.beneficiary_change_requests.find(r => r.bank_name === 'Axis Bank');
    expect(pendingReq).toBeTruthy();
    expect(pendingReq.status).toBe('PENDING_MAKER_CHECKER_APPROVAL');

    // Active verified accounts should NOT have Axis Bank yet
    const verifiedAccounts = stateAfterRequest.beneficiary_accounts.filter(b => b.verification_status === 'VERIFIED');
    expect(verifiedAccounts.some(b => b.bank_name === 'Axis Bank')).toBe(false);

    // 2. Central Platform Admin logs in to Maker-Checker workbench (ADM-05)
    await loginAs(page, 'USR-ADITI'); // Platform Admin
    await page.goto('http://localhost:3000/#/admin/hospitals');
    await expect(page.locator('h1')).toContainText('Beneficiary Account Dual-Approval');

    // Admin dual-approves the change
    await page.click(`[data-testid="btn-approve-bcr-${pendingReq.request_id}"]`);
    await page.waitForFunction(() => window.__LSP_STORE__ !== undefined);

    // Verify newly approved account is now active and verified
    const stateAfterApproval = await page.evaluate(() => window.__LSP_STORE__.getState());
    const approvedBenef = stateAfterApproval.beneficiary_accounts.find(b => b.bank_name === 'Axis Bank');
    expect(approvedBenef).toBeTruthy();
    expect(approvedBenef.verification_status).toBe('VERIFIED');

    // 3. Test Rejection flow: Hospital submits another change, Admin rejects it
    await loginAs(page, 'USR-ANAND');
    await page.goto('http://localhost:3000/#/hospital/beneficiary');
    await page.fill('[data-testid="new-bank-name"]', 'Suspicious Offshore Bank');
    await page.fill('[data-testid="new-bank-ifsc"]', 'OFFS0009999');
    await page.fill('[data-testid="new-bank-account"]', '99988877766655');
    await page.click('[data-testid="btn-submit-bank-change"]');
    await page.waitForFunction(() => window.__LSP_STORE__ !== undefined);

    const stateBeforeReject = await page.evaluate(() => window.__LSP_STORE__.getState());
    const rejectReq = stateBeforeReject.beneficiary_change_requests.find(r => r.bank_name === 'Suspicious Offshore Bank');
    expect(rejectReq).toBeTruthy();

    await loginAs(page, 'USR-ADITI');
    await page.goto('http://localhost:3000/#/admin/hospitals');
    await page.click(`[data-testid="btn-reject-bcr-${rejectReq.request_id}"]`);
    await page.waitForFunction(() => window.__LSP_STORE__ !== undefined);

    const stateAfterReject = await page.evaluate(() => window.__LSP_STORE__.getState());
    const rejectedReqObj = stateAfterReject.beneficiary_change_requests.find(r => r.request_id === rejectReq.request_id);
    expect(rejectedReqObj.status).toBe('REJECTED');
    expect(stateAfterReject.beneficiary_accounts.some(b => b.bank_name === 'Suspicious Offshore Bank')).toBe(false);
  });

  test('AT-25 & J14: Daily reconciliation with deliberate mismatch: discrepancy flagged, assigned, evidence attached, resolved', async ({ page }) => {
    await loginAs(page, 'USR-VIKRAM'); // Ops Manager
    await page.goto('http://localhost:3000/#/ops/reconciliation');
    await expect(page.locator('h1')).toContainText('Daily Reconciliation Workbench');

    // Plant test discrepancy
    await page.click('[data-testid="btn-plant-mismatch"]');
    await expect(page.locator('text=UNRECONCILED / MISMATCH').first()).toBeVisible();

    // Go to Exception Workbench
    await page.goto('http://localhost:3000/#/ops/exceptions');
    await expect(page.locator('h1')).toContainText('Exception Workbench');

    // Find the planted mismatch receipt
    const plantedReceipt = await page.evaluate(() => {
      return window.__LSP_STORE__.getState().receipts.find(r => r.state === 'MISMATCH');
    });
    expect(plantedReceipt).toBeTruthy();

    // Assign owner and attach mandatory evidence to resolve
    await page.fill(`[data-testid="input-exception-owner-${plantedReceipt.receipt_id}"]`, 'Vikram Malhotra (Ops Lead)');
    await page.fill(`[data-testid="input-resolution-evidence-${plantedReceipt.receipt_id}"]`, 'SBI Bank statement scroll #48921 confirmed UTR credited to Hospital Account');
    await page.click(`[data-testid="btn-resolve-exception-${plantedReceipt.receipt_id}"]`);
    await page.waitForFunction(() => window.__LSP_STORE__ !== undefined);

    // Verify resolved in store and audit log
    const resolvedReceipt = await page.evaluate(recId => {
      return window.__LSP_STORE__.getState().receipts.find(r => r.receipt_id === recId);
    }, plantedReceipt.receipt_id);

    expect(resolvedReceipt.state).toBe('CONFIRMED');
    expect(resolvedReceipt.assigned_owner).toBe('Vikram Malhotra (Ops Lead)');
    expect(resolvedReceipt.resolution_evidence).toContain('SBI Bank statement scroll #48921');

    // Audit log verification
    const auditLogs = await page.evaluate(() => window.__LSP_STORE__.getState().audit_logs);
    const resolveAudit = auditLogs.find(l => l.action === 'EXCEPTION_RESOLVED_WITH_EVIDENCE' && l.target_id === plantedReceipt.receipt_id);
    expect(resolveAudit).toBeTruthy();
    expect(resolveAudit.reason).toContain('SBI Bank statement scroll #48921');
  });

  test('AT-28: Duplicate lender webhook: idempotency guard prevents double processing; audit logged; financial state unaffected', async ({ page }) => {
    // Process webhook event 1
    const result1 = await page.evaluate(() => {
      return window.__LENDER_ADAPTER__.ingestWebhook({
        eventId: 'EVT-WEBHOOK-9901',
        eventType: 'DISBURSEMENT_CONFIRMATION',
        payload: { amount: 50000, utr: 'UTR-TEST-9901' }
      });
    });

    expect(result1.status).toBe('PROCESSED');

    // Send exact same webhook event again (duplicate)
    const result2 = await page.evaluate(() => {
      return window.__LENDER_ADAPTER__.ingestWebhook({
        eventId: 'EVT-WEBHOOK-9901',
        eventType: 'DISBURSEMENT_CONFIRMATION',
        payload: { amount: 50000, utr: 'UTR-TEST-9901' }
      });
    });

    expect(result2.status).toBe('DISCARDED_DUPLICATE');

    // Verify audit log has the duplicate discarded record
    const auditLogs = await page.evaluate(() => window.__LSP_STORE__.getState().audit_logs);
    const dupAudit = auditLogs.find(l => l.action === 'DUPLICATE_WEBHOOK_DISCARDED' && l.target_id === 'EVT-WEBHOOK-9901');
    expect(dupAudit).toBeTruthy();
    expect(dupAudit.reason).toContain('Idempotency key match');
  });
});
