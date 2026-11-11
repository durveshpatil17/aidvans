/**
 * Central State Container and Domain Store
 * Meets Section 4.3 (Mock Data Layer) & State Machine Constraints
 */

import {
  validateTransition,
  CASE_TRANSITIONS,
  DEMAND_TRANSITIONS,
  FUNDING_REQUEST_TRANSITIONS,
  DRAWDOWN_TRANSITIONS,
  DISBURSEMENT_TRANSITIONS,
  RECEIPT_TRANSITIONS
} from './states.js';
import { AuditLogger } from './audit.js';

const STORAGE_KEY = 'HF_LSP_PROTOTYPE_v1.0';

export class Store {
  constructor(initialSeed) {
    this.initialSeed = JSON.parse(JSON.stringify(initialSeed));
    this.listeners = new Set();
    this.rateLimitMap = new Map(); // frid -> { attempts: count, lockUntil: timestamp }
    this.audit = new AuditLogger(this);
    this.state = this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.version === this.initialSeed.version) {
          return parsed;
        }
      }
    } catch {
      // Fall through to initialSeed
    }
    const fresh = JSON.parse(JSON.stringify(this.initialSeed));
    if (!fresh.currentUserId) fresh.currentUserId = 'USR-PRIYA';
    this.saveState(fresh);
    return fresh;
  }

  saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    this.state = newState;
    this.saveState(this.state);
    this.notify();
  }

  update(updater) {
    const next = updater(this.state);
    this.setState(next);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (e) {
        console.error('Store listener error:', e);
      }
    }
  }

  reset() {
    const fresh = JSON.parse(JSON.stringify(this.initialSeed));
    fresh.currentUserId = 'USR-PRIYA';
    this.rateLimitMap.clear();
    this.setState(fresh);
    return fresh;
  }

  // --- Identity / Auth ---
  getCurrentUser() {
    const uid = this.state.currentUserId;
    if (!uid) {
      return {
        user_id: 'GUEST',
        name: 'Guest Visitor',
        role: 'PUBLIC',
        context: 'Unauthenticated Public Visitor',
        status: 'ACTIVE'
      };
    }
    return (
      this.state.users.find(u => u.user_id === uid) ||
      this.state.users[0]
    );
  }

  signOut() {
    this.update(s => ({
      ...s,
      currentUserId: null
    }));
    this.audit.log({
      actorId: 'ANONYMOUS',
      actorRole: 'PUBLIC',
      action: 'USER_LOGOUT',
      targetType: 'SESSION',
      targetId: 'SESSION',
      reason: 'User signed out from enterprise portal'
    });
  }

  setCurrentUser(userId) {
    const user = this.state.users.find(u => u.user_id === userId);
    if (!user) throw new Error(`User not found: ${userId}`);
    this.update(s => ({
      ...s,
      currentUserId: userId
    }));
    this.audit.log({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'USER_LOGIN_SWITCH',
      targetType: 'USER',
      targetId: user.user_id,
      reason: `Switched active prototype user to ${user.name}`
    });
  }

  // --- Rate Limiting for FRID Linking (AT-04) ---
  checkFridRateLimit(frid) {
    const now = Date.now();
    const entry = this.rateLimitMap.get(frid) || { attempts: 0, lockUntil: 0 };
    if (entry.lockUntil > now) {
      const remainingSec = Math.ceil((entry.lockUntil - now) / 1000);
      return { locked: true, remainingSec };
    }
    return { locked: false, attempts: entry.attempts };
  }

  recordFridAttempt(frid, success) {
    const now = Date.now();
    const entry = this.rateLimitMap.get(frid) || { attempts: 0, lockUntil: 0 };
    if (success) {
      this.rateLimitMap.delete(frid);
      return;
    }
    entry.attempts += 1;
    if (entry.attempts >= 5) {
      entry.lockUntil = now + 15 * 60 * 1000; // 15 minutes lock
      this.audit.log({
        actorId: 'ANONYMOUS',
        actorRole: 'BORROWER',
        action: 'FRID_RATE_LIMIT_LOCKED',
        targetType: 'FRID',
        targetId: frid,
        reason: '5 consecutive failed linking attempts triggered 15-minute lock'
      });
    }
    this.rateLimitMap.set(frid, entry);
  }

  // --- FRID Generation (HF-XXXX-XXXX) ---
  generateFRID() {
    const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    const pick = len => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `HF-${pick(4)}-${pick(4)}`;
  }

  generateToken() {
    return 'TOK-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
  }

  // --- Domain Mutations ---

  createCase({ hospitalId, branchId, patientName, patientContact, patientAdmissionRef, borrowerSameAsPatient, borrowerName, borrowerContact, borrowerRelationship, demandType, demandAmount, demandEvidenceRef }) {
    const currentUser = this.getCurrentUser();
    // Validate scope
    if (currentUser.role === 'EXECUTIVE' && currentUser.assigned_hospital_ids && !currentUser.assigned_hospital_ids.includes(hospitalId)) {
      throw new Error('Executive is not assigned to this hospital organisation.');
    }

    // Duplicate check (Patient admission ref or contact at branch)
    const existing = this.state.cases.find(c => {
      const pat = this.state.patients.find(p => p.patient_id === c.patient_id);
      return c.hospital_id === hospitalId && pat && (pat.hospital_admission_ref === patientAdmissionRef || (pat.contact === patientContact && c.case_status !== 'CLOSED'));
    });
    if (existing) {
      throw new Error(`Duplicate case candidate detected: active case ${existing.case_id} (${existing.frid}) already exists for this patient reference.`);
    }

    const caseId = `CASE-${Date.now().toString().slice(-4)}`;
    const frid = this.generateFRID();
    const rawToken = this.generateToken();

    const patientId = `PAT-${Date.now().toString().slice(-4)}`;
    const patientObj = {
      patient_id: patientId,
      name: patientName,
      contact: patientContact,
      hospital_admission_ref: patientAdmissionRef
    };

    let borrowerId;
    if (borrowerSameAsPatient) {
      borrowerId = `BOR-${patientId}`;
    } else {
      borrowerId = `BOR-${Date.now().toString().slice(-4)}`;
    }

    const borrowerUser = {
      user_id: borrowerId,
      name: borrowerSameAsPatient ? patientName : borrowerName,
      contact: borrowerSameAsPatient ? patientContact : borrowerContact,
      phone: borrowerSameAsPatient ? patientContact : borrowerContact,
      email: `${(borrowerSameAsPatient ? patientName : borrowerName).toLowerCase().replace(/\s+/g, '.')}@borrower.mock`,
      role: 'BORROWER',
      status: 'ACTIVE'
    };

    // Find beneficiary account for branch
    const benef = this.state.beneficiary_accounts.find(b => b.branch_id === branchId) || this.state.beneficiary_accounts[0];

    const demandId = `DEM-${caseId.replace('CASE-', '')}-1`;
    const demandObj = {
      demand_id: demandId,
      case_id: caseId,
      beneficiary_id: benef ? benef.beneficiary_id : null,
      amount: Number(demandAmount),
      currency: 'INR',
      type: demandType,
      evidence_ref: demandEvidenceRef,
      state: 'SUBMITTED',
      created_at: new Date().toISOString()
    };

    const caseObj = {
      case_id: caseId,
      frid,
      hospital_id: hospitalId,
      branch_id: branchId,
      patient_id: patientId,
      primary_borrower_id: borrowerId,
      patient_is_borrower: borrowerSameAsPatient,
      borrower_relationship: borrowerSameAsPatient ? 'SELF' : borrowerRelationship,
      assigned_executive_id: currentUser.user_id,
      case_status: 'READY_FOR_INVITATION',
      source: 'DESK',
      created_at: new Date().toISOString(),
      closed_at: null,
      closure_reason: null,
      invitation: {
        invite_id: `INV-${caseId.replace('CASE-', '')}`,
        token_hash: 'HASH-' + rawToken,
        raw_token: rawToken,
        intended_phone_masked: borrowerUser.phone ? '•••• •••• ' + borrowerUser.phone.slice(-2) : '•••• •••• 00',
        expiry: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        consumed: false,
        revoked: false
      }
    };

    this.update(s => ({
      ...s,
      patients: [...s.patients, patientObj],
      users: s.users.some(u => u.user_id === borrowerUser.user_id) ? s.users : [...s.users, borrowerUser],
      cases: [caseObj, ...s.cases],
      demands: [demandObj, ...s.demands]
    }));

    this.audit.log({
      actorId: currentUser.user_id,
      actorRole: currentUser.role,
      action: 'CASE_CREATED',
      targetType: 'CASE',
      targetId: caseId,
      reason: `Case created with initial demand of ₹${demandAmount}`,
      metadata: { frid, hospitalId, branchId }
    });

    return caseObj;
  }

  sendInvitation(caseId) {
    const caseObj = this.state.cases.find(c => c.case_id === caseId);
    if (!caseObj) throw new Error('Case not found');
    validateTransition(CASE_TRANSITIONS, 'FinancingCase', caseId, caseObj.case_status, 'INVITATION_SENT');

    this.update(s => ({
      ...s,
      cases: s.cases.map(c => c.case_id === caseId ? { ...c, case_status: 'INVITATION_SENT' } : c)
    }));

    this.audit.log({
      actorId: this.getCurrentUser().user_id,
      actorRole: this.getCurrentUser().role,
      action: 'INVITATION_SENT',
      targetType: 'CASE',
      targetId: caseId,
      reason: 'Invitation link and QR shared with borrower'
    });
  }

  resendInvitation(caseId) {
    const caseObj = this.state.cases.find(c => c.case_id === caseId);
    if (!caseObj) throw new Error('Case not found');
    const newRawToken = this.generateToken();

    this.update(s => ({
      ...s,
      cases: s.cases.map(c => {
        if (c.case_id === caseId) {
          return {
            ...c,
            invitation: {
              ...c.invitation,
              token_hash: 'HASH-' + newRawToken,
              raw_token: newRawToken,
              expiry: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
              consumed: false,
              revoked: false
            }
          };
        }
        return c;
      })
    }));

    this.audit.log({
      actorId: this.getCurrentUser().user_id,
      actorRole: this.getCurrentUser().role,
      action: 'INVITATION_RESENT',
      targetType: 'CASE',
      targetId: caseId,
      reason: 'Previous invitation token revoked; new token generated'
    });
  }

  linkCase(frid, token, userId) {
    const rateCheck = this.checkFridRateLimit(frid);
    if (rateCheck.locked) {
      throw new Error(`Too many failed attempts. Linking for this reference is locked for ${rateCheck.remainingSec} more seconds.`);
    }

    const caseObj = this.state.cases.find(c => c.frid === frid.trim().toUpperCase());
    if (!caseObj) {
      this.recordFridAttempt(frid, false);
      this.audit.log({
        actorId: userId || 'ANONYMOUS',
        actorRole: 'BORROWER',
        action: 'FRID_LINK_FAILED',
        targetType: 'FRID',
        targetId: frid,
        reason: 'Invalid FRID attempted'
      });
      throw new Error('Invalid Financing Reference ID (FRID) or invitation token.');
    }

    const inv = caseObj.invitation;
    if (!inv || inv.consumed || inv.revoked || inv.raw_token !== token.trim()) {
      this.recordFridAttempt(frid, false);
      this.audit.log({
        actorId: userId || 'ANONYMOUS',
        actorRole: 'BORROWER',
        action: 'FRID_LINK_FAILED',
        targetType: 'FRID',
        targetId: frid,
        reason: 'Expired, revoked, consumed, or mismatched invitation token'
      });
      throw new Error('Invalid Financing Reference ID (FRID) or invitation token.');
    }

    // Success: consume token
    this.recordFridAttempt(frid, true);
    if (caseObj.case_status === 'READY_FOR_INVITATION') {
      validateTransition(CASE_TRANSITIONS, 'FinancingCase', caseObj.case_id, 'READY_FOR_INVITATION', 'INVITATION_SENT');
      caseObj.case_status = 'INVITATION_SENT';
    }
    validateTransition(CASE_TRANSITIONS, 'FinancingCase', caseObj.case_id, caseObj.case_status, 'BORROWER_LINKED');

    this.update(s => ({
      ...s,
      cases: s.cases.map(c => {
        if (c.case_id === caseObj.case_id) {
          return {
            ...c,
            case_status: 'BORROWER_LINKED',
            primary_borrower_id: userId,
            invitation: {
              ...c.invitation,
              consumed: true,
              raw_token: null // Clear raw token
            }
          };
        }
        return c;
      })
    }));

    this.audit.log({
      actorId: userId,
      actorRole: 'BORROWER',
      action: 'BORROWER_LINKED',
      targetType: 'CASE',
      targetId: caseObj.case_id,
      reason: 'Borrower linked successfully via secure token'
    });

    return caseObj;
  }

  recordConsent(caseId, userId, consentItems) {
    const consents = consentItems.map(c => ({
      consent_id: `CNS-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      case_id: caseId,
      user_id: userId,
      purpose: c.purpose,
      category: c.category,
      recipient: c.recipient,
      granted: c.granted,
      timestamp: new Date().toISOString(),
      withdrawn: false
    }));

    this.update(s => ({
      ...s,
      consents: [...s.consents, ...consents]
    }));

    this.audit.log({
      actorId: userId,
      actorRole: 'BORROWER',
      action: 'CONSENT_RECORDED',
      targetType: 'CONSENT',
      targetId: caseId,
      reason: `Recorded ${consents.length} purpose-specific consent decisions`,
      metadata: { items: consentItems }
    });

    return consents;
  }

  withdrawConsent(consentId, userId) {
    this.update(s => ({
      ...s,
      consents: s.consents.map(c => (c.consent_id === consentId ? { ...c, withdrawn: true, withdrawn_at: new Date().toISOString() } : c))
    }));

    this.audit.log({
      actorId: userId,
      actorRole: 'BORROWER',
      action: 'CONSENT_WITHDRAWN',
      targetType: 'CONSENT',
      targetId: consentId,
      reason: 'Borrower exercised privacy right to withdraw optional consent'
    });
  }

  submitApplication({ caseId, borrowerId, lenderId, productId, monthlyIncome, employmentType, declaredObligations }) {
    const caseObj = this.state.cases.find(c => c.case_id === caseId);
    if (!caseObj) throw new Error('Case not found');

    // Verify consent exists and is not declined
    const caseConsents = this.state.consents.filter(c => c.case_id === caseId && c.user_id === borrowerId);
    const declined = caseConsents.some(c => !c.granted || c.withdrawn);
    if (declined || caseConsents.length === 0) {
      throw new Error('Mandatory consent not granted or withdrawn. Application cannot be submitted to lender.');
    }

    validateTransition(CASE_TRANSITIONS, 'FinancingCase', caseId, caseObj.case_status, 'APPLICATION_IN_PROGRESS');
    validateTransition(CASE_TRANSITIONS, 'FinancingCase', caseId, 'APPLICATION_IN_PROGRESS', 'SUBMITTED');

    const appId = `APP-${caseId.replace('CASE-', '')}-${Date.now().toString().slice(-4)}`;
    const appObj = {
      app_id: appId,
      case_id: caseId,
      borrower_id: borrowerId,
      lender_id: lenderId,
      product_id: productId,
      monthly_income: monthlyIncome,
      employment_type: employmentType,
      declared_obligations: declaredObligations,
      status: 'SUBMITTED',
      created_at: new Date().toISOString()
    };

    this.update(s => ({
      ...s,
      applications: [appObj, ...s.applications],
      cases: s.cases.map(c => (c.case_id === caseId ? { ...c, case_status: 'SUBMITTED' } : c))
    }));

    this.audit.log({
      actorId: borrowerId,
      actorRole: 'BORROWER',
      action: 'APPLICATION_SUBMITTED',
      targetType: 'APPLICATION',
      targetId: appId,
      reason: `Application submitted to lender ${lenderId}`
    });

    return appObj;
  }

  createFundingRequest(demandId) {
    const demand = this.state.demands.find(d => d.demand_id === demandId);
    if (!demand) throw new Error('Demand not found');
    const caseObj = this.state.cases.find(c => c.case_id === demand.case_id);
    const app = this.state.applications.find(a => a.case_id === demand.case_id);
    const product = app ? this.state.lender_products.find(p => p.product_id === app.product_id) : null;

    if (product && product.drawdown_mode === 'SINGLE_DISBURSEMENT') {
      throw new Error('This lender product does not support staged drawdowns.');
    }

    const freqId = `FREQ-${demandId.replace('DEM-', '')}-${Date.now().toString().slice(-4)}`;
    const freq = {
      funding_request_id: freqId,
      case_id: demand.case_id,
      demand_id: demand.demand_id,
      lender_id: app?.lender_id || 'LENDER-B',
      amount: demand.amount,
      currency: demand.currency || 'INR',
      beneficiary_id: demand.beneficiary_id,
      status: 'PENDING_BORROWER_AUTH',
      created_at: new Date().toISOString()
    };

    validateTransition(DEMAND_TRANSITIONS, 'HospitalDemand', demand.demand_id, demand.state, 'FUNDING_REQUESTED');

    this.update(s => ({
      ...s,
      funding_requests: [freq, ...s.funding_requests],
      demands: s.demands.map(d => d.demand_id === demandId ? { ...d, state: 'FUNDING_REQUESTED' } : d)
    }));

    this.audit.log({
      actorId: this.getCurrentUser().user_id,
      actorRole: this.getCurrentUser().role,
      action: 'FUNDING_REQUEST_CREATED',
      targetType: 'FUNDING_REQUEST',
      targetId: freqId,
      reason: `Created funding request of ₹${demand.amount} awaiting borrower authorisation`
    });

    return freq;
  }

  authoriseFundingRequest(fundingRequestId, borrowerId) {
    const freq = this.state.funding_requests.find(f => f.funding_request_id === fundingRequestId);
    if (!freq) throw new Error('Funding request not found');

    validateTransition(FUNDING_REQUEST_TRANSITIONS, 'FundingRequest', freq.funding_request_id, freq.status, 'AUTHORISED');

    const ddId = `DRAW-${freq.funding_request_id.replace('FREQ-', '')}`;
    const drawdown = {
      drawdown_id: ddId,
      funding_request_id: freq.funding_request_id,
      case_id: freq.case_id,
      amount: freq.amount,
      status: 'REQUESTED',
      requested_at: new Date().toISOString()
    };

    this.update(s => ({
      ...s,
      funding_requests: s.funding_requests.map(f => f.funding_request_id === fundingRequestId ? { ...f, status: 'AUTHORISED', authorised_at: new Date().toISOString() } : f),
      drawdowns: [...s.drawdowns, drawdown]
    }));

    this.audit.log({
      actorId: borrowerId,
      actorRole: 'BORROWER',
      action: 'BORROWER_DRAWDOWN_AUTHORISED',
      targetType: 'FUNDING_REQUEST',
      targetId: fundingRequestId,
      reason: `Borrower authorised drawdown request of ₹${freq.amount}`
    });

    return drawdown;
  }

  amendOrCancelDemand(demandId, action, reason) {
    const demand = this.state.demands.find(d => d.demand_id === demandId);
    if (!demand) throw new Error('Demand not found');

    const nextState = action === 'CANCEL' ? 'CANCELLED' : 'DISPUTED';
    validateTransition(DEMAND_TRANSITIONS, 'HospitalDemand', demand.demand_id, demand.state, nextState);

    this.update(s => ({
      ...s,
      demands: s.demands.map(d => d.demand_id === demandId ? { ...d, state: nextState, amendment_reason: reason } : d)
    }));

    this.audit.log({
      actorId: this.getCurrentUser().user_id,
      actorRole: this.getCurrentUser().role,
      action: `DEMAND_${nextState}`,
      targetType: 'DEMAND',
      targetId: demandId,
      reason: `Demand history preserved. Reason: ${reason}`
    });
  }
}
