/**
 * Unified Workspace Login Portal (/login)
 * One-Click direct access buttons for all role workspaces.
 */

import { api } from '../../core/api.js';

export function renderAllLoginsPortal({ router, session }) {
  window.__ON_VIEW_MOUNTED__ = () => {
    document.querySelectorAll('.btn-quick-access').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const userId = e.currentTarget.getAttribute('data-user-id');
        const workspace = e.currentTarget.getAttribute('data-workspace');

        try {
          const res = await api.post('/api/v1/auth/quick-login', { userId, workspace });
          api.setCsrfToken(res.csrfToken);
          session.user = res.user;
          session.workspace = workspace;
          session.resetIdleTimers();
          router.navigate(res.workspaceRoute);
        } catch (err) {
          const errBox = document.getElementById('login-portal-error');
          if (errBox) {
            errBox.textContent = err.message;
            errBox.style.display = 'block';
          }
        }
      });
    });
  };

  const PERSONAS = [
    {
      role: 'EXECUTIVE',
      name: 'Priya Sharma',
      badge: 'Hospital Desk',
      badgeClass: 'badge-blue',
      userId: 'USR-PRIYA',
      workspace: 'executive',
      description: 'Originate financing cases, generate check-digit FRIDs, print invitation slips, and provide objective offer assistance.',
      targetUrl: '/executive/dashboard'
    },
    {
      role: 'HOSPITAL_FINANCE',
      name: 'Sunita Patil',
      badge: 'Hospital Finance',
      badgeClass: 'badge-emerald',
      userId: 'USR-SUNITA',
      workspace: 'hospital',
      description: 'Submit treatment payment demands, confirm hospital bank receipts against lender UTRs, and manage verified bank accounts.',
      targetUrl: '/hospital/dashboard'
    },
    {
      role: 'BORROWER',
      name: 'Rahul Kumar',
      badge: 'Borrower Mobile Web',
      badgeClass: 'badge-blue',
      userId: 'BOR-B1',
      workspace: 'borrower',
      description: 'Mobile web portal (360px viewport). Link FRID, grant DPDP purpose-specific consent, review KFS, and execute loan agreements.',
      targetUrl: '/borrower/home'
    },
    {
      role: 'OPS_MANAGER',
      name: 'Vikram Malhotra',
      badge: 'Central Operations',
      badgeClass: 'badge-amber',
      userId: 'USR-VIKRAM',
      workspace: 'ops',
      description: 'SLA queues, exception workbench (bank statement evidence required), and daily 3-way reconciliation balancing to zero variance.',
      targetUrl: '/ops/dashboard'
    },
    {
      role: 'PLATFORM_ADMIN',
      name: 'Aditi Joshi',
      badge: 'Platform Administration',
      badgeClass: 'badge-purple',
      userId: 'USR-ADITI',
      workspace: 'admin',
      description: 'Checker dual-approval for hospital beneficiary bank accounts, lender configuration, user directory, and audit logs.',
      targetUrl: '/admin/dashboard'
    },
    {
      role: 'COMPLIANCE_AUDITOR',
      name: 'Rohan Sen',
      badge: 'Regulatory Compliance',
      badgeClass: 'badge-purple',
      userId: 'USR-ROHAN',
      workspace: 'compliance',
      description: 'Read-only consent audit ledger, statutory data retention oversight, and DPDP regulatory compliance reports.',
      targetUrl: '/compliance/consent'
    },
    {
      role: 'SUPPORT_AGENT',
      name: 'Neha Kulkarni',
      badge: 'Customer Support',
      badgeClass: 'badge-blue',
      userId: 'USR-NEHA',
      workspace: 'support',
      description: 'Masked case status inquiry, customer assistance, and borrower grievance redirection to regulated NBFC channels.',
      targetUrl: '/support/tickets'
    }
  ];

  return `
    <div style="min-height:100vh;background:var(--bg-subtle);display:flex;flex-direction:column;">
      <header class="top-bar" style="height:64px;">
        <div class="top-bar-context">
          <span class="brand-title">AIDVANS HEALTHCARE FINANCING</span>
          <span style="font-size:12px;color:var(--text-subtle);">| Quick Access Portal</span>
        </div>
        <div class="top-bar-actions">
          <a href="/" class="nav-link">&larr; Return to Home</a>
          <a href="http://localhost:3001/" target="_blank" class="btn btn-secondary btn-sm">Lender Sandbox (Port 3001) &nearr;</a>
        </div>
      </header>

      <main class="page-container" style="max-width:1040px;margin:32px auto;padding:0 16px;flex:1;">
        <div class="box" style="padding:24px 32px;margin-bottom:24px;border-left:4px solid var(--primary);background:#ffffff;">
          <span class="badge badge-blue">One-Click Persona Access</span>
          <h1 style="font-size:24px;margin:8px 0 6px 0;">Instant Workspace Access Portal</h1>
          <p style="font-size:14px;color:var(--text-muted);margin:0;">
            Click any profile below to sign in immediately and access that role's workspace panel.
            Zero password or OTP entry required.
          </p>
          <div id="login-portal-error" class="alert alert-danger" style="display:none;margin-top:16px;"></div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(310px, 1fr));gap:16px;">
          ${PERSONAS.map(p => `
            <div class="box" style="margin:0;display:flex;flex-direction:column;justify-content:space-between;background:#ffffff;border:1px solid var(--border-light);padding:20px;">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                  <span class="badge ${p.badgeClass}">${p.badge}</span>
                  <code style="font-size:11px;color:var(--text-subtle);background:#f1f5f9;padding:2px 6px;">${p.userId}</code>
                </div>
                <h3 style="font-size:17px;margin:0 0 6px 0;color:var(--text-main);">${p.name}</h3>
                <p style="font-size:13px;color:var(--text-muted);line-height:1.4;margin:0 0 16px 0;">${p.description}</p>
              </div>
              <div>
                <button type="button" class="btn btn-primary btn-quick-access" data-user-id="${p.userId}" data-workspace="${p.workspace}" style="width:100%;font-weight:600;padding:8px 14px;">
                  One-Click Access to ${p.name.split(' ')[0]}'s Panel &rarr;
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </main>
    </div>
  `;
}
