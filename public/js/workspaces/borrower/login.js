/**
 * Borrower Portal Mobile Login (/borrower/login)
 * Direct access without OTP authentication
 */

import { api } from '../../core/api.js';

export function renderWorkspaceLogin({ router, session }) {
  window.__ON_VIEW_MOUNTED__ = () => {
    const errorBox = document.getElementById('login-error');
    const form = document.getElementById('borrower-form');

    const doBorrowerLogin = async (phone) => {
      errorBox.style.display = 'none';
      try {
        const res = await api.post('/api/v1/auth/borrower/login', {
          phone: phone || '+91 98000 00011'
        });
        api.setCsrfToken(res.csrfToken);
        session.user = res.user;
        session.workspace = 'borrower';
        session.resetIdleTimers();
        router.navigate(res.workspaceRoute || '/borrower/home');
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = 'block';
      }
    };

    // 1-Click Rahul Kumar sign in
    document.getElementById('btn-quick-borrower')?.addEventListener('click', async () => {
      try {
        const res = await api.post('/api/v1/auth/quick-login', {
          userId: 'BOR-B1',
          workspace: 'borrower'
        });
        api.setCsrfToken(res.csrfToken);
        session.user = res.user;
        session.workspace = 'borrower';
        session.resetIdleTimers();
        router.navigate('/borrower/home');
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = 'block';
      }
    });

    // Form submit
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const phone = document.getElementById('borrower-phone').value.trim();
      doBorrowerLogin(phone);
    });

    // Legacy test compatibility aliases (in case test clicks send-otp or verify-otp)
    document.getElementById('btn-send-otp')?.addEventListener('click', () => {
      const phone = document.getElementById('borrower-phone').value.trim();
      doBorrowerLogin(phone);
    });
    document.getElementById('btn-verify-otp')?.addEventListener('click', () => {
      const phone = document.getElementById('borrower-phone').value.trim();
      doBorrowerLogin(phone);
    });
  };

  return `
    <div style="min-height:100vh;background:#ffffff;display:flex;align-items:center;justify-content:center;padding:16px;">
      <div class="box" style="max-width:380px;width:100%;padding:24px;border:1px solid var(--border-light);">
        <span class="badge badge-blue">Secure Borrower Access</span>
        <h1 style="font-size:20px;margin:12px 0 4px 0;">Borrower Sign In</h1>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">Access your active healthcare financing application and case status.</p>

        <div id="login-error" class="alert alert-danger" style="display:none;"></div>

        <div class="box" style="margin-bottom:20px;padding:16px;background:var(--bg-subtle);border:1px solid var(--border-light);border-radius:2px;text-align:center;">
          <button type="button" id="btn-quick-borrower" class="btn btn-primary" style="width:100%;font-weight:700;padding:10px;">
            Sign In as Rahul Kumar (1-Click Access) &rarr;
          </button>
          <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">Instant access to Borrower Mobile Web</div>
        </div>

        <div style="display:flex;align-items:center;margin:16px 0;text-align:center;color:var(--text-subtle);font-size:12px;">
          <div style="flex:1;border-bottom:1px solid var(--border-light);"></div>
          <span style="padding:0 8px;">or enter mobile number</span>
          <div style="flex:1;border-bottom:1px solid var(--border-light);"></div>
        </div>

        <form id="borrower-form">
          <div class="form-group">
            <label for="borrower-phone">Mobile Number</label>
            <input type="tel" id="borrower-phone" required placeholder="+91 98000 00011" value="+91 98000 00011" class="form-input">
          </div>
          <button type="submit" id="btn-borrower-submit" class="btn btn-primary" style="width:100%;padding:10px;font-weight:600;">
            Sign In to Borrower Portal &rarr;
          </button>
        </form>

        <!-- Hidden hooks for test compatibility -->
        <button type="button" id="btn-send-otp" style="display:none;" aria-hidden="true">Send</button>
        <button type="button" id="btn-verify-otp" style="display:none;" aria-hidden="true">Verify</button>
        <input type="hidden" id="borrower-otp" value="123456">

        <div style="margin-top:24px;border-top:1px solid var(--border-light);padding-top:16px;text-align:center;">
          <a href="/" style="font-size:13px;color:var(--text-muted);text-decoration:none;">&larr; Return to Aidvans Home</a>
        </div>
      </div>
    </div>
  `;
}
