/**
 * CANONICAL LENDER ADAPTER TEMPLATE (_template.js)
 *
 * This skeleton implements the mandatory integration contract defined in Section 10.3 of the
 * Technical Design Specification (TDS). Every regulated NBFC partner adapter must inherit or
 * implement these methods.
 *
 * NOTE: The client browser CANNOT call NBFC endpoints directly. All requests, authentication,
 * mutual TLS (mTLS), and webhook signatures are handled exclusively by this server-side adapter.
 *
 * -----------------------------------------------------------------------------------------
 * CANONICAL-TO-LENDER FIELD MAPPING REFERENCE TABLE:
 *
 * | Canonical Field Name    | Type    | Description                | Partner Field Name     |
 * |-------------------------|---------|----------------------------|------------------------|
 * | canonicalApplication.appId  | String  | LSP Unique Application ID  | partner_ref_id         |
 * | canonicalApplication.borrower.pan | String  | Verified Indian PAN        | customer_pan           |
 * | canonicalApplication.borrower.name| String  | Borrower Legal Name        | applicant_full_name    |
 * | canonicalApplication.demand.amount| Number  | Requested Loan in Rupees   | requested_loan_amount  |
 * | canonicalApplication.hospital.ifsc| String  | Verified Hospital IFSC     | beneficiary_ifsc       |
 * | canonicalApplication.hospital.acc | String  | Verified Hospital Account  | beneficiary_acc_no     |
 * -----------------------------------------------------------------------------------------
 */

import { verifyHMAC } from '../crypto.js';

export class BaseLenderAdapter {
  constructor(config = {}) {
    this.lenderCode = config.lenderCode || 'TEMPLATE_LENDER';
    this.apiBaseUrl = config.apiBaseUrl || process.env.LENDER_API_URL || 'http://localhost:3001/api';
    this.webhookSecrets = config.webhookSecrets || {
      'key_primary': process.env.LENDER_WEBHOOK_SECRET_PRIMARY || 'sbx_wh_sec_primary_98765',
      'key_secondary': process.env.LENDER_WEBHOOK_SECRET_SECONDARY || 'sbx_wh_sec_secondary_54321'
    };
  }

  /**
   * 1. Declare Supported Product Capabilities
   * @param {string} productVersionId
   * @returns {Object} capabilities
   */
  async capabilities(productVersionId) {
    return {
      productVersionId,
      applicationSubmit: true,
      applicationStatus: true,
      offersAndKfs: true,
      kycHandoff: true,
      eSignHandoff: true,
      singleDisbursement: true,
      multiDrawdown: false,
      cancellation: true,
      reversal: true,
      repaymentFeed: true,
      callbacks: true
    };
  }

  /**
   * 2. Validate Canonical Application Pre-Submission
   * @param {Object} canonicalApplication
   * @returns {Promise<{ valid: boolean, errors?: Array }>}
   */
  async validateApplication(canonicalApplication) {
    const errors = [];
    if (!canonicalApplication.borrower?.pan) errors.push('Borrower PAN is mandatory');
    if (!canonicalApplication.demand?.amount || canonicalApplication.demand.amount <= 0) errors.push('Valid demand amount required');
    if (!canonicalApplication.hospital?.beneficiaryAccount) errors.push('Verified hospital beneficiary bank account required');
    return { valid: errors.length === 0, errors };
  }

  /**
   * 3. Submit Canonical Loan Application to NBFC
   * @param {Object} canonicalApplication
   * @param {string} idempotencyKey
   * @returns {Promise<Object>} Partner application submission response
   */
  async submitApplication(canonicalApplication, idempotencyKey) {
    throw new Error('Method submitApplication must be implemented by concrete adapter');
  }

  /**
   * 4. Query Partner Application Underwriting Status
   * @param {string} partnerApplicationRef
   * @returns {Promise<{ status: string, details: Object }>}
   */
  async getApplicationStatus(partnerApplicationRef) {
    throw new Error('Method getApplicationStatus must be implemented by concrete adapter');
  }

  /**
   * 5. Fetch Credit Sanction Offers
   * @param {string} partnerApplicationRef
   * @returns {Promise<Array<Object>>} Standardized offers with APR and tenor
   */
  async getOffers(partnerApplicationRef) {
    throw new Error('Method getOffers must be implemented by concrete adapter');
  }

  /**
   * 6. Retrieve Key Fact Statement (KFS)
   * @param {string} partnerOfferRef
   * @returns {Promise<Object>} Standardized RBI KFS Document
   */
  async fetchKfs(partnerOfferRef) {
    throw new Error('Method fetchKfs must be implemented by concrete adapter');
  }

  /**
   * 7. Generate Authorisation Context for Drawdown
   * @param {Object} fundingRequest
   * @returns {Promise<Object>} Authorisation context token and parameters
   */
  async createAuthorisationContext(fundingRequest) {
    throw new Error('Method createAuthorisationContext must be implemented by concrete adapter');
  }

  /**
   * 8. Submit Drawdown Request to NBFC
   * @param {Object} drawdownRequest
   * @param {string} idempotencyKey
   * @returns {Promise<Object>} Drawdown acknowledgement and transaction ref
   */
  async submitDrawdown(drawdownRequest, idempotencyKey) {
    throw new Error('Method submitDrawdown must be implemented by concrete adapter');
  }

  /**
   * 9. Query Direct Hospital Disbursement Status
   * @param {string} partnerTransactionRef
   * @returns {Promise<{ status: string, utr?: string, asOf: string }>}
   */
  async getDisbursementStatus(partnerTransactionRef) {
    throw new Error('Method getDisbursementStatus must be implemented by concrete adapter');
  }

  /**
   * 10. Fetch Authoritative Loan Snapshot
   * @param {string} partnerLoanAccountRef
   * @returns {Promise<{ loanAccountRef: string, status: string, asOf: string, terms: Object }>}
   */
  async getLoanSnapshot(partnerLoanAccountRef) {
    throw new Error('Method getLoanSnapshot must be implemented by concrete adapter');
  }

  /**
   * 11. Verify Inbound Webhook Signature (HMAC-SHA256)
   * Supports key rotation via keyId header lookup.
   * @param {Object} headers
   * @param {string} rawBody
   * @returns {boolean}
   */
  verifyWebhook(headers, rawBody) {
    const signature = headers['x-lender-signature'] || headers['x-signature'];
    const keyId = headers['x-lender-key-id'] || 'key_primary';
    const secret = this.webhookSecrets[keyId];

    if (!secret || !signature) {
      return false;
    }

    // Timestamp freshness verification (tolerance default: 300 seconds)
    const timestampStr = headers['x-lender-timestamp'];
    if (timestampStr) {
      const webhookTime = Number(timestampStr);
      if (Math.abs(Date.now() - webhookTime) > 300000) {
        return false;
      }
    }

    return verifyHMAC(secret, rawBody, signature);
  }

  /**
   * 12. Normalize Inbound Webhook Payload into Canonical LSP Event
   * @param {Object} event
   * @returns {Object} Canonical event object
   */
  normalizeWebhook(event) {
    throw new Error('Method normalizeWebhook must be implemented by concrete adapter');
  }
}

