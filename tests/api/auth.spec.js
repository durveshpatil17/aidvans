import { test, expect } from '@playwright/test';
import { generateTOTP } from '../../server/crypto.js';

test.describe('Tier 2 API: Workforce & Borrower Authentication', () => {
  test('Workforce login requires TOTP when enrolled and returns session cookie', async ({ request }) => {
    // 1. Password only -> MFA required
    const mfaRes = await request.post('/api/v1/auth/login', {
      data: {
        userIdOrEmail: 'USR-PRIYA',
        password: 'Password@123',
        workspace: 'executive'
      }
    });
    expect(mfaRes.status()).toBe(200);
    const mfaData = await mfaRes.json();
    expect(mfaData.mfa_required).toBe(true);

    // 2. Supply TOTP code
    const totpSecret = Buffer.from('USR-PRIYA'.padEnd(16, '0')).toString('hex').slice(0, 32);
    const totp = generateTOTP(totpSecret);

    const fullLogin = await request.post('/api/v1/auth/login', {
      data: {
        userIdOrEmail: 'USR-PRIYA',
        password: 'Password@123',
        totpCode: totp,
        workspace: 'executive'
      }
    });
    expect(fullLogin.status()).toBe(200);
    const data = await fullLogin.json();
    expect(data.success).toBe(true);
    expect(data.user.user_id).toBe('USR-PRIYA');
    expect(data.workspaceRoute).toBe('/executive/dashboard');

    // Check Set-Cookie header contains aidvans_session with HttpOnly
    const cookieHeader = fullLogin.headers()['set-cookie'] || '';
    expect(cookieHeader).toContain('aidvans_session=');
    expect(cookieHeader.toLowerCase()).toContain('httponly');
    expect(cookieHeader.toLowerCase()).toContain('samesite=lax');

    // Verify /api/v1/auth/me returns active session
    const meRes = await request.get('/api/v1/auth/me', {
      headers: { 'Cookie': cookieHeader }
    });
    expect(meRes.status()).toBe(200);
    const meData = await meRes.json();
    expect(meData.user.user_id).toBe('USR-PRIYA');

    // Logout revokes session
    const logoutRes = await request.post('/api/v1/auth/logout', {
      headers: { 'Cookie': cookieHeader }
    });
    expect(logoutRes.status()).toBe(200);
    const clearCookie = logoutRes.headers()['set-cookie'] || '';
    expect(clearCookie).toContain('Max-Age=0');
  });

  test('Account lockout enforces 5-attempt limit and locks account', async ({ request }) => {
    const targetUserId = 'USR-IMRAN';

    // 5 invalid attempts
    for (let i = 0; i < 5; i++) {
      const res = await request.post('/api/v1/auth/login', {
        data: {
          userIdOrEmail: targetUserId,
          password: 'WrongPassword999',
          workspace: 'executive'
        }
      });
      expect(res.status()).toBe(401);
    }

    // 6th attempt is locked
    const lockedRes = await request.post('/api/v1/auth/login', {
      data: {
        userIdOrEmail: targetUserId,
        password: 'Password@123', // even with correct password
        workspace: 'executive'
      }
    });
    expect(lockedRes.status()).toBe(401);
    const data = await lockedRes.json();
    expect(data.error.message).toContain('Account temporarily locked');

    // Unlock via Admin API
    const adminSecret = Buffer.from('USR-ADITI'.padEnd(16, '0')).toString('hex').slice(0, 32);
    const adminLogin = await request.post('/api/v1/auth/login', {
      data: {
        userIdOrEmail: 'USR-ADITI',
        password: 'Password@123',
        totpCode: generateTOTP(adminSecret),
        workspace: 'admin'
      }
    });
    const adminCookie = adminLogin.headers()['set-cookie'];

    const unlockRes = await request.post(`/api/v1/admin/users/${targetUserId}/unlock`, {
      headers: { 'Cookie': adminCookie }
    });
    expect(unlockRes.status()).toBe(200);
  });

  test('Borrower mobile SMS OTP flow with anti-enumeration protection', async ({ request }) => {
    // 1. Anti-enumeration: Request OTP for unregistered phone returns generic success
    const anonRes = await request.post('/api/v1/auth/borrower/request-otp', {
      data: { phone: '+91 99999 99999' }
    });
    expect(anonRes.status()).toBe(200);
    const anonData = await anonRes.json();
    expect(anonData.message).toContain('One-Time Password (OTP) dispatched');

    // 2. Request OTP for seeded borrower Ramesh Kumar
    const reqRes = await request.post('/api/v1/auth/borrower/request-otp', {
      data: { phone: '+91 98000 00011' }
    });
    expect(reqRes.status()).toBe(200);

    // 3. Inspect simulated outbox via demo state endpoint
    const demoStateRes = await request.get('/api/v1/demo/state');
    const demoState = await demoStateRes.json();
    const smsOutbox = demoState.outboxes.sms;
    const latestSMS = smsOutbox.find(s => s.recipient === '+91 98000 00011');
    expect(latestSMS).toBeDefined();
    expect(latestSMS.otp).toMatch(/^\d{6}$/);

    // 4. Verify OTP with wrong code fails
    const badVerify = await request.post('/api/v1/auth/borrower/verify-otp', {
      data: { phone: '+91 98000 00011', otp: '000000' }
    });
    expect(badVerify.status()).toBe(401);

    // 5. Verify OTP with correct code succeeds and sets cookie
    const goodVerify = await request.post('/api/v1/auth/borrower/verify-otp', {
      data: { phone: '+91 98000 00011', otp: latestSMS.otp }
    });
    expect(goodVerify.status()).toBe(200);
    const goodData = await goodVerify.json();
    expect(goodData.user.name).toBe('Ramesh Kumar');
    expect(goodData.workspaceRoute).toBe('/borrower/home');
  });
});
