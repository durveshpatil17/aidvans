import { test, expect } from '@playwright/test';
import { generateHMAC } from '../../server/crypto.js';

test.describe('Tier 2 API: Lender Webhook Ingestion & Signature Verification (Slice 3, J20)', () => {
  const PRIMARY_SECRET = 'sec_carefin_primary_9876543210';
  const SECONDARY_SECRET = 'sec_carefin_secondary_1234567890';
  const CASE_ID = 'CASE-2026-4019';

  test('Valid HMAC-SHA256 signed webhook for SANCTION_APPROVED updates case status', async ({ request }) => {
    const eventId = `EVT-SAN-${Date.now()}`;
    const payload = {
      event_id: eventId,
      event_type: 'SANCTION_APPROVED',
      case_id: CASE_ID,
      application_id: 'APP-2026-9901',
      timestamp: new Date().toISOString(),
      data: {
        sanction_amount: 125000,
        apr: '13.5%',
        tenor_months: 12,
        kfs_ref: 'KFS-CAREFIN-STD-2026'
      }
    };

    const rawBody = JSON.stringify(payload);
    const signature = generateHMAC(PRIMARY_SECRET, rawBody);

    const res = await request.post('/webhooks/lender/lender_a', {
      headers: {
        'Content-Type': 'application/json',
        'x-lender-signature': signature,
        'x-lender-key-id': 'key_carefin_2026_primary',
        'x-lender-timestamp': String(Date.now())
      },
      data: Buffer.from(rawBody)
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('PROCESSED');
    expect(data.event_id).toBe(eventId);
  });

  test('Webhook key rotation: secondary key ID signs and verifies successfully', async ({ request }) => {
    const eventId = `EVT-ROT-${Date.now()}`;
    const payload = {
      event_id: eventId,
      event_type: 'SANCTION_APPROVED',
      case_id: CASE_ID,
      timestamp: new Date().toISOString(),
      data: { sanction_amount: 125000 }
    };

    const rawBody = JSON.stringify(payload);
    const signature = generateHMAC(SECONDARY_SECRET, rawBody);

    const res = await request.post('/webhooks/lender/lender_a', {
      headers: {
        'Content-Type': 'application/json',
        'x-lender-signature': signature,
        'x-lender-key-id': 'key_carefin_2026_secondary',
        'x-lender-timestamp': String(Date.now())
      },
      data: Buffer.from(rawBody)
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('PROCESSED');
  });

  test('Tampered webhook payload or bad signature is rejected with 401 INVALID_SIGNATURE', async ({ request }) => {
    const rawBody = JSON.stringify({
      event_id: `EVT-BAD-${Date.now()}`,
      event_type: 'SANCTION_APPROVED',
      case_id: CASE_ID
    });

    const badSignature = '0000000000000000000000000000000000000000000000000000000000000000';

    const res = await request.post('/webhooks/lender/lender_a', {
      headers: {
        'Content-Type': 'application/json',
        'x-lender-signature': badSignature,
        'x-lender-key-id': 'key_carefin_2026_primary'
      },
      data: Buffer.from(rawBody)
    });

    expect(res.status()).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe('INVALID_SIGNATURE');
  });

  test('Duplicate webhook event is acknowledged as IGNORED_DUPLICATE without re-executing', async ({ request }) => {
    const eventId = `EVT-DUP-${Date.now()}`;
    const payload = {
      event_id: eventId,
      event_type: 'DISBURSEMENT_CONFIRMED',
      case_id: CASE_ID,
      timestamp: new Date().toISOString(),
      data: {
        hospital_id: 'HOSP-01',
        amount: 125000,
        utr: 'SBX-NEFT-99182'
      }
    };

    const rawBody = JSON.stringify(payload);
    const signature = generateHMAC(PRIMARY_SECRET, rawBody);

    // 1st delivery
    const res1 = await request.post('/webhooks/lender/lender_a', {
      headers: {
        'Content-Type': 'application/json',
        'x-lender-signature': signature,
        'x-lender-key-id': 'key_carefin_2026_primary'
      },
      data: Buffer.from(rawBody)
    });
    expect(res1.status()).toBe(200);
    const data1 = await res1.json();
    expect(data1.status).toBe('PROCESSED');

    // 2nd delivery (replayed duplicate)
    const res2 = await request.post('/webhooks/lender/lender_a', {
      headers: {
        'Content-Type': 'application/json',
        'x-lender-signature': signature,
        'x-lender-key-id': 'key_carefin_2026_primary'
      },
      data: Buffer.from(rawBody)
    });
    expect(res2.status()).toBe(200);
    const data2 = await res2.json();
    expect(data2.status).toBe('IGNORED_DUPLICATE');
  });

  test('Webhook to unregistered lender returns 404 UNKNOWN_LENDER', async ({ request }) => {
    const rawBody = JSON.stringify({ event_id: 'EVT-99' });
    const res = await request.post('/webhooks/lender/unknown_bank_nbfc', {
      headers: { 'Content-Type': 'application/json' },
      data: Buffer.from(rawBody)
    });
    expect(res.status()).toBe(404);
    const data = await res.json();
    expect(data.error.code).toBe('UNKNOWN_LENDER');
  });
});

