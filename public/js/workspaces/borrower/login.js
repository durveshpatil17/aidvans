/**
 * Borrower Portal Mobile Login (/borrower/login)
 */

import { api } from '../../core/api.js';

export function renderWorkspaceLogin({ router, session }) {
  window.__ON_VIEW_MOUNTED__ = () => {
    const phoneStep = document.getElementById('step-phone');
    const otpStep = document.getElementById('step-otp');
    const errorBox = document.getElementById('login-error');
    let targetPhone = '';

    document.getElementById('btn-send-otp').addEventListener('click', async () => {
      errorBox.style.display = 'none';
      targetPhone = document.getElementById('borrower-phone').value.trim();

      try {
        await api.post('/api/v1/auth/borrower/request-otp', { phone: targetPhone });
        phoneStep.style.display = 'none';
        otpStep.style.display = 'block';
        document.getElementById('display-phone').textContent = targetPhone;
        document.getElementById('borrower-otp').focus();
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = 'block';
      }
    });

    document.getElementById('btn-verify-otp').addEventListener('click', async () => {
      errorBox.style.display = 'none';
      const otp = document.getElementById('borrower-otp').value.trim();

      try {
        const res = await api.post('/api/v1/auth/borrower/verify-otp', {
          phone: targetPhone,
          otp
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
  };

  return `
    <div style="min-height:100vh;background:#ffffff;display:flex;align-items:center;justify-content:center;padding:16px;">
      <div class="box" style="max-width:380px;width:100%;padding:24px;border:1px solid var(--border-light);">
        <span class="badge badge-blue">Secure Borrower Access</span>
        <h1 style="font-size:20px;margin:12px 0 4px 0;">Borrower Sign In</h1>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">Enter your registered Indian mobile number to receive a secure login code.</p>

        <div id="login-error" class="alert alert-danger" style="display:none;"></div>

        <div id="step-phone">
          <div class="form-group">
            <label for="borrower-phone">Mobile Number</label>
            <input type="tel" id="borrower-phone" required placeholder="+91 98000 00011" value="+91 98000 00011" class="form-input">
          </div>
          <button type="button" id="btn-send-otp" class="btn btn-primary" style="width:100%;">Send Login Code &rarr;</button>
        </div>

        <div id="step-otp" style="display:none;">
          <p style="font-size:13px;color:var(--text-muted);">Enter code sent to <strong id="display-phone"></strong>:</p>
          <div class="form-group">
            <label for="borrower-otp">6-Digit SMS Code</label>
            <input type="text" id="borrower-otp" maxlength="6" pattern="[0-9]{6}" placeholder="000000" style="letter-spacing:4px;font-family:var(--font-mono);font-size:18px;">
          </div>
          <button type="button" id="btn-verify-otp" class="btn btn-primary" style="width:100%;">Verify & Open Case</button>
        </div>

        <div style="margin-top:24px;border-top:1px solid var(--border-light);padding-top:16px;text-align:center;">
          <a href="/" style="font-size:13px;color:var(--text-muted);text-decoration:none;">&larr; Aidvans Home</a>
        </div>
      </div>
    </div>
  `;
}
