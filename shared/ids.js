/**
 * Standardized Check-Digit Protected Reference Generators
 * Generates copyable reference IDs with verifiable checksums.
 */

// Unambiguous character set (no 0, 1, I, O)
const ALPHANUMERIC = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Computes a Luhn-like checksum character for error detection
 */
export function computeCheckChar(input) {
  const sanitized = String(input).toUpperCase().replace(/[^23456789ABCDEFGHJKMNPQRSTUVWXYZ]/g, '');
  let sum = 0;
  for (let i = 0; i < sanitized.length; i++) {
    const val = ALPHANUMERIC.indexOf(sanitized[i]);
    if (val !== -1) {
      const weight = (i % 2 === 0) ? 3 : 1;
      sum += val * weight;
    }
  }
  const rem = sum % ALPHANUMERIC.length;
  return ALPHANUMERIC[rem];
}

export function validateReferenceCheckChar(ref) {
  if (!ref || typeof ref !== 'string') return false;
  const parts = ref.split('-');
  if (parts.length < 2) return false;
  const providedCheck = parts[parts.length - 1].slice(-1);
  const base = ref.slice(0, -1);
  return computeCheckChar(base) === providedCheck;
}

function randomBlock(len) {
  let str = '';
  for (let i = 0; i < len; i++) {
    str += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
  }
  return str;
}

/**
 * Generates unique Financing Reference ID (FRID)
 * Format: HF-XXXX-XXXX (e.g. HF-7K3M-9QX2) with check character
 */
export function generateFRID() {
  const part1 = randomBlock(4);
  const part2Raw = randomBlock(3);
  const check = computeCheckChar(`HF${part1}${part2Raw}`);
  return `HF-${part1}-${part2Raw}${check}`;
}

export function generateReference(prefix, year = new Date().getFullYear()) {
  const raw = randomBlock(5);
  const check = computeCheckChar(`${prefix}${year}${raw}`);
  return `${prefix}-${year}-${raw}${check}`;
}

export const generateCaseId = () => generateReference('CASE');
export const generateDemandId = () => generateReference('DEM');
export const generateFundingRequestId = () => generateReference('FREQ');
export const generateApplicationId = () => generateReference('APP');
export const generateSanctionId = () => generateReference('SAN');
export const generateDrawdownId = () => generateReference('DRAW');
export const generateDisbursementId = () => generateReference('DISB');
export const generateLoanId = () => generateReference('LOAN');
export const generateReceiptId = () => generateReference('RCPT');
export const generateExceptionId = () => generateReference('EXC');
export const generateTicketId = () => generateReference('TKT');
