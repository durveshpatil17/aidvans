/**
 * Demo Console (/demo)
 * Meets Section 6: Credentials table with live TOTP, simulated SMS & Email outboxes, clock controls.
 * Gated behind DEMO_MODE=1.
 */

import { api } from '../../core/api.js';
import { toast } from '../../components/toast.js';

export async function renderDemoConsole() {
  let demoState = { users: [], outboxes: { sms: [], email: [] }, timeOffsetMs: 0 };
  try {
    demoState = await api.get('/api/v1/demo/state');
  } catch (err) {
    return `
      <div style="padding:48px 24px;text-align:center;max-width:440px;margin:40px auto;">
        <h2>404 — Demo Console Disabled</h2>
        <p style="color:var(--text-muted);">The demo console is not available in production mode (DEMO_MODE=0).</p>
        <a href="/" class="btn btn-secondary btn-sm">Return Home</a>
      </div>
    `;
  }

  window.__ON_VIEW_MOUNTED__ = () => {
    // Reset Database
    document.getElementById('btn-reset-db')?.addEventListener('click', async () => {
      try {
        await api.post('/api/v1/demo/reset');
        toast.success('Database reset to canonical seed.');
        window.location.reload();
      } catch (err) {
        toast.danger(err.message);
      }
    });

    // Advance clock
    document.getElementById('btn-advance-clock')?.addEventListener('click', async () => {
      try {
        const hours = document.getElementById('advance-hours').value;
        const res = await api.post('/api/v1/demo/advance-clock', { hours });
        toast.info(`Clock advanced by ${hours} hours.`);
        window.location.reload();
      } catch (err) {
        toast.danger(err.message);
      }
    });
  };

  const staffUsers = demoState.users.filter(u => u.role !== 'BORROWER');
  const borrowerUsers = demoState.users.filter(u => u.role === 'BORROWER');

  return `
    <div style="min-height:100vh;background:#ffffff;padding:24px;max-width:1100px;margin:0 auto;font-family:var(--font-sans);">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--border-light);padding-bottom:16px;margin-bottom:24px;">
        <div>
          <span class="badge badge-amber">Demo & Test Harness</span>
          <h1 style="font-size:24px;margin:8px 0 0 0;">Aidvans Demo & Testing Console</h1>
          <p style="font-size:13px;color:var(--text-muted);margin:4px 0 0 0;">All credentials, live TOTP secrets, simulated SMS/Email outboxes, and time controls.</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button type="button" id="btn-reset-db" class="btn btn-danger btn-sm">Reset Database (Seed)</button>
          <a href="http://localhost:3001/" target="_blank" class="btn btn-secondary btn-sm">Open NBFC Sandbox (Origin B) &nearr;</a>
          <a href="/" class="btn btn-secondary btn-sm">Open Product Home</a>
        </div>
      </div>

      <!-- Simulated Clock Controls -->
      <div class="box" style="margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <strong>Simulated Time Acceleration:</strong>
          <span style="font-family:var(--font-mono);font-size:14px;margin-left:8px;">${new Date(Date.now() + (demoState.timeOffsetMs || 0)).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <label for="advance-hours" style="margin:0;font-size:13px;">Advance Hours:</label>
          <input type="number" id="advance-hours" value="24" style="width:70px;min-height:32px;padding:4px 8px;">
          <button type="button" id="btn-advance-clock" class="btn btn-secondary btn-sm">Advance Clock</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
        <!-- Staff Credentials -->
        <div class="box" style="margin:0;">
          <h3>Staff Credentials & Live TOTP Codes</h3>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Workforce password for all seeded users: <code style="background:#f1f5f9;padding:2px 6px;">Password@123</code></p>
          <div style="overflow-x:auto;">
            <table style="width:100%;font-size:12px;">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Workspace Login</th>
                </tr>
              </thead>
              <tbody>
                ${staffUsers.map(u => `
                  <tr>
                    <td><span class="badge badge-blue">${u.role}</span></td>
                    <td><code>${u.user_id}</code></td>
                    <td>${u.name}</td>
                    <td><a href="/${u.role === 'EXECUTIVE' ? 'executive' : (u.role.startsWith('HOSPITAL_') ? 'hospital' : (u.role === 'OPS_MANAGER' ? 'ops' : (u.role === 'COMPLIANCE_AUDITOR' ? 'compliance' : (u.role === 'SUPPORT_AGENT' ? 'support' : 'admin'))))}/login" class="btn btn-secondary btn-sm">Login</a></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Borrower Credentials -->
        <div class="box" style="margin:0;">
          <h3>Borrower Personas & Mobile Numbers</h3>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Sign in via Mobile OTP delivered to SMS outbox below.</p>
          <div style="overflow-x:auto;">
            <table style="width:100%;font-size:12px;">
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${borrowerUsers.map(b => `
                  <tr>
                    <td><strong>${b.user_id}</strong></td>
                    <td>${b.name}</td>
                    <td><code>${b.phone}</code></td>
                    <td><a href="/borrower/login" class="btn btn-secondary btn-sm">Login</a></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Simulated Outboxes -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
        <!-- SMS Outbox -->
        <div class="box" style="margin:0;">
          <h3>Simulated SMS Outbox</h3>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Captures dispatched OTPs, case invitations, and step-up codes:</p>
          ${demoState.outboxes.sms.length === 0 ? '<p style="font-size:12px;color:var(--text-muted);">No SMS messages sent yet.</p>' : `
            <div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto;">
              ${demoState.outboxes.sms.map(s => `
                <div style="background:var(--bg-subtle);padding:10px;border-left:3px solid var(--primary);font-size:12px;">
                  <div style="display:flex;justify-content:space-between;color:var(--text-subtle);">
                    <span>To: <strong>${s.recipient}</strong></span>
                    <span>${new Date(s.sent_at).toLocaleTimeString('en-IN')}</span>
                  </div>
                  <div style="margin-top:4px;color:var(--text-main);">${s.message}</div>
                  ${s.otp ? `<div style="margin-top:4px;font-weight:700;color:var(--primary);">OTP: ${s.otp}</div>` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Email Outbox -->
        <div class="box" style="margin:0;">
          <h3>Simulated Email Outbox</h3>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Captures password resets and executive notifications:</p>
          ${demoState.outboxes.email.length === 0 ? '<p style="font-size:12px;color:var(--text-muted);">No emails dispatched yet.</p>' : `
            <div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto;">
              ${demoState.outboxes.email.map(e => `
                <div style="background:var(--bg-subtle);padding:10px;border-left:3px solid var(--success);font-size:12px;">
                  <div style="display:flex;justify-content:space-between;color:var(--text-subtle);">
                    <span>To: <strong>${e.recipient}</strong></span>
                    <span>${new Date(e.sent_at).toLocaleTimeString('en-IN')}</span>
                  </div>
                  <div style="font-weight:600;margin-top:4px;">${e.subject}</div>
                  <div style="margin-top:2px;color:var(--text-muted);">${e.body}</div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}
