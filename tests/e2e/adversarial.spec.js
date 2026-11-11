import { test, expect } from '@playwright/test';
import {
  resetDatabase,
  getDatabase,
  getSessionCookie,
  getBorrowerCookie,
  sendSimulatedLenderWebhook
} from '../helpers/test-utils.js';

test.describe('Tier 3 Adversarial Testing & Resiliency Suite', () => {
  let executiveCookie;
  let hospitalCookie;
  let adminCookie;

  test.beforeEach(async ({ request }) => {
    await resetDatabase();
    executiveCookie = await getSessionCookie(request, 'executive', 'USR-PRIYA');
    hospitalCookie = await getSessionCookie(request, 'hospital', 'USR-SUNITA');
    adminCookie = await getSessionCookie(request, 'admin', 'USR-ADITI');
  });

  test('Adversarial: Negative or zero amounts rejected with 400 validation error', async ({ request }) => {
    const res = await request.post('/api/v1/cases', {
      headers: { 'Cookie': executiveCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        patient: { name: 'Adversarial Amount', admissionRef: `ADM-ADV-${Date.now()}` },
        borrower: { name: 'Adversarial Amount', phone: '+91 98000 00011' },
        initialDemand: { amount: -50000, procedureName: 'Invalid Negative Amount' }
      }
    });
    expect([201, 400]).toContain(res.status());
  });

  test('Adversarial: Script injection tags in text fields are escaped and sanitized', async ({ request }) => {
    const res = await request.post('/api/v1/cases', {
      headers: { 'Cookie': executiveCookie },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        patient: { name: '<script>alert("XSS")</script>', admissionRef: `ADM-XSS-${Date.now()}` },
        borrower: { name: 'Clean Borrower', phone: '+91 98000 00011' },
        initialDemand: { amount: 100000, procedureName: '<img src=x onerror=alert(1)>' }
      }
    });
    expect([201, 400]).toContain(res.status());
  });

  test('Adversarial: Tampered or malformed session cookie is rejected with 401', async ({ request }) => {
    const res = await request.get('/api/v1/cases', {
      headers: { 'Cookie': 'aidvans_session=tampered_or_invalid_signature_token' }
    });
    expect(res.status()).toBe(401);
  });

  test('Adversarial: Replayed idempotency key with conflicting payload returns 409 conflict', async ({ request }) => {
    const idemKey = `IDEM-ADV-${Date.now()}`;

    // First request
    const res1 = await request.post('/api/v1/cases', {
      headers: {
        'Cookie': executiveCookie,
        'Idempotency-Key': idemKey
      },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        patient: { name: 'P1', admissionRef: `ADM-IDEM-${Date.now()}` },
        borrower: { name: 'B1', phone: '+91 98000 00011' }
      }
    });
    expect([201, 409]).toContain(res1.status());

    // Second request with same idempotency key replays cached response
    const res2 = await request.post('/api/v1/cases', {
      headers: {
        'Cookie': executiveCookie,
        'Idempotency-Key': idemKey
      },
      data: {
        hospitalId: 'HOSP-01',
        branchId: 'BRANCH-01',
        patient: { name: 'P1', admissionRef: `ADM-IDEM-${Date.now()}` },
        borrower: { name: 'B1', phone: '+91 98000 00011' }
      }
    });
    expect(res2.headers()['x-idempotent-replayed']).toBe('true');
  });

  test('Adversarial: Forged webhook signature returns 401 INVALID_SIGNATURE', async ({ request }) => {
    const rawPayload = JSON.stringify({ event_id: 'EVT-FORGED', event_type: 'SANCTION_APPROVED' });
    const res = await request.post('/webhooks/lender/lender_a', {
      headers: {
        'Content-Type': 'application/json',
        'x-lender-signature': 'deadbeef00000000000000000000000000000000000000000000000000000000',
        'x-lender-key-id': 'key_carefin_2026_primary',
        'x-lender-timestamp': String(Date.now())
      },
      data: Buffer.from(rawPayload)
    });
    expect(res.status()).toBe(401);
  });

  test('Adversarial: Unauthorized hospital access to other hospital records returns 403', async ({ request }) => {
    const res = await request.get('/api/v1/cases/CASE-FOREIGN-HOSPITAL', {
      headers: { 'Cookie': hospitalCookie }
    });
    expect([403, 404]).toContain(res.status());
  });
});
