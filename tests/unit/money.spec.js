import { test, expect } from '@playwright/test';
import {
  formatINR,
  amountInWordsINR,
  rupeesToPaise,
  paiseToRupees,
  safeAddINR,
  safeSubtractINR
} from '../../shared/money.js';

test.describe('Tier 1 Unit: Currency Formatting & Number to Words', () => {
  test('formatINR formats numbers with Indian grouping and rupee symbol', () => {
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(500)).toBe('₹500');
    expect(formatINR(1000)).toBe('₹1,000');
    expect(formatINR(10000)).toBe('₹10,000');
    expect(formatINR(125000)).toBe('₹1,25,000');
    expect(formatINR(1000000)).toBe('₹10,00,000');
    expect(formatINR(12345678)).toBe('₹1,23,45,678');
    expect(formatINR(-5000)).toBe('-₹5,000');
  });

  test('amountInWordsINR converts amounts to standard Indian numbering words', () => {
    expect(amountInWordsINR(0)).toBe('Rupees Zero Only');
    expect(amountInWordsINR(500)).toBe('Rupees Five Hundred Only');
    expect(amountInWordsINR(125000)).toBe('Rupees One Lakh Twenty Five Thousand Only');
    expect(amountInWordsINR(7500000)).toBe('Rupees Seventy Five Lakh Only');
    expect(amountInWordsINR(10000000)).toBe('Rupees One Crore Only');
  });

  test('Paise conversions are precise with zero float rounding errors', () => {
    expect(rupeesToPaise(125000)).toBe(12500000);
    expect(rupeesToPaise(99.50)).toBe(9950);
    expect(paiseToRupees(12500000)).toBe(125000);
    expect(paiseToRupees(9950)).toBe(99.5);
  });

  test('Safe decimal arithmetic avoids JavaScript IEEE 754 float drift', () => {
    expect(safeAddINR(0.1, 0.2)).toBe(0.3);
    expect(safeSubtractINR(1.0, 0.9)).toBe(0.1);
    expect(safeAddINR(125000.50, 25000.25)).toBe(150000.75);
  });
});
