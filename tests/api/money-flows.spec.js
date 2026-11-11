import { test, expect } from '@playwright/test';
import { generateTOTP } from '../../server/crypto.js';

test.describe('Tier 2 API: End-to-End Money Flows & Transactions (Slice 6, AT-10, AT-11, AT-14, AT-18, AT-27)', () => {
  let executiveCookie;
  let hospitalCookie;
  let borrowerCookie;
  let adminCookie;

  test.beforeEach(async ({ request }) => {
    // 1. Executive Login
    const exeSecret = Buffer.from('USR-PRIYA'.padEnd(16, '0')).toString('hex').slice(0, 32);
    const exeLogin = await request.post('/api/v1/auth/login', {
      data: { userIdOrEmail: 'USR-PRIYA', password: 'Password@123', totpCode: generateTOTP(exeSecret), workspace: 'executive' }
    });
    executiveCookie = exeLogin.headers()['set-cookie'];

    // 2. Hospital Finance Login
    const hospSecret = Buffer.from('USR-SUNITA'.padEnd(16, '0')).toString('hex').slice(0, 32);
    const hospLogin = await request.post('/api/v1/auth/login', {
      data: { userIdOrEmail: 'USR-SUNITA', password: 'Password@123', totpCode: generateTOTP(hospSecret), workspace: 'hospital' }
    });
    hospitalCookie = hospLogin.headers()['set-cookie'];

    // 3. Admin Login
    const admSecret = Buffer.from('USR-ADITI'.padEnd(16, '0')).toString('hex').slice(0, 32);
    const admLogin = await request.post('/api/v1/auth/login', {
      data: { userIdOrEmail: 'USR-ADITI', password: 'Password@123', totpCode: generateTOTP(admSecret), workspace: 'admin' }
    });
    adminCookie = admLogin.headers()['set-cookie'];

    // 4. Borrower Login
    await request.post('/api/v1/auth/borrower/request-otp', { data: { phone: '+91 98000 00011' } });
    const demoState = await (await request.get('/api/v1/demo/state')).json();
    const latestSMS = demoState.outboxes.sms.find(s => s.recipient === '+91 98000 00011');
    const borVerify = await request.post('/api/v1/auth/borrower/verify-otp', {
      data: { phone: '+91 98000 00011', otp: latestSMS.otp }
    });
    borrowerCookie = borVerify.headers()['set-cookie'];
  });

  test('AT-01: Executive creates financing case with initial demand; FRID generated', async ({ request }) => {
    const res = await request.post('/api/v1/cases', {
      headers: { 'Cookie': executiveCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        patient: { name: 'Kavita Deshmukh', admissionRef: `IPD-${Date.now()}`, phone: '+91 98000 00055', age: 38 },
        borrower: { name: 'Ramesh Kumar', phone: '+91 98000 00011', pan: 'TESTP1111A' },
        initialDemand: { amount: 125000, procedureName: 'Emergency Appendectomy' }
      }
    });

    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.frid).toMatch(/^HF-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
    expect(data.case.case_status).toBe('READY_FOR_INVITATION');
  });

  test('AT-10 & J11: Single-disbursement product (Lender A) rejects subsequent drawdown tranche', async ({ request }) => {
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

  test('AT-11: Multi-drawdown facility (Lender B) allows subsequent funding requests with borrower authorization', async ({ request }) => {
    // Case using PROD-02 (Multi-drawdown)
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
    const { fundingRequest: req2Data } = await freq2.json();

    // Borrower requests step-up OTP
    await request.post('/api/v1/funding-requests/step-up-otp', { headers: { 'Cookie': borrowerCookie } });
    const demoState = await (await request.get('/api/v1/demo/state')).json();
    const latestSMS = demoState.outboxes.sms.find(s => s.recipient === '+91 98000 00011');

    // Borrower authorises drawdown tranche with step-up OTP
    const authRes = await request.post(`/api/v1/funding-requests/${req2Data.funding_request_id}/authorise`, {
      headers: { 'Cookie': borrowerCookie },
      data: { stepUpOtp: latestSMS.otp }
    });
    expect(authRes.status()).toBe(200);
    const authData = await authRes.json();
    expect(authData.status).toBe('AUTHORISED');
  });

  test('AT-18 & J13: Hospital beneficiary bank account changes enforce maker-checker dual approval', async ({ request }) => {
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

  test('AT-27: Closing LSP facilitation case displays statutory notice and preserves underlying lender loan', async ({ request }) => {
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
    const closeRes = await request.post(`/api/v1/cases/${caseRecord.case_id}/close`, {
      headers: { 'Cookie': executiveCookie }
    });
    expect(closeRes.status()).toBe(200);
    const closeData = await closeRes.json();
    expect(closeData.status).toBe('FACILITATION_CLOSED');
    expect(closeData.statutoryNotice).toContain('does not close or terminate the borrower\'s underlying loan agreement');
  });
});

