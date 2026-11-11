/**
 * Executive Desk Login Page (/executive/login)
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
          workspace: 'executive'
        });

        if (res.mfa_required) {
          mfaContainer.style.display = 'block';
          document.getElementById('totp-code').focus();
          return;
        }

        // Successfully authenticated
        api.setCsrfToken(res.csrfToken);
        session.user = res.user;
        session.workspace = 'executive';
        session.resetIdleTimers();
        router.navigate(res.workspaceRoute || '/executive/dashboard');
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = 'block';
      }
    });
  };

  return `
    <div style="min-height:100vh;background:var(--bg-subtle);display:flex;align-items:center;justify-content:center;padding:24px;">
      <div class="box" style="max-width:440px;width:100%;padding:32px;background:#ffffff;">
        <span class="badge badge-blue">Hospital Desk Operations</span>
        <h1 style="font-size:22px;margin:12px 0 4px 0;">Executive Desk Login</h1>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">Stationed executive authentication. Single Sign-On and TOTP MFA enforced.</p>

        <div id="login-error" class="alert alert-danger" style="display:none;"></div>

        <form id="login-form">
          <div class="form-group">
            <label for="username">Corporate User ID or Email</label>
            <input type="text" id="username" required autocomplete="username" value="USR-PRIYA" class="form-input">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" required autocomplete="current-password" value="Password@123" class="form-input">
          </div>
          <div id="mfa-container" class="form-group" style="display:none;background:var(--bg-subtle);padding:12px;border:1px solid var(--border-light);border-radius:2px;">
            <label for="totp-code">6-Digit Authenticator Code (TOTP)</label>
            <input type="text" id="totp-code" maxlength="6" pattern="[0-9]{6}" placeholder="000000" style="letter-spacing:4px;font-family:var(--font-mono);font-size:16px;">
            <small style="color:var(--text-subtle);margin-top:4px;display:block;">Code from your registered authenticator app or demo console</small>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Sign In to Desk</button>
        </form>

        <div style="margin-top:20px;border-top:1px solid var(--border-light);padding-top:16px;text-align:center;">
          <a href="/" style="font-size:13px;color:var(--text-muted);text-decoration:none;">&larr; Return to Aidvans Home</a>
        </div>
      </div>
    </div>
  `;
}

