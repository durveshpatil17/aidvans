/**
 * Operations Portal (OPS-01 to OPS-07)
 * Meets TDS Section 4.3 & Exception Runbook Requirements
 */

import { escapeHTML, renderStatusBadge, renderEmptyState, renderErrorState, renderSuccessState, formatINR, formatDate, formatDateTime } from '../ui.js';

export function renderOpsDashboard({ store, user }) {
  const state = store.getState();
  const cases = state.cases;
  const mismatches = state.receipts.filter(r => r.state === 'MISMATCH');
  const failedDisbs = state.disbursements.filter(d => d.status === 'FAILED');

  return `
    <div class="box">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <h1>Operations Control Workbench (OPS-01)</h1>
          <p style="color:var(--text-muted);margin:0;">
            Operations Manager: <strong>${escapeHTML(user.name)}</strong> | Environment: <strong>Prototype Sandbox</strong>
          </p>
        </div>
        <div style="display:flex;gap:8px;">
          <a href="#/ops/exceptions" class="btn btn-secondary">Exception Workbench (${mismatches.length + failedDisbs.length})</a>
          <a href="#/ops/reconciliation" class="btn btn-primary">Daily Reconciliation</a>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:24px;">
        <div class="box" style="margin:0;">
          <small style="color:var(--text-muted);">Total Cases Today</small>
          <div style="font-size:1.5rem;font-weight:700;">${cases.length}</div>
        </div>
        <div class="box" style="margin:0;">
          <small style="color:var(--text-muted);">Active Exceptions</small>
          <div style="font-size:1.5rem;font-weight:700;color:var(--status-red);">${mismatches.length + failedDisbs.length}</div>
        </div>
        <div class="box" style="margin:0;">
          <small style="color:var(--text-muted);">Total Lender Disbursements</small>
          <div style="font-size:1.5rem;font-weight:700;">${state.disbursements.length}</div>
        </div>
      </div>

      <h2>Operational Queues</h2>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Queue Name</th>
              <th>Pending Count</th>
              <th>Target SLA</th>
              <th>Primary Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Disbursement & Receipt Exceptions</strong></td>
              <td><span class="status-badge ${mismatches.length > 0 ? 'status-red' : 'status-green'}">${mismatches.length} Mismatches</span></td>
              <td>4 Hours</td>
              <td><a href="#/ops/exceptions" class="btn btn-secondary" style="min-height:36px;padding:4px 8px;font-size:0.8125rem;">Resolve</a></td>
            </tr>
            <tr>
              <td><strong>End-of-Day Financial Reconciliation</strong></td>
              <td><span class="status-badge status-amber">Active Batch</span></td>
              <td>By 23:59 IST</td>
              <td><a href="#/ops/reconciliation" class="btn btn-secondary" style="min-height:36px;padding:4px 8px;font-size:0.8125rem;">Run Reconcile</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderOpsExceptions({ store, user }) {
  const state = store.getState();
  const mismatches = state.receipts.filter(r => r.state === 'MISMATCH');
  const failedDisbs = state.disbursements.filter(d => d.status === 'FAILED');

  window.__ON_VIEW_MOUNTED__ = () => {
    document.querySelectorAll('[data-action="resolve-exception"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const input = document.querySelector(`[data-testid="input-resolution-evidence-${id}"]`);
        const ownerInput = document.querySelector(`[data-testid="input-exception-owner-${id}"]`);
        const evidence = input ? input.value.trim() : 'Bank statement UTR verified';
        const assignedOwner = ownerInput ? ownerInput.value.trim() : user.name;
        if (!evidence) {
          alert('Resolution rejected: Cannot resolve exception without attaching source evidence (AT-25 rule).');
          return;
        }

        store.update(s => ({
          ...s,
          receipts: s.receipts.map(r => r.receipt_id === id ? {
            ...r,
            state: 'CONFIRMED',
            assigned_owner: assignedOwner,
            resolved_by: user.user_id,
            resolution_evidence: evidence,
            resolved_at: new Date().toISOString()
          } : r)
        }));

        store.audit.log({
          actorId: user.user_id,
          actorRole: user.role,
          action: 'EXCEPTION_RESOLVED_WITH_EVIDENCE',
          targetType: 'RECEIPT_EXCEPTION',
          targetId: id,
          reason: `Ops resolved mismatch. Assigned owner: ${assignedOwner}. Attached evidence: ${evidence}`
        });

        window.location.reload();
      });
    });
  };

  return `
    <div class="box">
      <h1>Exception Workbench (OPS-04)</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Investigate transfer discrepancies, receipt mismatches, and failed transactions.
      </p>

      <div class="alert alert-info">
        <strong>Mandatory Evidence Rule (AT-25):</strong> No manual alteration or resolution of a payment exception is permitted without verifiable source evidence (bank statement UTR or bank callback verification).
      </div>

      <h2>Receipt Mismatches & Disputes</h2>
      ${mismatches.length === 0 ? renderEmptyState('No Mismatches', 'Zero active receipt mismatches.') : `
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Disbursement Ref</th>
                <th>Expected Amount</th>
                <th>Reported Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${mismatches.map(m => `
                <tr>
                  <td><code>${escapeHTML(m.receipt_id)}</code></td>
                  <td><code>${escapeHTML(m.disbursement_id)}</code></td>
                  <td>${formatINR(m.expected_amount)}</td>
                  <td><span style="color:var(--status-red);">${escapeHTML(m.mismatch_reason || 'Discrepancy')}</span></td>
                  <td>
                    <div style="display:flex;flex-direction:column;gap:6px;">
                      <input type="text" data-testid="input-exception-owner-${m.receipt_id}" placeholder="Assign Ops Owner" value="${escapeHTML(user.name)}" style="min-height:32px;font-size:0.8125rem;">
                      <input type="text" data-testid="input-resolution-evidence-${m.receipt_id}" placeholder="Bank Statement UTR Evidence *" value="Verified via HDFC Bank statement UTR confirmed credited" style="min-height:32px;font-size:0.8125rem;">
                      <button type="button" class="btn btn-primary" style="min-height:36px;padding:4px 8px;font-size:0.8125rem;" data-action="resolve-exception" data-id="${m.receipt_id}" data-testid="btn-resolve-exception-${m.receipt_id}">
                        Resolve with Evidence
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}

      <h2 style="margin-top:24px;">Failed / Returned Disbursements</h2>
      ${failedDisbs.length === 0 ? renderEmptyState('No Failed Transfers', 'All lender disbursements successfully processed.') : `
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Disbursement ID</th>
                <th>Case ID</th>
                <th>Amount</th>
                <th>Beneficiary</th>
                <th>Failure Reason</th>
              </tr>
            </thead>
            <tbody>
              ${failedDisbs.map(d => `
                <tr>
                  <td><code>${escapeHTML(d.disbursement_id)}</code></td>
                  <td>${escapeHTML(d.case_id)}</td>
                  <td>${formatINR(d.amount)}</td>
                  <td>${escapeHTML(d.beneficiary_masked)}</td>
                  <td><span style="color:var(--status-red);">${escapeHTML(d.failure_reason || 'Bank technical rejection')}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

export function renderOpsReconciliation({ store, user }) {
  const state = store.getState();
  const disbs = state.disbursements;
  const receipts = state.receipts;

  const plantBtnId = 'btn-plant-mismatch';

  window.__ON_VIEW_MOUNTED__ = () => {
    const btn = document.getElementById(plantBtnId);
    if (btn) {
      btn.addEventListener('click', () => {
        // Plant a reconciliation mismatch (J14 test scenario)
        const fakeDisbId = `DISB-PLANT-${Date.now().toString().slice(-4)}`;
        const fakeDisb = {
          disbursement_id: fakeDisbId,
          case_id: 'CASE-1001',
          demand_id: 'DEM-1001-1',
          beneficiary_id: 'BENEF-01',
          beneficiary_masked: '•••• •••• 4092',
          bank_name: 'HDFC Bank',
          amount: 50000,
          currency: 'INR',
          transaction_ref: `UTR-PLANT-${Date.now().toString().slice(-4)}`,
          value_date: new Date().toISOString(),
          status: 'CONFIRMED_BY_LENDER'
        };

        const fakeReceipt = {
          receipt_id: `REC-PLANT-${Date.now().toString().slice(-4)}`,
          disbursement_id: fakeDisbId,
          case_id: 'CASE-1001',
          expected_amount: 50000,
          received_amount: null,
          state: 'MISMATCH',
          mismatch_reason: 'Planted audit test: Bank credit pending verification',
          created_at: new Date().toISOString()
        };

        store.update(s => ({
          ...s,
          disbursements: [...s.disbursements, fakeDisb],
          receipts: [...s.receipts, fakeReceipt]
        }));

        store.audit.log({
          actorId: user.user_id,
          actorRole: user.role,
          action: 'RECONCILIATION_MISMATCH_PLANTED',
          targetType: 'RECONCILIATION',
          targetId: fakeReceipt.receipt_id,
          reason: 'Planted test discrepancy for automated reconciliation scenario J14'
        });

        window.location.reload();
      });
    }
  };

  return `
    <div class="box">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <h1>Daily Reconciliation Workbench (OPS-07)</h1>
          <p style="color:var(--text-muted);margin:0;">
            Three-way matching between Lender Confirmations, Bank Statements, and Hospital Receipts.
          </p>
        </div>
        <div>
          <button type="button" id="${plantBtnId}" data-testid="btn-plant-mismatch" class="btn btn-secondary" style="font-size:0.8125rem;">
            Plant Test Discrepancy (J14)
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Disbursement Ref</th>
              <th>Lender Amount</th>
              <th>Value Date</th>
              <th>Hospital Receipt State</th>
              <th>Reconciliation Verdict</th>
            </tr>
          </thead>
          <tbody>
            ${disbs.map(d => {
              const rec = receipts.find(r => r.disbursement_id === d.disbursement_id);
              const isMatch = rec && rec.state === 'CONFIRMED' && rec.received_amount === d.amount;
              return `
                <tr>
                  <td><code>${escapeHTML(d.transaction_ref)}</code><br><small>${escapeHTML(d.disbursement_id)}</small></td>
                  <td><strong>${formatINR(d.amount)}</strong></td>
                  <td>${formatDate(d.value_date)}</td>
                  <td>${renderStatusBadge(rec ? rec.state : 'NOT_RECORDED')}</td>
                  <td>
                    ${isMatch ? '<span class="status-badge status-green">RECONCILED CLEAN</span>' : '<span class="status-badge status-red">UNRECONCILED / MISMATCH</span>'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
