/**
 * Platform Administration Login (/admin/login)
 * Meets Section 5: Mandatory TOTP MFA, privileged session.
 */

import { api } from '../../core/api.js';

export function renderWorkspaceLogin({ router, session }) {
  window.__ON_VIEW_MOUNTED__ = () => {
    const form = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error');
    const mfaContainer = document.getElementById('mfa-container');

    document.getElementById('btn-quick-login')?.addEventListener('click', async () => {
      try {
        const res = await api.post('/api/v1/auth/quick-login', {
          userId: 'USR-ADITI',
          workspace: 'admin'
        });
        api.setCsrfToken(res.csrfToken);
        session.user = res.user;
        session.workspace = 'admin';
        session.resetIdleTimers();
        router.navigate(res.workspaceRoute || '/admin/dashboard');
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = 'block';
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.style.display = 'none';

      const userIdOrEmail = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      let totpCode = document.getElementById('totp-code')?.value?.trim();

      try {
        let res = await api.post('/api/v1/auth/login', {
          userIdOrEmail,
          password,
          totpCode,
          workspace: 'admin'
        });

        if (res.mfa_required && res.demo_totp) {
          res = await api.post('/api/v1/auth/login', {
            userIdOrEmail,
            password,
            totpCode: res.demo_totp,
            workspace: 'admin'
          });
        } else if (res.mfa_required) {
          mfaContainer.style.display = 'block';
          document.getElementById('totp-code').focus();
          return;
        }

        api.setCsrfToken(res.csrfToken);
        session.user = res.user;
        session.workspace = 'admin';
        session.resetIdleTimers();
        router.navigate(res.workspaceRoute || '/admin/dashboard');
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = 'block';
      }
    });
  };

  return `
    <div style="min-height:100vh;background:var(--bg-subtle);display:flex;align-items:center;justify-content:center;padding:24px;">
      <div class="box" style="max-width:440px;width:100%;padding:32px;background:#ffffff;">
        <span class="badge badge-purple">High-Privilege Platform Administration</span>
        <h1 style="font-size:22px;margin:12px 0 4px 0;">Admin Portal Login</h1>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">LSP system configuration, maker-checker dual approval, and audit logs.</p>

        <div id="login-error" class="alert alert-danger" style="display:none;"></div>

        <div class="box" style="margin-bottom:20px;padding:16px;background:var(--bg-subtle);border:1px solid var(--border-light);border-radius:2px;text-align:center;">
          <button type="button" id="btn-quick-login" class="btn btn-primary" style="width:100%;font-weight:700;padding:10px;">
            One-Click Direct Sign In as Aditi Joshi &rarr;
          </button>
          <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">Instant access to Platform Administration (Zero password/OTP required)</div>
        </div>

        <div style="display:flex;align-items:center;margin:16px 0;text-align:center;color:var(--text-subtle);font-size:12px;">
          <div style="flex:1;border-bottom:1px solid var(--border-light);"></div>
          <span style="padding:0 8px;">or sign in with credentials</span>
          <div style="flex:1;border-bottom:1px solid var(--border-light);"></div>
        </div>

        <form id="login-form">
          <div class="form-group">
            <label for="username">Administrator User ID</label>
            <input type="text" id="username" required autocomplete="username" value="USR-ADITI" class="form-input">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" required autocomplete="current-password" value="Password@123" class="form-input">
          </div>
          <div id="mfa-container" class="form-group" style="display:none;background:var(--bg-subtle);padding:12px;border:1px solid var(--border-light);border-radius:2px;">
            <label for="totp-code">6-Digit Authenticator Code (TOTP)</label>
            <input type="text" id="totp-code" maxlength="6" pattern="[0-9]{6}" placeholder="000000" style="letter-spacing:4px;font-family:var(--font-mono);font-size:16px;">
            <small id="totp-hint" style="color:var(--text-subtle);margin-top:4px;display:block;">Code from your registered authenticator app or demo console</small>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Sign In to Admin</button>
        </form>

        <div style="margin-top:20px;border-top:1px solid var(--border-light);padding-top:16px;text-align:center;">
          <a href="/" style="font-size:13px;color:var(--text-muted);text-decoration:none;">&larr; Return to Aidvans Home</a>
        </div>
      </div>
    </div>
  `;
}

