/**
 * Borrower Portal (BOR-01 to BOR-16)
 * Mobile-First (360px) Design, Full Workflow & Guardrails
 */

import { escapeHTML, renderStatusBadge, renderEmptyState, renderErrorState, renderSuccessState, formatINR, formatDate, formatDateTime, maskName, maskPhone, maskBankAccount } from '../ui.js';

export function renderBorrowerWelcome({ store }) {
  return `
    <div class="mobile-view-wrapper">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-size:1.35rem;margin-bottom:6px;">Borrower Access Desk (BOR-01)</h1>
        <p style="color:var(--text-muted);font-size:0.875rem;">Healthcare Financing Facilitation</p>
      </div>

      <div class="alert alert-info" data-testid="borrower-guidance-notice">
        <h3 style="font-size:1rem;margin-bottom:6px;">Desk Referral Required (AT-02)</h3>
        <p style="font-size:0.875rem;">
          To prevent unauthorized lending origination, self-service standalone loan applications are not permitted.
        </p>
        <p style="font-size:0.875rem;margin-top:6px;">
          You must link your application using a <strong>Financing Reference ID (FRID)</strong> provided by an authorized LSP executive at the hospital desk.
        </p>
      </div>

      <div class="box" style="text-align:center;">
        <p style="font-weight:600;margin-bottom:12px;">Have an invitation or FRID?</p>
        <a href="#/borrower/link" class="btn btn-primary" style="width:100%;" data-testid="btn-go-to-link">Link My Hospital Case</a>
      </div>

      <div style="text-align:center;margin-top:16px;">
        <a href="#/privacy" style="font-size:0.8125rem;">Privacy Policy & RBI Disclosures</a>
      </div>
    </div>
  `;
}

export function renderBorrowerLink({ store, query, user }) {
  const defaultFrid = query.get('frid') || '';
  const defaultToken = query.get('token') || '';

  window.__ON_VIEW_MOUNTED__ = () => {
    const form = document.getElementById('borrower-link-form');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const errorBox = document.getElementById('link-error-box');
      errorBox.innerHTML = '';

      const frid = document.getElementById('input-frid').value.trim();
      const token = document.getElementById('input-token').value.trim();

      try {
        const linkedCase = store.linkCase(frid, token, user.user_id);
        window.location.hash = `#/borrower/consent/${linkedCase.case_id}`;
      } catch (err) {
        errorBox.innerHTML = renderErrorState('Unable to Link Case', err.message);
      }
    });
  };

  return `
    <div class="mobile-view-wrapper">
      <h1 style="font-size:1.35rem;margin-bottom:6px;">Link Financing Case (BOR-02)</h1>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px;">
        Enter your Financing Reference ID and single-use invitation token.
      </p>

      <div id="link-error-box"></div>

      <form id="borrower-link-form">
        <div class="form-group">
          <label for="input-frid">Financing Reference ID (FRID) *</label>
          <input type="text" id="input-frid" data-testid="input-frid" required placeholder="e.g. HF-7K3M-9QX2" value="${escapeHTML(defaultFrid)}">
          <div class="field-hint">Format: HF-XXXX-XXXX (8 uppercase characters)</div>
        </div>

        <div class="form-group">
          <label for="input-token">One-Time Invitation Token *</label>
          <input type="text" id="input-token" data-testid="input-token" required placeholder="e.g. TOK-DEMO-B1-VALID" value="${escapeHTML(defaultToken)}">
          <div class="field-hint">Single-use token generated at the hospital desk.</div>
        </div>

        <div class="button-bar">
          <button type="submit" class="btn btn-primary" style="width:100%;" data-testid="btn-submit-link">Verify & Link Case</button>
        </div>
      </form>

      <div style="margin-top:20px;border-top:1px solid var(--border-light);padding-top:16px;text-align:center;">
        <small style="color:var(--text-muted);">
          Security Notice: 5 consecutive failed attempts will lock linking for 15 minutes. All linking actions are logged.
        </small>
      </div>
    </div>
  `;
}

export function renderBorrowerConsent({ store, params, user }) {
  const state = store.getState();
  const caseObj = state.cases.find(c => c.case_id === params.id);
  if (!caseObj) return renderErrorState('Case Not Found', 'The requested financing case does not exist.');

  window.__ON_VIEW_MOUNTED__ = () => {
    const form = document.getElementById('consent-form');
    const declineBtn = document.getElementById('btn-decline-consent');
    const msgBox = document.getElementById('consent-msg-box');

    form.addEventListener('submit', e => {
      e.preventDefault();
      const bureau = document.getElementById('cns-bureau').checked;
      const lenderShare = document.getElementById('cns-lender').checked;
      const comms = document.getElementById('cns-comms').checked;

      if (!bureau || !lenderShare) {
        msgBox.innerHTML = renderErrorState(
          'Mandatory Consent Required',
          'Credit assessment and lender transmission require mandatory consent. If you do not wish to grant these, please click "Decline All Consent".'
        );
        return;
      }

      store.recordConsent(caseObj.case_id, user.user_id, [
        { purpose: 'CREDIT_BUREAU_INQUIRY', category: 'FINANCIAL_CREDIT', recipient: 'CIBIL_EXPERIAN', granted: true },
        { purpose: 'LENDER_DATA_TRANSFER', category: 'LOAN_ORIGINATION', recipient: 'REGULATED_NBFC', granted: true },
        { purpose: 'COMMUNICATION_UPDATES', category: 'NOTIFICATIONS', recipient: 'LSP_PLATFORM', granted: comms }
      ]);

      window.location.hash = `#/borrower/apply/${caseObj.case_id}`;
    });

    declineBtn.addEventListener('click', () => {
      store.recordConsent(caseObj.case_id, user.user_id, [
        { purpose: 'ALL_DATA_PROCESSING', category: 'ALL', recipient: 'ALL', granted: false }
      ]);

      msgBox.innerHTML = renderErrorState(
        'Consent Declined (AT-06)',
        'You have declined data sharing. In accordance with privacy rules, no information will be transmitted to regulated lenders, and application submission is halted.'
      );
      document.getElementById('consent-actions-bar').style.display = 'none';
    });
  };

  return `
    <div class="mobile-view-wrapper">
      <h1 style="font-size:1.35rem;margin-bottom:6px;">Purpose-Specific Consent (BOR-06)</h1>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px;">
        Under RBI guidelines, consent is unbundled. You have full choice over each category.
      </p>

      <div id="consent-msg-box"></div>

      <form id="consent-form">
        <fieldset>
          <legend>Consent Purposes</legend>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="cns-bureau" data-testid="cns-bureau" checked>
              <span><strong>Credit Bureau Assessment *</strong><br><small style="color:var(--text-muted);">Authorise credit score check via authorized CICs (CIBIL/Experian) for loan eligibility.</small></span>
            </label>

            <label class="checkbox-label">
              <input type="checkbox" id="cns-lender" data-testid="cns-lender" checked>
              <span><strong>Lender Data Sharing *</strong><br><small style="color:var(--text-muted);">Share entered identity and income details with regulated NBFC partners for medical financing underwriting.</small></span>
            </label>

            <label class="checkbox-label">
              <input type="checkbox" id="cns-comms" data-testid="cns-comms" checked>
              <span><strong>Transaction Notifications (Optional)</strong><br><small style="color:var(--text-muted);">Receive status updates and loan notices via SMS and WhatsApp.</small></span>
            </label>
          </div>
        </fieldset>

        <div id="consent-actions-bar" class="button-bar">
          <button type="button" id="btn-decline-consent" data-testid="btn-decline-consent" class="btn btn-secondary" style="flex:1;">Decline All</button>
          <button type="submit" id="btn-grant-consent" data-testid="btn-grant-consent" class="btn btn-primary" style="flex:2;">Accept & Continue</button>
        </div>
      </form>
    </div>
  `;
}

export function renderBorrowerApply({ store, params, user }) {
  const state = store.getState();
  const caseObj = state.cases.find(c => c.case_id === params.id);
  if (!caseObj) return renderErrorState('Case Not Found', 'Financing case was not found.');

  const products = state.lender_products;

  window.__ON_VIEW_MOUNTED__ = () => {
    const form = document.getElementById('application-form');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const productId = document.getElementById('select-product').value;
      const product = products.find(p => p.product_id === productId);
      const monthlyIncome = parseFloat(document.getElementById('input-income').value);
      const employmentType = document.getElementById('select-employment').value;
      const declaredObligations = parseFloat(document.getElementById('input-obligations').value) || 0;

      try {
        const app = store.submitApplication({
          caseId: caseObj.case_id,
          borrowerId: user.user_id,
          lenderId: product.lender_id,
          productId,
          monthlyIncome,
          employmentType,
          declaredObligations
        });

        window.location.hash = `#/borrower/kyc/${caseObj.case_id}`;
      } catch (err) {
        document.getElementById('apply-error').innerHTML = renderErrorState('Application Error', err.message);
      }
    });
  };

  return `
    <div class="mobile-view-wrapper">
      <h1 style="font-size:1.35rem;margin-bottom:6px;">Complete Loan Application (BOR-05)</h1>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px;">
        Provide verified financial information for regulated lender assessment.
      </p>

      <div id="apply-error"></div>

      <form id="application-form">
        <div class="form-group">
          <label for="select-product">Lending Facility / Partner *</label>
          <select id="select-product" data-testid="select-product" required>
            ${products.map(p => `
              <option value="${p.product_id}">
                ${escapeHTML(p.product_name)} (${p.multi_drawdown ? 'Multi-Drawdown Facility' : 'Single Upfront Disbursement'})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label for="select-employment">Employment Type *</label>
          <select id="select-employment" required>
            <option value="SALARIED">Salaried Employee</option>
            <option value="SELF_EMPLOYED">Self-Employed / Business</option>
            <option value="PROFESSIONAL">Independent Professional</option>
          </select>
        </div>

        <div class="form-group">
          <label for="input-income">Monthly Net Income (INR) *</label>
          <input type="number" id="input-income" data-testid="input-income" required min="5000" placeholder="e.g. 65000" value="65000">
        </div>

        <div class="form-group">
          <label for="input-obligations">Existing Monthly Loan EMIs (INR)</label>
          <input type="number" id="input-obligations" data-testid="input-obligations" min="0" placeholder="e.g. 5000" value="0">
        </div>

        <div class="button-bar">
          <button type="submit" class="btn btn-primary" style="width:100%;" data-testid="btn-submit-application">Submit to Regulated Lender</button>
        </div>
      </form>
    </div>
  `;
}

export function renderKYCHandoff({ store, params }) {
  const state = store.getState();
  const caseObj = state.cases.find(c => c.case_id === params.id);
  if (!caseObj) return renderErrorState('Case Not Found', 'Case not found.');

  window.__ON_VIEW_MOUNTED__ = () => {
    const kycBtn = document.getElementById('btn-complete-mock-kyc');
    if (!kycBtn) return;

    kycBtn.addEventListener('click', () => {
      // In real world, lender webhook / redirect returns here.
      // Automatically navigate to borrower overview or offers
      window.location.hash = `#/borrower/overview`;
    });
  };

  return `
    <div class="mobile-view-wrapper">
      <div class="sandbox-banner" data-testid="sandbox-kyc-banner">
        REGULATED NBFC KYC GATEWAY (SANDBOX HANDOFF)
      </div>

      <h1 style="font-size:1.35rem;margin-bottom:6px;">Lender KYC Verification (BOR-07)</h1>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px;">
        To protect borrower privacy, biometric and identity documents are processed strictly within the lender's regulated boundary. The LSP never stores Aadhaar or biometrics.
      </p>

      <div class="box" style="background:var(--bg-subtle);">
        <p><strong>Verification Mode:</strong> Aadhaar OTP / DigiLocker</p>
        <p><strong>Security Status:</strong> Encrypted TLS Session</p>
        <p><strong>Lender ID:</strong> Regulated NBFC Partner</p>
      </div>

      <div class="button-bar">
        <button type="button" id="btn-complete-mock-kyc" data-testid="btn-complete-mock-kyc" class="btn btn-primary" style="width:100%;">
          Complete Verified KYC & Return
        </button>
      </div>
    </div>
  `;
}

export function renderBorrowerOverview({ store, user }) {
  const state = store.getState();
  // Find cases linked to this borrower
  const cases = state.cases.filter(c => c.primary_borrower_id === user.user_id);

  if (cases.length === 0) {
    return `
      <div class="mobile-view-wrapper">
        <h1 style="font-size:1.35rem;margin-bottom:8px;">Borrower Portal (BOR-03)</h1>
        ${renderEmptyState('No Linked Cases', 'You do not have any active financing cases linked yet.')}
        <div style="text-align:center;margin-top:16px;">
          <a href="#/borrower/link" class="btn btn-primary">Link Case via FRID</a>
        </div>
      </div>
    `;
  }

  const currentCase = cases[0];
  const demands = state.demands.filter(d => d.case_id === currentCase.case_id);
  const app = state.applications.find(a => a.case_id === currentCase.case_id);
  const sanction = state.sanctions.find(s => s.case_id === currentCase.case_id);
  const disbursements = state.disbursements.filter(d => d.case_id === currentCase.case_id);
  const fundingRequests = state.funding_requests.filter(f => f.case_id === currentCase.case_id);
  const pendingAuthReq = fundingRequests.find(f => f.status === 'PENDING_BORROWER_AUTH');

  return `
    <div class="mobile-view-wrapper">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div>
          <h1 style="font-size:1.25rem;margin:0;">My Healthcare Case (BOR-03)</h1>
          <small style="color:var(--text-muted);">FRID: <strong>${escapeHTML(currentCase.frid)}</strong></small>
        </div>
        <div>
          ${renderStatusBadge(currentCase.case_status)}
        </div>
      </div>

      ${pendingAuthReq ? `
        <div class="alert alert-warning" style="margin-bottom:16px;">
          <strong>Action Required:</strong> A new hospital payment funding request of <strong>${formatINR(pendingAuthReq.amount)}</strong> requires your authorization.
          <div style="margin-top:8px;">
            <a href="#/borrower/drawdown/${pendingAuthReq.funding_request_id}" class="btn btn-primary" style="width:100%;">Review & Authorise Drawdown</a>
          </div>
        </div>
      ` : ''}

      ${sanction && currentCase.case_status === 'SANCTIONED' ? `
        <div class="alert alert-info" style="margin-bottom:16px;">
          <strong>Loan Offer Ready:</strong> Lender approved sanction of <strong>${formatINR(sanction.sanctioned_amount)}</strong>.
          <div style="margin-top:8px;">
            <a href="#/borrower/offers/${currentCase.case_id}" class="btn btn-primary" style="width:100%;" data-testid="btn-view-offers">Review Offers & KFS</a>
          </div>
        </div>
      ` : ''}

      <div class="box" style="margin-bottom:16px;">
        <h3 style="margin-top:0;font-size:1rem;">Hospital Episode Details</h3>
        <p style="margin:4px 0;"><strong>Hospital:</strong> ${escapeHTML(currentCase.hospital_id)}</p>
        <p style="margin:4px 0;"><strong>Patient:</strong> ${escapeHTML(currentCase.patient_is_borrower ? 'Self (Borrower)' : 'Family Member')}</p>
        <p style="margin:4px 0;"><strong>Active Demands:</strong> ${demands.length}</p>
      </div>

      <div class="box" style="margin-bottom:16px;">
        <h3 style="margin-top:0;font-size:1rem;">Lender Decisions & Transfers</h3>
        ${app ? `
          <p style="margin:4px 0;"><strong>Application Ref:</strong> <code>${escapeHTML(app.app_id)}</code></p>
          <p style="margin:4px 0;"><strong>Lender Status:</strong> ${renderStatusBadge(app.status)}</p>
          ${app.decline_reason ? `
            <div class="alert alert-error" style="margin-top:8px;font-size:0.875rem;">
              <strong>Lender Rejection:</strong> ${escapeHTML(app.decline_reason)}
            </div>
          ` : ''}
          ${disbursements.length > 0 ? `
            <div style="margin-top:8px;">
              <a href="#/borrower/timeline/${currentCase.case_id}" class="btn btn-secondary" style="width:100%;">View Disbursement Timeline</a>
            </div>
          ` : ''}
        ` : `
          <p style="color:var(--text-muted);font-size:0.875rem;">No application submitted yet.</p>
          <a href="#/borrower/apply/${currentCase.case_id}" class="btn btn-primary" style="width:100%;">Submit Loan Application</a>
        `}
      </div>

      ${sanction && ['ACTIVE', 'DISBURSED', 'SERVICE_COMPLETE', 'CLOSED'].includes(currentCase.case_status) ? `
        <div class="box" style="margin-bottom:16px;">
          <h3 style="margin-top:0;font-size:1rem;">Lender Loan Information</h3>
          <p style="margin:4px 0;"><strong>Sanctioned Limit:</strong> ${formatINR(sanction.sanctioned_amount)}</p>
          <p style="margin:4px 0;"><strong>Monthly EMI:</strong> ${formatINR(sanction.monthly_emi)} / month</p>
          <div style="margin-top:8px;">
            <a href="#/borrower/loan/${currentCase.case_id}" class="btn btn-secondary" style="width:100%;">View Repayment Schedule</a>
          </div>
        </div>
      ` : ''}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px;">
        <a href="#/borrower/privacy" class="btn btn-secondary" style="font-size:0.8125rem;">Privacy Centre</a>
        <a href="#/borrower/help" class="btn btn-secondary" style="font-size:0.8125rem;">Help & Support</a>
      </div>
    </div>
  `;
}

export function renderBorrowerOffers({ store, params, user }) {
  const state = store.getState();
  const caseObj = state.cases.find(c => c.case_id === params.id);
  if (!caseObj) return renderErrorState('Case Not Found', 'Case not found.');

  const sanction = state.sanctions.find(s => s.case_id === caseObj.case_id);
  const app = state.applications.find(a => a.case_id === caseObj.case_id);
  const product = app ? state.lender_products.find(p => p.product_id === app.product_id) : null;

  return `
    <div class="mobile-view-wrapper">
      <h1 style="font-size:1.35rem;margin-bottom:6px;">Lender Offers (BOR-08)</h1>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px;">
        Objective, unbiased comparison. All terms and fees are determined by the regulated NBFC.
      </p>

      ${sanction ? `
        <div class="box" style="border:2px solid var(--primary-color);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-weight:700;">${escapeHTML(product?.product_name || 'Care Medical Loan')}</span>
            <span class="status-badge status-green">Approved</span>
          </div>
          <div style="font-size:1.75rem;font-weight:700;color:var(--primary-color);margin-bottom:8px;">
            ${formatINR(sanction.sanctioned_amount)}
          </div>
          <table style="font-size:0.875rem;margin-bottom:12px;">
            <tr><td>Tenor</td><td><strong>${sanction.approved_tenor_months} Months</strong></td></tr>
            <tr><td>Annual Percentage Rate (APR)</td><td><strong>${escapeHTML(sanction.interest_rate_apr)}</strong></td></tr>
            <tr><td>Monthly Instalment (EMI)</td><td><strong>${formatINR(sanction.monthly_emi)}</strong></td></tr>
            <tr><td>Disbursement Mode</td><td><strong>Direct to Verified Hospital Bank Account</strong></td></tr>
          </table>

          <div class="alert alert-info" style="font-size:0.8125rem;padding:8px;">
            <strong>Mandatory KFS Disclosure:</strong> A Key Fact Statement (KFS) containing full APR calculations and cooling-off periods must be reviewed before acceptance.
          </div>

          <div class="button-bar">
            <a href="#/borrower/kfs/${caseObj.case_id}" class="btn btn-primary" style="width:100%;" data-testid="btn-review-kfs">Review KFS & Sign Agreement</a>
          </div>
        </div>
      ` : renderEmptyState('No Offers Yet', 'Lender underwriting assessment is currently pending.')}
    </div>
  `;
}

export function renderBorrowerKFS({ store, params, user }) {
  const state = store.getState();
  const caseObj = state.cases.find(c => c.case_id === params.id);
  if (!caseObj) return renderErrorState('Case Not Found', 'Case not found.');

  const sanction = state.sanctions.find(s => s.case_id === caseObj.case_id);
  const app = state.applications.find(a => a.case_id === caseObj.case_id);
  const lender = app ? state.organizations.find(o => o.org_id === app.lender_id) : null;

  window.__ON_VIEW_MOUNTED__ = () => {
    const acceptBtn = document.getElementById('btn-accept-agreement');
    if (!acceptBtn) return;

    acceptBtn.addEventListener('click', () => {
      // Handled by adapter
      const adapter = window.__LENDER_ADAPTER__;
      if (adapter) {
        adapter.acceptLoanAgreement(caseObj.case_id, user.user_id);
      }
      window.location.hash = `#/borrower/overview`;
    });
  };

  return `
    <div class="mobile-view-wrapper">
      <div class="sandbox-banner">
        REGULATED NBFC AGREEMENT EXECUTION ENDPOINT
      </div>

      <h1 style="font-size:1.35rem;margin-bottom:6px;">Key Fact Statement (KFS) & Agreement (BOR-09)</h1>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px;">
        Regulated Entity: <strong>${escapeHTML(lender?.legal_name || 'CareFinance Capital NBFC')}</strong>
      </p>

      <div class="box" style="font-size:0.875rem;">
        <h3 style="margin-top:0;">Key Fact Statement (RBI Standard Format)</h3>
        <table style="width:100%;">
          <tr><td>Loan Sanction Amount</td><td><strong>${formatINR(sanction?.sanctioned_amount || 125000)}</strong></td></tr>
          <tr><td>Loan Term</td><td><strong>${sanction?.approved_tenor_months || 12} Months</strong></td></tr>
          <tr><td>Annual Percentage Rate (APR)</td><td><strong>${escapeHTML(sanction?.interest_rate_apr || '12.5% p.a.')}</strong></td></tr>
          <tr><td>Monthly Instalment (EMI)</td><td><strong>${formatINR(sanction?.monthly_emi || 11125)}</strong></td></tr>
          <tr><td>Cooling-Off Period</td><td><strong>3 Business Days</strong></td></tr>
          <tr><td>End-Use Restriction</td><td><strong>Strictly Hospital Treatment Direct Credit</strong></td></tr>
        </table>
      </div>

      <div class="checkbox-group" style="margin-bottom:16px;">
        <label class="checkbox-label">
          <input type="checkbox" id="chk-kfs-accept" data-testid="chk-kfs-accept" checked>
          <span>I have read and understood the Key Fact Statement (KFS) and agree to the loan terms and repayment obligations.</span>
        </label>
      </div>

      <div class="button-bar">
        <button type="button" id="btn-accept-agreement" data-testid="btn-accept-agreement" class="btn btn-primary" style="width:100%;">
          Digitally Sign & Accept Loan Terms
        </button>
      </div>
    </div>
  `;
}

export function renderBorrowerDrawdown({ store, params, user }) {
  const state = store.getState();
  const freq = state.funding_requests.find(f => f.funding_request_id === params.id);
  if (!freq) return renderErrorState('Request Not Found', 'Funding request not found.');

  const caseObj = state.cases.find(c => c.case_id === freq.case_id);
  const demand = state.demands.find(d => d.demand_id === freq.demand_id);
  const hospital = state.organizations.find(o => o.org_id === caseObj.hospital_id);

  window.__ON_VIEW_MOUNTED__ = () => {
    const authBtn = document.getElementById('btn-auth-drawdown');
    if (!authBtn) return;

    authBtn.addEventListener('click', () => {
      // Borrower affirmative authorization
      store.authoriseFundingRequest(freq.funding_request_id, user.user_id);
      window.location.hash = `#/borrower/overview`;
    });
  };

  return `
    <div class="mobile-view-wrapper">
      <h1 style="font-size:1.35rem;margin-bottom:6px;">Authorise Drawdown Request (BOR-10)</h1>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px;">
        Multi-Drawdown Facility: Each subsequent hospital demand requires your explicit authorisation (AT-11).
      </p>

      <div class="box">
        <h3 style="margin-top:0;">Hospital Payment Demand Particulars</h3>
        <p><strong>Hospital:</strong> ${escapeHTML(hospital?.legal_name)}</p>
        <p><strong>Demand Type:</strong> ${escapeHTML(demand?.type.replace(/_/g, ' '))}</p>
        <p><strong>Evidence Reference:</strong> ${escapeHTML(demand?.evidence_ref)}</p>
        <p style="font-size:1.5rem;font-weight:700;color:var(--primary-color);margin:12px 0;">
          ${formatINR(freq.amount)}
        </p>
        <p style="font-size:0.8125rem;color:var(--text-muted);">
          Authorising this request instructs the lender to disburse this exact amount directly to the hospital's verified account.
        </p>
      </div>

      <div class="button-bar">
        <a href="#/borrower/overview" class="btn btn-secondary" style="flex:1;">Reject / Cancel</a>
        <button type="button" id="btn-auth-drawdown" data-testid="btn-auth-drawdown" class="btn btn-primary" style="flex:2;">
          Authorise Exactly ${formatINR(freq.amount)}
        </button>
      </div>
    </div>
  `;
}

export function renderBorrowerTimeline({ store, params }) {
  const state = store.getState();
  const caseObj = state.cases.find(c => c.case_id === params.id);
  if (!caseObj) return renderErrorState('Case Not Found', 'Case not found.');

  const disbursements = state.disbursements.filter(d => d.case_id === caseObj.case_id);

  return `
    <div class="mobile-view-wrapper">
      <h1 style="font-size:1.35rem;margin-bottom:6px;">Disbursement Timeline (BOR-11)</h1>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px;">
        Tracking lender-confirmed funds transfers to hospital bank accounts.
      </p>

      ${disbursements.length === 0 ? renderEmptyState('No Transfers Yet', 'No disbursements have been confirmed by the lender yet.') : `
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${disbursements.map(d => `
            <div class="box">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-weight:700;font-size:1.1rem;">${formatINR(d.amount)}</span>
                ${renderStatusBadge(d.status)}
              </div>
              <p style="margin:4px 0;font-size:0.875rem;"><strong>Beneficiary:</strong> ${escapeHTML(d.bank_name)} (${escapeHTML(d.beneficiary_masked)})</p>
              <p style="margin:4px 0;font-size:0.875rem;"><strong>Bank UTR:</strong> <code>${escapeHTML(d.transaction_ref)}</code></p>
              <p style="margin:4px 0;font-size:0.8125rem;color:var(--text-muted);">Lender Value Date: ${formatDateTime(d.value_date)}</p>
            </div>
          `).join('')}
        </div>
      `}

      <div class="button-bar">
        <a href="#/borrower/overview" class="btn btn-secondary" style="width:100%;">Back to Overview</a>
      </div>
    </div>
  `;
}

export function renderBorrowerLoanInfo({ store, params }) {
  const state = store.getState();
  const caseObj = state.cases.find(c => c.case_id === params.id);
  if (!caseObj) return renderErrorState('Case Not Found', 'Case not found.');

  const sanction = state.sanctions.find(s => s.case_id === caseObj.case_id);

  return `
    <div class="mobile-view-wrapper">
      <h1 style="font-size:1.35rem;margin-bottom:6px;">Loan Information (BOR-12)</h1>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px;">
        Authoritative values supplied directly by the regulated NBFC.
      </p>

      <div class="box">
        <div class="alert alert-info" style="font-size:0.8125rem;padding:8px;margin-bottom:12px;">
          <strong>Source of Truth:</strong> Values displayed are sourced strictly from lender mock records. The LSP does not calculate authoritative live interest or outstanding balances.
        </div>

        <p><strong>Sanctioned Loan Facility:</strong> ${formatINR(sanction?.sanctioned_amount || 0)}</p>
        <p><strong>Monthly EMI:</strong> ${formatINR(sanction?.monthly_emi || 0)}</p>
        <p><strong>Interest Rate:</strong> ${escapeHTML(sanction?.interest_rate_apr || '—')}</p>
        <p><strong>Tenor:</strong> ${sanction?.approved_tenor_months || 0} Months</p>
        <p style="font-size:0.8125rem;color:var(--text-muted);margin-top:8px;">
          As of Timestamp: ${formatDateTime(sanction?.as_of_timestamp)}
        </p>
      </div>

      <div class="button-bar">
        <a href="#/borrower/overview" class="btn btn-secondary" style="width:100%;">Back to Overview</a>
      </div>
    </div>
  `;
}

export function renderBorrowerPrivacy({ store, user }) {
  const state = store.getState();
  const consents = state.consents.filter(c => c.user_id === user.user_id);

  window.__ON_VIEW_MOUNTED__ = () => {
    document.querySelectorAll('[data-action="withdraw-consent"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cnsId = btn.getAttribute('data-consent-id');
        store.withdrawConsent(cnsId, user.user_id);
        window.location.reload();
      });
    });
  };

  return `
    <div class="mobile-view-wrapper">
      <h1 style="font-size:1.35rem;margin-bottom:6px;">Privacy Centre (BOR-16)</h1>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px;">
        Review your consent history and exercise your rights under data protection laws.
      </p>

      ${consents.length === 0 ? renderEmptyState('No Consents Recorded', 'No consent decisions have been recorded for this user.') : `
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${consents.map(c => `
            <div class="box" style="font-size:0.875rem;">
              <p><strong>Purpose:</strong> ${escapeHTML(c.purpose)}</p>
              <p><strong>Status:</strong> ${c.withdrawn ? '<span style="color:var(--status-red);font-weight:600;">WITHDRAWN</span>' : (c.granted ? '<span style="color:var(--status-green);font-weight:600;">ACTIVE</span>' : '<span style="color:var(--status-amber);font-weight:600;">DECLINED</span>')}</p>
              <p style="color:var(--text-muted);font-size:0.75rem;">Granted At: ${formatDateTime(c.timestamp)}</p>
              ${c.granted && !c.withdrawn && c.purpose !== 'MANDATORY_STATUTORY_RECORDS' ? `
                <div style="margin-top:8px;">
                  <button type="button" class="btn btn-secondary" style="min-height:36px;padding:4px 8px;font-size:0.8125rem;color:var(--status-red);" data-action="withdraw-consent" data-consent-id="${c.consent_id}">
                    Withdraw Consent
                  </button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `}

      <div class="button-bar">
        <a href="#/borrower/overview" class="btn btn-secondary" style="width:100%;">Back to Overview</a>
      </div>
    </div>
  `;
}

export function renderBorrowerHelp({ store, user }) {
  const state = store.getState();
  const tickets = state.support_tickets;

  window.__ON_VIEW_MOUNTED__ = () => {
    const form = document.getElementById('ticket-form');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const category = document.getElementById('ticket-category').value;
      const text = document.getElementById('ticket-message').value.trim();

      const newTicket = {
        ticket_id: `TICK-${Date.now().toString().slice(-4)}`,
        case_id: 'CASE-1001',
        complainant_name: maskName(user.name),
        complainant_contact: maskPhone(user.phone),
        category,
        priority: 'MEDIUM',
        owner_id: 'USR-NEHA',
        status: 'OPEN',
        created_at: new Date().toISOString(),
        messages: [{ sender: user.name, time: new Date().toISOString(), text }]
      };

      store.update(s => ({
        ...s,
        support_tickets: [newTicket, ...s.support_tickets]
      }));

      store.audit.log({
        actorId: user.user_id,
        actorRole: 'BORROWER',
        action: 'SUPPORT_TICKET_RAISED',
        targetType: 'TICKET',
        targetId: newTicket.ticket_id,
        reason: `Borrower submitted support enquiry: ${category}`
      });

      window.location.reload();
    });
  };

  return `
    <div class="mobile-view-wrapper">
      <h1 style="font-size:1.35rem;margin-bottom:6px;">Help & Complaints (BOR-15)</h1>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px;">
        Raise a question or register a formal grievance.
      </p>

      <form id="ticket-form" style="margin-bottom:24px;">
        <div class="form-group">
          <label for="ticket-category">Category *</label>
          <select id="ticket-category" data-testid="ticket-category" required>
            <option value="LENDER_GRIEVANCE">Lender Complaint / Grievance Redressal (AT-23)</option>
            <option value="DISBURSEMENT_STATUS">Disbursement Status Enquiry</option>
            <option value="KFS_TERMS">Loan Terms & KFS Query</option>
            <option value="HOSPITAL_BILL">Hospital Billing Discrepancy</option>
            <option value="DATA_PRIVACY">Data Privacy Request</option>
          </select>
        </div>

        <div class="form-group">
          <label for="ticket-message">Message *</label>
          <textarea id="ticket-message" data-testid="ticket-message" required rows="3" placeholder="Describe your query..."></textarea>
        </div>

        <div class="button-bar">
          <button type="submit" class="btn btn-primary" data-testid="btn-submit-ticket" style="width:100%;">Submit Ticket</button>
        </div>
      </form>

      <div class="box" data-testid="grievance-officer-card" style="margin-bottom:20px;background:var(--bg-subtle);">
        <h3 style="margin-top:0;font-size:0.9375rem;">Regulated Lender Grievance Redressal (AT-23)</h3>
        <p style="font-size:0.8125rem;color:var(--text-muted);margin:4px 0;">
          As per RBI Digital Lending Guidelines, any loan dispute is routed to the partner lender's designated Principal Nodal Grievance Officer:
        </p>
        <p style="font-size:0.8125rem;margin:4px 0;"><strong>Officer:</strong> Rajesh Verma (Nodal Officer)</p>
        <p style="font-size:0.8125rem;margin:4px 0;"><strong>Email:</strong> grievance@lender-nbfc.mock</p>
        <p style="font-size:0.8125rem;margin:4px 0;"><strong>Helpline:</strong> 1800-200-9999 (Toll Free, 9 AM - 6 PM)</p>
        <p style="font-size:0.8125rem;color:var(--text-muted);margin:4px 0;">Turnaround Time: Escalated directly to NBFC within 24 hours.</p>
      </div>

      <h2>Recent Tickets</h2>
      ${tickets.length === 0 ? renderEmptyState('No Tickets', 'No open enquiries.') : `
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${tickets.map(t => `
            <div class="box" style="font-size:0.875rem;">
              <div style="display:flex;justify-content:space-between;">
                <strong>${escapeHTML(t.category.replace(/_/g, ' '))}</strong>
                ${renderStatusBadge(t.status)}
              </div>
              <small style="color:var(--text-muted);display:block;margin-top:4px;">${formatDateTime(t.created_at)}</small>
            </div>
          `).join('')}
        </div>
      `}

      <div class="button-bar">
        <a href="#/borrower/overview" class="btn btn-secondary" style="width:100%;">Back to Overview</a>
      </div>
    </div>
  `;
}
