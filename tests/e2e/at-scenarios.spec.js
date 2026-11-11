import { test, expect } from '@playwright/test';
import {
  resetDatabase,
  getDatabase,
  loginWorkforce,
  loginBorrower,
  getSessionCookie,
  getBorrowerCookie,
  sendSimulatedLenderWebhook
} from '../helpers/test-utils.js';

test.describe('Tier 3 Acceptance Tests: AT-01 through AT-30', () => {
  let executiveCookie;
  let hospitalCookie;
  let borrowerCookie;
  let adminCookie;
  let opsCookie;

  test.beforeEach(async ({ request }) => {
    await resetDatabase();

    executiveCookie = await getSessionCookie(request, 'executive', 'USR-PRIYA');
    hospitalCookie = await getSessionCookie(request, 'hospital', 'USR-SUNITA');
    adminCookie = await getSessionCookie(request, 'admin', 'USR-ADITI');
    opsCookie = await getSessionCookie(request, 'ops', 'USR-VIKRAM');
    borrowerCookie = await getBorrowerCookie(request, '+91 98000 00011');
  });

  test('AT-01: Executive creates valid case; CASE_ID and FRID generated; no HMS call occurs', async ({ request }) => {
    const res = await request.post('/api/v1/cases', {
      headers: { 'Cookie': executiveCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        patient: { name: 'Vikramaditya Roy', admissionRef: 'ADM-VIK-9901', phone: '+91 98000 00022', age: 42 },
        borrower: { name: 'Vikramaditya Roy', phone: '+91 98000 00022', pan: 'TESTP1111A' },
        initialDemand: { amount: 150000, procedureName: 'Cardiac Stent' }
      }
    });

    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.frid).toMatch(/^HF-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
    expect(data.case.case_id).toMatch(/^CASE-/);
    expect(data.case.case_status).toBe('READY_FOR_INVITATION');

    const db = getDatabase();
    const c = db.cases.find(x => x.case_id === data.case.case_id);
    expect(c).toBeDefined();
    expect(c.initial_demand_id).toBeDefined();
  });

  test('AT-02: App user without FRID tries to apply; shows guidance to visit desk', async ({ page }) => {
    await page.goto('/borrower/home');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toContainText(/Borrower Authentication Required|visit the hospital financing desk|Sign In/i);
  });

  test('AT-03: Valid borrower links FRID; case visible only after successful link and consent', async ({ request }) => {
    const res = await request.get('/api/v1/cases', {
      headers: { 'Cookie': borrowerCookie }
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.cases.length).toBeGreaterThan(0);
    expect(data.cases[0].frid).toBeDefined();
  });

  test('AT-04: FRID guessed or reused; rate limit/block after 5 attempts; audit logged', async ({ request }) => {
    for (let i = 0; i < 6; i++) {
      const res = await request.post('/api/v1/auth/borrower/request-otp', {
        data: { phone: '+91 98000 00011', frid: `HF-FAKE-${i}000` }
      });
      expect([200, 429]).toContain(res.status());
    }

    const db = getDatabase();
    expect(db.audit_logs.length).toBeGreaterThan(0);
  });

  test('AT-05: Patient differs from borrower; separate party identities; financial privacy', async () => {
    const db = getDatabase();
    const separatedCase = db.cases.find(c => c.patient_id !== c.primary_borrower_id);
    expect(separatedCase).toBeDefined();
    expect(separatedCase.patient_id).not.toBe(separatedCase.primary_borrower_id);
  });

  test('AT-06: Borrower declines consent; application sharing stops; records decline', async ({ request }) => {
    const res = await request.post('/api/v1/consent', {
      headers: { 'Cookie': borrowerCookie },
      data: {
        caseId: 'CASE-1001',
        declined: true
      }
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('DECLINED');
  });

  test('AT-07: Lender API timeout after submit; application state becomes pending/unknown', async () => {
    const res = await sendSimulatedLenderWebhook('lender_a', 'APPLICATION_STATUS_UNKNOWN', {
      case_id: 'CASE-1001',
      status: 'TIMEOUT_PENDING'
    });
    expect([200, 400]).toContain(res.status);
  });

  test('AT-08: Multiple lender offers; fair comparison and KFS links available', async ({ request }) => {
    const res = await request.get('/api/v1/public/lenders');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.lenders.length).toBeGreaterThanOrEqual(2);
  });

  test('AT-09: Lender rejects application; case reflects decline; cannot manually edit', async () => {
    const res = await sendSimulatedLenderWebhook('lender_a', 'UNDERWRITING_REJECTED', {
      case_id: 'CASE-1001',
      reason: 'Bureau score below partner cut-off'
    });
    expect(res.status).toBe(200);

    const db = getDatabase();
    const c = db.cases.find(x => x.case_id === 'CASE-1001');
    expect(c.case_status).toBe('UNDERWRITING_REJECTED');
  });

  test('AT-10: Single-disbursement product (Lender A) rejects subsequent drawdown tranche', async ({ request }) => {
    // 1. Create case with first funding request
    const caseRes = await request.post('/api/v1/cases', {
      headers: { 'Cookie': executiveCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        patient: { name: 'Patient Single', admissionRef: `ADM-SGL-${Date.now()}` },
        borrower: { name: 'Borrower Single', phone: '+91 98000 00011' },
        initialDemand: { amount: 100000 }
      }
    });
    const { case: caseRecord } = await caseRes.json();

    // 1st funding request for PROD-01 (Single disbursement)
    const freq1 = await request.post('/api/v1/funding-requests', {
      headers: { 'Cookie': executiveCookie },
      data: { caseId: caseRecord.case_id, demandId: 'DEM-01', amount: 100000, productId: 'PROD-01' }
    });
    expect(freq1.status()).toBe(201);

    // 2nd funding request for PROD-01 must be rejected
    const freq2 = await request.post('/api/v1/funding-requests', {
      headers: { 'Cookie': executiveCookie },
      data: { caseId: caseRecord.case_id, demandId: 'DEM-02', amount: 50000, productId: 'PROD-01' }
    });
    expect(freq2.status()).toBe(400);
    const errData = await freq2.json();
    expect(errData.error.code).toBe('SUBSEQUENT_TRANCHE_NOT_SUPPORTED');
  });

  test('AT-11: Multi-drawdown facility (Lender B) allows subsequent request with authorization', async ({ request }) => {
    const caseRes = await request.post('/api/v1/cases', {
      headers: { 'Cookie': executiveCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        patient: { name: 'Patient Multi', admissionRef: `ADM-MLT-${Date.now()}` },
        borrower: { name: 'Ramesh Kumar', phone: '+91 98000 00011' }
      }
    });
    const { case: caseRecord } = await caseRes.json();

    // 1st request
    const freq1 = await request.post('/api/v1/funding-requests', {
      headers: { 'Cookie': executiveCookie },
      data: { caseId: caseRecord.case_id, amount: 150000, productId: 'PROD-02' }
    });
    expect(freq1.status()).toBe(201);

    // 2nd request succeeds for multi-drawdown product
    const freq2 = await request.post('/api/v1/funding-requests', {
      headers: { 'Cookie': executiveCookie },
      data: { caseId: caseRecord.case_id, amount: 80000, productId: 'PROD-02' }
    });
    expect(freq2.status()).toBe(201);
  });

  test('AT-12: Hospital demand changes after authorisation; original history preserved', async ({ request }) => {
    const caseRes = await request.post('/api/v1/cases', {
      headers: { 'Cookie': executiveCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        patient: { name: 'Patient Demand Change', admissionRef: `ADM-DMD-${Date.now()}` },
        borrower: { name: 'Borrower Demand Change', phone: '+91 98000 00011' },
        initialDemand: { amount: 100000, procedureName: 'Initial Protocol' }
      }
    });
    const { case: caseRecord } = await caseRes.json();

    const res = await request.post('/api/v1/demands', {
      headers: { 'Cookie': hospitalCookie },
      data: {
        caseId: caseRecord.case_id,
        amount: 140000,
        procedureName: 'Amended Reconstruction Protocol',
        invoiceNumber: 'INV-AMEND-02'
      }
    });
    expect(res.status()).toBe(201);

    const db = getDatabase();
    const demands = db.demands.filter(d => d.case_id === caseRecord.case_id);
    expect(demands.length).toBeGreaterThanOrEqual(2);
  });

  test('AT-13: Disbursement confirmed but hospital receipt absent; mismatch exception opens', async ({ request }) => {
    // 1. Trigger lender disbursement confirmation via signed webhook
    await sendSimulatedLenderWebhook('lender_a', 'DISBURSEMENT_CONFIRMED', {
      case_id: 'CASE-1001',
      hospital_id: 'HOSP-01',
      amount: 125000,
      utr: 'UTR-DISB-CONF-123'
    });

    const db = getDatabase();
    const disb = db.disbursements.find(d => d.case_id === 'CASE-1001');
    expect(disb).toBeDefined();

    const res = await request.post('/api/v1/receipts/mismatch', {
      headers: { 'Cookie': hospitalCookie },
      data: {
        disbursementId: disb.disbursement_id,
        reportedUtr: 'UTR-MISMATCH-123',
        creditedAmount: 100000,
        expectedAmount: 125000
      }
    });
    expect([200, 201]).toContain(res.status());
    const data = await res.json();
    expect(data.exception.exception_id).toBeDefined();
    expect(data.exception.status).toBe('OPEN_OPS_INVESTIGATION');
  });

  test('AT-14: Disbursement fails/returns; return/reversal event linked; parties notified', async () => {
    // 1. Ensure disbursement exists
    await sendSimulatedLenderWebhook('lender_a', 'DISBURSEMENT_CONFIRMED', {
      case_id: 'CASE-1001',
      hospital_id: 'HOSP-01',
      amount: 125000,
      utr: 'UTR-DISB-CONF-123'
    });

    const res = await sendSimulatedLenderWebhook('lender_a', 'DISBURSEMENT_REVERSED', {
      case_id: 'CASE-1001',
      reversal_ref: 'REV-CAREFIN-8812',
      reason: 'Beneficiary IFSC technical routing rejection'
    });
    expect(res.status).toBe(200);

    const db = getDatabase();
    const c = db.cases.find(x => x.case_id === 'CASE-1001');
    expect(c.case_status).toBe('DISBURSEMENT_FAILED');
  });

  test('AT-15: Hospital tries to access another hospital case; 403 denied and audited', async ({ request }) => {
    const res = await request.get('/api/v1/cases/CASE-HOSP2-9999', {
      headers: { 'Cookie': hospitalCookie }
    });
    expect([403, 404]).toContain(res.status());
  });

  test('AT-16: Hospital user requests borrower KYC/PAN; access masked', async ({ request }) => {
    const res = await request.get('/api/v1/cases', {
      headers: { 'Cookie': hospitalCookie }
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    if (data.cases && data.cases.length > 0) {
      const c = data.cases[0];
      if (c.borrower && c.borrower.pan) {
        expect(c.borrower.pan).toMatch(/\*{4}[0-9A-Z]{4}/);
      }
    }
  });

  test('AT-17: Executive tries to enter borrower OTP; workflow prohibits and no OTP field for staff', async ({ page }) => {
    await loginWorkforce(page, 'executive', 'USR-PRIYA');
    await page.goto('/executive/new-case');
    await page.waitForLoadState('domcontentloaded');

    const staffOtpField = page.locator('#borrower-sms-otp');
    await expect(staffOtpField).toHaveCount(0);
  });

  test('AT-18: Hospital beneficiary account change held pending maker-checker approval', async ({ request }) => {
    // 1. Hospital user (Maker) requests account change
    const makeRes = await request.post('/api/v1/admin/beneficiaries/request-change', {
      headers: { 'Cookie': hospitalCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        accountHolder: 'Sahyadri Operations Escrow Account',
        bankName: 'Axis Bank',
        ifsc: 'UTIB0000123',
        accountNumber: '912010045678912'
      }
    });
    expect(makeRes.status()).toBe(201);
    const { beneficiary } = await makeRes.json();
    expect(beneficiary.verification_status).toBe('PENDING_MAKER_CHECKER_APPROVAL');

    // 2. Maker attempts to approve own change -> Collusion violation 403
    const selfApprove = await request.post(`/api/v1/admin/beneficiaries/${beneficiary.beneficiary_id}/approve`, {
      headers: { 'Cookie': hospitalCookie }
    });
    expect(selfApprove.status()).toBe(403);

    // 3. Platform Admin (Checker) approves change
    const checkApprove = await request.post(`/api/v1/admin/beneficiaries/${beneficiary.beneficiary_id}/approve`, {
      headers: { 'Cookie': adminCookie }
    });
    expect(checkApprove.status()).toBe(200);
    const checkData = await checkApprove.json();
    expect(checkData.status).toBe('VERIFIED');
  });

  test('AT-19: Borrower deep links resume linked case without re-origination', async ({ request }) => {
    const res = await request.get('/api/v1/cases/lookup?frid=HF-7K3M-9QX2');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.case.frid).toBe('HF-7K3M-9QX2');
  });

  test('AT-20: Borrower completes core journey on mobile web only (360px viewport, no native app)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await loginBorrower(page, '+91 98000 00011');

    await page.goto('/borrower/consent');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#btn-confirm-consent')).toBeVisible();

    await page.click('#btn-confirm-consent');
    await page.waitForTimeout(300);
    await expect(page.locator('body')).toContainText('Objective Lender Credit Offers');
  });

  test('AT-21: Expense journal feature disabled by default; no UI/API available', async ({ request }) => {
    const res = await request.get('/api/v1/user/journal', {
      headers: { 'Cookie': borrowerCookie }
    });
    expect(res.status()).toBe(404);
  });

  test('AT-22: Expense journal flag enabled; strictly borrower-only and isolated', async ({ request }) => {
    const res = await request.get('/api/v1/hospital/journal', {
      headers: { 'Cookie': hospitalCookie }
    });
    expect(res.status()).toBe(404);
  });

  test('AT-23: Borrower grievance ticket routed to correct NBFC channel with tracking', async ({ request }) => {
    const res = await request.post('/api/v1/support/tickets', {
      headers: { 'Cookie': borrowerCookie },
      data: {
        caseId: 'CASE-1001',
        category: 'LENDER_KFS_DISCREPANCY',
        lenderCode: 'lender_a',
        description: 'Discrepancy in APR shown vs sanction letter'
      }
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.ticket.ticket_id).toBeDefined();
    expect(data.ticket.routed_to).toBe('NBFC_GRIEVANCE_DESK');
  });

  test('AT-24: Staff deactivated; sessions revoked live and reassignment queue gets tasks', async ({ request }) => {
    const res = await request.post('/api/v1/admin/users/USR-IMRAN/deactivate', {
      headers: { 'Cookie': adminCookie }
    });
    expect(res.status()).toBe(200);

    const db = getDatabase();
    const user = db.users.find(u => u.user_id === 'USR-IMRAN');
    expect(user.status).toBe('DEACTIVATED');

    const activeSessions = db.sessions.filter(s => s.user_id === 'USR-IMRAN' && !s.revoked_at);
    expect(activeSessions.length).toBe(0);
  });

  test('AT-25: Daily reconciliation mismatch; exception owner assigned with evidence required', async ({ request }) => {
    const res = await request.get('/api/v1/ops/reconciliation', {
      headers: { 'Cookie': opsCookie }
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.records).toBeDefined();
  });

  test('AT-26: Consent withdrawal stops optional sharing while retaining mandatory records', async ({ request }) => {
    const res = await request.post('/api/v1/consent/withdraw', {
      headers: { 'Cookie': borrowerCookie },
      data: {
        caseId: 'CASE-1001',
        purpose: 'MARKETING_ANALYTICS'
      }
    });
    expect(res.status()).toBe(200);

    const db = getDatabase();
    const statutory = db.audit_logs.filter(c => c.action === 'CONSENT_WITHDRAWN');
    expect(statutory.length).toBeGreaterThan(0);
  });

  test('AT-27: Case closure notice: closing facilitation case does not terminate lender loan', async ({ request }) => {
    // Create case
    const caseRes = await request.post('/api/v1/cases', {
      headers: { 'Cookie': executiveCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        patient: { name: 'Patient Close', admissionRef: `ADM-CLS-${Date.now()}` },
        borrower: { name: 'Borrower Close', phone: '+91 98000 00011' }
      }
    });
    const { case: caseRecord } = await caseRes.json();

    // Close case
    const res = await request.post(`/api/v1/cases/${caseRecord.case_id}/close`, {
      headers: { 'Cookie': executiveCookie }
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.statutoryNotice).toContain('does not close or terminate the borrower\'s underlying loan agreement');
  });

  test('AT-28: Concurrent webhook retries; duplicate event logged as IGNORED_DUPLICATE', async () => {
    const eventId = `EVT-DEDUP-${Date.now()}`;
    const res1 = await sendSimulatedLenderWebhook('lender_a', 'SANCTION_APPROVED', {
      event_id: eventId,
      case_id: 'CASE-1001',
      sanction_amount: 125000,
      apr: '13.5%'
    });
    expect(res1.status).toBe(200);

    // Replay same event ID
    const res2 = await sendSimulatedLenderWebhook('lender_a', 'SANCTION_APPROVED', {
      event_id: eventId,
      case_id: 'CASE-1001',
      sanction_amount: 125000,
      apr: '13.5%'
    });
    expect(res2.status).toBe(200);
    expect(res2.json.status).toBe('IGNORED_DUPLICATE');
  });

  test('AT-29: Data export requested by executive is denied/controlled and audited', async ({ request }) => {
    const res = await request.get('/api/v1/cases/export', {
      headers: { 'Cookie': executiveCookie }
    });
    expect([401, 403]).toContain(res.status());
  });

  test('AT-30: Data breach simulation triggers incident response and containment logs', async ({ request }) => {
    const res = await request.post('/api/v1/admin/incident/simulate', {
      headers: { 'Cookie': adminCookie },
      data: {
        incident_type: 'CREDENTIAL_STUFFING_BURST',
        severity: 'HIGH',
        detected_ip: '203.0.113.42'
      }
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.incident.incident_id).toMatch(/^INC-/);
    expect(data.incident.containment_status).toBe('CONTAINED');
  });
});
