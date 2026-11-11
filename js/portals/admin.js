/**
 * Admin Portal (ADM-01 to ADM-13)
 * Meets TDS Section 4.2 & Maker-Checker Security Governance
 */

import { escapeHTML, renderStatusBadge, renderEmptyState, renderErrorState, renderSuccessState, formatINR, formatDate, formatDateTime } from '../ui.js';

export function renderAdminDashboard({ store, user }) {
  const state = store.getState();
  const staff = state.users.filter(u => u.role !== 'BORROWER');
  const pendingMakerChecker = (state.beneficiary_change_requests || []).filter(r => r.status === 'PENDING_MAKER_CHECKER_APPROVAL');

  return `
    <div class="box">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <h1>Platform Administration (ADM-01)</h1>
          <p style="color:var(--text-muted);margin:0;">
            Platform Admin: <strong>${escapeHTML(user.name)}</strong> | Role: <strong>${escapeHTML(user.role)}</strong>
          </p>
        </div>
        <div style="display:flex;gap:8px;">
          <a href="#/admin/hospitals" class="btn btn-secondary">Maker-Checker Approvals (${pendingMakerChecker.length})</a>
          <a href="#/admin/audit" class="btn btn-primary">Platform Audit Logs</a>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:24px;">
        <div class="box" style="margin:0;">
          <small style="color:var(--text-muted);">Active Staff Accounts</small>
          <div style="font-size:1.5rem;font-weight:700;">${staff.filter(s => s.status === 'ACTIVE').length}</div>
        </div>
        <div class="box" style="margin:0;">
          <small style="color:var(--text-muted);">Partner Lenders</small>
          <div style="font-size:1.5rem;font-weight:700;">${state.organizations.filter(o => o.org_type === 'NBFC').length}</div>
        </div>
        <div class="box" style="margin:0;">
          <small style="color:var(--text-muted);">Pending Dual Approvals</small>
          <div style="font-size:1.5rem;font-weight:700;color:${pendingMakerChecker.length > 0 ? 'var(--status-amber)' : 'inherit'};">${pendingMakerChecker.length}</div>
        </div>
      </div>

      <h2>Quick Administration Navigation</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:12px;">
        <div class="box">
          <h3>User Directory (ADM-02)</h3>
          <p style="font-size:0.875rem;color:var(--text-muted);">Manage staff accounts, assign hospital branches, and deactivate credentials.</p>
          <a href="#/admin/users" class="btn btn-secondary" style="font-size:0.8125rem;">Open User Directory</a>
        </div>
        <div class="box">
          <h3>Beneficiary Governance (ADM-05)</h3>
          <p style="font-size:0.875rem;color:var(--text-muted);">Review and approve hospital bank account changes via maker-checker dual authorization.</p>
          <a href="#/admin/hospitals" class="btn btn-secondary" style="font-size:0.8125rem;">Maker-Checker Workbench</a>
        </div>
        <div class="box">
          <h3>Lender Products (ADM-07)</h3>
          <p style="font-size:0.875rem;color:var(--text-muted);">Configure single upfront vs multi-drawdown parameters and KFS templates.</p>
          <a href="#/admin/products" class="btn btn-secondary" style="font-size:0.8125rem;">Configure Products</a>
        </div>
      </div>
    </div>
  `;
}

export function renderUserDirectory({ store, user }) {
  const state = store.getState();
  const staff = state.users.filter(u => u.role !== 'BORROWER');

  window.__ON_VIEW_MOUNTED__ = () => {
    document.querySelectorAll('[data-action="deactivate-user"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-user-id');
        const target = staff.find(s => s.user_id === targetId);

        store.update(s => ({
          ...s,
          users: s.users.map(u => u.user_id === targetId ? { ...u, status: 'DEACTIVATED', deactivated_at: new Date().toISOString() } : u)
        }));

        store.audit.log({
          actorId: user.user_id,
          actorRole: user.role,
          action: 'STAFF_DEACTIVATED',
          targetType: 'USER',
          targetId: targetId,
          reason: `Admin deactivated staff account ${target?.name} (AT-24/J15 rule: session revoked, case history preserved)`
        });

        window.location.reload();
      });
    });
  };

  return `
    <div class="box">
      <h1>Staff User Directory (ADM-02)</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Workforce account management. No shared accounts permitted (TDS Section 3.6).
      </p>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Staff Name</th>
              <th>Role</th>
              <th>Assigned Organisation / Scope</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${staff.map(s => `
              <tr>
                <td><strong>${escapeHTML(s.name)}</strong><br><small style="color:var(--text-muted);">${escapeHTML(s.email)}</small></td>
                <td><code>${escapeHTML(s.role)}</code></td>
                <td>${escapeHTML(s.assigned_hospital_ids ? s.assigned_hospital_ids.join(', ') : s.org_id)}</td>
                <td>
                  <span class="status-badge ${s.status === 'ACTIVE' ? 'status-green' : 'status-red'}">${escapeHTML(s.status)}</span>
                </td>
                <td>
                  ${s.status === 'ACTIVE' && s.user_id !== user.user_id ? `
                    <button type="button" class="btn btn-secondary" style="min-height:36px;padding:4px 8px;font-size:0.8125rem;color:var(--status-red);" data-action="deactivate-user" data-user-id="${s.user_id}" data-testid="btn-deactivate-${s.user_id}">
                      Deactivate
                    </button>
                  ` : `
                    <small style="color:var(--text-muted);">Immutable</small>
                  `}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderHospitalAdminManagement({ store, user }) {
  const state = store.getState();
  const requests = (state.beneficiary_change_requests || []).filter(r => r.status === 'PENDING_MAKER_CHECKER_APPROVAL');

  window.__ON_VIEW_MOUNTED__ = () => {
    document.querySelectorAll('[data-action="dual-approve-bcr"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const reqId = btn.getAttribute('data-request-id');
        const req = (state.beneficiary_change_requests || []).find(r => r.request_id === reqId);
        if (!req) return;

        // Apply change to verified beneficiary account
        const newBenefId = `BENEF-${Date.now().toString().slice(-4)}`;
        const newBenef = {
          beneficiary_id: newBenefId,
          branch_id: req.branch_id,
          hospital_id: req.hospital_id,
          account_holder: `${req.bank_name} Operations`,
          bank_name: req.bank_name,
          ifsc: req.ifsc,
          account_number_masked: req.account_number_masked,
          account_number_raw: req.account_number_raw,
          verification_status: 'VERIFIED',
          effective_from: new Date().toISOString()
        };

        store.update(s => ({
          ...s,
          beneficiary_accounts: [newBenef, ...s.beneficiary_accounts],
          beneficiary_change_requests: (s.beneficiary_change_requests || []).map(r => r.request_id === reqId ? { ...r, status: 'APPROVED', approved_by: user.user_id, approved_at: new Date().toISOString() } : r)
        }));

        store.audit.log({
          actorId: user.user_id,
          actorRole: user.role,
          action: 'MAKER_CHECKER_BENEFICIARY_APPROVED',
          targetType: 'BENEFICIARY_ACCOUNT',
          targetId: newBenefId,
          reason: `Platform admin completed dual approval for bank account change ${req.bank_name} (${req.account_number_masked})`
        });

        window.location.reload();
      });
    });

    document.querySelectorAll('[data-action="dual-reject-bcr"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const reqId = btn.getAttribute('data-request-id');
        const req = (state.beneficiary_change_requests || []).find(r => r.request_id === reqId);
        if (!req) return;

        store.update(s => ({
          ...s,
          beneficiary_change_requests: (s.beneficiary_change_requests || []).map(r => r.request_id === reqId ? { ...r, status: 'REJECTED', rejected_by: user.user_id, rejected_at: new Date().toISOString() } : r)
        }));

        store.audit.log({
          actorId: user.user_id,
          actorRole: user.role,
          action: 'MAKER_CHECKER_BENEFICIARY_REJECTED',
          targetType: 'BENEFICIARY_ACCOUNT',
          targetId: reqId,
          reason: `Platform admin rejected bank account change ${req.bank_name} (${req.account_number_masked}); previous active account retained`
        });

        window.location.reload();
      });
    });
  };

  return `
    <div class="box">
      <h1>Beneficiary Account Dual-Approval Workbench (ADM-05)</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Maker-Checker Gate: Hospital bank account updates require independent platform approval (AT-18, J13).
      </p>

      ${requests.length === 0 ? renderEmptyState('No Pending Approvals', 'All beneficiary bank account changes have been resolved.') : `
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Request Ref</th>
                <th>Hospital Org</th>
                <th>Proposed Bank</th>
                <th>IFSC</th>
                <th>Proposed Account (Masked)</th>
                <th>Requested By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${requests.map(r => `
                <tr>
                  <td><code>${escapeHTML(r.request_id)}</code></td>
                  <td>${escapeHTML(r.hospital_id)}</td>
                  <td><strong>${escapeHTML(r.bank_name)}</strong></td>
                  <td><code>${escapeHTML(r.ifsc)}</code></td>
                  <td>${escapeHTML(r.account_number_masked)}</td>
                  <td><code>${escapeHTML(r.requested_by)}</code></td>
                  <td>
                    <div style="display:flex;gap:6px;">
                      <button type="button" class="btn btn-primary" style="min-height:36px;padding:4px 8px;font-size:0.8125rem;" data-action="dual-approve-bcr" data-request-id="${r.request_id}" data-testid="btn-approve-bcr-${r.request_id}">
                        Dual Approve
                      </button>
                      <button type="button" class="btn btn-secondary" style="min-height:36px;padding:4px 8px;font-size:0.8125rem;color:var(--status-red);" data-action="dual-reject-bcr" data-request-id="${r.request_id}" data-testid="btn-reject-bcr-${r.request_id}">
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

export function renderProductConfiguration({ store }) {
  const products = store.getState().lender_products;
  return `
    <div class="box">
      <h1>Lender Product Configuration (ADM-07)</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Regulated product terms sourced from signed NBFC master agreements.
      </p>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Product Code</th>
              <th>Lender ID</th>
              <th>Product Name</th>
              <th>Drawdown Mode</th>
              <th>Ticket Range</th>
              <th>Indicative APR</th>
              <th>KFS Template</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td><code>${escapeHTML(p.product_id)}</code></td>
                <td><strong>${escapeHTML(p.lender_id)}</strong></td>
                <td>${escapeHTML(p.product_name)}</td>
                <td>
                  <span class="status-badge ${p.multi_drawdown ? 'status-green' : 'status-neutral'}">
                    ${p.multi_drawdown ? 'MULTI_DRAWDOWN' : 'SINGLE_DISBURSEMENT'}
                  </span>
                </td>
                <td>${formatINR(p.min_amount)} – ${formatINR(p.max_amount)}</td>
                <td>${escapeHTML(p.apr_display)}</td>
                <td><code>${escapeHTML(p.kfs_template)}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderAuditLogs({ store }) {
  const logs = [...store.getState().audit_logs].reverse();

  return `
    <div class="box">
      <h1>Platform Audit & Access Trail (ADM-13)</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Append-only, tamper-evident security audit log (TDS Section 11.5).
      </p>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor ID</th>
              <th>Role</th>
              <th>Action</th>
              <th>Target</th>
              <th>Reason / Particulars</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => `
              <tr>
                <td><small>${formatDateTime(l.timestamp)}</small></td>
                <td><code>${escapeHTML(l.actor_id)}</code></td>
                <td>${escapeHTML(l.actor_role)}</td>
                <td><strong>${escapeHTML(l.action)}</strong></td>
                <td><code>${escapeHTML(l.target_type)}:${escapeHTML(l.target_id)}</code></td>
                <td>${escapeHTML(l.reason)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
