/**
 * Enterprise Authentication & RBAC Workspace Access (AUTH-01)
 * Route: #/login
 */

import { escapeHTML } from '../ui.js';

export function renderLoginPage({ store, router }) {
  const state = store.getState();
  const users = state.users;

  // Split into staff personas and borrowers
  const staffUsers = users.filter(u => u.role !== 'BORROWER');
  const borrowerUsers = users.filter(u => u.role === 'BORROWER');

  window.__ON_VIEW_MOUNTED__ = () => {
    // Quick login persona cards
    document.querySelectorAll('[data-action="login-persona"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-user-id');
        const user = users.find(u => u.user_id === userId);
        if (!user) return;

        store.setCurrentUser(userId);

        // Route to respective workspace according to RBAC
        switch (user.role) {
          case 'EXECUTIVE':
            window.location.hash = '#/executive/dashboard';
            break;
          case 'HOSPITAL_ADMIN':
          case 'HOSPITAL_FINANCE':
          case 'HOSPITAL_REFERRAL':
            window.location.hash = '#/hospital/dashboard';
            break;
          case 'OPS_MANAGER':
            window.location.hash = '#/ops/dashboard';
            break;
          case 'PLATFORM_ADMIN':
          case 'SUPER_ADMIN':
            window.location.hash = '#/admin/dashboard';
            break;
          case 'COMPLIANCE_AUDITOR':
            window.location.hash = '#/compliance/consent';
            break;
          case 'SUPPORT_AGENT':
            window.location.hash = '#/support/tickets';
            break;
          case 'BORROWER':
          case 'PATIENT_VIEWER':
            window.location.hash = '#/borrower/overview';
            break;
          default:
            window.location.hash = '#/';
        }
      });
    });

    // Custom login form submission
    const form = document.getElementById('enterprise-login-form');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase()) || users[0];
        store.setCurrentUser(matchedUser.user_id);

        if (matchedUser.role === 'BORROWER') {
          window.location.hash = '#/borrower/overview';
        } else if (matchedUser.role.startsWith('HOSPITAL_')) {
          window.location.hash = '#/hospital/dashboard';
        } else if (matchedUser.role === 'OPS_MANAGER') {
          window.location.hash = '#/ops/dashboard';
        } else if (matchedUser.role === 'PLATFORM_ADMIN') {
          window.location.hash = '#/admin/dashboard';
        } else {
          window.location.hash = '#/executive/dashboard';
        }
      });
    }

    // Tab switcher between Staff and Borrower
    const staffTabBtn = document.getElementById('tab-btn-staff');
    const borrowerTabBtn = document.getElementById('tab-btn-borrower');
    const staffSection = document.getElementById('login-section-staff');
    const borrowerSection = document.getElementById('login-section-borrower');

    if (staffTabBtn && borrowerTabBtn) {
      staffTabBtn.addEventListener('click', () => {
        staffTabBtn.classList.add('tab-active');
        borrowerTabBtn.classList.remove('tab-active');
        staffSection.style.display = 'block';
        borrowerSection.style.display = 'none';
      });

      borrowerTabBtn.addEventListener('click', () => {
        borrowerTabBtn.classList.add('tab-active');
        staffTabBtn.classList.remove('tab-active');
        borrowerSection.style.display = 'block';
        staffSection.style.display = 'none';
      });
    }
  };

  return `
    <div class="auth-page-wrapper">
      <div class="auth-card-container">
        <!-- Brand Header -->
        <div class="auth-header">
          <div class="auth-brand-badge">RBI Compliant LSP Platform</div>
          <h1 class="auth-title">Enterprise Healthcare Financing Portal</h1>
          <p class="auth-subtitle">
            Secure, role-based workspace access for hospital desks, finance teams, operations, and borrowers.
          </p>
        </div>

        <!-- Auth Tabs -->
        <div class="auth-tabs" role="tablist">
          <button type="button" id="tab-btn-staff" class="auth-tab tab-active" role="tab" aria-selected="true">
            Hospital & Staff Workspace
          </button>
          <button type="button" id="tab-btn-borrower" class="auth-tab" role="tab" aria-selected="false">
            Borrower & Patient Access
          </button>
        </div>

        <!-- Section 1: Staff Workspaces -->
        <div id="login-section-staff" class="auth-tab-content">
          <div class="auth-instruction">
            Select a verified persona to enter their dedicated RBAC workspace:
          </div>

          <div class="persona-grid">
            ${staffUsers.map(u => {
              const roleTitle = u.role.replace(/_/g, ' ');
              let roleBadgeClass = 'badge-blue';
              if (u.role.includes('ADMIN')) roleBadgeClass = 'badge-purple';
              if (u.role.includes('HOSPITAL')) roleBadgeClass = 'badge-emerald';
              if (u.role.includes('OPS')) roleBadgeClass = 'badge-amber';

              return `
                <div class="persona-card">
                  <div class="persona-card-header">
                    <div class="persona-avatar">${escapeHTML(u.name.split(' ').map(n=>n[0]).join(''))}</div>
                    <div>
                      <div class="persona-name">${escapeHTML(u.name)}</div>
                      <span class="persona-role-badge ${roleBadgeClass}">${escapeHTML(roleTitle)}</span>
                    </div>
                  </div>
                  <p class="persona-context">${escapeHTML(u.context || 'Assigned to active hospital branch')}</p>
                  <div class="persona-card-footer">
                    <small class="persona-email">${escapeHTML(u.email)}</small>
                    <button type="button" class="btn btn-primary btn-sm" data-action="login-persona" data-user-id="${u.user_id}" data-testid="btn-login-${u.user_id}">
                      Access Workspace &rarr;
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="auth-divider"><span>Or Sign In with Corporate Email</span></div>

          <form id="enterprise-login-form" class="auth-form">
            <div class="form-group">
              <label for="login-email">Corporate Email Address</label>
              <input type="email" id="login-email" required placeholder="name@sahyadri.mock" value="priya.sharma@aidvans.mock" class="form-input">
            </div>
            <div class="form-group">
              <label for="login-password">Single Sign-On Password / MFA Token</label>
              <input type="password" id="login-password" required placeholder="••••••••••••" value="SecuredDemo123!" class="form-input">
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">
              Sign In to Enterprise Workspace
            </button>
          </form>
        </div>

        <!-- Section 2: Borrower Access -->
        <div id="login-section-borrower" class="auth-tab-content" style="display:none;">
          <div class="auth-instruction">
            Borrowers can link to active financing cases using their reference ID (FRID) or select a sample borrower persona:
          </div>

          <div class="persona-grid" style="grid-template-columns:1fr;margin-bottom:20px;">
            ${borrowerUsers.map(b => `
              <div class="persona-card">
                <div class="persona-card-header">
                  <div class="persona-avatar" style="background:#0ea5e9;">${escapeHTML(b.name.split(' ').map(n=>n[0]).join(''))}</div>
                  <div>
                    <div class="persona-name">${escapeHTML(b.name)}</div>
                    <span class="persona-role-badge badge-blue">Verified Borrower</span>
                  </div>
                </div>
                <p class="persona-context">${escapeHTML(b.context || 'Patient / Primary Borrower')}</p>
                <div class="persona-card-footer">
                  <small class="persona-email">Phone: ${escapeHTML(b.phone)}</small>
                  <button type="button" class="btn btn-primary btn-sm" data-action="login-persona" data-user-id="${b.user_id}" data-testid="btn-login-${b.user_id}">
                    Enter Mobile Journey &rarr;
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="box" style="background:var(--bg-subtle);">
            <h3>Link via Financing Reference ID (FRID)</h3>
            <p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:12px;">
              Enter the unique reference code provided by the hospital finance desk:
            </p>
            <div style="display:flex;gap:8px;">
              <input type="text" placeholder="e.g. HF-7K3M-9QX2" style="text-transform:uppercase;font-family:monospace;flex:1;">
              <a href="#/borrower/link" class="btn btn-primary">Open Linking Desk</a>
            </div>
          </div>
        </div>

        <!-- Compliance & Security Notice -->
        <div class="auth-footer-notice">
          <div><strong>Regulatory Compliance:</strong> Antigravity LSP operates under RBI Digital Lending Guidelines. Zero borrower fees collected. Zero loan or hospital funds handled.</div>
          <div style="margin-top:6px;font-size:0.75rem;color:var(--text-muted);">
            Protected by end-to-end audit logging &bull; Maker-Checker dual authorization &bull; Multi-tenant hospital isolation
          </div>
        </div>
      </div>
    </div>
  `;
}

