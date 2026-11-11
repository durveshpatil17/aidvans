import { test, expect } from '@playwright/test';
import {
  isValidPAN,
  isValidPhone,
  isValidIFSC,
  maskName,
  maskPhone,
  maskAccount,
  maskPAN,
  maskAadhaar,
  escapeHTML
} from '../../shared/validators.js';

test.describe('Tier 1 Unit: Validators & Data Masking', () => {
  test('isValidPAN verifies standard Indian Income Tax PAN structure', () => {
    expect(isValidPAN('ABCDE1234F')).toBe(true);
    expect(isValidPAN('TESTP1111A')).toBe(true);
    expect(isValidPAN('abcde1234f')).toBe(true); // case-insensitive
    expect(isValidPAN('12345ABCDE')).toBe(false);
    expect(isValidPAN('ABCDE12345')).toBe(false);
    expect(isValidPAN('ABC1234F')).toBe(false);
  });

  test('isValidPhone verifies 10-digit Indian mobile numbers with optional +91', () => {
    expect(isValidPhone('9876543210')).toBe(true);
    expect(isValidPhone('+91 98765 43210')).toBe(true);
    expect(isValidPhone('+919876543210')).toBe(true);
    expect(isValidPhone('09876543210')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('5876543210')).toBe(false); // does not start with 6-9
  });

  test('isValidIFSC verifies standard Indian Financial System Code', () => {
    expect(isValidIFSC('HDFC0001234')).toBe(true);
    expect(isValidIFSC('SBIN0000456')).toBe(true);
    expect(isValidIFSC('hdfc0001234')).toBe(true);
    expect(isValidIFSC('HDFC1001234')).toBe(false); // 5th char must be 0
    expect(isValidIFSC('HDFC000123')).toBe(false); // wrong length
  });

  test('Masking functions protect sensitive borrower and banking information', () => {
    expect(maskName('Ramesh Kumar')).toBe('R***** K****');
    expect(maskPhone('+91 98765 43210')).toBe('•••• ••10');
    expect(maskAccount('98765432104092')).toBe('•••• •••• 4092');
    expect(maskPAN('ABCDE1234F')).toBe('A••••4F');
    expect(maskAadhaar('123456789012')).toBe('•••• •••• 9012');
  });

  test('escapeHTML prevents script and markup injection', () => {
    expect(escapeHTML('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHTML('"Hello" & \'World\'')).toBe('&quot;Hello&quot; &amp; &#39;World&#39;');
  });
});
