/**
 * Compliance Auditor Login (/compliance/login)
 */

import { api } from '../../core/api.js';

export function renderWorkspaceLogin({ router, session }) {
  window.__ON_VIEW_MOUNTED__ = () => {
    const form = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error');
    const mfaContainer = document.getElementById('mfa-container');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.style.display = 'none';

      const userIdOrEmail = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const totpCode = document.getElementById('totp-code')?.value?.trim();

      try {
        const res = await api.post('/api/v1/auth/login', {
          userIdOrEmail,
          password,
          totpCode,
          workspace: 'compliance'
        });

        if (res.mfa_required) {
          mfaContainer.style.display = 'block';
          if (res.demo_totp) {
            const totpInput = document.getElementById('totp-code');
            if (totpInput) totpInput.value = res.demo_totp;
            const hint = document.getElementById('totp-hint');
            if (hint) hint.innerHTML = `Code from authenticator app (Demo Code: <strong>${res.demo_totp}</strong>)`;
          }
          document.getElementById('totp-code').focus();
          return;
        }

        api.setCsrfToken(res.csrfToken);
        session.user = res.user;
        session.workspace = 'compliance';
        session.resetIdleTimers();
        router.navigate(res.workspaceRoute || '/compliance/consent');
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = 'block';
      }
    });
  };

  return `
    <div style="min-height:100vh;background:var(--bg-subtle);display:flex;align-items:center;justify-content:center;padding:24px;">
      <div class="box" style="max-width:440px;width:100%;padding:32px;background:#ffffff;">
        <span class="badge badge-purple">Statutory Compliance & Audit</span>
        <h1 style="font-size:22px;margin:12px 0 4px 0;">Compliance Login</h1>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">Consent audit logs, access monitoring, and DPDP regulatory oversight.</p>
        <div id="login-error" class="alert alert-danger" style="display:none;"></div>
        <form id="login-form">
          <div class="form-group">
            <label for="username">Auditor ID</label>
            <input type="text" id="username" required value="USR-ROHAN" class="form-input">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" required value="Password@123" class="form-input">
          </div>
          <div id="mfa-container" class="form-group" style="display:none;background:var(--bg-subtle);padding:12px;border:1px solid var(--border-light);border-radius:2px;">
            <label for="totp-code">6-Digit Authenticator Code (TOTP)</label>
            <input type="text" id="totp-code" maxlength="6" pattern="[0-9]{6}" placeholder="000000" style="letter-spacing:4px;font-family:var(--font-mono);font-size:16px;">
            <small id="totp-hint" style="color:var(--text-subtle);margin-top:4px;display:block;">Code from your registered authenticator app or demo console</small>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Sign In to Compliance</button>
        </form>
        <div style="margin-top:20px;border-top:1px solid var(--border-light);padding-top:16px;text-align:center;">
          <a href="/" style="font-size:13px;color:var(--text-muted);text-decoration:none;">&larr; Aidvans Home</a>
        </div>
      </div>
    </div>
  `;
}

