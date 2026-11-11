/**
 * Formal State Machines and Transition Guards for Healthcare Financing LSP
 * TDS Section 7 Compliance
 */

export class StateTransitionError extends Error {
  constructor(entityType, entityId, fromState, toState, allowedStates) {
    super(
      `Invalid state transition for ${entityType} [${entityId}]: Cannot transition from '${fromState}' to '${toState}'. Allowed transitions: [${allowedStates.join(', ')}]`
    );
    this.name = 'StateTransitionError';
    this.entityType = entityType;
    this.entityId = entityId;
    this.fromState = fromState;
    this.toState = toState;
    this.allowedStates = allowedStates;
    this.statusCode = 409;
  }
}

export const CASE_TRANSITIONS = {
  DRAFT: ['READY_FOR_INVITATION', 'CANCELLED'],
  READY_FOR_INVITATION: ['INVITATION_SENT', 'ON_HOLD', 'CANCELLED'],
  INVITATION_SENT: ['BORROWER_LINKED', 'INVITATION_EXPIRED', 'CANCELLED'],
  BORROWER_LINKED: ['APPLICATION_IN_PROGRESS', 'ON_HOLD', 'WITHDRAWN'],
  APPLICATION_IN_PROGRESS: ['SUBMITTED', 'ABANDONED', 'WITHDRAWN'],
  SUBMITTED: ['LENDER_PENDING', 'ACTION_REQUIRED', 'SANCTIONED', 'DECLINED', 'UNKNOWN'],
  LENDER_PENDING: ['ACTION_REQUIRED', 'SANCTIONED', 'DECLINED', 'UNKNOWN'],
  ACTION_REQUIRED: ['LENDER_PENDING', 'DECLINED', 'WITHDRAWN'],
  SANCTIONED: ['AGREEMENT_PENDING', 'DISBURSEMENT_PENDING', 'WITHDRAWN', 'EXPIRED'],
  AGREEMENT_PENDING: ['AGREEMENT_EXECUTED', 'EXPIRED', 'WITHDRAWN'],
  AGREEMENT_EXECUTED: ['DISBURSEMENT_PENDING', 'ACTIVE', 'CANCELLED'],
  ACTIVE: ['DISBURSEMENT_PENDING', 'SERVICE_COMPLETE', 'CLOSED'],
  DISBURSEMENT_PENDING: ['PARTIALLY_DISBURSED', 'DISBURSED', 'FAILED', 'UNKNOWN'],
  PARTIALLY_DISBURSED: ['DISBURSEMENT_PENDING', 'DISBURSED', 'EXCEPTION'],
  DISBURSED: ['ADDITIONAL_DEMAND', 'SERVICE_COMPLETE', 'EXCEPTION'],
  ADDITIONAL_DEMAND: ['DISBURSEMENT_PENDING', 'SERVICE_COMPLETE'],
  SERVICE_COMPLETE: ['CLOSED'],
  DECLINED: ['CLOSED'],
  WITHDRAWN: ['CLOSED'],
  CANCELLED: ['CLOSED'],
  CLOSED: []
};

export const DEMAND_TRANSITIONS = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['VERIFICATION_PENDING', 'VERIFIED', 'REJECTED', 'CANCELLED'],
  VERIFICATION_PENDING: ['VERIFIED', 'REJECTED', 'CANCELLED'],
  VERIFIED: ['FUNDING_REQUESTED', 'DISPUTED', 'CANCELLED'],
  FUNDING_REQUESTED: ['PARTIALLY_FUNDED', 'FUNDED', 'DISPUTED', 'CANCELLED'],
  PARTIALLY_FUNDED: ['FUNDED', 'DISPUTED'],
  FUNDED: ['DISPUTED'],
  REJECTED: [],
  CANCELLED: [],
  DISPUTED: ['VERIFIED', 'CANCELLED']
};

export const FUNDING_REQUEST_TRANSITIONS = {
  DRAFT: ['PENDING_BORROWER_AUTH', 'CANCELLED'],
  PENDING_BORROWER_AUTH: ['AUTHORISED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
  AUTHORISED: ['SENT_TO_LENDER', 'CANCELLED'],
  SENT_TO_LENDER: ['LENDER_PENDING', 'APPROVED', 'REJECTED', 'UNKNOWN'],
  LENDER_PENDING: ['APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'UNKNOWN'],
  APPROVED: [],
  REJECTED: [],
  EXPIRED: [],
  CANCELLED: [],
  UNKNOWN: ['APPROVED', 'REJECTED']
};

export const DRAWDOWN_TRANSITIONS = {
  NOT_SUPPORTED: [],
  REQUESTED: ['APPROVED', 'DECLINED', 'EXPIRED'],
  APPROVED: ['REVERSED'],
  DECLINED: [],
  EXPIRED: [],
  REVERSED: []
};

export const DISBURSEMENT_TRANSITIONS = {
  INITIATED: ['PROCESSING', 'FAILED', 'UNKNOWN'],
  PROCESSING: ['CONFIRMED_BY_LENDER', 'FAILED', 'UNKNOWN'],
  CONFIRMED_BY_LENDER: ['RETURNED', 'REVERSED'],
  FAILED: [],
  RETURNED: [],
  REVERSED: [],
  UNKNOWN: ['CONFIRMED_BY_LENDER', 'FAILED']
};

export const RECEIPT_TRANSITIONS = {
  NOT_REQUESTED: ['AWAITING_HOSPITAL'],
  AWAITING_HOSPITAL: ['CONFIRMED', 'MISMATCH', 'DISPUTED'],
  CONFIRMED: ['DISPUTED'],
  MISMATCH: ['CONFIRMED', 'DISPUTED'],
  DISPUTED: ['CONFIRMED']
};

/**
 * Validates and executes a transition against a formal transition table.
 */
export function validateTransition(table, entityType, entityId, fromState, toState) {
  if (fromState === toState) {
    return true; // No-op idempotent transition
  }
  const allowed = table[fromState] || [];
  if (!allowed.includes(toState)) {
    throw new StateTransitionError(entityType, entityId, fromState, toState, allowed);
  }
  return true;
}
