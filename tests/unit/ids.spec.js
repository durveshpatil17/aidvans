import { test, expect } from '@playwright/test';
import {
  generateFRID,
  isValidFRID,
  generateCaseId,
  generateDemandId,
  generateFundingRequestId,
  generateApplicationId,
  generateSanctionId,
  generateDrawdownId,
  generateDisbursementId,
  generateReceiptId,
  generateExceptionId,
  generateTicketId,
  isValidEntityId
} from '../../shared/ids.js';

test.describe('Tier 1 Unit: Reference ID Generation & Check Digit Validation', () => {
  test('generateFRID creates valid FRID with check character', () => {
    for (let i = 0; i < 20; i++) {
      const frid = generateFRID();
      expect(frid).toMatch(/^HF-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
      expect(isValidFRID(frid)).toBe(true);
    }
  });

  test('isValidFRID detects corrupted or tampered FRIDs', () => {
    const valid = generateFRID();
    expect(isValidFRID(valid)).toBe(true);

    // Corrupt one character
    const chars = valid.split('');
    chars[chars.length - 1] = chars[chars.length - 1] === 'X' ? 'Y' : 'X';
    const corrupted = chars.join('');
    expect(isValidFRID(corrupted)).toBe(false);

    expect(isValidFRID('HF-INVALID')).toBe(false);
    expect(isValidFRID('123456')).toBe(false);
    expect(isValidFRID('')).toBe(false);
  });

  test('Entity ID generators produce correct prefixes and valid check characters', () => {
    const generators = [
      { fn: generateCaseId, prefix: 'CASE' },
      { fn: generateDemandId, prefix: 'DEM' },
      { fn: generateFundingRequestId, prefix: 'FREQ' },
      { fn: generateApplicationId, prefix: 'APP' },
      { fn: generateSanctionId, prefix: 'SAN' },
      { fn: generateDrawdownId, prefix: 'DRAW' },
      { fn: generateDisbursementId, prefix: 'DISB' },
      { fn: generateReceiptId, prefix: 'RCPT' },
      { fn: generateExceptionId, prefix: 'EXC' },
      { fn: generateTicketId, prefix: 'TKT' }
    ];

    for (const { fn, prefix } of generators) {
      const id = fn();
      expect(id.startsWith(`${prefix}-`)).toBe(true);
      expect(isValidEntityId(id, prefix)).toBe(true);

      // Corrupt check digit
      const tampered = id.slice(0, -1) + (id.endsWith('A') ? 'B' : 'A');
      expect(isValidEntityId(tampered, prefix)).toBe(false);
    }
  });
});

