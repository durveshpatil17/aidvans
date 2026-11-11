/**
 * Lender A Adapter (CareFinance Capital NBFC)
 * Architecture: Single Upfront Disbursement, Redirect Journey Mode for KYC & E-Sign
 */

import http from 'http';
import https from 'https';
import { BaseLenderAdapter } from './_template.js';
import { LENDER_PRODUCTS } from './registry.js';

export class LenderAAdapter extends BaseLenderAdapter {
  constructor(config = {}) {
    super({
      lenderCode: 'LENDER_A',
      apiBaseUrl: config.apiBaseUrl || process.env.LENDER_A_API_URL || 'http://localhost:3001/lender-a/api',
      webhookSecrets: {
        'key_carefin_2026_primary': 'sec_carefin_primary_9876543210',
        'key_carefin_2026_secondary': 'sec_carefin_secondary_1234567890'
      }
    });
    this.productConfig = LENDER_PRODUCTS['PROD-01'];
  }

  async makeRequest(endpoint, method = 'GET', data = null, headers = {}) {
    const url = new URL(`${this.apiBaseUrl}${endpoint}`);
    const bodyStr = data ? JSON.stringify(data) : null;
    const client = url.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
      const req = client.request(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
          ...headers
        }
      }, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            const parsed = raw ? JSON.parse(raw) : {};
            if (res.statusCode >= 400) {
              const err = new Error(parsed.message || `Lender A HTTP ${res.statusCode}`);
              err.statusCode = res.statusCode;
              err.details = parsed;
              return reject(err);
            }
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Failed to parse Lender A response: ${raw}`));
          }
        });
      });

      req.on('error', reject);
      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  }

  async capabilities() {
    return this.productConfig;
  }

  async submitApplication(canonicalApplication, idempotencyKey) {
    // Map canonical application to Lender A schema
    const partnerPayload = {
      partner_application_ref: canonicalApplication.appId,
      case_id: canonicalApplication.caseId,
      frid: canonicalApplication.frid,
      applicant: {
        pan: canonicalApplication.borrower.pan,
        name: canonicalApplication.borrower.name,
        monthly_income: canonicalApplication.borrower.monthlyIncome
      },
      hospital_demand: {
        amount: canonicalApplication.demand.amount,
        hospital_id: canonicalApplication.hospital.orgId,
        beneficiary_acc: canonicalApplication.hospital.beneficiaryAccount.account_number_raw,
        ifsc: canonicalApplication.hospital.beneficiaryAccount.ifsc
      }
    };

    return this.makeRequest('/applications/submit', 'POST', partnerPayload, {
      'Idempotency-Key': idempotencyKey
    });
  }

  async getApplicationStatus(partnerApplicationRef) {
    return this.makeRequest(`/applications/${partnerApplicationRef}/status`);
  }

  async getOffers(partnerApplicationRef) {
    return this.makeRequest(`/applications/${partnerApplicationRef}/offers`);
  }

  async fetchKfs(partnerOfferRef) {
    return this.makeRequest(`/offers/${partnerOfferRef}/kfs`);
  }

  async createAuthorisationContext(fundingRequest) {
    // Single disbursement mode: cannot create subsequent drawdown tranches
    if (fundingRequest.demand_sequence > 1) {
      const err = new Error('Lender A (CareFinance Medical Loan) is a single-disbursement product. Subsequent tranches are rejected. Please originate a new application.');
      err.statusCode = 422;
      err.code = 'SUBSEQUENT_TRANCHE_NOT_SUPPORTED';
      throw err;
    }
    return {
      authContextId: `CTX-A-${Date.now()}`,
      lenderCode: this.lenderCode,
      allowedAmount: fundingRequest.amount
    };
  }

  async submitDrawdown(drawdownRequest, idempotencyKey) {
    if (drawdownRequest.sequence > 1) {
      const err = new Error('Subsequent tranches prohibited by single-disbursement policy.');
      err.statusCode = 422;
      throw err;
    }
    return this.makeRequest('/drawdowns/submit', 'POST', drawdownRequest, {
      'Idempotency-Key': idempotencyKey
    });
  }

  async getDisbursementStatus(partnerTransactionRef) {
    return this.makeRequest(`/disbursements/${partnerTransactionRef}`);
  }

  async getLoanSnapshot(partnerLoanAccountRef) {
    return this.makeRequest(`/loans/${partnerLoanAccountRef}`);
  }

  normalizeWebhook(rawEvent) {
    // Standardizes inbound webhook event
    return {
      eventId: rawEvent.event_id,
      eventType: rawEvent.event_type, // 'SANCTION_APPROVED', 'DISBURSEMENT_CONFIRMED', 'DISBURSEMENT_REVERSED'
      timestamp: rawEvent.timestamp,
      caseId: rawEvent.case_id,
      applicationId: rawEvent.application_id,
      payload: rawEvent.data
    };
  }
}

