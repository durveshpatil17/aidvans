/**
 * Hospital Billing Portal Login (/hospital/login)
 * Direct access without OTP authentication
 */

import { api } from '../../core/api.js';

export function renderWorkspaceLogin({ router, session }) {
  window.__ON_VIEW_MOUNTED__ = () => {
    const form = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error');

    document.getElementById('btn-quick-login')?.addEventListener('click', async () => {
      try {
        const res = await api.post('/api/v1/auth/quick-login', {
          userId: 'USR-SUNITA',
          workspace: 'hospital'
        });
        api.setCsrfToken(res.csrfToken);
        session.user = res.user;
        session.workspace = 'hospital';
        session.resetIdleTimers();
        router.navigate(res.workspaceRoute || '/hospital/dashboard');
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

      try {
        const res = await api.post('/api/v1/auth/login', {
          userIdOrEmail,
          password,
          workspace: 'hospital'
        });

        api.setCsrfToken(res.csrfToken);
        session.user = res.user;
        session.workspace = 'hospital';
        session.resetIdleTimers();
        router.navigate(res.workspaceRoute || '/hospital/dashboard');
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = 'block';
      }
    });
  };

  return `
    <div style="min-height:100vh;background:var(--bg-subtle);display:flex;align-items:center;justify-content:center;padding:24px;">
      <div class="box" style="max-width:440px;width:100%;padding:32px;background:#ffffff;">
        <span class="badge badge-emerald">Hospital Financial Operations</span>
        <h1 style="font-size:22px;margin:12px 0 4px 0;">Hospital Portal Login</h1>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">Dedicated portal for hospital finance, billing desks, and medical administrators.</p>

        <div id="login-error" class="alert alert-danger" style="display:none;"></div>

        <div class="box" style="margin-bottom:20px;padding:16px;background:var(--bg-subtle);border:1px solid var(--border-light);border-radius:2px;text-align:center;">
          <button type="button" id="btn-quick-login" class="btn btn-primary" style="width:100%;font-weight:700;padding:10px;">
            Sign In as Sunita Patil (1-Click Access) &rarr;
          </button>
          <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">Instant access to Hospital Finance Portal</div>
        </div>

        <div style="display:flex;align-items:center;margin:16px 0;text-align:center;color:var(--text-subtle);font-size:12px;">
          <div style="flex:1;border-bottom:1px solid var(--border-light);"></div>
          <span style="padding:0 8px;">or sign in with credentials</span>
          <div style="flex:1;border-bottom:1px solid var(--border-light);"></div>
        </div>

        <form id="login-form">
          <div class="form-group">
            <label for="username">Hospital Staff ID or Email</label>
            <input type="text" id="username" required autocomplete="username" value="USR-SUNITA" class="form-input">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" required autocomplete="current-password" value="Password@123" class="form-input">
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Sign In to Hospital Portal &rarr;</button>
        </form>

        <div style="margin-top:20px;border-top:1px solid var(--border-light);padding-top:16px;text-align:center;">
          <a href="/" style="font-size:13px;color:var(--text-muted);text-decoration:none;">&larr; Return to Aidvans Home</a>
        </div>
      </div>
    </div>
  `;
}
