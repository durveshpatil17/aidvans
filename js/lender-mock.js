/**
 * Lender Simulator and Adapter Mock
 * Meets Section 4.2 (Lender Simulator) and Canonical Adapter Requirements
 */

import {
  validateTransition,
  CASE_TRANSITIONS,
  FUNDING_REQUEST_TRANSITIONS,
  DRAWDOWN_TRANSITIONS,
  DISBURSEMENT_TRANSITIONS,
  RECEIPT_TRANSITIONS
} from './states.js';

export class LenderMockAdapter {
  constructor(store) {
    this.store = store;
  }

  approveApplication(appId, customTerms = {}) {
    const state = this.store.getState();
    const app = state.applications.find(a => a.app_id === appId);
    if (!app) throw new Error('Application not found');

    const caseObj = state.cases.find(c => c.case_id === app.case_id);
    if (!caseObj) throw new Error('Case not found');

    const product = state.lender_products.find(p => p.product_id === app.product_id);
    const demand = state.demands.find(d => d.case_id === caseObj.case_id);
    const requestedAmount = demand ? demand.amount : 100000;
    const sanctionedAmount = customTerms.amount || requestedAmount;

    const sanctionId = `SAN-${appId.replace('APP-', '')}`;
    const sanction = {
      sanction_id: sanctionId,
      app_id: appId,
      case_id: caseObj.case_id,
      lender_id: app.lender_id,
      sanctioned_amount: sanctionedAmount,
      approved_tenor_months: customTerms.tenor || 12,
      interest_rate_apr: customTerms.apr || '12.5% p.a.',
      monthly_emi: Math.round(sanctionedAmount * 0.089), // sample amortized value
      kfs_reference: `${product.kfs_template}-V1`,
      conditions: 'Direct disbursement to verified hospital beneficiary account only.',
      as_of_timestamp: new Date().toISOString(),
      status: 'APPROVED'
    };

    const offerId = `OFF-${appId.replace('APP-', '')}`;
    const offer = {
      offer_id: offerId,
      app_id: appId,
      sanction_id: sanctionId,
      lender_id: app.lender_id,
      lender_name: app.lender_id === 'LENDER-A' ? 'CareFinance Capital NBFC' : 'HealthCredit India NBFC',
      amount: sanctionedAmount,
      tenor: sanction.approved_tenor_months,
      apr: sanction.interest_rate_apr,
      emi: sanction.monthly_emi,
      kfs_url: `#/borrower/kfs/${sanctionId}`,
      expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
    };

    let facility = null;
    if (product.multi_drawdown) {
      facility = {
        facility_id: `FAC-${appId.replace('APP-', '')}`,
        sanction_id: sanctionId,
        case_id: caseObj.case_id,
        credit_limit: sanctionedAmount,
        available_limit: sanctionedAmount,
        utilised_limit: 0,
        status: 'ACTIVE'
      };
    }

    // State machine updates
    validateTransition(CASE_TRANSITIONS, 'FinancingCase', caseObj.case_id, caseObj.case_status, 'SANCTIONED');

    this.store.update(s => ({
      ...s,
      applications: s.applications.map(a => a.app_id === appId ? { ...a, status: 'SANCTIONED' } : a),
      cases: s.cases.map(c => c.case_id === caseObj.case_id ? { ...c, case_status: 'SANCTIONED' } : c),
      sanctions: [...s.sanctions, sanction],
      facilities: facility ? [...s.facilities, facility] : s.facilities
    }));

    this.store.audit.log({
      actorId: app.lender_id,
      actorRole: 'LENDER_NBFC',
      action: 'LENDER_SANCTION_APPROVED',
      targetType: 'APPLICATION',
      targetId: appId,
      reason: `Lender approved sanction of ₹${sanctionedAmount}`,
      metadata: { sanctionId, sanctionedAmount }
    });

    return sanction;
  }

  rejectApplication(appId, reason = 'Underwriting score below lender threshold') {
    const state = this.store.getState();
    const app = state.applications.find(a => a.app_id === appId);
    if (!app) throw new Error('Application not found');
    const caseObj = state.cases.find(c => c.case_id === app.case_id);

    validateTransition(CASE_TRANSITIONS, 'FinancingCase', caseObj.case_id, caseObj.case_status, 'DECLINED');

    this.store.update(s => ({
      ...s,
      applications: s.applications.map(a => a.app_id === appId ? { ...a, status: 'DECLINED', decline_reason: reason } : a),
      cases: s.cases.map(c => c.case_id === caseObj.case_id ? { ...c, case_status: 'DECLINED', decline_reason: reason } : c)
    }));

    this.store.audit.log({
      actorId: app.lender_id,
      actorRole: 'LENDER_NBFC',
      action: 'LENDER_APPLICATION_DECLINED',
      targetType: 'APPLICATION',
      targetId: appId,
      reason: `Lender declined application: ${reason}`
    });
  }

  requestMoreInfo(appId, query) {
    const state = this.store.getState();
    const app = state.applications.find(a => a.app_id === appId);
    if (!app) throw new Error('Application not found');
    const caseObj = state.cases.find(c => c.case_id === app.case_id);

    validateTransition(CASE_TRANSITIONS, 'FinancingCase', caseObj.case_id, caseObj.case_status, 'ACTION_REQUIRED');

    this.store.update(s => ({
      ...s,
      applications: s.applications.map(a => a.app_id === appId ? { ...a, status: 'ACTION_REQUIRED', info_query: query } : a),
      cases: s.cases.map(c => c.case_id === caseObj.case_id ? { ...c, case_status: 'ACTION_REQUIRED' } : c)
    }));

    this.store.audit.log({
      actorId: app.lender_id,
      actorRole: 'LENDER_NBFC',
      action: 'LENDER_INFO_REQUESTED',
      targetType: 'APPLICATION',
      targetId: appId,
      reason: `Lender requested additional information: ${query}`
    });
  }

  simulateTimeout(appId) {
    const state = this.store.getState();
    const app = state.applications.find(a => a.app_id === appId);
    if (!app) throw new Error('Application not found');
    const caseObj = state.cases.find(c => c.case_id === app.case_id);

    this.store.update(s => ({
      ...s,
      applications: s.applications.map(a => a.app_id === appId ? { ...a, status: 'UNKNOWN' } : a),
      cases: s.cases.map(c => c.case_id === caseObj.case_id ? { ...c, case_status: 'UNKNOWN' } : c)
    }));

    this.store.audit.log({
      actorId: 'SYSTEM',
      actorRole: 'CENTRAL_PLATFORM',
      action: 'LENDER_TIMEOUT',
      targetType: 'APPLICATION',
      targetId: appId,
      reason: 'Lender webhook timed out; status set to UNKNOWN pending polling'
    });
  }

  acceptLoanAgreement(caseId, userId) {
    const state = this.store.getState();
    const caseObj = state.cases.find(c => c.case_id === caseId);
    if (!caseObj) throw new Error('Case not found');

    validateTransition(CASE_TRANSITIONS, 'FinancingCase', caseId, caseObj.case_status, 'AGREEMENT_PENDING');
    validateTransition(CASE_TRANSITIONS, 'FinancingCase', caseId, 'AGREEMENT_PENDING', 'AGREEMENT_EXECUTED');
    validateTransition(CASE_TRANSITIONS, 'FinancingCase', caseId, 'AGREEMENT_EXECUTED', 'DISBURSEMENT_PENDING');

    this.store.update(s => ({
      ...s,
      cases: s.cases.map(c => c.case_id === caseId ? { ...c, case_status: 'DISBURSEMENT_PENDING', agreement_accepted_at: new Date().toISOString() } : c)
    }));

    this.store.audit.log({
      actorId: userId,
      actorRole: 'BORROWER',
      action: 'LOAN_AGREEMENT_ACCEPTED',
      targetType: 'CASE',
      targetId: caseId,
      reason: 'Borrower accepted lender agreement and KFS at lender endpoint'
    });
  }

  approveDrawdown(drawdownId) {
    const state = this.store.getState();
    const dd = state.drawdowns.find(d => d.drawdown_id === drawdownId);
    if (!dd) throw new Error('Drawdown not found');

    validateTransition(DRAWDOWN_TRANSITIONS, 'Drawdown', drawdownId, dd.status, 'APPROVED');

    this.store.update(s => ({
      ...s,
      drawdowns: s.drawdowns.map(d => d.drawdown_id === drawdownId ? { ...d, status: 'APPROVED', approved_at: new Date().toISOString() } : d),
      funding_requests: s.funding_requests.map(f => f.funding_request_id === dd.funding_request_id ? { ...f, status: 'APPROVED' } : f)
    }));

    this.store.audit.log({
      actorId: 'LENDER_NBFC',
      actorRole: 'LENDER_NBFC',
      action: 'DRAWDOWN_APPROVED',
      targetType: 'DRAWDOWN',
      targetId: drawdownId,
      reason: `Lender approved drawdown ${drawdownId}`
    });
  }

  rejectDrawdown(drawdownId, reason) {
    const state = this.store.getState();
    const dd = state.drawdowns.find(d => d.drawdown_id === drawdownId);
    if (!dd) throw new Error('Drawdown not found');

    validateTransition(DRAWDOWN_TRANSITIONS, 'Drawdown', drawdownId, dd.status, 'DECLINED');

    this.store.update(s => ({
      ...s,
      drawdowns: s.drawdowns.map(d => d.drawdown_id === drawdownId ? { ...d, status: 'DECLINED', decline_reason: reason } : d),
      funding_requests: s.funding_requests.map(f => f.funding_request_id === dd.funding_request_id ? { ...f, status: 'REJECTED', reject_reason: reason } : f)
    }));

    this.store.audit.log({
      actorId: 'LENDER_NBFC',
      actorRole: 'LENDER_NBFC',
      action: 'DRAWDOWN_DECLINED',
      targetType: 'DRAWDOWN',
      targetId: drawdownId,
      reason: `Lender declined drawdown: ${reason}`
    });
  }

  confirmDisbursement({ caseId, demandId, amount, beneficiaryId }) {
    const state = this.store.getState();
    const caseObj = state.cases.find(c => c.case_id === caseId);
    if (!caseObj) throw new Error('Case not found');

    const benef = state.beneficiary_accounts.find(b => b.beneficiary_id === beneficiaryId) || state.beneficiary_accounts[0];
    const disbId = `DISB-${caseId.replace('CASE-', '')}-${Date.now().toString().slice(-4)}`;
    const utr = `UTR-${Date.now().toString().slice(-6)}`;

    const disbursement = {
      disbursement_id: disbId,
      case_id: caseId,
      demand_id: demandId,
      beneficiary_id: benef.beneficiary_id,
      beneficiary_masked: benef.account_number_masked,
      bank_name: benef.bank_name,
      amount: Number(amount),
      currency: 'INR',
      transaction_ref: utr,
      value_date: new Date().toISOString(),
      status: 'CONFIRMED_BY_LENDER'
    };

    const receiptId = `REC-${disbId.replace('DISB-', '')}`;
    const receipt = {
      receipt_id: receiptId,
      disbursement_id: disbId,
      case_id: caseId,
      expected_amount: Number(amount),
      received_amount: null,
      state: 'AWAITING_HOSPITAL',
      created_at: new Date().toISOString()
    };

    // Case transition: DISBURSEMENT_PENDING -> DISBURSED
    const nextCaseState = 'DISBURSED';
    try {
      validateTransition(CASE_TRANSITIONS, 'FinancingCase', caseId, caseObj.case_status, nextCaseState);
    } catch {
      // If already partially disbursed or disbursed, remain in valid state
    }

    this.store.update(s => ({
      ...s,
      disbursements: [...s.disbursements, disbursement],
      receipts: [...s.receipts, receipt],
      cases: s.cases.map(c => c.case_id === caseId ? { ...c, case_status: nextCaseState } : c),
      demands: s.demands.map(d => d.demand_id === demandId ? { ...d, state: 'FUNDED' } : d)
    }));

    this.store.audit.log({
      actorId: 'LENDER_NBFC',
      actorRole: 'LENDER_NBFC',
      action: 'LENDER_DISBURSEMENT_CONFIRMED',
      targetType: 'DISBURSEMENT',
      targetId: disbId,
      reason: `Lender confirmed direct fund transfer of ₹${amount} to hospital beneficiary`,
      metadata: { utr, beneficiary: benef.account_number_masked }
    });

    return disbursement;
  }

  failDisbursement(disbId, reason) {
    const state = this.store.getState();
    const disb = state.disbursements.find(d => d.disbursement_id === disbId);
    if (!disb) throw new Error('Disbursement not found');

    validateTransition(DISBURSEMENT_TRANSITIONS, 'Disbursement', disbId, disb.status, 'FAILED');

    this.store.update(s => ({
      ...s,
      disbursements: s.disbursements.map(d => d.disbursement_id === disbId ? { ...d, status: 'FAILED', failure_reason: reason } : d),
      notifications: [
        ...(s.notifications || []),
        { id: `NOTIF-${Date.now()}-1`, recipientRole: 'BORROWER', case_id: disb.case_id, message: `Disbursement transfer failed: ${reason}`, date: new Date().toISOString() },
        { id: `NOTIF-${Date.now()}-2`, recipientRole: 'HOSPITAL', case_id: disb.case_id, message: `Disbursement transfer failed: ${reason}`, date: new Date().toISOString() }
      ]
    }));

    this.store.audit.log({
      actorId: 'LENDER_NBFC',
      actorRole: 'LENDER_NBFC',
      action: 'DISBURSEMENT_FAILED',
      targetType: 'DISBURSEMENT',
      targetId: disbId,
      reason: `Disbursement failed at bank: ${reason}`
    });
  }

  reverseDisbursement(disbId, reason) {
    const state = this.store.getState();
    const disb = state.disbursements.find(d => d.disbursement_id === disbId);
    if (!disb) throw new Error('Disbursement not found');

    validateTransition(DISBURSEMENT_TRANSITIONS, 'Disbursement', disbId, disb.status, 'REVERSED');

    const reversalId = `REV-${disbId.replace('DISB-', '')}`;
    const reversalRecord = {
      reversal_id: reversalId,
      original_disbursement_id: disbId,
      case_id: disb.case_id,
      amount: disb.amount,
      reason: reason,
      reversed_at: new Date().toISOString()
    };

    this.store.update(s => ({
      ...s,
      disbursements: s.disbursements.map(d => d.disbursement_id === disbId ? { ...d, status: 'REVERSED', reversal_reason: reason, reversal_id: reversalId } : d),
      reversals: [...(s.reversals || []), reversalRecord],
      notifications: [
        ...(s.notifications || []),
        { id: `NOTIF-${Date.now()}-1`, recipientRole: 'BORROWER', case_id: disb.case_id, message: `Disbursement transfer returned/reversed: ${reason}`, date: new Date().toISOString() },
        { id: `NOTIF-${Date.now()}-2`, recipientRole: 'HOSPITAL', case_id: disb.case_id, message: `Disbursement transfer returned/reversed: ${reason}`, date: new Date().toISOString() }
      ]
    }));

    this.store.audit.log({
      actorId: 'LENDER_NBFC',
      actorRole: 'LENDER_NBFC',
      action: 'DISBURSEMENT_REVERSED',
      targetType: 'DISBURSEMENT',
      targetId: disbId,
      reason: `Disbursement reversed: ${reason}; linked reversal ${reversalId}`
    });
  }

  ingestWebhook({ eventId, eventType, payload }) {
    const state = this.store.getState();
    const processedEvents = state.processed_webhook_events || [];
    if (processedEvents.includes(eventId)) {
      this.store.audit.log({
        actorId: 'LENDER_NBFC',
        actorRole: 'LENDER_NBFC',
        action: 'DUPLICATE_WEBHOOK_DISCARDED',
        targetType: 'WEBHOOK',
        targetId: eventId,
        reason: 'Idempotency key match: duplicate webhook discarded; financial state unaffected (AT-28)'
      });
      return { status: 'DISCARDED_DUPLICATE', eventId };
    }

    this.store.update(s => ({
      ...s,
      processed_webhook_events: [...processedEvents, eventId]
    }));

    this.store.audit.log({
      actorId: 'LENDER_NBFC',
      actorRole: 'LENDER_NBFC',
      action: 'WEBHOOK_PROCESSED',
      targetType: 'WEBHOOK',
      targetId: eventId,
      reason: `Webhook processed for event ${eventType}`
    });

    return { status: 'PROCESSED', eventId };
  }
}
