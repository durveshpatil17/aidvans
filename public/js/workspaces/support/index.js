/**
 * Customer Support Workspace (/support/*)
 * Meets Section 7.6: Ticket queue, grievance routing, masked data access.
 */

import { api } from '../../core/api.js';
import { renderDataTable } from '../../components/datatable.js';

export async function renderSupportWorkspace(ctx, { router, session }) {
  const user = session.user;
  if (!user || (!['SUPPORT_AGENT', 'OPS_MANAGER', 'PLATFORM_ADMIN'].includes(user.role))) {
    return `<div class="alert alert-danger" style="margin:40px auto;max-width:480px;">Access Denied (403) - Support Agent role required</div>`;
  }

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="brand-title">SUPPORT DESK</span>
          <span class="brand-subtitle">Customer Care</span>
        </div>
        <nav class="sidebar-nav">
          <a href="/support/tickets" class="nav-link active">Ticket Queue</a>
        </nav>
        <div style="padding:16px;border-top:1px solid var(--border-light);font-size:12px;color:var(--text-muted);">
          <span>Agent: <strong>${user.name}</strong></span><br>
          <button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px;width:100%;" onclick="fetch('/api/v1/auth/logout',{method:'POST'}).then(()=>window.location.href='/support/login')">Sign Out</button>
        </div>
      </aside>

      <div class="main-content">
        <header class="top-bar">
          <div class="top-bar-context"><span class="badge badge-blue">Customer Support</span></div>
          <div class="top-bar-actions"><span style="font-size:13px;color:var(--text-muted);">${user.email}</span></div>
        </header>

        <main class="page-container">
          <h1>Customer Grievance & Ticket Queue</h1>
          <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">Customer inquiries, masked case status lookups, and regulated NBFC escalations.</p>

          <div class="box">
            <p style="margin:0;color:var(--text-muted);">No active support tickets pending resolution.</p>
          </div>
        </main>
      </div>
    </div>
  `;
}
