/**
 * Executive Portal (EXE-01 to EXE-13)
 * Meets TDS Section 4.4 and Section 5.1/5.2 Wireframe Contracts
 */

import { escapeHTML, renderStatusBadge, renderEmptyState, renderErrorState, renderSuccessState, formatINR, formatDate, formatDateTime, maskName, maskPhone } from '../ui.js';
import { generateQRCodeSVG } from '../qrcode.js';

export function renderExecutiveDashboard({ store, user }) {
  const state = store.getState();
  // Filter cases assigned to this executive (or all if admin/ops)
  const cases = state.cases.filter(c => {
    if (user.role === 'EXECUTIVE') {
      return c.assigned_executive_id === user.user_id || (user.assigned_hospital_ids && user.assigned_hospital_ids.includes(c.hospital_id));
    }
    return true;
  });

  const activeCount = cases.filter(c => !['CLOSED', 'CANCELLED'].includes(c.case_status)).length;
  const invitePendingCount = cases.filter(c => c.case_status === 'READY_FOR_INVITATION').length;
  const disbPendingCount = cases.filter(c => c.case_status === 'DISBURSEMENT_PENDING').length;

  return `
    <div class="box">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <h1>Executive Financing Desk (EXE-01)</h1>
          <p style="color:var(--text-muted);margin:0;">
            Assigned Hospital: <strong>${user.assigned_hospital_ids ? user.assigned_hospital_ids.join(', ') : 'All Hospitals'}</strong> | Executive: <strong>${escapeHTML(user.name)}</strong>
          </p>
        </div>
        <div>
          <a href="#/executive/new-case" class="btn btn-primary" data-testid="btn-create-new-case">Create New Case</a>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:24px;">
        <div class="box" style="margin:0;">
          <small style="color:var(--text-muted);">Active Cases</small>
          <div style="font-size:1.5rem;font-weight:700;">${activeCount}</div>
        </div>
        <div class="box" style="margin:0;">
          <small style="color:var(--text-muted);">Awaiting Borrower Link</small>
          <div style="font-size:1.5rem;font-weight:700;">${invitePendingCount}</div>
        </div>
        <div class="box" style="margin:0;">
          <small style="color:var(--text-muted);">Disbursement Pending</small>
          <div style="font-size:1.5rem;font-weight:700;">${disbPendingCount}</div>
        </div>
      </div>

      <h2>Assigned Financing Cases</h2>
      ${cases.length === 0 ? renderEmptyState('No cases assigned', 'No financing cases have been created at this hospital branch yet.') : `
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>FRID / Case ID</th>
                <th>Patient</th>
                <th>Borrower</th>
                <th>Initial Demand</th>
                <th>Lifecycle Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${cases.map(c => {
                const patient = state.patients.find(p => p.patient_id === c.patient_id);
                const borrower = state.users.find(u => u.user_id === c.primary_borrower_id);
                const demand = state.demands.find(d => d.case_id === c.case_id);
                return `
                  <tr>
                    <td>
                      <strong>${escapeHTML(c.frid)}</strong><br>
                      <small style="color:var(--text-muted);">${escapeHTML(c.case_id)}</small>
                    </td>
                    <td>${escapeHTML(patient ? maskName(patient.name) : '—')}</td>
                    <td>${escapeHTML(borrower ? maskName(borrower.name) : '—')}</td>
                    <td>${demand ? formatINR(demand.amount) : '—'}</td>
                    <td>${renderStatusBadge(c.case_status)}</td>
                    <td>${formatDate(c.created_at)}</td>
                    <td>
                      <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        <a href="#/executive/cases/${c.case_id}" class="btn btn-secondary" style="min-height:36px;padding:4px 8px;font-size:0.8125rem;">Details</a>
                        ${c.case_status === 'READY_FOR_INVITATION' || c.case_status === 'INVITATION_SENT' ? `
                          <a href="#/executive/invitation/${c.case_id}" class="btn btn-secondary" style="min-height:36px;padding:4px 8px;font-size:0.8125rem;">Invitation</a>
                        ` : ''}
                      </div>
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

export function renderNewCaseWizard({ store, user }) {
  const state = store.getState();
  const allowedHospitals = state.organizations.filter(o => o.org_type === 'HOSPITAL' && (!user.assigned_hospital_ids || user.assigned_hospital_ids.includes(o.org_id)));

  window.__ON_VIEW_MOUNTED__ = () => {
    const form = document.getElementById('new-case-form');
    if (!form) return;

    const diffRadio = document.getElementById('borrower-diff');
    const sameRadio = document.getElementById('borrower-same');
    const diffSection = document.getElementById('diff-borrower-fields');
    const patientNameInput = document.getElementById('patient-name');
    const patientAgeInput = document.getElementById('patient-age');
    const minorWarning = document.getElementById('minor-warning-box');

    function toggleBorrower() {
      if (diffRadio.checked) {
        diffSection.style.display = 'block';
        document.getElementById('borrower-name').required = true;
        document.getElementById('borrower-contact').required = true;
      } else {
        diffSection.style.display = 'none';
        document.getElementById('borrower-name').required = false;
        document.getElementById('borrower-contact').required = false;
      }
    }

    diffRadio.addEventListener('change', toggleBorrower);
    sameRadio.addEventListener('change', toggleBorrower);

    patientAgeInput.addEventListener('input', () => {
      const age = parseInt(patientAgeInput.value, 10);
      if (age < 18) {
        minorWarning.style.display = 'block';
      } else {
        minorWarning.style.display = 'none';
      }
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const errorContainer = document.getElementById('wizard-error');
      errorContainer.innerHTML = '';

      const age = parseInt(patientAgeInput.value, 10);
      if (age < 18) {
        errorContainer.innerHTML = renderErrorState(
          'Incapacitated or Minor Patient (AT-05/J8 Policy)',
          'Patient is a minor (< 18 years). Standalone or direct borrower application is not permitted without verified legal guardian and manual review. Case creation halted.'
        );
        return;
      }

      const hospitalId = document.getElementById('hospital-select').value;
      const branchId = document.getElementById('branch-select').value;
      const patientName = patientNameInput.value.trim();
      const patientContact = document.getElementById('patient-contact').value.trim();
      const patientAdmissionRef = document.getElementById('patient-adm-ref').value.trim();
      const borrowerSameAsPatient = sameRadio.checked;
      const borrowerName = document.getElementById('borrower-name').value.trim();
      const borrowerContact = document.getElementById('borrower-contact').value.trim();
      const borrowerRelationship = document.getElementById('borrower-relationship').value;
      const demandType = document.getElementById('demand-type').value;
      const demandAmount = parseFloat(document.getElementById('demand-amount').value);
      const demandEvidenceRef = document.getElementById('demand-evidence-ref').value.trim();

      if (isNaN(demandAmount) || demandAmount <= 0) {
        errorContainer.innerHTML = renderErrorState('Validation Error', 'Payment demand amount must be a positive number greater than ₹0.');
        return;
      }

      try {
        const created = store.createCase({
          hospitalId,
          branchId,
          patientName,
          patientContact,
          patientAdmissionRef,
          borrowerSameAsPatient,
          borrowerName,
          borrowerContact,
          borrowerRelationship,
          demandType,
          demandAmount,
          demandEvidenceRef
        });

        window.location.hash = `#/executive/invitation/${created.case_id}`;
      } catch (err) {
        errorContainer.innerHTML = renderErrorState('Case Creation Failed', err.message);
      }
    });
  };

  return `
    <div class="box">
      <h1>New Financing Case Wizard (EXE-02 to EXE-05)</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Initiate an assisted financing case and generate an immutable Financing Reference ID (FRID).
      </p>

      <div class="wizard-steps">
        <div class="wizard-step active">1. Hospital & Patient</div>
        <div class="wizard-step active">2. Borrower Identity</div>
        <div class="wizard-step active">3. Initial Demand</div>
        <div class="wizard-step active">4. Review & FRID</div>
      </div>

      <div id="wizard-error"></div>

      <form id="new-case-form">
        <fieldset>
          <legend>Hospital and Admission Details</legend>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label for="hospital-select">Hospital Organisation *</label>
              <select id="hospital-select" data-testid="hospital-select" required>
                ${allowedHospitals.map(h => `<option value="${h.org_id}">${escapeHTML(h.legal_name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="branch-select">Hospital Branch *</label>
              <select id="branch-select" data-testid="branch-select" required>
                ${allowedHospitals[0]?.branches.map(b => `<option value="${b.branch_id}">${escapeHTML(b.name)} (${escapeHTML(b.code)})</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="patient-adm-ref">Hospital Admission / IPD Reference Number *</label>
            <input type="text" id="patient-adm-ref" data-testid="patient-adm-ref" required placeholder="e.g. IPD-2026-9901">
            <div class="field-hint">Used for hospital reconciliation and duplicate candidate detection.</div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Patient Details (Person Receiving Treatment)</legend>
          <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;">
            <div class="form-group">
              <label for="patient-name">Patient Full Name *</label>
              <input type="text" id="patient-name" data-testid="patient-name" required placeholder="e.g. Ramesh Kumar">
            </div>
            <div class="form-group">
              <label for="patient-age">Patient Age *</label>
              <input type="number" id="patient-age" data-testid="patient-age" required min="1" max="120" value="34">
            </div>
            <div class="form-group">
              <label for="patient-contact">Patient Phone *</label>
              <input type="tel" id="patient-contact" data-testid="patient-contact" required placeholder="+91 98000 00011">
            </div>
          </div>
          <div id="minor-warning-box" class="alert alert-warning" style="display:none;">
            <strong>Warning:</strong> Patient is marked under 18 years old. Under product rules (AT-05/J8), a minor cannot be the borrower and cannot apply directly without manual review.
          </div>
        </fieldset>

        <fieldset>
          <legend>Borrower Details (Person Applying & Owing Loan)</legend>
          <p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:12px;">
            Patient and Borrower are distinct legal identities. If different, the patient viewer cannot see loan, income, or EMI data.
          </p>
          <div class="radio-group" style="margin-bottom:16px;">
            <label class="radio-label">
              <input type="radio" name="borrower-identity" id="borrower-same" value="SAME" checked>
              <span>Borrower is the patient (Self)</span>
            </label>
            <label class="radio-label">
              <input type="radio" name="borrower-identity" id="borrower-diff" data-testid="borrower-diff" value="DIFFERENT">
              <span>Borrower is a family member or sponsor (Different person)</span>
            </label>
          </div>

          <div id="diff-borrower-fields" style="display:none;background:var(--bg-subtle);padding:16px;border:1px solid var(--border-light);">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label for="borrower-name">Borrower Full Name *</label>
                <input type="text" id="borrower-name" data-testid="borrower-name" placeholder="e.g. Amit Shah">
              </div>
              <div class="form-group">
                <label for="borrower-contact">Borrower Phone *</label>
                <input type="tel" id="borrower-contact" data-testid="borrower-contact" placeholder="+91 98000 00012">
              </div>
            </div>
            <div class="form-group">
              <label for="borrower-relationship">Relationship to Patient *</label>
              <select id="borrower-relationship" data-testid="borrower-relationship">
                <option value="SON">Son</option>
                <option value="DAUGHTER">Daughter</option>
                <option value="SPOUSE">Spouse</option>
                <option value="FATHER">Father</option>
                <option value="MOTHER">Mother</option>
                <option value="GUARDIAN">Legal Guardian</option>
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Initial Hospital Payment Demand</legend>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label for="demand-type">Demand Type *</label>
              <select id="demand-type" data-testid="demand-type">
                <option value="ADMISSION_ADVANCE">Admission Advance Deposit</option>
                <option value="PRE_PROCEDURE">Pre-Procedure / Surgery Deposit</option>
                <option value="INTERIM_BILL">Interim Billing Demand</option>
                <option value="FINAL_DISCHARGE">Final Discharge Bill</option>
              </select>
            </div>
            <div class="form-group">
              <label for="demand-amount">Demand Amount (INR) *</label>
              <input type="number" id="demand-amount" data-testid="demand-amount" required min="1" step="1" placeholder="e.g. 125000">
              <div class="field-hint">Indian Rupee grouping (e.g. ₹1,25,000). Must be positive.</div>
            </div>
          </div>
          <div class="form-group">
            <label for="demand-evidence-ref">Hospital Estimate / Bill Reference *</label>
            <input type="text" id="demand-evidence-ref" data-testid="demand-evidence-ref" required placeholder="e.g. EST-2026-PUN-0081">
          </div>
        </fieldset>

        <div class="button-bar">
          <a href="#/executive/dashboard" class="btn btn-secondary">Cancel</a>
          <button type="submit" class="btn btn-primary" data-testid="btn-create-case-submit">Create Case & Generate FRID</button>
        </div>
      </form>
    </div>
  `;
}

export function renderBorrowerInvitation({ store, params }) {
  const state = store.getState();
  const caseObj = state.cases.find(c => c.case_id === params.id);
  if (!caseObj) return renderErrorState('Case Not Found', `Case ID ${params.id} could not be found.`);

  const inv = caseObj.invitation;
  const linkUrl = `${window.location.origin}/#/borrower/link?frid=${encodeURIComponent(caseObj.frid)}&token=${encodeURIComponent(inv ? inv.raw_token || '' : '')}`;
  const qrSvg = inv && inv.raw_token ? generateQRCodeSVG(linkUrl, 200) : '';

  window.__ON_VIEW_MOUNTED__ = () => {
    const sendBtn = document.getElementById('btn-send-invitation');
    const resendBtn = document.getElementById('btn-resend-invitation');

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        store.sendInvitation(caseObj.case_id);
        sendBtn.textContent = 'Invitation Sent';
        sendBtn.disabled = true;
      });
    }

    if (resendBtn) {
      resendBtn.addEventListener('click', () => {
        store.resendInvitation(caseObj.case_id);
        const updated = store.getState().cases.find(c => c.case_id === caseObj.case_id);
        const tokenEl = document.querySelector('[data-testid="invitation-raw-token"]');
        if (tokenEl && updated?.invitation?.raw_token) {
          tokenEl.textContent = updated.invitation.raw_token;
        }
      });
    }
  };

  return `
    <div class="box">
      <h1>Borrower Invitation & FRID Reference (EXE-06)</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Share the secure QR code or invitation link with the borrower to initiate mobile web onboarding.
      </p>

      <div style="display:grid;grid-template-columns:1fr 220px;gap:24px;align-items:start;">
        <div>
          <div class="box" style="background:var(--bg-subtle);">
            <div style="font-size:0.875rem;color:var(--text-muted);">Unique Financing Reference ID (FRID)</div>
            <div style="font-size:2rem;font-weight:700;letter-spacing:1px;color:var(--primary-color);" data-testid="generated-frid">
              ${escapeHTML(caseObj.frid)}
            </div>
            <small style="color:var(--text-muted);">Reference ID is public. Access requires one-time secure invitation token.</small>
          </div>

          <div class="box">
            <h3 style="margin-top:0;">Invitation Token Status</h3>
            <p><strong>Status:</strong> ${renderStatusBadge(caseObj.case_status)}</p>
            <p><strong>Intended Recipient:</strong> ${escapeHTML(inv ? inv.intended_phone_masked : '—')}</p>
            <p><strong>Token Expiry:</strong> ${formatDateTime(inv ? inv.expiry : '')}</p>
            <p><strong>Token Consumed:</strong> ${inv?.consumed ? '<span style="color:var(--status-red);font-weight:600;">YES (Single-use token used)</span>' : '<span style="color:var(--status-green);font-weight:600;">NO (Active)</span>'}</p>
            ${inv?.raw_token ? `
              <div style="margin-top:12px;padding:8px;background:#fdfdfe;border:1px solid var(--border-color);">
                <small style="color:var(--text-muted);display:block;">Raw Invitation Token (shown once):</small>
                <code data-testid="invitation-raw-token">${escapeHTML(inv.raw_token)}</code>
              </div>
            ` : ''}
          </div>

          <div class="form-group">
            <label for="invite-link-input">Secure Mobile Web Link</label>
            <input type="text" id="invite-link-input" data-testid="invite-link-input" readonly value="${escapeHTML(linkUrl)}">
            <div class="field-hint">Open or copy this link directly in mobile browser to test borrower linking.</div>
          </div>
        </div>

        <div style="text-align:center;">
          <div style="display:inline-block;margin-bottom:8px;" data-testid="qr-code-container">
            ${qrSvg || '<p>QR Token Consumed</p>'}
          </div>
          <p style="font-size:0.8125rem;color:var(--text-muted);">Scan with camera to open case on mobile web</p>
        </div>
      </div>

      <div class="button-bar">
        <button type="button" id="btn-send-invitation" data-testid="btn-send-invitation" class="btn btn-primary">
          ${caseObj.case_status === 'READY_FOR_INVITATION' ? 'Send Invitation' : 'Mark Invitation Sent'}
        </button>
        <button type="button" id="btn-resend-invitation" data-testid="btn-resend-invitation" class="btn btn-secondary">
          Resend Invitation (Revokes Old Token)
        </button>
        <a href="#/executive/cases/${caseObj.case_id}" class="btn btn-secondary">View Case Details</a>
        <a href="${escapeHTML(linkUrl)}" class="btn btn-secondary" target="_blank" data-testid="btn-open-borrower-journey">Open Borrower Link</a>
      </div>
    </div>
  `;
}

export function renderExecutiveCaseDetails({ store, params, user }) {
  const state = store.getState();
  const caseObj = state.cases.find(c => c.case_id === params.id);
  if (!caseObj) return renderErrorState('Case Not Found', `Case ID ${params.id} was not found.`);

  const patient = state.patients.find(p => p.patient_id === caseObj.patient_id);
  const borrower = state.users.find(u => u.user_id === caseObj.primary_borrower_id);
  const hospital = state.organizations.find(o => o.org_id === caseObj.hospital_id);
  const branch = hospital?.branches?.find(b => b.branch_id === caseObj.branch_id);
  const demands = state.demands.filter(d => d.case_id === caseObj.case_id);
  const app = state.applications.find(a => a.case_id === caseObj.case_id);
  const sanction = state.sanctions.find(s => s.case_id === caseObj.case_id);
  const disbursements = state.disbursements.filter(d => d.case_id === caseObj.case_id);

  return `
    <div class="box">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <h1>Case Workspace (EXE-07)</h1>
          <p style="color:var(--text-muted);margin:0;">
            FRID: <strong>${escapeHTML(caseObj.frid)}</strong> | Case ID: <strong>${escapeHTML(caseObj.case_id)}</strong>
          </p>
        </div>
        <div>
          ${renderStatusBadge(caseObj.case_status)}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
        <div class="box" style="margin:0;">
          <h3 style="margin-top:0;">Hospital & Parties</h3>
          <p><strong>Hospital:</strong> ${escapeHTML(hospital?.legal_name || caseObj.hospital_id)}</p>
          <p><strong>Branch:</strong> ${escapeHTML(branch?.name || caseObj.branch_id)}</p>
          <p><strong>Patient Name:</strong> ${escapeHTML(patient ? maskName(patient.name) : '—')}</p>
          <p><strong>Borrower Name:</strong> ${escapeHTML(borrower ? maskName(borrower.name) : '—')}</p>
          <p><strong>Borrower Relationship:</strong> ${escapeHTML(caseObj.borrower_relationship || 'SELF')}</p>
        </div>

        <div class="box" style="margin:0;">
          <h3 style="margin-top:0;">Lender Status (Source of Truth)</h3>
          ${app ? `
            <p><strong>Lender ID:</strong> ${escapeHTML(app.lender_id)}</p>
            <p><strong>Application Ref:</strong> <code>${escapeHTML(app.app_id)}</code></p>
            <p><strong>Application Status:</strong> ${renderStatusBadge(app.status)}</p>
            ${sanction ? `
              <p><strong>Sanctioned Amount:</strong> ${formatINR(sanction.sanctioned_amount)}</p>
              <p><strong>Indicative APR:</strong> ${escapeHTML(sanction.interest_rate_apr)}</p>
              <p><strong>Estimated EMI:</strong> ${formatINR(sanction.monthly_emi)} / month</p>
              <p><small style="color:var(--text-muted);">As of: ${formatDateTime(sanction.as_of_timestamp)}</small></p>
            ` : ''}
            ${app.decline_reason ? `
              <div class="alert alert-error" style="margin-top:8px;">
                <strong>Lender Rejection Reason:</strong> ${escapeHTML(app.decline_reason)}<br>
                <small>Lender decision is authoritative. No staff member may override or edit.</small>
              </div>
            ` : ''}
          ` : `
            <p style="color:var(--text-muted);">Borrower has not yet submitted an application to the lender.</p>
          `}
        </div>
      </div>

      <h2>Payment Demands & Staged Funding</h2>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Demand ID</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Evidence Ref</th>
              <th>Demand State</th>
              <th>Created</th>
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
                <td>${formatDate(d.created_at)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="button-bar">
        <a href="#/executive/new-demand/${caseObj.case_id}" class="btn btn-secondary" data-testid="btn-add-subsequent-demand">Add Subsequent Hospital Demand</a>
        <a href="#/executive/invitation/${caseObj.case_id}" class="btn btn-secondary">Invitation & QR</a>
        <a href="#/executive/timeline/${caseObj.case_id}" class="btn btn-secondary">Audit Timeline</a>
        ${['DISBURSED', 'DECLINED', 'CANCELLED'].includes(caseObj.case_status) ? `
          <a href="#/executive/close/${caseObj.case_id}" class="btn btn-secondary">Close LSP Case</a>
        ` : ''}
      </div>
    </div>
  `;
}

export function renderNewDemandScreen({ store, params }) {
  const state = store.getState();
  const caseObj = state.cases.find(c => c.case_id === params.id);
  if (!caseObj) return renderErrorState('Case Not Found', `Case ID ${params.id} was not found.`);

  const app = state.applications.find(a => a.case_id === caseObj.case_id);
  const product = app ? state.lender_products.find(p => p.product_id === app.product_id) : null;

  // RULE CHECK: Single-disbursement product (Lender A) rejects additional tranche (AT-10, J11)
  const isSingleDisbursement = product && product.drawdown_mode === 'SINGLE_DISBURSEMENT';

  window.__ON_VIEW_MOUNTED__ = () => {
    const form = document.getElementById('subsequent-demand-form');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById('sub-demand-amount').value);
      const type = document.getElementById('sub-demand-type').value;
      const ref = document.getElementById('sub-demand-ref').value;

      const demandId = `DEM-${caseObj.case_id.replace('CASE-', '')}-${Date.now().toString().slice(-4)}`;
      const benef = state.beneficiary_accounts.find(b => b.branch_id === caseObj.branch_id) || state.beneficiary_accounts[0];

      const newDemand = {
        demand_id: demandId,
        case_id: caseObj.case_id,
        beneficiary_id: benef.beneficiary_id,
        amount,
        currency: 'INR',
        type,
        evidence_ref: ref,
        state: 'SUBMITTED',
        created_at: new Date().toISOString()
      };

      store.update(s => ({
        ...s,
        demands: [...s.demands, newDemand]
      }));

      store.audit.log({
        actorId: store.getCurrentUser().user_id,
        actorRole: store.getCurrentUser().role,
        action: 'SUBSEQUENT_DEMAND_CAPTURED',
        targetType: 'DEMAND',
        targetId: demandId,
        reason: `Subsequent hospital demand of ₹${amount} submitted`
      });

      window.location.hash = `#/executive/cases/${caseObj.case_id}`;
    });
  };

  return `
    <div class="box">
      <h1>New Demand & Funding Request (EXE-09)</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Capture subsequent treatment demand against existing FRID: <strong>${escapeHTML(caseObj.frid)}</strong>
      </p>

      ${isSingleDisbursement ? `
        <div class="alert alert-error" data-testid="single-disbursement-error">
          <h3 style="margin-bottom:8px;">Subsequent Drawdown Not Supported (AT-10)</h3>
          <p>
            The selected lender product (<strong>${escapeHTML(product.product_name)}</strong>) is configured for <strong>SINGLE UPFRONT DISBURSEMENT ONLY</strong>.
          </p>
          <p style="margin-top:8px;">
            This product facility does not permit staged or additional tranches on the same application. A subsequent hospital payment demand cannot be added to this case.
          </p>
          <p style="font-weight:600;margin-top:8px;">
            Resolution: Direct the borrower to initiate a new financing application for this subsequent requirement.
          </p>
          <div style="margin-top:16px;">
            <a href="#/executive/cases/${caseObj.case_id}" class="btn btn-secondary">Return to Case Details</a>
          </div>
        </div>
      ` : `
        <form id="subsequent-demand-form">
          <fieldset>
            <legend>Demand Particulars</legend>
            <div class="form-group">
              <label for="sub-demand-type">Demand Type *</label>
              <select id="sub-demand-type" required>
                <option value="PRE_PROCEDURE">Pre-Procedure / Surgery Advance</option>
                <option value="INTERIM_BILL">Interim Running Bill</option>
                <option value="FINAL_DISCHARGE">Final Discharge Bill</option>
              </select>
            </div>
            <div class="form-group">
              <label for="sub-demand-amount">Demand Amount (INR) *</label>
              <input type="number" id="sub-demand-amount" data-testid="sub-demand-amount" required min="1" step="1" placeholder="e.g. 50000">
            </div>
            <div class="form-group">
              <label for="sub-demand-ref">Hospital Bill / Estimate Reference *</label>
              <input type="text" id="sub-demand-ref" data-testid="sub-demand-ref" required placeholder="e.g. INT-PUN-2026-4401">
            </div>
          </fieldset>

          <div class="alert alert-info">
            <strong>Borrower Authorization Guard:</strong> Under multi-drawdown facilities, submitting this hospital demand will generate a funding request that requires explicit, affirmative authorization by the borrower on their mobile device before routing to the lender.
          </div>

          <div class="button-bar">
            <a href="#/executive/cases/${caseObj.case_id}" class="btn btn-secondary">Cancel</a>
            <button type="submit" class="btn btn-primary" data-testid="btn-submit-sub-demand">Submit Demand</button>
          </div>
        </form>
      `}
    </div>
  `;
}

export function renderExecutiveDisbursements({ store, user }) {
  const state = store.getState();
  const disbursements = state.disbursements;

  return `
    <div class="box">
      <h1>Disbursement Tracker (EXE-10)</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Confirmed funds transfers from regulated lenders directly to verified hospital beneficiary accounts.
      </p>

      ${disbursements.length === 0 ? renderEmptyState('No disbursements recorded', 'No disbursements have been confirmed by lenders yet.') : `
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Disbursement ID</th>
                <th>Case Ref</th>
                <th>Beneficiary (Masked)</th>
                <th>Amount</th>
                <th>UTR Reference</th>
                <th>Transfer Status</th>
                <th>Value Date</th>
              </tr>
            </thead>
            <tbody>
              ${disbursements.map(d => `
                <tr>
                  <td><code>${escapeHTML(d.disbursement_id)}</code></td>
                  <td>${escapeHTML(d.case_id)}</td>
                  <td>${escapeHTML(d.bank_name)} (${escapeHTML(d.beneficiary_masked)})</td>
                  <td><strong>${formatINR(d.amount)}</strong></td>
                  <td><code>${escapeHTML(d.transaction_ref)}</code></td>
                  <td>${renderStatusBadge(d.status)}</td>
                  <td>${formatDateTime(d.value_date)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

export function renderExecutiveTimeline({ store, params }) {
  const state = store.getState();
  const caseObj = state.cases.find(c => c.case_id === params.id);
  if (!caseObj) return renderErrorState('Case Not Found', `Case ID ${params.id} was not found.`);

  const events = state.audit_logs.filter(l => l.target_id === caseObj.case_id || (caseObj.frid && l.target_id === caseObj.frid));

  return `
    <div class="box">
      <h1>Case Audit Timeline (EXE-11)</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Immutable chronological audit trail for FRID: <strong>${escapeHTML(caseObj.frid)}</strong>
      </p>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor Role</th>
              <th>Action</th>
              <th>Reason / Particulars</th>
            </tr>
          </thead>
          <tbody>
            ${events.map(e => `
              <tr>
                <td>${formatDateTime(e.timestamp)}</td>
                <td><code>${escapeHTML(e.actor_role)}</code></td>
                <td><strong>${escapeHTML(e.action)}</strong></td>
                <td>${escapeHTML(e.reason)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="button-bar">
        <a href="#/executive/cases/${caseObj.case_id}" class="btn btn-secondary">Return to Case Details</a>
      </div>
    </div>
  `;
}

export function renderExecutiveCaseClosure({ store, params, user }) {
  const state = store.getState();
  const caseObj = state.cases.find(c => c.case_id === params.id);
  if (!caseObj) return renderErrorState('Case Not Found', `Case ID ${params.id} was not found.`);

  window.__ON_VIEW_MOUNTED__ = () => {
    const btn = document.getElementById('btn-confirm-close-case');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const reason = document.getElementById('closure-reason').value;
      store.update(s => ({
        ...s,
        cases: s.cases.map(c => c.case_id === caseObj.case_id ? { ...c, case_status: 'CLOSED', closed_at: new Date().toISOString(), closure_reason: reason } : c)
      }));

      store.audit.log({
        actorId: user.user_id,
        actorRole: user.role,
        action: 'LSP_CASE_CLOSED',
        targetType: 'CASE',
        targetId: caseObj.case_id,
        reason: `LSP service episode closed: ${reason}. Lender loan remains unaffected.`
      });

      window.location.hash = `#/executive/cases/${caseObj.case_id}`;
    });
  };

  return `
    <div class="box">
      <h1>Close Financing Case Service (EXE-13)</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Closing operational service work for Case: <strong>${escapeHTML(caseObj.case_id)}</strong> (${escapeHTML(caseObj.frid)})
      </p>

      <div class="alert alert-warning" data-testid="closure-notice">
        <h3 style="margin-bottom:8px;">CRITICAL NOTICE (AT-27 Rule)</h3>
        <p>
          Closing this LSP case marks the conclusion of LSP hospital facilitation and coordination services.
        </p>
        <p style="font-weight:700;margin-top:8px;">
          CLOSING THE LSP CASE DOES NOT CLOSE, CANCEL, OR SETTLE THE BORROWER'S LOAN ACCOUNT WITH THE LENDER OR THE HOSPITAL'S INVOICES.
        </p>
        <p style="margin-top:8px;">
          The borrower remains legally obligated to repay the regulated lender under the signed loan agreement and repayment schedule.
        </p>
      </div>

      <div class="form-group">
        <label for="closure-reason">Closure Reason *</label>
        <select id="closure-reason" data-testid="closure-reason">
          <option value="HOSPITAL_SERVICE_COMPLETED">Hospital Treatment Completed & All Demands Reconciled</option>
          <option value="APPLICATION_DECLINED">Lender Declined Application - Closed by Desk</option>
          <option value="BORROWER_WITHDRAWN">Borrower Opted Out / Cancelled</option>
        </select>
      </div>

      <div class="button-bar">
        <a href="#/executive/cases/${caseObj.case_id}" class="btn btn-secondary">Cancel</a>
        <button type="button" id="btn-confirm-close-case" data-testid="btn-confirm-close-case" class="btn btn-danger">Confirm Case Closure</button>
      </div>
    </div>
  `;
}
