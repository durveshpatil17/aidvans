/**
 * Regulated Lender Product Capability Registry
 * Enforces Section 4.4: Product version capabilities fail closed if not declared.
 */

export const LENDER_PRODUCTS = {
  'PROD-01': {
    productId: 'PROD-01',
    productVersionId: 'PROD-01-v1',
    lenderCode: 'LENDER_A',
    lenderName: 'CareFinance Capital NBFC Private Limited',
    productName: 'CareFinance Medical Loan',
    drawdownMode: 'SINGLE_DISBURSEMENT',
    multiDrawdown: false,
    minAmount: 25000,
    maxAmount: 500000,
    aprDisplay: '11.5% - 14.0% p.a.',
    tenorMonths: [6, 12, 18, 24],
    kfsTemplate: 'KFS-CAREFIN-STD-2026',
    coolingOffDays: 3,
    journeyModes: {
      application: 'api',
      kyc: 'redirect',
      offers: 'api',
      e_sign: 'redirect',
      authorisation: 'api'
    },
    capabilities: {
      application_submit: true,
      application_status: true,
      offers_and_kfs: true,
      kyc_handoff: true,
      e_sign_handoff: true,
      single_disbursement: true,
      multi_drawdown: false,
      cancellation: true,
      reversal: true,
      repayment_feed: true,
      callbacks: true
    },
    webhookConfig: {
      signatureScheme: 'HMAC_SHA256',
      activeKeyIds: ['key_carefin_2026_primary', 'key_carefin_2026_secondary'],
      timestampToleranceSeconds: 300
    }
  },
  'PROD-02': {
    productId: 'PROD-02',
    productVersionId: 'PROD-02-v1',
    lenderCode: 'LENDER_B',
    lenderName: 'HealthCredit India NBFC Limited',
    productName: 'HealthCredit Staged Care Facility',
    drawdownMode: 'MULTI_DRAWDOWN',
    multiDrawdown: true,
    requiresBorrowerAuthPerDrawdown: true,
    minAmount: 50000,
    maxAmount: 1000000,
    aprDisplay: '12.0% - 15.5% p.a.',
    tenorMonths: [12, 24, 36],
    kfsTemplate: 'KFS-HLTHCRED-FAC-2026',
    coolingOffDays: 3,
    journeyModes: {
      application: 'iframe', // Supported with redirect fallback
      kyc: 'iframe',
      offers: 'api',
      e_sign: 'redirect',
      authorisation: 'api'
    },
    capabilities: {
      application_submit: true,
      application_status: true,
      offers_and_kfs: true,
      kyc_handoff: true,
      e_sign_handoff: true,
      single_disbursement: false,
      multi_drawdown: true,
      cancellation: true,
      reversal: true,
      repayment_feed: true,
      callbacks: true
    },
    webhookConfig: {
      signatureScheme: 'HMAC_SHA256',
      activeKeyIds: ['key_hlthcred_2026_v1', 'key_hlthcred_2026_v2'],
      timestampToleranceSeconds: 300
    }
  }
};

export function getProductCapabilities(productId) {
  const prod = LENDER_PRODUCTS[productId];
  if (!prod) {
    throw new Error(`Unrecognized lender product: ${productId}`);
  }
  return prod;
}

export function assertCapability(productId, capabilityKey) {
  const prod = getProductCapabilities(productId);
  if (!prod.capabilities || prod.capabilities[capabilityKey] !== true) {
    const err = new Error(`Feature '${capabilityKey}' is not supported by lender product '${productId}'.`);
    err.statusCode = 422;
    err.code = 'UNSUPPORTED_LENDER_CAPABILITY';
    throw err;
  }
  return true;
}
