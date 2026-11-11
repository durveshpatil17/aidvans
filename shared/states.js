/**
 * Shared State Machine Definitions and Transition Validator
 * Complies with SSOT v0.1 & TDS Section 6.2
 */

export class StateTransitionError extends Error {
  constructor(entityType, entityId, fromState, toState, allowedStates = []) {
    super(`Illegal state transition for ${entityType} '${entityId}': Cannot transition from '${fromState}' to '${toState}'. Allowed transitions: [${allowedStates.join(', ')}]`);
    this.name = 'StateTransitionError';
    this.statusCode = 409;
    this.entityType = entityType;
    this.entityId = entityId;
    this.fromState = fromState;
    this.toState = toState;
    this.allowedStates = allowedStates;
  }
}

export const CASE_TRANSITIONS = {
  'INITIATED': ['READY_FOR_INVITATION', 'CANCELLED'],
  'READY_FOR_INVITATION': ['INVITATION_SENT', 'CANCELLED'],
  'INVITATION_SENT': ['BORROWER_LINKED', 'INVITATION_SENT', 'EXPIRED', 'CANCELLED'],
  'BORROWER_LINKED': ['CONSENT_GRANTED', 'CANCELLED'],
  'CONSENT_GRANTED': ['APPLICATION_SUBMITTED', 'CONSENT_WITHDRAWN', 'CANCELLED'],
  'APPLICATION_SUBMITTED': ['UNDERWRITING_ACKNOWLEDGED', 'ACTION_REQUIRED', 'REJECTED', 'CANCELLED'],
  'ACTION_REQUIRED': ['APPLICATION_SUBMITTED', 'REJECTED', 'CANCELLED'],
  'UNDERWRITING_ACKNOWLEDGED': ['SANCTIONED', 'ACTION_REQUIRED', 'REJECTED', 'CANCELLED'],
  'SANCTIONED': ['AGREEMENT_PENDING', 'CANCELLED'],
  'AGREEMENT_PENDING': ['AGREEMENT_EXECUTED', 'CANCELLED'],
  'AGREEMENT_EXECUTED': ['DISBURSEMENT_PENDING', 'CANCELLED'],
  'DISBURSEMENT_PENDING': ['PARTIALLY_DISBURSED', 'DISBURSED', 'DISBURSEMENT_FAILED'],
  'DISBURSEMENT_FAILED': ['DISBURSEMENT_PENDING', 'CANCELLED'],
  'PARTIALLY_DISBURSED': ['DISBURSEMENT_PENDING', 'FACILITATION_CLOSED'],
  'DISBURSED': ['FACILITATION_CLOSED'],
  'FACILITATION_CLOSED': [],
  'CONSENT_WITHDRAWN': [],
  'REJECTED': [],
  'EXPIRED': ['INVITATION_SENT', 'CANCELLED'],
  'CANCELLED': []
};

export const DEMAND_TRANSITIONS = {
  'SUBMITTED': ['LOCKED_FOR_FUNDING', 'DISPUTED', 'SUPERSEDED', 'CANCELLED'],
  'LOCKED_FOR_FUNDING': ['FUNDED', 'SUBMITTED', 'CANCELLED'],
  'FUNDED': [],
  'DISPUTED': ['SUBMITTED', 'SUPERSEDED', 'CANCELLED'],
  'SUPERSEDED': [],
  'CANCELLED': []
};

export const FUNDING_REQUEST_TRANSITIONS = {
  'DRAFT': ['PENDING_BORROWER_AUTH', 'CANCELLED'],
  'PENDING_BORROWER_AUTH': ['AUTHORISED', 'CANCELLED'],
  'AUTHORISED': ['SENT_TO_LENDER', 'CANCELLED'],
  'SENT_TO_LENDER': ['APPROVED', 'REJECTED', 'PENDING_RECONCILIATION'],
  'PENDING_RECONCILIATION': ['APPROVED', 'REJECTED', 'CANCELLED'],
  'APPROVED': ['DISBURSED'],
  'DISBURSED': [],
  'REJECTED': [],
  'CANCELLED': []
};

export const DRAWDOWN_TRANSITIONS = {
  'REQUESTED': ['APPROVED', 'DECLINED', 'CANCELLED'],
  'APPROVED': ['DISBURSED'],
  'DECLINED': [],
  'DISBURSED': [],
  'CANCELLED': []
};

export const DISBURSEMENT_TRANSITIONS = {
  'INITIATED': ['CONFIRMED_BY_LENDER', 'FAILED'],
  'CONFIRMED_BY_LENDER': ['RECEIPT_CONFIRMED', 'REVERSED', 'FAILED'],
  'RECEIPT_CONFIRMED': ['REVERSED'],
  'REVERSED': [],
  'FAILED': []
};

export const RECEIPT_TRANSITIONS = {
  'PENDING': ['CONFIRMED', 'DISCREPANCY_FLAGGED'],
  'DISCREPANCY_FLAGGED': ['CONFIRMED', 'REVERSED_UNMATCHED', 'RESOLVED_MANUALLY'],
  'CONFIRMED': [],
  'REVERSED_UNMATCHED': [],
  'RESOLVED_MANUALLY': []
};

export const BENEFICIARY_ACCOUNT_TRANSITIONS = {
  'PENDING_VERIFICATION': ['VERIFIED', 'REJECTED'],
  'VERIFIED': ['PENDING_MAKER_CHECKER_APPROVAL', 'DEACTIVATED'],
  'PENDING_MAKER_CHECKER_APPROVAL': ['VERIFIED', 'REJECTED'],
  'REJECTED': [],
  'DEACTIVATED': []
};

export function validateTransition(table, entityType, entityId, fromState, toState) {
  if (fromState === toState) return true;
  const allowed = table[fromState];
  if (!allowed) {
    throw new StateTransitionError(entityType, entityId, fromState, toState, []);
  }
  if (!allowed.includes(toState)) {
    throw new StateTransitionError(entityType, entityId, fromState, toState, allowed);
  }
  return true;
}
