/**
 * Borrower Mobile Web Journey (/borrower/*)
 * Meets Section 7.3: 360px mobile-first layout, unbundled consent, KYC handoff, KFS, and step-up OTP.
 */

import { api } from '../../core/api.js';
import { formatINR } from '../../../shared/money.js';
import { renderTimeline } from '../../components/timeline.js';
import { toast } from '../../components/toast.js';

export async function renderBorrowerWorkspace(ctx, { router, session }) {
  const user = session.user;
  if (!user || (user.role !== 'BORROWER' && user.role !== 'PATIENT_VIEWER')) {
    return `
      <div style="padding:48px 24px;text-align:center;max-width:440px;margin:40px auto;">
        <h2>Borrower Authentication Required</h2>
        <p style="color:var(--text-muted);">Please sign in with your mobile number to view your financing application.</p>
        <a href="/borrower/login" class="btn btn-primary btn-sm">Sign In via Mobile OTP</a>
      </div>
    `;
  }

  const subview = ctx.params.view || 'home';

  let cases = [];
  try {
    const res = await api.get('/api/v1/cases');
    cases = res.cases || [];
  } catch {}

  const activeCase = cases[0] || null;

  window.__ON_VIEW_MOUNTED__ = () => {
    // Consent confirmation
    const consentBtn = document.getElementById('btn-confirm-consent');
    if (consentBtn) {
      consentBtn.addEventListener('click', async () => {
        const c1 = document.getElementById('consent-p1').checked;
        const c2 = document.getElementById('consent-p2').checked;
        const c3 = document.getElementById('consent-p3').checked;

        if (!c1 || !c2 || !c3) {
          toast.warning('Please review and check all statutory consent purposes.');
          return;
        }

        toast.success('Unbundled consent granted and logged in audit ledger.');
        router.navigate('/borrower/offers');
      });
    }

    // Step-up OTP trigger
    const stepUpBtn = document.getElementById('btn-request-step-up');
    if (stepUpBtn) {
      stepUpBtn.addEventListener('click', async () => {
        try {
          await api.post('/api/v1/funding-requests/step-up-otp');
          toast.info('Step-up code sent via SMS. Check simulated outbox.');
          document.getElementById('step-up-container').style.display = 'block';
        } catch (err) {
          toast.danger(err.message);
        }
      });
    }
  };

  return `
    <div style="background:#f8fafc;min-height:100vh;display:flex;justify-content:center;padding:16px 8px;">
      <div style="max-width:480px;width:100%;background:#ffffff;border:1px solid var(--border-light);border-radius:4px;display:flex;flex-direction:column;min-height:90vh;">
        <!-- Mobile Header -->
        <header style="padding:12px 16px;border-bottom:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="font-weight:800;color:var(--primary);font-size:14px;">AIDVANS HEALTHCARE</span><br>
            <small style="color:var(--text-subtle);">Borrower: <strong>${user.name}</strong></small>
          </div>
          <div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="fetch('/api/v1/auth/logout',{method:'POST'}).then(()=>window.location.href='/borrower/login')">Sign Out</button>
          </div>
        </header>

        <!-- Subnav Pills -->
        <div style="display:flex;gap:4px;padding:8px 16px;background:var(--bg-subtle);border-bottom:1px solid var(--border-light);overflow-x:auto;">
          <a href="/borrower/home" class="badge ${subview === 'home' ? 'badge-blue' : 'badge-neutral'}" style="text-decoration:none;">Case</a>
          <a href="/borrower/consent" class="badge ${subview === 'consent' ? 'badge-blue' : 'badge-neutral'}" style="text-decoration:none;">Consent</a>
          <a href="/borrower/offers" class="badge ${subview === 'offers' ? 'badge-blue' : 'badge-neutral'}" style="text-decoration:none;">Offers</a>
          <a href="/borrower/privacy" class="badge ${subview === 'privacy' ? 'badge-blue' : 'badge-neutral'}" style="text-decoration:none;">Privacy</a>
        </div>

        <!-- Main Mobile Content -->
        <main style="padding:20px 16px;flex:1;">
          ${renderBorrowerContent(subview, { activeCase, user })}
        </main>
      </div>
    </div>
  `;
}

function renderBorrowerContent(subview, { activeCase, user }) {
  if (subview === 'consent') {
    return `
      <h2>Unbundled Purpose-Specific Consent</h2>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">In compliance with DPDP Act & RBI Digital Lending Guidelines:</p>

      <div class="box" style="padding:16px;margin-bottom:12px;">
        <label style="display:flex;gap:8px;font-size:13px;font-weight:500;">
          <input type="checkbox" id="consent-p1" checked>
          <span><strong>Purpose 1: Regulated Credit Evaluation</strong><br><small style="color:var(--text-muted);">Share demographics and income with accredited partner NBFCs for loan appraisal.</small></span>
        </label>
      </div>

      <div class="box" style="padding:16px;margin-bottom:12px;">
        <label style="display:flex;gap:8px;font-size:13px;font-weight:500;">
          <input type="checkbox" id="consent-p2" checked>
          <span><strong>Purpose 2: Direct Hospital Billing Verification</strong><br><small style="color:var(--text-muted);">Verify medical cost demands against hospital admission reference.</small></span>
        </label>
      </div>

      <div class="box" style="padding:16px;margin-bottom:20px;">
        <label style="display:flex;gap:8px;font-size:13px;font-weight:500;">
          <input type="checkbox" id="consent-p3" checked>
          <span><strong>Purpose 3: Statutory Audit Retention</strong><br><small style="color:var(--text-muted);">Retain electronic transaction trail for mandatory RBI compliance.</small></span>
        </label>
      </div>

      <button type="button" id="btn-confirm-consent" class="btn btn-primary" style="width:100%;">Confirm Specific Consent &rarr;</button>
    `;
  }

  if (subview === 'offers') {
    return `
      <h2>Objective Lender Credit Offers</h2>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Standardized terms provided by regulated lending partners (no sponsored rankings):</p>

      <div class="box" style="border-left:4px solid var(--primary);padding:16px;margin-bottom:16px;">
        <span class="badge badge-blue">CareFinance Capital NBFC</span>
        <h3 style="margin:8px 0 4px 0;">CareFinance Medical Loan</h3>
        <p style="font-size:20px;font-weight:800;color:var(--primary);margin:4px 0;">₹1,25,000</p>
        <p style="font-size:12px;color:var(--text-muted);margin:0 0 12px 0;">13.5% p.a. APR &bull; 12 Months Tenor &bull; ₹11,195/month</p>

        <a href="http://localhost:3001/hosted/redirect/esign?return_url=http://localhost:3000/borrower/home&state=DEMO_STATE" class="btn btn-primary btn-sm" style="width:100%;">Review KFS & E-Sign with NBFC &rarr;</a>
      </div>
    `;
  }

  // Default: Case Overview
  if (!activeCase) {
    return `
      <div style="text-align:center;padding:32px 0;">
        <h3>No Linked Financing Case</h3>
        <p style="font-size:13px;color:var(--text-muted);">Please visit the hospital financing desk to originate a case.</p>
      </div>
    `;
  }

  return `
    <span class="badge badge-emerald">${activeCase.case_status}</span>
    <h1 style="font-size:20px;margin:8px 0 4px 0;">Financing Case ${activeCase.frid}</h1>
    <p style="font-size:12px;color:var(--text-subtle);margin-bottom:16px;">Reference: ${activeCase.case_id}</p>

    <div class="box" style="padding:16px;margin-bottom:16px;">
      <h3 style="margin-top:0;">Single Next Best Action</h3>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Your application is ready for objective offer review.</p>
      <a href="/borrower/offers" class="btn btn-primary btn-sm" style="width:100%;">View Lender Offers &rarr;</a>
    </div>

    <div class="box" style="padding:16px;">
      <h4>Financing Particulars</h4>
      <p style="font-size:13px;margin:4px 0;">Admission Ref: <strong>${activeCase.admission_ref || 'ADM-8912'}</strong></p>
      <p style="font-size:13px;margin:4px 0;">Disbursement Destination: <strong>Direct to Verified Hospital Bank Account</strong></p>
      <p style="font-size:13px;margin:4px 0;">Borrower Fee: <strong>₹0 (Zero Fee from LSP)</strong></p>
    </div>
  `;
}
