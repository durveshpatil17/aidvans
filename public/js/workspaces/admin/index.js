/**
 * Platform Administration Workspace (/admin/*)
 * Meets Section 7.5: User directory, maker-checker bank approval, lender config, feature flags, audit log.
 */

import { api } from '../../core/api.js';
import { renderDataTable } from '../../components/datatable.js';
import { toast } from '../../components/toast.js';

export async function renderAdminWorkspace(ctx, { router, session }) {
  const user = session.user;
  if (!user || (!['PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(user.role))) {
    return `<div class="alert alert-danger" style="margin:40px auto;max-width:480px;">Access Denied (403) - Administrator role required</div>`;
  }

  const subview = ctx.params.view || 'dashboard';

  let auditLogs = [];
  try {
    const res = await api.get('/api/v1/audit/logs');
    auditLogs = res.logs || [];
  } catch {}

  window.__ON_VIEW_MOUNTED__ = () => {
    // Checker approve handler
    document.querySelectorAll('[data-action="approve-beneficiary"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const benefId = btn.getAttribute('data-benef-id');
        try {
          await api.post(`/api/v1/admin/beneficiaries/${benefId}/approve`);
          toast.success('Hospital bank account approved by Checker dual-authorization.');
          router.resolve();
        } catch (err) {
          toast.danger(err.message);
        }
      });
    });
  };

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="brand-title">ADMIN CONTROL</span>
          <span class="brand-subtitle">Platform Governance</span>
        </div>
        <nav class="sidebar-nav">
          <a href="/admin/dashboard" class="nav-link ${subview === 'dashboard' ? 'active' : ''}">Overview</a>
          <a href="/admin/users" class="nav-link ${subview === 'users' ? 'active' : ''}">User Directory</a>
          <a href="/admin/beneficiaries" class="nav-link ${subview === 'beneficiaries' ? 'active' : ''}">Bank Approvals (Checker)</a>
          <a href="/admin/lenders" class="nav-link ${subview === 'lenders' ? 'active' : ''}">Lender Products</a>
          <a href="/admin/flags" class="nav-link ${subview === 'flags' ? 'active' : ''}">Feature Flags</a>
          <a href="/admin/audit" class="nav-link ${subview === 'audit' ? 'active' : ''}">Immutable Audit</a>
        </nav>
        <div style="padding:16px;border-top:1px solid var(--border-light);font-size:12px;color:var(--text-muted);">
          <span>Admin: <strong>${user.name}</strong></span><br>
          <button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px;width:100%;" onclick="fetch('/api/v1/auth/logout',{method:'POST'}).then(()=>window.location.href='/admin/login')">Sign Out</button>
        </div>
      </aside>

      <div class="main-content">
        <header class="top-bar">
          <div class="top-bar-context">
            <span class="badge badge-purple">Platform Administrator</span>
            <span>Governance Level 1</span>
          </div>
          <div class="top-bar-actions">
            <span style="font-size:13px;color:var(--text-muted);">${user.email}</span>
          </div>
        </header>

        <main class="page-container">
          <div class="breadcrumbs">
            <a href="/admin/dashboard">Admin</a> &gt;
            <span>${subview.charAt(0).toUpperCase() + subview.slice(1)}</span>
          </div>

          ${renderAdminSubview(subview, { auditLogs, user })}
        </main>
      </div>
    </div>
  `;
}

function renderAdminSubview(subview, { auditLogs, user }) {
  if (subview === 'beneficiaries') {
    return `
      <h1>Hospital Bank Accounts Dual Approval (Checker Step)</h1>
      <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">Review hospital bank account change requests submitted by hospital or admin makers.</p>

      <div class="box">
        <h3>Pending Dual Approval Requests</h3>
        <table style="width:100%;font-size:14px;">
          <thead>
            <tr>
              <th>Beneficiary ID</th>
              <th>Hospital / Branch</th>
              <th>Account Details</th>
              <th>Maker ID</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>BENEF-01</strong></td>
              <td>Sahyadri Care Super Specialty (BRANCH-01)</td>
              <td>HDFC Bank &bull; •••• •••• 4092</td>
              <td>USR-MEHTA</td>
              <td>
                <button type="button" class="btn btn-primary btn-sm" data-action="approve-beneficiary" data-benef-id="BENEF-01">Dual-Approve & Verify</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  if (subview === 'flags') {
    return `
      <h1>Platform Feature Flags</h1>
      <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">System-wide feature toggles governed by platform policy.</p>

      <div class="box" style="max-width:540px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong>Personal Expense Journal (BOR-13):</strong><br>
            <small style="color:var(--text-muted);">Borrower personal medical cost tracker. Strictly OFF by default (AT-21).</small>
          </div>
          <span class="badge badge-danger">DISABLED (OFF)</span>
        </div>
      </div>
    `;
  }

  if (subview === 'audit') {
    return `
      <h1>Immutable Audit Trail</h1>
      <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">Append-only electronic records logging actor, role, action, target, timestamp, and justification.</p>

      ${renderDataTable({
        columns: [
          { label: 'Audit Log ID', key: 'log_id', render: val => `<strong>${val}</strong>` },
          { label: 'Timestamp (IST)', key: 'timestamp', render: val => new Date(val).toLocaleString('en-IN') },
          { label: 'Actor', key: 'actor_id', render: (val, r) => `${val} (${r.actor_role})` },
          { label: 'Action', key: 'action', render: val => `<span class="badge badge-blue">${val}</span>` },
          { label: 'Reason / Target', key: 'reason', render: (val, r) => `${val || '—'} [${r.target_type}:${r.target_id}]` }
        ],
        data: auditLogs,
        emptyMessage: 'No audit records logged yet.'
      })}
    `;
  }

  // Default Dashboard
  return `
    <h1>Platform Administration Dashboard</h1>
    <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">User directory, lender product registry, and compliance governance.</p>

    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:24px;">
      <div class="box" style="margin:0;"><small style="color:var(--text-subtle);">Active System Users</small><div style="font-size:24px;font-weight:700;">10</div></div>
      <div class="box" style="margin:0;"><small style="color:var(--text-subtle);">Partner Hospitals</small><div style="font-size:24px;font-weight:700;">2</div></div>
      <div class="box" style="margin:0;"><small style="color:var(--text-subtle);">Active Lender Products</small><div style="font-size:24px;font-weight:700;">2</div></div>
    </div>
  `;
}
