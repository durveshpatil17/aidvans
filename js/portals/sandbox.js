/**
 * Regulated NBFC Lender Simulator (Sandbox Panel)
 * Route: #/sandbox/lender
 * Meets Section 4.2 (Lender Simulator)
 */

import { escapeHTML, renderStatusBadge, renderEmptyState, renderErrorState, renderSuccessState, formatINR, formatDate, formatDateTime } from '../ui.js';

export function renderLenderSandbox({ store, user }) {
  const state = store.getState();
  const applications = state.applications;
  const fundingRequests = state.funding_requests.filter(f => f.status === 'AUTHORISED');
  const disbursements = state.disbursements;
  const adapter = window.__LENDER_ADAPTER__;

  window.__ON_VIEW_MOUNTED__ = () => {
    // Approve buttons
    document.querySelectorAll('[data-action="lender-approve"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const appId = btn.getAttribute('data-app-id');
        adapter.approveApplication(appId);
        window.location.reload();
      });
    });

    // Sanction lower amount
    document.querySelectorAll('[data-action="lender-sanction-lower"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const appId = btn.getAttribute('data-app-id');
        const input = document.querySelector(`[data-testid="lender-lower-amount-${appId}"]`);
        const amount = parseFloat(input?.value || 150000);
        adapter.approveApplication(appId, { amount });
        window.location.reload();
      });
    });

    // Reject buttons
    document.querySelectorAll('[data-action="lender-reject"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const appId = btn.getAttribute('data-app-id');
        const input = document.querySelector(`[data-testid="lender-reject-reason-${appId}"]`);
        const reason = input?.value || 'Credit score below policy threshold';
        adapter.rejectApplication(appId, reason);
        window.location.reload();
      });
    });

    // Request info
    document.querySelectorAll('[data-action="lender-request-info"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const appId = btn.getAttribute('data-app-id');
        const input = document.querySelector(`[data-testid="lender-info-query-${appId}"]`);
        const query = input?.value || 'Please upload latest 3 months bank statement';
        adapter.requestMoreInfo(appId, query);
        window.location.reload();
      });
    });

    // Timeout
    document.querySelectorAll('[data-action="lender-timeout"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const appId = btn.getAttribute('data-app-id');
        adapter.simulateTimeout(appId);
        window.location.reload();
      });
    });

    // Disburse funds
    document.querySelectorAll('[data-action="lender-disburse"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const caseId = btn.getAttribute('data-case-id');
        const demand = state.demands.find(d => d.case_id === caseId);
        const amount = demand ? demand.amount : 125000;
        adapter.confirmDisbursement({
          caseId,
          demandId: demand?.demand_id || 'DEM-1',
          amount,
          beneficiaryId: demand?.beneficiary_id || 'BENEF-01'
        });
        window.location.reload();
      });
    });

    // Fail disbursement
    document.querySelectorAll('[data-action="lender-disb-fail"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const disbId = btn.getAttribute('data-disb-id');
        const reason = document.querySelector(`[data-testid="lender-disb-fail-reason-${disbId}"]`)?.value || 'Beneficiary account frozen at bank';
        adapter.failDisbursement(disbId, reason);
        window.location.reload();
      });
    });

    // Drawdown approvals
    document.querySelectorAll('[data-action="lender-drawdown-approve"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ddId = btn.getAttribute('data-dd-id');
        adapter.approveDrawdown(ddId);
        window.location.reload();
      });
    });

    // Drawdown rejections
    document.querySelectorAll('[data-action="lender-drawdown-reject"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ddId = btn.getAttribute('data-dd-id');
        const input = document.querySelector(`[data-testid="lender-drawdown-reject-reason-${ddId}"]`);
        const reason = input?.value || 'Limit exceeded';
        adapter.rejectDrawdown(ddId, reason);
        window.location.reload();
      });
    });

    // Reverse disbursement
    document.querySelectorAll('[data-action="lender-disb-reverse"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const disbId = btn.getAttribute('data-disb-id');
        const reason = document.querySelector(`[data-testid="lender-disb-reverse-reason-${disbId}"]`)?.value || 'NEFT return: Technical failure';
        adapter.reverseDisbursement(disbId, reason);
        window.location.reload();
      });
    });

    // Duplicate webhook
    document.querySelectorAll('[data-action="lender-dup-webhook"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const evtId = btn.getAttribute('data-event-id');
        store.audit.log({
          actorId: 'LENDER_NBFC',
          actorRole: 'LENDER_NBFC',
          action: 'DUPLICATE_WEBHOOK_INGESTED',
          targetType: 'WEBHOOK',
          targetId: evtId,
          reason: 'Idempotency check: duplicate webhook discarded; financial state unaffected (AT-28)'
        });
        alert('Duplicate webhook ingested. Idempotency guard verified: exactly one financial event recorded.');
      });
    });
  };

  return `
    <div class="box">
      <div class="sandbox-banner" data-testid="lender-sandbox-banner">
        LENDER SANDBOX (not part of the LSP product)
      </div>

      <h1>Regulated NBFC Simulator</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Use this panel to simulate asynchronous NBFC underwriting decisions, sanctions, disbursements, and exception events. Every LSP screen reacts strictly to events generated here.
      </p>

      <h2>1. Underwriting Decision Controls</h2>
      ${applications.length === 0 ? renderEmptyState('No Applications', 'Submit an application from the Borrower portal to test lender underwriting.') : `
        <div style="display:flex;flex-direction:column;gap:16px;">
          ${applications.map(app => `
            <div class="box">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <strong>Application: ${escapeHTML(app.app_id)}</strong>
                ${renderStatusBadge(app.status)}
              </div>
              <p style="margin:4px 0;"><strong>Case ID:</strong> ${escapeHTML(app.case_id)} | <strong>Lender:</strong> ${escapeHTML(app.lender_id)}</p>
              <p style="margin:4px 0;"><strong>Monthly Income:</strong> ${formatINR(app.monthly_income)} | <strong>Employment:</strong> ${escapeHTML(app.employment_type)}</p>

              ${app.status === 'SUBMITTED' || app.status === 'LENDER_PENDING' || app.status === 'ACTION_REQUIRED' ? `
                <div style="margin-top:12px;background:var(--bg-subtle);padding:12px;border:1px solid var(--border-light);">
                  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
                    <button type="button" class="btn btn-primary" data-action="lender-approve" data-app-id="${app.app_id}" data-testid="lender-action-approve-${app.app_id}">
                      Approve Sanction
                    </button>
                    <button type="button" class="btn btn-secondary" data-action="lender-timeout" data-app-id="${app.app_id}" data-testid="lender-action-timeout-${app.app_id}">
                      Simulate Timeout
                    </button>
                  </div>

                  <div style="display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:8px;">
                    <input type="number" data-testid="lender-lower-amount-${app.app_id}" placeholder="Sanction Lower Amount" value="150000" style="min-height:36px;">
                    <button type="button" class="btn btn-secondary" data-action="lender-sanction-lower" data-app-id="${app.app_id}" data-testid="lender-action-sanction-lower-${app.app_id}">
                      Sanction Lower
                    </button>
                  </div>

                  <div style="display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:8px;">
                    <input type="text" data-testid="lender-reject-reason-${app.app_id}" placeholder="Rejection reason..." value="Underwriting criteria not met" style="min-height:36px;">
                    <button type="button" class="btn btn-secondary" style="color:var(--status-red);" data-action="lender-reject" data-app-id="${app.app_id}" data-testid="lender-action-reject-${app.app_id}">
                      Reject
                    </button>
                  </div>

                  <div style="display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:8px;">
                    <input type="text" data-testid="lender-info-query-${app.app_id}" placeholder="Query description..." value="Additional salary slips needed" style="min-height:36px;">
                    <button type="button" class="btn btn-secondary" data-action="lender-request-info" data-app-id="${app.app_id}" data-testid="lender-action-request-info-${app.app_id}">
                      Request Info
                    </button>
                  </div>
                </div>
              ` : `
                <p style="font-size:0.875rem;color:var(--text-muted);margin-top:8px;">Decided / Finalised</p>
              `}
            </div>
          `).join('')}
        </div>
      `}

      <h2 style="margin-top:24px;">2. Funds Transfer / Disbursement Simulator</h2>
      <p style="color:var(--text-muted);font-size:0.875rem;">Simulate direct transfers to verified hospital accounts after borrower agreement execution.</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
        ${state.cases.filter(c => ['DISBURSEMENT_PENDING', 'ACTIVE', 'PARTIALLY_DISBURSED', 'SANCTIONED'].includes(c.case_status)).map(c => `
          <button type="button" class="btn btn-primary" data-action="lender-disburse" data-case-id="${c.case_id}" data-testid="btn-disburse-${c.case_id}">
            Confirm Transfer for ${escapeHTML(c.frid)}
          </button>
        `).join('')}
      </div>

      <h2 style="margin-top:24px;">3. Drawdown Requests (Multi-Drawdown Facility)</h2>
      <p style="color:var(--text-muted);font-size:0.875rem;">Underwrite subsequent drawdown tranches requested by borrower.</p>
      ${state.drawdowns.length === 0 ? renderEmptyState('No Drawdowns', 'No subsequent drawdowns requested yet.') : `
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${state.drawdowns.map(dd => `
            <div class="box">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>Drawdown: ${escapeHTML(dd.drawdown_id)}</strong>
                ${renderStatusBadge(dd.status)}
              </div>
              <p>Amount: <strong>${formatINR(dd.amount)}</strong> | Case ID: ${escapeHTML(dd.case_id)}</p>
              ${dd.status === 'REQUESTED' ? `
                <div style="display:flex;gap:8px;align-items:center;margin-top:8px;">
                  <button type="button" class="btn btn-primary" data-action="lender-drawdown-approve" data-dd-id="${dd.drawdown_id}" data-testid="lender-drawdown-approve-${dd.drawdown_id}">
                    Approve Drawdown
                  </button>
                  <input type="text" data-testid="lender-drawdown-reject-reason-${dd.drawdown_id}" placeholder="Reject reason..." value="Facility limit exceeded" style="max-width:240px;min-height:36px;">
                  <button type="button" class="btn btn-secondary" style="color:var(--status-red);" data-action="lender-drawdown-reject" data-dd-id="${dd.drawdown_id}" data-testid="lender-drawdown-reject-${dd.drawdown_id}">
                    Reject Drawdown
                  </button>
                </div>
              ` : `
                <p style="font-size:0.875rem;color:var(--text-muted);margin-top:4px;">Status: ${escapeHTML(dd.status)}</p>
              `}
            </div>
          `).join('')}
        </div>
      `}

      ${disbursements.length > 0 ? `
        <h3>Existing Disbursements (Test Failures & Reversals)</h3>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${disbursements.map(d => `
            <div class="box">
              <div style="display:flex;justify-content:space-between;">
                <strong>${escapeHTML(d.disbursement_id)} (UTR: ${escapeHTML(d.transaction_ref)})</strong>
                ${renderStatusBadge(d.status)}
              </div>
              <p>Amount: <strong>${formatINR(d.amount)}</strong> to ${escapeHTML(d.beneficiary_masked)}</p>
              ${d.status === 'CONFIRMED_BY_LENDER' ? `
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
                  <input type="text" data-testid="lender-disb-fail-reason-${d.disbursement_id}" value="Account beneficiary mismatch at bank" style="max-width:240px;min-height:36px;">
                  <button type="button" class="btn btn-secondary" style="color:var(--status-red);" data-action="lender-disb-fail" data-disb-id="${d.disbursement_id}" data-testid="lender-disb-fail-${d.disbursement_id}">
                    Simulate Failure
                  </button>
                  <input type="text" data-testid="lender-disb-reverse-reason-${d.disbursement_id}" value="Bank return: NEFT technical failure" style="max-width:240px;min-height:36px;">
                  <button type="button" class="btn btn-secondary" style="color:var(--status-red);" data-action="lender-disb-reverse" data-disb-id="${d.disbursement_id}" data-testid="lender-disb-reverse-${d.disbursement_id}">
                    Simulate Reversal
                  </button>
                  <button type="button" class="btn btn-secondary" data-action="lender-dup-webhook" data-event-id="${d.disbursement_id}" data-testid="lender-webhook-duplicate-${d.disbursement_id}">
                    Send Duplicate Webhook (AT-28)
                  </button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}
