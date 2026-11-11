import { test, expect } from '@playwright/test';
import {
  hashPassword,
  verifyPassword,
  generateTOTP,
  verifyTOTP,
  signHMAC,
  verifyHMAC,
  generateSecureToken,
  generateNumericOTP
} from '../../server/crypto.js';

test.describe('Tier 1 Unit: Cryptography, Scrypt, TOTP and HMAC', () => {
  test('scrypt password hashing and verification', () => {
    const password = 'Password@123';
    const hash = hashPassword(password);
    expect(hash).toContain(':'); // salt:hash format

    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword('WrongPassword', hash)).toBe(false);
    expect(verifyPassword('', hash)).toBe(false);
  });

  test('RFC 6238 TOTP generates 6-digit codes and verifies current window with skew', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const token = generateTOTP(secret);
    expect(token).toMatch(/^\d{6}$/);

    expect(verifyTOTP(secret, token)).toBe(true);
    expect(verifyTOTP(secret, '000000')).toBe(false);
  });

  test('HMAC-SHA256 signs payloads and verifies tampering', () => {
    const secretKey = 'lender_hmac_secret_key_2026';
    const payload = JSON.stringify({ event_id: 'EVT-01', amount: 125000 });

    const signature = signHMAC(payload, secretKey);
    expect(signature).toMatch(/^[a-f0-9]{64}$/);

    expect(verifyHMAC(payload, signature, secretKey)).toBe(true);
    expect(verifyHMAC(payload, signature, 'wrong_key')).toBe(false);
    expect(verifyHMAC(payload + 'tampered', signature, secretKey)).toBe(false);
  });

  test('Secure token and numeric OTP generators produce expected lengths', () => {
    const token16 = generateSecureToken(16);
    expect(token16.length).toBe(32); // 16 bytes = 32 hex chars

    const otp6 = generateNumericOTP(6);
    expect(otp6).toMatch(/^\d{6}$/);
  });
});

