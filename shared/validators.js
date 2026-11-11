/**
 * Shared Validation Rules & Masking Utilities
 * TDS Section 8 Compliance (Data Privacy & Field Masking)
 */

export const REGEX = {
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  PHONE: /^\+91\s?[6-9]\d{9}$/,
  IFSC: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  AADHAAR_LAST4: /^\d{4}$/,
  FRID: /^HF-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/
};

export function isValidPAN(pan) {
  if (!pan || typeof pan !== 'string') return false;
  return REGEX.PAN.test(pan.trim().toUpperCase());
}

export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return REGEX.PHONE.test(phone.trim());
}

export function isValidIFSC(ifsc) {
  if (!ifsc || typeof ifsc !== 'string') return false;
  return REGEX.IFSC.test(ifsc.trim().toUpperCase());
}

export function isValidFRID(frid) {
  if (!frid || typeof frid !== 'string') return false;
  return REGEX.FRID.test(frid.trim().toUpperCase());
}

export function maskName(name) {
  if (!name || typeof name !== 'string') return '—';
  return name.split(' ').map(part => {
    if (part.length <= 1) return part;
    return part[0] + '*'.repeat(Math.max(1, part.length - 1));
  }).join(' ');
}

export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '—';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 4) return '••••';
  const last2 = clean.slice(-2);
  return `•••• ••${last2}`;
}

export function maskAccount(accNumber) {
  if (!accNumber || typeof accNumber !== 'string') return '—';
  const clean = accNumber.replace(/\s+/g, '');
  if (clean.length < 4) return '••••';
  const last4 = clean.slice(-4);
  return `•••• •••• ${last4}`;
}

export function maskAadhaar(aadhaar) {
  if (!aadhaar || typeof aadhaar !== 'string') return '—';
  const clean = aadhaar.replace(/\s+/g, '');
  if (clean.length < 4) return '••••';
  const last4 = clean.slice(-4);
  return `•••• •••• ${last4}`;
}

export function maskPAN(pan) {
  if (!pan || typeof pan !== 'string') return '—';
  const clean = pan.trim().toUpperCase();
  if (clean.length < 4) return '••••';
  return clean[0] + '••••' + clean.slice(-2);
}

export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
