/**
 * Shared Indian Currency, Safe Paise Math and Number-to-Words
 * Strict compliance: Zero calculations of authoritative loan balance or live interest.
 */

export function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const num = Math.round(Number(amount));
  const isNegative = num < 0;
  const absStr = Math.abs(num).toString();

  if (absStr.length <= 3) {
    return (isNegative ? '-₹' : '₹') + absStr;
  }

  const lastThree = absStr.substring(absStr.length - 3);
  const otherNumbers = absStr.substring(0, absStr.length - 3);
  const withCommas = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  return (isNegative ? '-₹' : '₹') + withCommas;
}

export function rupeesToPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

export function paiseToRupees(paise) {
  return Math.round(Number(paise)) / 100;
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertThreeDigits(n) {
  let str = '';
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    str += ONES[n] + ' ';
  }
  return str.trim();
}

/**
 * Converts numeric amount to words using the Indian numbering system
 * (Crores, Lakhs, Thousands, Hundreds).
 * Example: 125000 -> "Rupees One Lakh Twenty Five Thousand Only"
 */
export function amountInWordsINR(amount) {
  const num = Math.round(Number(amount));
  if (isNaN(num) || num <= 0) return 'Rupees Zero Only';

  let remaining = num;
  const parts = [];

  const crores = Math.floor(remaining / 10000000);
  if (crores > 0) {
    parts.push(convertThreeDigits(crores) + ' Crore');
    remaining %= 10000000;
  }

  const lakhs = Math.floor(remaining / 100000);
  if (lakhs > 0) {
    parts.push(convertThreeDigits(lakhs) + ' Lakh');
    remaining %= 100000;
  }

  const thousands = Math.floor(remaining / 1000);
  if (thousands > 0) {
    parts.push(convertThreeDigits(thousands) + ' Thousand');
    remaining %= 1000;
  }

  if (remaining > 0) {
    parts.push(convertThreeDigits(remaining));
  }

  return `Rupees ${parts.join(' ')} Only`.replace(/\s+/g, ' ');
}
