/**
 * Compliance & Audit Workspace (/compliance/*)
 * Meets Section 7.6: Read-only consent ledger, access audit, and statutory reports.
 */

import { api } from '../../core/api.js';
import { renderDataTable } from '../../components/datatable.js';

export async function renderComplianceWorkspace(ctx, { router, session }) {
  const user = session.user;
  if (!user || (!['COMPLIANCE_AUDITOR', 'PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(user.role))) {
    return `<div class="alert alert-danger" style="margin:40px auto;max-width:480px;">Access Denied (403) - Auditor role required</div>`;
  }

  let auditLogs = [];
  try {
    const res = await api.get('/api/v1/audit/logs');
    auditLogs = res.logs || [];
  } catch {}

  const consentLogs = auditLogs.filter(a => a.action.includes('CONSENT'));

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="brand-title">COMPLIANCE DESK</span>
          <span class="brand-subtitle">Statutory DPDP Audit</span>
        </div>
        <nav class="sidebar-nav">
          <a href="/compliance/consent" class="nav-link active">Consent Registry</a>
          <a href="/compliance/audit" class="nav-link">Audit Trail</a>
        </nav>
        <div style="padding:16px;border-top:1px solid var(--border-light);font-size:12px;color:var(--text-muted);">
          <span>Auditor: <strong>${user.name}</strong></span><br>
          <button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px;width:100%;" onclick="fetch('/api/v1/auth/logout',{method:'POST'}).then(()=>window.location.href='/compliance/login')">Sign Out</button>
        </div>
      </aside>

      <div class="main-content">
        <header class="top-bar">
          <div class="top-bar-context"><span class="badge badge-purple">Compliance Auditor</span></div>
          <div class="top-bar-actions"><span style="font-size:13px;color:var(--text-muted);">${user.email}</span></div>
        </header>

        <main class="page-container">
          <h1>Consent Audit & Regulatory Ledger</h1>
          <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">Unbundled purpose-specific consent records and withdrawal history.</p>

          ${renderDataTable({
            columns: [
              { label: 'Timestamp (IST)', key: 'timestamp', render: val => new Date(val).toLocaleString('en-IN') },
              { label: 'Target Case', key: 'target_id' },
              { label: 'Consent Action', key: 'action', render: val => `<span class="badge badge-emerald">${val}</span>` },
              { label: 'Justification / Record', key: 'reason' }
            ],
            data: consentLogs,
            emptyMessage: 'No consent events logged yet.'
          })}
        </main>
      </div>
    </div>
  `;
}

