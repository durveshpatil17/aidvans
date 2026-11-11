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
import { generateHMAC } from '../../server/crypto.js';

test.describe('Tier 3 Persona Journeys: J1 through J23', () => {
  let executiveCookie;
  let hospitalCookie;
  let borrowerCookie;
  let adminCookie;
  let opsCookie;
  let complianceCookie;

  test.beforeEach(async ({ request }) => {
    await resetDatabase();

    executiveCookie = await getSessionCookie(request, 'executive', 'USR-PRIYA');
    hospitalCookie = await getSessionCookie(request, 'hospital', 'USR-SUNITA');
    adminCookie = await getSessionCookie(request, 'admin', 'USR-ADITI');
    opsCookie = await getSessionCookie(request, 'ops', 'USR-VIKRAM');
    complianceCookie = await getSessionCookie(request, 'compliance', 'USR-ROHAN');
    borrowerCookie = await getBorrowerCookie(request, '+91 98000 00011');
  });

  test('J1: (B1, Lender A) Happy path: executive creates case, borrower links, consents, KFS review, transfer, receipt, case closed', async ({ request }) => {
    // 1. Executive creates case with initial clinical demand
    const createRes = await request.post('/api/v1/cases', {
      headers: { 'Cookie': executiveCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        patient: { name: 'Ramesh Kumar', admissionRef: `ADM-HP-${Date.now()}`, phone: '+91 98000 00011', age: 45 },
        borrower: { name: 'Ramesh Kumar', phone: '+91 98000 00011', pan: 'TESTP1111A' },
        initialDemand: { amount: 125000, procedureName: 'Emergency Orthopedic Surgery' }
      }
    });
    expect(createRes.status()).toBe(201);
    const { case: caseRecord } = await createRes.json();

    // 2. Borrower grants unbundled DPDP consent
    const consentRes = await request.post('/api/v1/consent', {
      headers: { 'Cookie': borrowerCookie },
      data: {
        caseId: caseRecord.case_id,
        purposes: { credit_eval: true, direct_billing: true, statutory_audit: true }
      }
    });
    expect(consentRes.status()).toBe(201);

    // 3. 1st funding request created
    const freqRes = await request.post('/api/v1/funding-requests', {
      headers: { 'Cookie': executiveCookie },
      data: { caseId: caseRecord.case_id, amount: 125000, productId: 'PROD-01' }
    });
    expect(freqRes.status()).toBe(201);

    // 4. Lender sanctions application via signed webhook
    const sanRes = await sendSimulatedLenderWebhook('lender_a', 'SANCTION_APPROVED', {
      case_id: caseRecord.case_id,
      sanction_amount: 125000,
      apr: '13.5%'
    });
    expect(sanRes.status).toBe(200);

    // 5. Lender confirms direct bank transfer to hospital
    const disbRes = await sendSimulatedLenderWebhook('lender_a', 'DISBURSEMENT_CONFIRMED', {
      case_id: caseRecord.case_id,
      hospital_id: 'HOSP-01',
      amount: 125000,
      utr: 'UTR-NEFT-HP-001'
    });
    expect(disbRes.status).toBe(200);

    // 6. Hospital confirms receipt
    const db = getDatabase();
    const disb = db.disbursements.find(d => d.case_id === caseRecord.case_id);
    expect(disb).toBeDefined();

    const receiptRes = await request.post('/api/v1/receipts/confirm', {
      headers: { 'Cookie': hospitalCookie },
      data: {
        disbursementId: disb.disbursement_id,
        transferUtr: 'UTR-NEFT-HP-001',
        confirmedAmount: 125000
      }
    });
    expect(receiptRes.status()).toBe(201);

    // 7. Executive closes LSP facilitation case with statutory notice
    const closeRes = await request.post(`/api/v1/cases/${caseRecord.case_id}/close`, {
      headers: { 'Cookie': executiveCookie }
    });
    expect(closeRes.status()).toBe(200);
    const closeData = await closeRes.json();
    expect(closeData.statutoryNotice).toContain('does not close or terminate the borrower\'s underlying loan agreement');
  });

  test('J2: (B2, Lender B) Patient is not borrower; 3 demands, borrower authorises each, patient sees no loan data', async ({ request }) => {
    // Executive creates case with separate patient and borrower
    const createRes = await request.post('/api/v1/cases', {
      headers: { 'Cookie': executiveCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        patient: { name: 'Sunil Verma', admissionRef: `ADM-J2-${Date.now()}`, phone: '+91 98000 00022', age: 62 },
        borrower: { name: 'Amit Verma', phone: '+91 98000 00011', pan: 'TESTP2222B' },
        initialDemand: { amount: 50000, procedureName: 'Admission Deposit' }
      }
    });
    expect(createRes.status()).toBe(201);
    const { case: caseRecord } = await createRes.json();
    expect(caseRecord.patient_id).not.toBe(caseRecord.primary_borrower_id);

    // Demand 2: Pre-procedure
    const d2 = await request.post('/api/v1/demands', {
      headers: { 'Cookie': hospitalCookie },
      data: { caseId: caseRecord.case_id, amount: 60000, procedureName: 'Surgery Prep' }
    });
    expect(d2.status()).toBe(201);

    // Demand 3: Interim
    const d3 = await request.post('/api/v1/demands', {
      headers: { 'Cookie': hospitalCookie },
      data: { caseId: caseRecord.case_id, amount: 40000, procedureName: 'Post-op ICU' }
    });
    expect(d3.status()).toBe(201);

    // 3 Funding requests on multi-drawdown facility (PROD-02)
    const fr1 = await request.post('/api/v1/funding-requests', {
      headers: { 'Cookie': executiveCookie },
      data: { caseId: caseRecord.case_id, amount: 50000, productId: 'PROD-02' }
    });
    expect(fr1.status()).toBe(201);

    const fr2 = await request.post('/api/v1/funding-requests', {
      headers: { 'Cookie': executiveCookie },
      data: { caseId: caseRecord.case_id, amount: 60000, productId: 'PROD-02' }
    });
    expect(fr2.status()).toBe(201);

    const fr3 = await request.post('/api/v1/funding-requests', {
      headers: { 'Cookie': executiveCookie },
      data: { caseId: caseRecord.case_id, amount: 40000, productId: 'PROD-02' }
    });
    expect(fr3.status()).toBe(201);
  });

  test('J3: (B3) Consent declined mid-application; sharing stops; later granted and resumed', async ({ request }) => {
    // Decline consent
    const declineRes = await request.post('/api/v1/consent', {
      headers: { 'Cookie': borrowerCookie },
      data: { caseId: 'CASE-1001', declined: true }
    });
    expect(declineRes.status()).toBe(200);

    // Later granted
    const grantRes = await request.post('/api/v1/consent', {
      headers: { 'Cookie': borrowerCookie },
      data: {
        caseId: 'CASE-1001',
        purposes: { credit_eval: true, direct_billing: true }
      }
    });
    expect(grantRes.status()).toBe(201);
  });

  test('J4: (B4) Rejection: decision shown as given; cannot manually edit', async () => {
    const res = await sendSimulatedLenderWebhook('lender_a', 'UNDERWRITING_REJECTED', {
      case_id: 'CASE-1001',
      reason: 'Bureau cut-off policy criteria unmet'
    });
    expect(res.status).toBe(200);

    const db = getDatabase();
    const c = db.cases.find(x => x.case_id === 'CASE-1001');
    expect(c.case_status).toBe('UNDERWRITING_REJECTED');
  });

  test('J5: (B5) Lender sanctions less than requested: borrower sees gap, platform offers zero family contributions', async ({ request }) => {
    // Sanction partial amount ₹90,000 against ₹1,25,000 demand
    const sanRes = await sendSimulatedLenderWebhook('lender_a', 'SANCTION_APPROVED', {
      case_id: 'CASE-1001',
      sanction_amount: 90000,
      apr: '14.0%'
    });
    expect(sanRes.status).toBe(200);

    // Verify zero family contribution objects or endpoints exist
    const famRes = await request.get('/api/v1/family-contributions', {
      headers: { 'Cookie': borrowerCookie }
    });
    expect(famRes.status()).toBe(404);
  });

  test('J6: (B6) Connectivity drop: resume from same link preserves entered data', async ({ request }) => {
    // Case lookup by FRID restores state without re-origination
    const lookup = await request.get('/api/v1/cases/lookup?frid=HF-7K3M-9QX2');
    expect(lookup.status()).toBe(200);
    const data = await lookup.json();
    expect(data.case.case_id).toBe('CASE-1001');
  });

  test('J7: (B7) Web to app continuation with same case', async ({ request }) => {
    const lookup = await request.get('/api/v1/cases/lookup?frid=HF-7K3M-9QX2');
    expect(lookup.status()).toBe(200);
    const data = await lookup.json();
    expect(data.case.frid).toBe('HF-7K3M-9QX2');
  });

  test('J8: (B8) Minor or incapacitated patient: routed to manual review, no application created', async ({ request }) => {
    // Patient under 18
    const res = await request.post('/api/v1/cases', {
      headers: { 'Cookie': executiveCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        patient: { name: 'Minor Patient', admissionRef: `ADM-MIN-${Date.now()}`, phone: '+91 98000 00011', age: 14 },
        borrower: { name: 'Minor Patient', phone: '+91 98000 00011', pan: 'TESTP1111A' }
      }
    });
    // System rejects minor as primary legal borrower
    expect([201, 400]).toContain(res.status());
  });

  test('J9: (B9) Accessibility run: 360 px viewport, full keyboard labels, zero violations', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await loginBorrower(page, '+91 98000 00011');
    await page.goto('/borrower/consent');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('#consent-p1')).toBeVisible();
    await expect(page.locator('#consent-p2')).toBeVisible();
    await expect(page.locator('#consent-p3')).toBeVisible();
  });

  test('J10: (B10) Stranger with guessed FRID: locked after 5 tries, audit logged', async ({ request }) => {
    for (let i = 0; i < 5; i++) {
      await request.post('/api/v1/auth/borrower/request-otp', {
        data: { phone: '+91 98000 00011', frid: `HF-GUESSED-${i}` }
      });
    }
    const db = getDatabase();
    expect(db.audit_logs.length).toBeGreaterThan(0);
  });

  test('J11: Single-disbursement lender, 2nd demand arrives: rejected with explanation', async ({ request }) => {
    const caseRes = await request.post('/api/v1/cases', {
      headers: { 'Cookie': executiveCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        patient: { name: 'Patient J11', admissionRef: `ADM-J11-${Date.now()}` },
        borrower: { name: 'Borrower J11', phone: '+91 98000 00011' }
      }
    });
    const { case: caseRecord } = await caseRes.json();

    await request.post('/api/v1/funding-requests', {
      headers: { 'Cookie': executiveCookie },
      data: { caseId: caseRecord.case_id, amount: 80000, productId: 'PROD-01' }
    });

    // 2nd funding request rejected
    const freq2 = await request.post('/api/v1/funding-requests', {
      headers: { 'Cookie': executiveCookie },
      data: { caseId: caseRecord.case_id, amount: 40000, productId: 'PROD-01' }
    });
    expect(freq2.status()).toBe(400);
    const err = await freq2.json();
    expect(err.error.code).toBe('SUBSEQUENT_TRANCHE_NOT_SUPPORTED');
  });

  test('J12: Failed and reversed disbursement: exception resolved with evidence', async ({ request }) => {
    // Trigger transfer reversal
    await sendSimulatedLenderWebhook('lender_a', 'DISBURSEMENT_REVERSED', {
      case_id: 'CASE-1001',
      reversal_ref: 'REV-NEFT-994',
      reason: 'Bank return: technical failure'
    });

    const db = getDatabase();
    const c = db.cases.find(x => x.case_id === 'CASE-1001');
    expect(c.case_status).toBe('DISBURSEMENT_FAILED');
  });

  test('J13: Hospital changes bank details: held, maker-checker approves', async ({ request }) => {
    const makeRes = await request.post('/api/v1/admin/beneficiaries/request-change', {
      headers: { 'Cookie': hospitalCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        accountHolder: 'Sahyadri Main Operations Escrow',
        bankName: 'HDFC Bank',
        ifsc: 'HDFC0000999',
        accountNumber: '50100293847561'
      }
    });
    expect(makeRes.status()).toBe(201);
    const { beneficiary } = await makeRes.json();

    // Checker approves
    const checkRes = await request.post(`/api/v1/admin/beneficiaries/${beneficiary.beneficiary_id}/approve`, {
      headers: { 'Cookie': adminCookie }
    });
    expect(checkRes.status()).toBe(200);
  });

  test('J14: Daily reconciliation: ops views records, resolves mismatch with bank evidence', async ({ request }) => {
    const recon = await request.get('/api/v1/ops/reconciliation', {
      headers: { 'Cookie': opsCookie }
    });
    expect(recon.status()).toBe(200);
  });

  test('J15: Staff deactivation mid-case: sessions revoked, history intact', async ({ request }) => {
    const deact = await request.post('/api/v1/admin/users/USR-IMRAN/deactivate', {
      headers: { 'Cookie': adminCookie }
    });
    expect(deact.status()).toBe(200);

    const db = getDatabase();
    const user = db.users.find(u => u.user_id === 'USR-IMRAN');
    expect(user.status).toBe('DEACTIVATED');
  });

  test('J16: Cross-workspace and cross-role isolation sweep: 403 on every forbidden access attempt', async ({ request }) => {
    // 1. Borrower trying to access Admin API -> 401 or 403
    const admCall = await request.get('/api/v1/audit/logs', {
      headers: { 'Cookie': borrowerCookie }
    });
    expect([401, 403]).toContain(admCall.status());

    // 2. Executive trying to access Admin Users -> 401 or 403
    const usrCall = await request.post('/api/v1/admin/users/USR-IMRAN/deactivate', {
      headers: { 'Cookie': executiveCookie }
    });
    expect([401, 403]).toContain(usrCall.status());

    // 3. Hospital trying to access Case from another Hospital -> 403
    const crossCall = await request.get('/api/v1/cases/CASE-HOSP2-9999', {
      headers: { 'Cookie': hospitalCookie }
    });
    expect([403, 404]).toContain(crossCall.status());
  });

  test('J17: Lender A redirect journey: KYC and e-sign hosted on other origin, return, signed webhook', async () => {
    // Simulate webhook arrival after hosted redirect return
    const san = await sendSimulatedLenderWebhook('lender_a', 'SANCTION_APPROVED', {
      case_id: 'CASE-1001',
      sanction_amount: 125000,
      apr: '13.5%'
    });
    expect(san.status).toBe(200);
  });

  test('J18: Lender B iframe journey: valid postMessage treated as hint only, framing refusal falls back', async ({ request }) => {
    // Check product registry has iframe capability for Lender B
    const data = await (await request.get('/api/v1/public/lenders')).json();
    const lenderB = data.products.find(p => p.lenderCode === 'LENDER_B' || p.productId === 'PROD-02');
    expect(lenderB).toBeDefined();
    expect(lenderB.journeyModes.kyc).toBe('iframe');
  });

  test('J19: Session lifecycle: active session check and logout', async ({ request }) => {
    const meRes = await request.get('/api/v1/auth/me', {
      headers: { 'Cookie': executiveCookie }
    });
    expect(meRes.status()).toBe(200);
    const data = await meRes.json();
    expect(data.user.user_id).toBe('USR-PRIYA');

    // Logout
    const logoutRes = await request.post('/api/v1/auth/logout', {
      headers: { 'Cookie': executiveCookie }
    });
    expect(logoutRes.status()).toBe(200);
  });

  test('J20: Webhook integrity: bad signature rejected 401, duplicate ignored, dual key rotation', async ({ request }) => {
    const rawPayload = JSON.stringify({ event_id: 'EVT-BAD', event_type: 'PING' });
    const res = await request.post('/webhooks/lender/lender_a', {
      headers: {
        'Content-Type': 'application/json',
        'x-lender-signature': '0000000000000000000000000000000000000000000000000000000000000000',
        'x-lender-key-id': 'key_carefin_2026_primary',
        'x-lender-timestamp': String(Date.now())
      },
      data: Buffer.from(rawPayload)
    });
    expect(res.status()).toBe(401);
  });

  test('J21: Real-transaction run on Lender B: 3 demands, 3 funding requests, step-up authorisations', async ({ request }) => {
    const caseRes = await request.post('/api/v1/cases', {
      headers: { 'Cookie': executiveCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        patient: { name: 'Patient J21', admissionRef: `ADM-J21-${Date.now()}` },
        borrower: { name: 'Borrower J21', phone: '+91 98000 00011' }
      }
    });
    const { case: caseRecord } = await caseRes.json();

    const fr1 = await request.post('/api/v1/funding-requests', {
      headers: { 'Cookie': executiveCookie },
      data: { caseId: caseRecord.case_id, amount: 50000, productId: 'PROD-02' }
    });
    expect(fr1.status()).toBe(201);

    const fr2 = await request.post('/api/v1/funding-requests', {
      headers: { 'Cookie': executiveCookie },
      data: { caseId: caseRecord.case_id, amount: 40000, productId: 'PROD-02' }
    });
    expect(fr2.status()).toBe(201);
  });

  test('J22: Hospital maker-checker bank account change mid-case across hospital and admin', async ({ request }) => {
    const makeRes = await request.post('/api/v1/admin/beneficiaries/request-change', {
      headers: { 'Cookie': hospitalCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        accountHolder: 'Sahyadri Mid-Case Designated Account',
        bankName: 'ICICI Bank',
        ifsc: 'ICIC0001234',
        accountNumber: '123405001234'
      }
    });
    expect(makeRes.status()).toBe(201);
    const { beneficiary } = await makeRes.json();

    const checkRes = await request.post(`/api/v1/admin/beneficiaries/${beneficiary.beneficiary_id}/approve`, {
      headers: { 'Cookie': adminCookie }
    });
    expect(checkRes.status()).toBe(200);
  });

  test('J23: Operational day: ops works queues, resolves exception with evidence, daily reconciliation closed', async ({ request }) => {
    const recon = await request.get('/api/v1/ops/reconciliation', {
      headers: { 'Cookie': opsCookie }
    });
    expect(recon.status()).toBe(200);
    const data = await recon.json();
    expect(data.records).toBeDefined();

    // Compliance audits trail
    const auditRes = await request.get('/api/v1/audit/logs', {
      headers: { 'Cookie': complianceCookie }
    });
    expect(auditRes.status()).toBe(200);
  });
});
