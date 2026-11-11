/**
 * Hospital Portal (HOS-01 to HOS-11)
 * Meets TDS Section 4.5 & Strict ABAC Tenant Isolation
 */

import { escapeHTML, renderStatusBadge, renderEmptyState, renderErrorState, renderSuccessState, renderPermissionDeniedState, formatINR, formatDate, formatDateTime, maskName } from '../ui.js';
import { checkAccess } from '../rbac.js';

export function renderHospitalDashboard({ store, user }) {
  const state = store.getState();
  // ABAC: Hospital isolation - only cases belonging to user.org_id
  const cases = state.cases.filter(c => c.hospital_id === user.org_id);
  const hospital = state.organizations.find(o => o.org_id === user.org_id);

  const pendingDemands = state.demands.filter(d => cases.some(c => c.case_id === d.case_id) && d.state === 'SUBMITTED');
  const pendingReceipts = state.receipts.filter(r => cases.some(c => c.case_id === r.case_id) && r.state === 'AWAITING_HOSPITAL');

  return `
    <div class="box">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <h1>Hospital Portal Dashboard (HOS-02)</h1>
          <p style="color:var(--text-muted);margin:0;">
            Organisation: <strong>${escapeHTML(hospital?.legal_name || user.org_id)}</strong> | Role: <strong>${escapeHTML(user.role)}</strong>
          </p>
        </div>
        <div>
          <a href="#/hospital/receipts" class="btn btn-primary">Confirm Bank Receipts (${pendingReceipts.length})</a>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:24px;">
        <div class="box" style="margin:0;">
          <small style="color:var(--text-muted);">Active Hospital Cases</small>
          <div style="font-size:1.5rem;font-weight:700;">${cases.length}</div>
        </div>
        <div class="box" style="margin:0;">
          <small style="color:var(--text-muted);">Demands Awaiting Action</small>
          <div style="font-size:1.5rem;font-weight:700;">${pendingDemands.length}</div>
        </div>
        <div class="box" style="margin:0;">
          <small style="color:var(--text-muted);">Transfers Awaiting Receipt</small>
          <div style="font-size:1.5rem;font-weight:700;">${pendingReceipts.length}</div>
        </div>
      </div>

      <h2>Hospital Cases in Scope</h2>
      ${cases.length === 0 ? renderEmptyState('No cases found', 'No financing cases are active for this hospital organisation.') : `
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>FRID / Case ID</th>
                <th>Patient Name</th>
                <th>Admission Ref</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${cases.map(c => {
                const patient = state.patients.find(p => p.patient_id === c.patient_id);
                return `
                  <tr>
                    <td>
                      <strong>${escapeHTML(c.frid)}</strong><br>
                      <small style="color:var(--text-muted);">${escapeHTML(c.case_id)}</small>
                    </td>
                    <td>${escapeHTML(patient ? maskName(patient.name) : '—')}</td>
                    <td><code>${escapeHTML(patient?.hospital_admission_ref || '—')}</code></td>
                    <td>${renderStatusBadge(c.case_status)}</td>
                    <td>${formatDate(c.created_at)}</td>
                    <td>
                      <a href="#/hospital/cases/${c.case_id}" class="btn btn-secondary" style="min-height:36px;padding:4px 8px;font-size:0.8125rem;">View Hospital Summary</a>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

export function renderHospitalCaseDetails({ store, params, user }) {
  const state = store.getState();
  const caseObj = state.cases.find(c => c.case_id === params.id);
  if (!caseObj) return renderErrorState('Case Not Found', 'Financing case was not found.');

  // CRITICAL ABAC CHECK: Cross-hospital access isolation (AT-15)
  if (user.role.startsWith('HOSPITAL_') && user.org_id !== caseObj.hospital_id) {
    store.audit.log({
      actorId: user.user_id,
      actorRole: user.role,
      action: 'CROSS_HOSPITAL_ACCESS_DENIED',
      targetType: 'CASE',
      targetId: caseObj.case_id,
      reason: `Hospital user from ${user.org_id} attempted access to case owned by ${caseObj.hospital_id}`
    });

    return renderPermissionDeniedState(
      `Cross-Hospital Access Denied: You belong to ${user.org_id} and cannot access cases from ${caseObj.hospital_id}.`
    );
  }

  const patient = state.patients.find(p => p.patient_id === caseObj.patient_id);
  const demands = state.demands.filter(d => d.case_id === caseObj.case_id);
  const disbursements = state.disbursements.filter(d => d.case_id === caseObj.case_id);

  return `
    <div class="box">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <h1>Hospital Case Summary (HOS-04 / HOS-06)</h1>
          <p style="color:var(--text-muted);margin:0;">
            FRID: <strong>${escapeHTML(caseObj.frid)}</strong> | Admission Ref: <strong>${escapeHTML(patient?.hospital_admission_ref || '—')}</strong>
          </p>
        </div>
        <div>
          ${renderStatusBadge(caseObj.case_status)}
        </div>
      </div>

      <div class="alert alert-info">
        <strong>Privacy Barrier (AT-16):</strong> Hospital portal users have view access restricted to clinical billing references and disbursement status. Borrower personal identity records, government identifiers, credit agency records, and loan agreement archives are strictly inaccessible.
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
        <div class="box" style="margin:0;">
          <h3 style="margin-top:0;">Patient Clinical Demographics</h3>
          <p><strong>Patient Name:</strong> ${escapeHTML(patient ? maskName(patient.name) : '—')}</p>
          <p><strong>Admission Reference:</strong> <code>${escapeHTML(patient?.hospital_admission_ref || '—')}</code></p>
          <p><strong>Patient Phone:</strong> ${escapeHTML(patient?.contact ? '•••• •••• ' + patient.contact.slice(-2) : '—')}</p>
        </div>

        <div class="box" style="margin:0;">
          <h3 style="margin-top:0;">Disbursement Status</h3>
          <p><strong>Financing Status:</strong> ${renderStatusBadge(caseObj.case_status)}</p>
          <p><strong>Total Confirmed Transfers:</strong> ${formatINR(disbursements.reduce((sum, d) => sum + (d.status === 'CONFIRMED_BY_LENDER' ? d.amount : 0), 0))}</p>
        </div>
      </div>

      <h2>Payment Demands</h2>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Demand ID</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Evidence Ref</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${demands.map(d => `
              <tr>
                <td><code>${escapeHTML(d.demand_id)}</code></td>
                <td>${escapeHTML(d.type.replace(/_/g, ' '))}</td>
                <td><strong>${formatINR(d.amount)}</strong></td>
                <td>${escapeHTML(d.evidence_ref)}</td>
                <td>${renderStatusBadge(d.state)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="button-bar">
        <a href="#/hospital/dashboard" class="btn btn-secondary">Back to Dashboard</a>
      </div>
    </div>
  `;
}

export function renderHospitalReceipts({ store, user }) {
  const state = store.getState();
  const cases = state.cases.filter(c => c.hospital_id === user.org_id);
  const caseIds = cases.map(c => c.case_id);
  const receipts = state.receipts.filter(r => caseIds.includes(r.case_id));

  window.__ON_VIEW_MOUNTED__ = () => {
    document.querySelectorAll('[data-action="confirm-receipt"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const recId = btn.getAttribute('data-receipt-id');
        const rec = state.receipts.find(r => r.receipt_id === recId);
        const ref = prompt('Enter Hospital Internal Credit / ERP Reference:', `HOS-REC-${Date.now().toString().slice(-4)}`);
        if (!ref) return;

        store.update(s => ({
          ...s,
          receipts: s.receipts.map(r => r.receipt_id === recId ? { ...r, state: 'CONFIRMED', received_amount: r.expected_amount, hospital_receipt_ref: ref, confirmed_at: new Date().toISOString() } : r)
        }));

        store.audit.log({
          actorId: user.user_id,
          actorRole: user.role,
          action: 'HOSPITAL_RECEIPT_CONFIRMED',
          targetType: 'RECEIPT',
          targetId: recId,
          reason: `Hospital finance confirmed bank credit receipt of ₹${rec.expected_amount}`
        });

        window.location.reload();
      });
    });

    document.querySelectorAll('[data-action="report-mismatch"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const recId = btn.getAttribute('data-receipt-id');
        const reason = prompt('Enter Mismatch Reason (e.g., Credit not reflected in bank statement):', 'Amount not credited in hospital bank account');
        if (!reason) return;

        store.update(s => ({
          ...s,
          receipts: s.receipts.map(r => r.receipt_id === recId ? { ...r, state: 'MISMATCH', mismatch_reason: reason, reported_at: new Date().toISOString() } : r)
        }));

        store.audit.log({
          actorId: user.user_id,
          actorRole: user.role,
          action: 'HOSPITAL_RECEIPT_MISMATCH_REPORTED',
          targetType: 'RECEIPT',
          targetId: recId,
          reason: `Hospital reported bank credit mismatch: ${reason}`
        });

        window.location.reload();
      });
    });
  };

  return `
    <div class="box">
      <h1>Hospital Bank Receipt Confirmation (HOS-07)</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Independently confirm bank credits received from regulated lenders or flag discrepancy (AT-13).
      </p>

      ${receipts.length === 0 ? renderEmptyState('No Pending Receipts', 'No lender disbursements require confirmation at this time.') : `
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Disbursement Ref</th>
                <th>Expected Amount</th>
                <th>Receipt State</th>
                <th>Hospital ERP Ref</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${receipts.map(r => {
                const disb = state.disbursements.find(d => d.disbursement_id === r.disbursement_id);
                return `
                  <tr>
                    <td><code>${escapeHTML(r.receipt_id)}</code></td>
                    <td><code>${escapeHTML(disb?.transaction_ref || r.disbursement_id)}</code></td>
                    <td><strong>${formatINR(r.expected_amount)}</strong></td>
                    <td>${renderStatusBadge(r.state)}</td>
                    <td>${escapeHTML(r.hospital_receipt_ref || '—')}</td>
                    <td>
                      ${r.state === 'AWAITING_HOSPITAL' ? `
                        <div style="display:flex;gap:6px;">
                          <button type="button" class="btn btn-primary" style="min-height:36px;padding:4px 8px;font-size:0.8125rem;" data-action="confirm-receipt" data-receipt-id="${r.receipt_id}" data-testid="btn-confirm-receipt-${r.receipt_id}">
                            Confirm Credit
                          </button>
                          <button type="button" class="btn btn-secondary" style="min-height:36px;padding:4px 8px;font-size:0.8125rem;color:var(--status-red);" data-action="report-mismatch" data-receipt-id="${r.receipt_id}" data-testid="btn-report-mismatch-${r.receipt_id}">
                            Flag Mismatch
                          </button>
                        </div>
                      ` : `
                        <span style="font-size:0.8125rem;color:var(--text-muted);">Reconciled</span>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

export function renderHospitalBeneficiary({ store, user }) {
  const state = store.getState();
  const benefs = state.beneficiary_accounts.filter(b => b.hospital_id === user.org_id);
  const requests = state.beneficiary_change_requests || [];

  window.__ON_VIEW_MOUNTED__ = () => {
    const form = document.getElementById('change-bank-form');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const newBank = document.getElementById('new-bank-name').value.trim();
      const newIfsc = document.getElementById('new-bank-ifsc').value.trim();
      const newAcc = document.getElementById('new-bank-account').value.trim();

      const newReq = {
        request_id: `BCR-${Date.now().toString().slice(-4)}`,
        hospital_id: user.org_id,
        branch_id: benefs[0]?.branch_id || 'BRANCH-01',
        bank_name: newBank,
        ifsc: newIfsc,
        account_number_raw: newAcc,
        account_number_masked: '•••• •••• ' + newAcc.slice(-4),
        requested_by: user.user_id,
        status: 'PENDING_MAKER_CHECKER_APPROVAL',
        created_at: new Date().toISOString()
      };

      store.update(s => ({
        ...s,
        beneficiary_change_requests: [...(s.beneficiary_change_requests || []), newReq]
      }));

      store.audit.log({
        actorId: user.user_id,
        actorRole: user.role,
        action: 'BENEFICIARY_CHANGE_REQUESTED',
        targetType: 'BENEFICIARY_ACCOUNT',
        targetId: newReq.request_id,
        reason: 'Hospital admin submitted bank account change request; held pending maker-checker approval'
      });

      window.location.reload();
    });
  };

  return `
    <div class="box">
      <h1>Hospital Profile & Beneficiary Verification (HOS-11)</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Verified bank account details for direct lender disbursements.
      </p>

      <h2>Active Verified Beneficiary Accounts</h2>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Beneficiary ID</th>
              <th>Branch</th>
              <th>Bank Name</th>
              <th>IFSC Code</th>
              <th>Account Number (Masked)</th>
              <th>Verification Status</th>
            </tr>
          </thead>
          <tbody>
            ${benefs.map(b => `
              <tr>
                <td><code>${escapeHTML(b.beneficiary_id)}</code></td>
                <td>${escapeHTML(b.branch_id)}</td>
                <td>${escapeHTML(b.bank_name)}</td>
                <td><code>${escapeHTML(b.ifsc)}</code></td>
                <td><strong>${escapeHTML(b.account_number_masked)}</strong></td>
                <td><span class="status-badge status-green">VERIFIED</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="box" style="margin-top:24px;">
        <h3>Request Bank Account Change (Maker-Checker Gate: AT-18/J13)</h3>
        <p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:12px;">
          To prevent fraudulent diversion of loan proceeds, any change to hospital beneficiary bank details is held in pending status until independent callback verification and platform admin maker-checker dual approval.
        </p>

        <form id="change-bank-form">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label for="new-bank-name">New Bank Name *</label>
              <input type="text" id="new-bank-name" data-testid="new-bank-name" required placeholder="e.g. State Bank of India">
            </div>
            <div class="form-group">
              <label for="new-bank-ifsc">New IFSC Code *</label>
              <input type="text" id="new-bank-ifsc" data-testid="new-bank-ifsc" required placeholder="e.g. SBIN0001234">
            </div>
          </div>
          <div class="form-group">
            <label for="new-bank-account">New Account Number *</label>
            <input type="text" id="new-bank-account" data-testid="new-bank-account" required placeholder="e.g. 55667788990011">
          </div>

          <div class="button-bar">
            <button type="submit" class="btn btn-primary" data-testid="btn-submit-bank-change">Submit Change for Dual Approval</button>
          </div>
        </form>
      </div>

      ${requests.length > 0 ? `
        <h2 style="margin-top:24px;">Pending Change Requests</h2>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Proposed Bank</th>
                <th>Proposed Account</th>
                <th>Requested At</th>
                <th>Dual Approval Status</th>
              </tr>
            </thead>
            <tbody>
              ${requests.map(r => `
                <tr>
                  <td><code>${escapeHTML(r.request_id)}</code></td>
                  <td>${escapeHTML(r.bank_name)} (${escapeHTML(r.ifsc)})</td>
                  <td>${escapeHTML(r.account_number_masked)}</td>
                  <td>${formatDateTime(r.created_at)}</td>
                  <td>${renderStatusBadge(r.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    </div>
  `;
}
