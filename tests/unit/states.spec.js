import { test, expect } from '@playwright/test';
import {
  validateTransition,
  StateTransitionError,
  CASE_TRANSITIONS,
  DEMAND_TRANSITIONS,
  FUNDING_REQUEST_TRANSITIONS,
  DRAWDOWN_TRANSITIONS,
  DISBURSEMENT_TRANSITIONS,
  RECEIPT_TRANSITIONS,
  BENEFICIARY_ACCOUNT_TRANSITIONS
} from '../../shared/states.js';

test.describe('Tier 1 Unit: State Machines & Transition Validation', () => {
  test('Valid case lifecycle transitions succeed', () => {
    expect(() => validateTransition(CASE_TRANSITIONS, 'Case', 'CASE-01', 'INITIATED', 'READY_FOR_INVITATION')).not.toThrow();
    expect(() => validateTransition(CASE_TRANSITIONS, 'Case', 'CASE-01', 'READY_FOR_INVITATION', 'INVITATION_SENT')).not.toThrow();
    expect(() => validateTransition(CASE_TRANSITIONS, 'Case', 'CASE-01', 'INVITATION_SENT', 'BORROWER_LINKED')).not.toThrow();
    expect(() => validateTransition(CASE_TRANSITIONS, 'Case', 'CASE-01', 'BORROWER_LINKED', 'CONSENT_GRANTED')).not.toThrow();
    expect(() => validateTransition(CASE_TRANSITIONS, 'Case', 'CASE-01', 'CONSENT_GRANTED', 'APPLICATION_SUBMITTED')).not.toThrow();
    expect(() => validateTransition(CASE_TRANSITIONS, 'Case', 'CASE-01', 'APPLICATION_SUBMITTED', 'UNDERWRITING_ACKNOWLEDGED')).not.toThrow();
    expect(() => validateTransition(CASE_TRANSITIONS, 'Case', 'CASE-01', 'UNDERWRITING_ACKNOWLEDGED', 'SANCTIONED')).not.toThrow();
    expect(() => validateTransition(CASE_TRANSITIONS, 'Case', 'CASE-01', 'SANCTIONED', 'AGREEMENT_PENDING')).not.toThrow();
    expect(() => validateTransition(CASE_TRANSITIONS, 'Case', 'CASE-01', 'AGREEMENT_PENDING', 'AGREEMENT_EXECUTED')).not.toThrow();
    expect(() => validateTransition(CASE_TRANSITIONS, 'Case', 'CASE-01', 'AGREEMENT_EXECUTED', 'DISBURSEMENT_PENDING')).not.toThrow();
    expect(() => validateTransition(CASE_TRANSITIONS, 'Case', 'CASE-01', 'DISBURSEMENT_PENDING', 'DISBURSED')).not.toThrow();
    expect(() => validateTransition(CASE_TRANSITIONS, 'Case', 'CASE-01', 'DISBURSED', 'FACILITATION_CLOSED')).not.toThrow();
  });

  test('Illegal case transitions throw StateTransitionError with HTTP 409', () => {
    expect(() => validateTransition(CASE_TRANSITIONS, 'Case', 'CASE-01', 'INITIATED', 'DISBURSEMENT_PENDING'))
      .toThrow(StateTransitionError);

    try {
      validateTransition(CASE_TRANSITIONS, 'Case', 'CASE-01', 'INITIATED', 'DISBURSEMENT_PENDING');
    } catch (err) {
      expect(err.statusCode).toBe(409);
      expect(err.code || 'ILLEGAL_STATE_TRANSITION').toBeDefined();
      expect(err.message).toContain("Cannot transition from 'INITIATED' to 'DISBURSEMENT_PENDING'");
    }
  });

  test('Demand lifecycle transitions enforce correct ordering', () => {
    expect(() => validateTransition(DEMAND_TRANSITIONS, 'Demand', 'DEM-01', 'SUBMITTED', 'LOCKED_FOR_FUNDING')).not.toThrow();
    expect(() => validateTransition(DEMAND_TRANSITIONS, 'Demand', 'DEM-01', 'SUBMITTED', 'CANCELLED')).not.toThrow();
    expect(() => validateTransition(DEMAND_TRANSITIONS, 'Demand', 'DEM-01', 'LOCKED_FOR_FUNDING', 'FUNDED')).not.toThrow();
    expect(() => validateTransition(DEMAND_TRANSITIONS, 'Demand', 'DEM-01', 'FUNDED', 'SUBMITTED')).toThrow(StateTransitionError);
  });

  test('Funding request enforces borrower authorization', () => {
    expect(() => validateTransition(FUNDING_REQUEST_TRANSITIONS, 'FundingRequest', 'FREQ-01', 'PENDING_BORROWER_AUTH', 'AUTHORISED')).not.toThrow();
    expect(() => validateTransition(FUNDING_REQUEST_TRANSITIONS, 'FundingRequest', 'FREQ-01', 'PENDING_BORROWER_AUTH', 'SENT_TO_LENDER')).toThrow(StateTransitionError);
    expect(() => validateTransition(FUNDING_REQUEST_TRANSITIONS, 'FundingRequest', 'FREQ-01', 'AUTHORISED', 'SENT_TO_LENDER')).not.toThrow();
  });

  test('Disbursement transitions track lender transfer and hospital receipt confirmation', () => {
    expect(() => validateTransition(DISBURSEMENT_TRANSITIONS, 'Disbursement', 'DISB-01', 'INITIATED', 'CONFIRMED_BY_LENDER')).not.toThrow();
    expect(() => validateTransition(DISBURSEMENT_TRANSITIONS, 'Disbursement', 'DISB-01', 'CONFIRMED_BY_LENDER', 'RECEIPT_CONFIRMED')).not.toThrow();
    expect(() => validateTransition(DISBURSEMENT_TRANSITIONS, 'Disbursement', 'DISB-01', 'CONFIRMED_BY_LENDER', 'REVERSED')).not.toThrow();
    expect(() => validateTransition(DISBURSEMENT_TRANSITIONS, 'Disbursement', 'DISB-01', 'RECEIPT_CONFIRMED', 'INITIATED')).toThrow(StateTransitionError);
  });

  test('Beneficiary account transitions enforce maker-checker dual approval', () => {
    expect(() => validateTransition(BENEFICIARY_ACCOUNT_TRANSITIONS, 'BeneficiaryAccount', 'BENEF-01', 'PENDING_VERIFICATION', 'VERIFIED')).not.toThrow();
    expect(() => validateTransition(BENEFICIARY_ACCOUNT_TRANSITIONS, 'BeneficiaryAccount', 'BENEF-01', 'VERIFIED', 'PENDING_MAKER_CHECKER_APPROVAL')).not.toThrow();
    expect(() => validateTransition(BENEFICIARY_ACCOUNT_TRANSITIONS, 'BeneficiaryAccount', 'BENEF-01', 'PENDING_MAKER_CHECKER_APPROVAL', 'VERIFIED')).not.toThrow();
    expect(() => validateTransition(BENEFICIARY_ACCOUNT_TRANSITIONS, 'BeneficiaryAccount', 'BENEF-01', 'PENDING_MAKER_CHECKER_APPROVAL', 'REJECTED')).not.toThrow();
    expect(() => validateTransition(BENEFICIARY_ACCOUNT_TRANSITIONS, 'BeneficiaryAccount', 'BENEF-01', 'PENDING_VERIFICATION', 'PENDING_MAKER_CHECKER_APPROVAL')).toThrow(StateTransitionError);
  });
});
