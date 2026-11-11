import { expect } from '@playwright/test';
import { resetDb, readDb, writeDb } from '../../server/db.js';
import { generateTOTP, computeHmacSha256, generateHMAC } from '../../server/crypto.js';

export function setupConsoleCheck(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`Page Error: ${err.message}`);
  });
  return () => {
    expect(errors, `Expected zero console errors, but found: ${errors.join('; ')}`).toEqual([]);
  };
}

export function setupNetworkCheck(page) {
  const externalRequests = [];
  page.on('request', req => {
    const url = new URL(req.url());
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      externalRequests.push(req.url());
    }
  });
  return () => {
    expect(externalRequests, `Expected zero external network requests, but found: ${externalRequests.join(', ')}`).toEqual([]);
  };
}

export async function resetDatabase() {
  try {
    await fetch('http://localhost:3000/api/v1/demo/reset', { method: 'POST' });
  } catch {}
  return resetDb();
}

export const resetData = resetDatabase;
export const loginAs = async () => {};

export function getDatabase() {
  return readDb();
}

export function getLatestSMS(phone) {
  const db = readDb();
  const messages = db.simulated_outbox?.sms || [];
  if (phone) {
    const clean = phone.replace(/[^0-9]/g, '');
    return messages.find(m => m.recipient.replace(/[^0-9]/g, '').includes(clean));
  }
  return messages[0];
}

export async function getSessionCookie(request, workspace, userId, password = 'Password@123') {
  const db = readDb();
  const user = db.users.find(u => u.user_id === userId || u.email === userId);
  const secret = user?.totp_secret || Buffer.from(userId.padEnd(16, '0')).toString('hex').slice(0, 32);
  const res = await request.post('/api/v1/auth/login', {
    data: {
      userIdOrEmail: userId,
      password,
      totpCode: generateTOTP(secret),
      workspace
    }
  });
  return res.headers()['set-cookie'];
}

export async function getBorrowerCookie(request, phone = '+91 98000 00011') {
  await request.post('/api/v1/auth/borrower/request-otp', { data: { phone } });
  const db = readDb();
  const sms = db.simulated_outbox?.sms?.find(s => s.recipient === phone);
  const otp = sms?.otp || '123456';
  const res = await request.post('/api/v1/auth/borrower/verify-otp', {
    data: { phone, otp }
  });
  return res.headers()['set-cookie'];
}

export async function loginWorkforce(page, workspace, userId = 'USR-PRIYA', password = 'Password@123') {
  await page.goto(`/${workspace}/login`);
  await page.waitForLoadState('domcontentloaded');

  const db = readDb();
  const user = db.users.find(u => u.user_id === userId || u.email === userId);

  await page.fill('#username', userId);
  await page.fill('#password', password);

  // First submit triggers MFA if enrolled
  await page.click('button[type="submit"]');
  await page.waitForTimeout(300);

  const mfaInput = page.locator('#totp-code');
  if (await mfaInput.isVisible() && user && user.totp_secret) {
    const code = generateTOTP(user.totp_secret);
    await mfaInput.fill(code);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(300);
  }

  await page.waitForURL(url => !url.pathname.endsWith('/login'), { timeout: 8000 });
}

export async function loginBorrower(page, phone = '+91 98000 00011') {
  await page.goto('/borrower/login');
  await page.waitForLoadState('domcontentloaded');

  const phoneInput = page.locator('#borrower-phone');
  if (await phoneInput.isVisible()) {
    await phoneInput.fill(phone);
  }
  const submitBtn = page.locator('#btn-borrower-submit, button[type="submit"], #btn-send-otp, #btn-quick-borrower');
  await submitBtn.first().click();
  await page.waitForTimeout(300);

  const otpInput = page.locator('#borrower-otp');
  if (await otpInput.isVisible()) {
    const sms = getLatestSMS(phone);
    const otp = sms?.otp || '123456';
    await otpInput.fill(otp);
    await page.click('#btn-verify-otp');
  }

  await page.waitForURL(url => !url.pathname.endsWith('/login'), { timeout: 8000 });
}

export async function sendSimulatedLenderWebhook(lenderCode = 'lender_a', eventType, data = {}) {
  const secret = lenderCode === 'lender_a' ? 'sec_carefin_primary_9876543210' : 'sec_healthpe_primary_1357924680';
  const keyId = lenderCode === 'lender_a' ? 'key_carefin_2026_primary' : 'key_healthpe_2026_primary';

  const payload = {
    event_id: data.event_id || `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    event_type: eventType,
    case_id: data.case_id || 'CASE-2026-4019',
    application_id: data.application_id || 'APP-2026-9901',
    timestamp: new Date().toISOString(),
    data
  };

  const bodyStr = JSON.stringify(payload);
  const sig = generateHMAC(secret, bodyStr);

  const res = await fetch(`http://localhost:3000/webhooks/lender/${lenderCode}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-lender-signature': sig,
      'x-lender-key-id': keyId,
      'x-lender-timestamp': String(Date.now())
    },
    body: bodyStr
  });

  return { status: res.status, json: await res.json() };
}
