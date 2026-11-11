import { test, expect } from '@playwright/test';
import { generateTOTP } from '../../server/crypto.js';

test.describe('Tier 2 API: Server Foundation, Security Headers & Error Envelopes', () => {
  test('Public overview returns platform metrics with security headers', async ({ request }) => {
    const res = await request.get('/api/v1/public/overview');
    expect(res.status()).toBe(200);

    const headers = res.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-correlation-id']).toBeDefined();

    const data = await res.json();
    expect(data.platformFeeToBorrower).toBe('₹0');
    expect(data.directDisbursementRate).toBe('100%');
    expect(data.partnerHospitals).toBeGreaterThan(0);
    expect(data.partnerLenders).toBeGreaterThan(0);
  });

  test('Public hospitals and lenders endpoints return verified partner entities', async ({ request }) => {
    const hospRes = await request.get('/api/v1/public/hospitals');
    expect(hospRes.status()).toBe(200);
    const hospData = await hospRes.json();
    expect(hospData.hospitals.length).toBeGreaterThanOrEqual(2);

    const lendRes = await request.get('/api/v1/public/lenders');
    expect(lendRes.status()).toBe(200);
    const lendData = await lendRes.json();
    expect(lendData.lenders.length).toBeGreaterThanOrEqual(2);
    expect(lendData.products.length).toBeGreaterThanOrEqual(2);
  });

  test('Unauthenticated request to protected endpoint returns 401 with standard error envelope and correlation ID', async ({ request }) => {
    const res = await request.get('/api/v1/cases');
    expect(res.status()).toBe(401);

    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('UNAUTHENTICATED');
    expect(data.error.message).toBeDefined();
    expect(data.error.correlationId).toBeDefined();

    // Verify correlation ID header reflection
    expect(res.headers()['x-correlation-id']).toBe(data.error.correlationId);
  });

  test('Invalid JSON request body returns 400 INVALID_JSON error envelope', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: Buffer.from('{ malformed json: missing quotes')
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('INVALID_JSON');
  });

  test('Non-existent API endpoint returns 404 NOT_FOUND error envelope for authenticated user', async ({ request }) => {
    // 1. Login as staff user with TOTP MFA
    const totpSecret = Buffer.from('USR-PRIYA'.padEnd(16, '0')).toString('hex').slice(0, 32);
    const totp = generateTOTP(totpSecret);

    const loginRes = await request.post('/api/v1/auth/login', {
      data: {
        userIdOrEmail: 'USR-PRIYA',
        password: 'Password@123',
        totpCode: totp,
        workspace: 'executive'
      }
    });
    expect(loginRes.status()).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.success).toBe(true);

    const res = await request.get('/api/v1/non-existent-route-99');
    expect(res.status()).toBe(404);
    const data = await res.json();
    expect(data.error.code).toBe('NOT_FOUND');
  });

  test('Idempotency key prevents duplicate execution and replays cached response', async ({ request }) => {
    const idemKey = `IDEM-TEST-${Date.now()}`;

    // Anonymous request with idempotency key
    const res1 = await request.post('/api/v1/cases/link', {
      headers: { 'Idempotency-Key': idemKey },
      data: { frid: 'HF-INVALID-KEY' }
    });
    const status1 = res1.status();
    const body1 = await res1.json();

    // Replay same request with same idempotency key
    const res2 = await request.post('/api/v1/cases/link', {
      headers: { 'Idempotency-Key': idemKey },
      data: { frid: 'HF-INVALID-KEY' }
    });

    expect(res2.status()).toBe(status1);
    expect(res2.headers()['x-idempotent-replayed']).toBe('true');
    const body2 = await res2.json();
    expect(body2).toEqual(body1);
  });
});
