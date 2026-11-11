/**
 * Lender B Adapter (HealthCredit India NBFC)
 * Architecture: Multi-Drawdown Staged Care Facility, Iframe Journey Mode with Redirect Fallback
 */

import http from 'http';
import { BaseLenderAdapter } from './_template.js';
import { LENDER_PRODUCTS } from './registry.js';

export class LenderBAdapter extends BaseLenderAdapter {
  constructor(config = {}) {
    super({
      lenderCode: 'LENDER_B',
      apiBaseUrl: config.apiBaseUrl || process.env.LENDER_B_API_URL || 'http://localhost:3001/lender-b/api',
      webhookSecrets: {
        'key_hlthcred_2026_v1': 'sec_hlthcred_v1_1122334455',
        'key_hlthcred_2026_v2': 'sec_hlthcred_v2_6677889900'
      }
    });
    this.productConfig = LENDER_PRODUCTS['PROD-02'];
  }

  async makeRequest(endpoint, method = 'GET', data = null, headers = {}) {
    const url = new URL(`${this.apiBaseUrl}${endpoint}`);
    const bodyStr = data ? JSON.stringify(data) : null;

    return new Promise((resolve, reject) => {
      const req = http.request(url, {
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
              const err = new Error(parsed.message || `Lender B HTTP ${res.statusCode}`);
              err.statusCode = res.statusCode;
              err.details = parsed;
              return reject(err);
            }
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Failed to parse Lender B response: ${raw}`));
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
    const partnerPayload = {
      facility_request_id: canonicalApplication.appId,
      case_id: canonicalApplication.caseId,
      frid: canonicalApplication.frid,
      applicant: {
        pan: canonicalApplication.borrower.pan,
        name: canonicalApplication.borrower.name,
        income: canonicalApplication.borrower.monthlyIncome
      },
      initial_tranche: {
        amount: canonicalApplication.demand.amount,
        hospital_id: canonicalApplication.hospital.orgId,
        beneficiary_acc: canonicalApplication.hospital.beneficiaryAccount.account_number_raw,
        ifsc: canonicalApplication.hospital.beneficiaryAccount.ifsc
      }
    };

    return this.makeRequest('/facility/apply', 'POST', partnerPayload, {
      'Idempotency-Key': idempotencyKey
    });
  }

  async getApplicationStatus(partnerApplicationRef) {
    return this.makeRequest(`/facility/${partnerApplicationRef}/status`);
  }

  async getOffers(partnerApplicationRef) {
    return this.makeRequest(`/facility/${partnerApplicationRef}/offers`);
  }

  async fetchKfs(partnerOfferRef) {
    return this.makeRequest(`/facility/offers/${partnerOfferRef}/kfs`);
  }

  async createAuthorisationContext(fundingRequest) {
    // Multi-drawdown facility generates per-tranche authorization context
    return {
      authContextId: `CTX-B-TRANCHE-${fundingRequest.demand_sequence}-${Date.now()}`,
      lenderCode: this.lenderCode,
      allowedAmount: fundingRequest.amount,
      trancheSequence: fundingRequest.demand_sequence,
      requiresStepUpOtp: true
    };
  }

  async submitDrawdown(drawdownRequest, idempotencyKey) {
    return this.makeRequest('/facility/drawdowns', 'POST', drawdownRequest, {
      'Idempotency-Key': idempotencyKey
    });
  }

  async getDisbursementStatus(partnerTransactionRef) {
    return this.makeRequest(`/disbursements/${partnerTransactionRef}`);
  }

  async getLoanSnapshot(partnerLoanAccountRef) {
    return this.makeRequest(`/facility/accounts/${partnerLoanAccountRef}`);
  }

  normalizeWebhook(rawEvent) {
    return {
      eventId: rawEvent.event_id,
      eventType: rawEvent.event_type,
      timestamp: rawEvent.timestamp,
      caseId: rawEvent.case_id,
      applicationId: rawEvent.application_id,
      payload: rawEvent.data
    };
  }
}
