/**
 * Server Cryptographic Utilities
 * Zero dependencies, uses Node.js standard 'crypto' module
 * - Scrypt Password Hashing with Salt
 * - RFC 6238 Time-Based One-Time Passwords (TOTP)
 * - HMAC-SHA256 Webhook Signatures
 * - Timing-safe comparisons
 */

import crypto from 'crypto';

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const key = crypto.scryptSync(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}

export function verifyPassword(password, combinedHash) {
  if (!combinedHash || !combinedHash.includes(':')) return false;
  const [salt, key] = combinedHash.split(':');
  const targetKey = Buffer.from(key, 'hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  if (targetKey.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(targetKey, derivedKey);
}

/**
 * Computes 6-digit TOTP code for a 16-byte hex secret
 * counter = floor(timestampInSeconds / timeStep)
 */
export function generateTOTP(secretHex, timestamp = Date.now(), timeStep = 30) {
  const counter = Math.floor(timestamp / 1000 / timeStep);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));

  const secretBuf = Buffer.from(secretHex, 'hex');
  const hmac = crypto.createHmac('sha1', secretBuf);
  hmac.update(buf);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return String(otp).padStart(6, '0');
}

export function verifyTOTP(token, secretHex, window = 1, timestamp = Date.now(), timeStep = 30) {
  if (!token || typeof token !== 'string') return false;
  const cleanToken = token.trim();
  for (let offset = -window; offset <= window; offset++) {
    const checkTime = timestamp + offset * timeStep * 1000;
    const expected = generateTOTP(secretHex, checkTime, timeStep);
    if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expected))) {
      return true;
    }
  }
  return false;
}

export function generateHMAC(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyHMAC(secret, payload, signature) {
  if (!signature || typeof signature !== 'string') return false;
  const expected = generateHMAC(secret, payload);
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function generateSecureToken(byteLength = 32) {
  return crypto.randomBytes(byteLength).toString('hex');
}

export function generateNumericOTP(digits = 6) {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return String(crypto.randomInt(min, max + 1));
}
