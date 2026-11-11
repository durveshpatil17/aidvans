/**
 * Public Portal Pages (PUB-01 to PUB-07)
 * TDS Section 4.1 Compliance
 */

import { escapeHTML } from '../ui.js';

export function renderPublicHome() {
  return `
    <div class="box" style="border:none;background:transparent;padding:0;">
      <!-- Hero Section -->
      <div class="box" style="padding:48px 36px;text-align:center;background:#ffffff;margin-bottom:28px;">
        <span class="auth-brand-badge">RBI Compliant Lending Service Platform</span>
        <h1 style="font-size:2.25rem;font-weight:800;color:#0f172a;letter-spacing:-0.03em;max-width:820px;margin:12px auto;">
          Transparent, Assisted Healthcare Financing for Leading Hospitals
        </h1>
        <p style="font-size:1.125rem;color:#475569;max-width:680px;margin:0 auto 28px;line-height:1.6;">
          Connecting patients, hospital desks, and regulated NBFC lenders with 100% digital consent, zero borrower fees, and direct verified hospital disbursements.
        </p>

        <div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap;">
          <a href="#/login" class="btn btn-accent" style="font-size:1rem;padding:12px 28px;">
            Access Workspace / Sign In &rarr;
          </a>
          <a href="#/borrower/link" class="btn btn-secondary" style="font-size:1rem;padding:12px 24px;">
            Link Borrower Case (FRID)
          </a>
          <a href="#/how-it-works" class="btn btn-secondary" style="font-size:1rem;padding:12px 24px;">
            Explore How It Works
          </a>
        </div>
      </div>

      <!-- Regulatory Callout -->
      <div class="alert alert-info">
        <strong>Important Regulatory Disclosure (RBI Digital Lending Guidelines):</strong><br>
        Antigravity LSP is a Lending Service Platform (LSP) operating strictly as an agent of regulated lending partners. We do not lend money, do not make credit decisions, collect ₹0 fee from borrowers, and never hold, route, or touch loan or hospital funds.
      </div>

      <!-- Network Performance KPIs -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin-bottom:28px;">
        <div class="box" style="margin:0;text-align:center;padding:20px;">
          <div style="font-size:2rem;font-weight:800;color:#0f172a;">12</div>
          <div style="font-size:0.875rem;font-weight:600;color:#64748b;margin-top:4px;">Accredited Hospital Branches</div>
        </div>
        <div class="box" style="margin:0;text-align:center;padding:20px;">
          <div style="font-size:2rem;font-weight:800;color:#2563eb;">2</div>
          <div style="font-size:0.875rem;font-weight:600;color:#64748b;margin-top:4px;">Regulated Partner NBFCs</div>
        </div>
        <div class="box" style="margin:0;text-align:center;padding:20px;">
          <div style="font-size:2rem;font-weight:800;color:#15803d;">₹0</div>
          <div style="font-size:0.875rem;font-weight:600;color:#64748b;margin-top:4px;">Borrower Platform Fees</div>
        </div>
        <div class="box" style="margin:0;text-align:center;padding:20px;">
          <div style="font-size:2rem;font-weight:800;color:#0f172a;">100%</div>
          <div style="font-size:0.875rem;font-weight:600;color:#64748b;margin-top:4px;">Direct Verified Hospital Transfer</div>
        </div>
      </div>

      <!-- Core Operating Pillars -->
      <h2>How the Ecosystem Operates</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:20px;margin-bottom:28px;">
        <div class="box" style="margin:0;">
          <h3 style="color:#0f172a;margin-top:0;">Assisted Hospital Desk</h3>
          <p style="font-size:0.9375rem;color:#475569;">
            Trained LSP executives stationed at partner hospital desks originate cases, separate clinical patient references from borrower records, and generate unique Financing Reference IDs (FRID).
          </p>
        </div>
        <div class="box" style="margin:0;">
          <h3 style="color:#0f172a;margin-top:0;">Borrower-Controlled Mobile Web</h3>
          <p style="font-size:0.9375rem;color:#475569;">
            Borrowers securely link via FRID & one-time token, review unbundled consent, compare objective lender offers with standardized KFS, and execute agreements at lender endpoints.
          </p>
        </div>
        <div class="box" style="margin:0;">
          <h3 style="color:#0f172a;margin-top:0;">Direct Verified Disbursement</h3>
          <p style="font-size:0.9375rem;color:#475569;">
            Regulated NBFCs disburse approved loan funds directly to verified hospital bank accounts with UTR tracking. The hospital independently verifies and confirms credit receipt.
          </p>
        </div>
      </div>

      <div class="button-bar" style="justify-content:center;">
        <a href="#/how-it-works" class="btn btn-primary">Operating Architecture</a>
        <a href="#/hospitals" class="btn btn-secondary">Hospital Locations</a>
        <a href="#/lenders" class="btn btn-secondary">Lender Partners</a>
        <a href="#/grievance" class="btn btn-secondary">Grievance & Redressal</a>
      </div>
    </div>
  `;
}

export function renderHowItWorks() {
  return `
    <div class="box">
      <h1>How Medical Financing Facilitation Works</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">A clear step-by-step separation of responsibilities between Hospital, LSP, Borrower, and Regulated Lenders.</p>

      <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:24px;">
        <div class="box">
          <h3>Step 1: Case Creation at Hospital Desk</h3>
          <p>An authorized LSP executive validates the hospital and branch, captures patient and borrower identities separately, inputs the hospital estimate demand, and generates an immutable Financing Reference ID (FRID) and a secure one-time linking token.</p>
        </div>
        <div class="box">
          <h3>Step 2: Borrower Links via Secure QR or Link</h3>
          <p>The borrower opens the secure link on mobile web, enters the FRID and token, and provides granular, purpose-specific consent before any data is sent to lending partners.</p>
        </div>
        <div class="box">
          <h3>Step 3: Lender Underwriting & Sanction</h3>
          <p>Regulated NBFC partners perform credit assessment and KYC. Eligible borrowers receive an objective comparison of sanctioned offers, complete with Key Fact Statements (APR, EMI, tenure, and all charges).</p>
        </div>
        <div class="box">
          <h3>Step 4: Agreement & Authorisation</h3>
          <p>The borrower accepts loan terms directly at the lender endpoint. For multi-drawdown facilities, each individual hospital demand requires separate, explicit borrower authorization.</p>
        </div>
        <div class="box">
          <h3>Step 5: Direct NBFC Disbursement</h3>
          <p>Approved funds are transferred by the lender directly to the verified hospital beneficiary account. The hospital finance desk confirms receipt independently.</p>
        </div>
        <div class="box">
          <h3>Step 6: Operational Closure</h3>
          <p>When hospital payment requirements are resolved, the LSP operational case is closed. <em>Note: Closing the LSP case does not close the borrower's loan account with the lender.</em></p>
        </div>
      </div>

      <div class="button-bar">
        <a href="#/" class="btn btn-secondary">Back to Overview</a>
        <a href="#/lenders" class="btn btn-primary">View Partner Lenders</a>
      </div>
    </div>
  `;
}

export function renderPartnerHospitals(store) {
  const hospitals = store.getState().organizations.filter(o => o.org_type === 'HOSPITAL');
  return `
    <div class="box">
      <h1>Partner Hospitals and Locations (PUB-03)</h1>
      <p style="color:var(--text-muted);margin-bottom:16px;">Financing desk services are active at the following accredited hospital locations:</p>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Hospital Name</th>
              <th>Branch Code</th>
              <th>Branch Name & City</th>
              <th>Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${hospitals.flatMap(h => h.branches.map(b => `
              <tr>
                <td><strong>${escapeHTML(h.legal_name)}</strong></td>
                <td><code>${escapeHTML(b.code)}</code></td>
                <td>${escapeHTML(b.name)} (${escapeHTML(b.city)})</td>
                <td>${escapeHTML(b.address)}</td>
                <td><span class="status-badge status-green">Active</span></td>
              </tr>
            `)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderLenderPartners(store) {
  const lenders = store.getState().organizations.filter(o => o.org_type === 'NBFC');
  const products = store.getState().lender_products;

  return `
    <div class="box">
      <h1>Regulated Lender Partners & Disclosures (PUB-04)</h1>
      <p style="color:var(--text-muted);margin-bottom:16px;">
        In accordance with RBI Digital Lending Guidelines, details of all regulated lending partners and products are disclosed below.
      </p>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Regulated Entity (NBFC)</th>
              <th>RBI Registration</th>
              <th>Product Facility</th>
              <th>Indicative APR</th>
              <th>Grievance Nodal Officer</th>
            </tr>
          </thead>
          <tbody>
            ${lenders.map(l => {
              const prods = products.filter(p => p.lender_id === l.org_id);
              return prods.map(p => `
                <tr>
                  <td><strong>${escapeHTML(l.legal_name)}</strong></td>
                  <td><code>${escapeHTML(l.registration_no)}</code></td>
                  <td>${escapeHTML(p.product_name)}<br><small style="color:var(--text-muted);">${p.multi_drawdown ? 'Multi-Drawdown Facility' : 'Single Upfront Disbursement'}</small></td>
                  <td>${escapeHTML(p.apr_display)}</td>
                  <td>${escapeHTML(l.nodal_officer)}<br><small>${escapeHTML(l.grievance_email)}</small></td>
                </tr>
              `).join('');
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderFeesExplanation() {
  return `
    <div class="box">
      <h1>Fees and Charges Explanation (PUB-05)</h1>
      <div class="alert alert-info">
        <strong>Zero Fee from LSP:</strong> Antigravity LSP does not charge any fee, commission, or processing charge to the borrower. Facilitation services at hospital desks are free of charge.
      </div>

      <h2>Lender Charges</h2>
      <p>All loan charges, interest rates, processing fees, penal interest, and foreclosure terms are strictly determined by the regulated NBFC partner and disclosed in the Key Fact Statement (KFS) prior to loan agreement acceptance.</p>

      <ul>
        <li><strong>Processing Fee:</strong> Sourced directly by the lender and deducted from sanctioned amount or billed per lender policy.</li>
        <li><strong>Interest Rates:</strong> Annual Percentage Rates (APR) range between 11.5% and 15.5% depending on borrower credit profile and lender product.</li>
        <li><strong>Penal Charges:</strong> Imposed only for delayed repayments in accordance with RBI fair practices code.</li>
      </ul>
    </div>
  `;
}

export function renderPrivacyNotice() {
  return `
    <div class="box">
      <h1>Privacy Notice and Data Governance (PUB-06)</h1>
      <p style="color:var(--text-muted);margin-bottom:16px;">Effective: 09 November 2026 | Version 1.0</p>

      <h2>1. Purpose of Data Collection</h2>
      <p>Data collected through the LSP is used solely for facilitating medical loan origination, verifying hospital treatment payment demands, and enabling direct lender disbursement.</p>

      <h2>2. Granular, Unbundled Consent</h2>
      <p>We do not bundle consents. You have the right to grant or decline specific permissions for credit bureau checks, lender data transfer, and communication updates. Declining consent halts lender data submission immediately.</p>

      <h2>3. Right to Withdraw Consent</h2>
      <p>Borrowers can review and withdraw optional data consents at any time via the Borrower Privacy Centre. Mandatory records required by financial regulations are retained under statutory retention schedules.</p>

      <h2>4. Data Protection Officer & Grievances</h2>
      <p>For privacy queries: <code>privacy@aidvans.mock</code> | Phone: +91 98000 00099</p>
    </div>
  `;
}

export function renderGrievanceContacts(store) {
  const lenders = store.getState().organizations.filter(o => o.org_type === 'NBFC');
  return `
    <div class="box">
      <h1>Grievance Redressal and Support (PUB-07)</h1>
      <p style="color:var(--text-muted);margin-bottom:16px;">We take complaints seriously. Contact channels for LSP and partner lenders are listed below.</p>

      <h2>LSP Grievance Redressal</h2>
      <p>
        <strong>Principal Nodal Officer:</strong> Neha Kulkarni<br>
        Email: <code>grievance@aidvans.mock</code><br>
        Response turnaround: Within 48 business hours. Resolution within 30 days.
      </p>

      <h2>Lender Partner Nodal Officers</h2>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Lender Entity</th>
              <th>Nodal Officer</th>
              <th>Grievance Email</th>
            </tr>
          </thead>
          <tbody>
            ${lenders.map(l => `
              <tr>
                <td><strong>${escapeHTML(l.legal_name)}</strong></td>
                <td>${escapeHTML(l.nodal_officer)}</td>
                <td><code>${escapeHTML(l.grievance_email)}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

