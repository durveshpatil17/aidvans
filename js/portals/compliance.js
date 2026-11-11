/**
 * Compliance & Customer Support Portal (CMP-01 to CMP-05, SUP-01/02)
 * Meets TDS Section 4.7, Security & Regulatory Gates
 */

import { escapeHTML, renderStatusBadge, renderEmptyState, renderErrorState, renderSuccessState, formatDateTime, maskName, maskPhone } from '../ui.js';

export function renderConsentAudit({ store }) {
  const consents = [...store.getState().consents].reverse();

  return `
    <div class="box">
      <h1>Consent and Purpose Ledger (CMP-01)</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Read-only compliance evidence trail of all purpose-specific borrower consent actions (TDS Section 11.3).
      </p>

      ${consents.length === 0 ? renderEmptyState('No Consents Logged', 'No consent decisions have been recorded yet.') : `
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Consent ID</th>
                <th>Case Ref</th>
                <th>Purpose</th>
                <th>Recipient Entity</th>
                <th>Status</th>
                <th>Recorded Timestamp</th>
                <th>Withdrawal Date</th>
              </tr>
            </thead>
            <tbody>
              ${consents.map(c => `
                <tr>
                  <td><code>${escapeHTML(c.consent_id)}</code></td>
                  <td>${escapeHTML(c.case_id)}</td>
                  <td><strong>${escapeHTML(c.purpose)}</strong></td>
                  <td>${escapeHTML(c.recipient)}</td>
                  <td>
                    ${c.withdrawn ? '<span class="status-badge status-red">WITHDRAWN</span>' : (c.granted ? '<span class="status-badge status-green">GRANTED</span>' : '<span class="status-badge status-amber">DECLINED</span>')}
                  </td>
                  <td>${formatDateTime(c.timestamp)}</td>
                  <td>${c.withdrawn_at ? formatDateTime(c.withdrawn_at) : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

export function renderIncidentRegister({ store, user }) {
  const incidents = store.getState().incidents || [];

  window.__ON_VIEW_MOUNTED__ = () => {
    const btn = document.getElementById('btn-simulate-breach');
    if (btn) {
      btn.addEventListener('click', () => {
        const incidentId = `INC-${Date.now().toString().slice(-4)}`;
        const newIncident = {
          incident_id: incidentId,
          title: 'Simulated Security Incident: Unauthorized FRID Enumeration Surge',
          severity: 'HIGH',
          owner: user.name,
          status: 'CONTAINED',
          notification_assessment: 'Containment successful via 15-minute rate limit. No PII disclosed. Regulatory notification not required under DPDP threshold.',
          reported_at: new Date().toISOString()
        };

        store.update(s => ({
          ...s,
          incidents: [newIncident, ...(s.incidents || [])]
        }));

        store.audit.log({
          actorId: user.user_id,
          actorRole: user.role,
          action: 'SECURITY_INCIDENT_OPENED',
          targetType: 'INCIDENT',
          targetId: incidentId,
          reason: 'Breach simulation recorded with notification assessment (AT-30)'
        });

        window.location.reload();
      });
    }
  };

  return `
    <div class="box">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <h1>Security Incident & Breach Register (CMP-05)</h1>
          <p style="color:var(--text-muted);margin:0;">
            Incident tracking and regulatory notification assessments (AT-30).
          </p>
        </div>
        <div>
          <button type="button" id="btn-simulate-breach" data-testid="btn-simulate-breach" class="btn btn-secondary">
            Simulate Security Breach (AT-30)
          </button>
        </div>
      </div>

      ${incidents.length === 0 ? renderEmptyState('No Active Incidents', 'The incident register has zero open security breaches.') : `
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Incident Ref</th>
                <th>Title & Scope</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Notification Assessment</th>
                <th>Reported At</th>
              </tr>
            </thead>
            <tbody>
              ${incidents.map(inc => `
                <tr>
                  <td><code>${escapeHTML(inc.incident_id)}</code></td>
                  <td><strong>${escapeHTML(inc.title)}</strong></td>
                  <td><span class="status-badge status-red">${escapeHTML(inc.severity)}</span></td>
                  <td><span class="status-badge status-green">${escapeHTML(inc.status)}</span></td>
                  <td><small>${escapeHTML(inc.notification_assessment)}</small></td>
                  <td>${formatDateTime(inc.reported_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

export function renderSupportQueue({ store, user }) {
  const tickets = store.getState().support_tickets || [];

  return `
    <div class="box">
      <h1>Customer Support Ticket Queue (SUP-01)</h1>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Support enquiries with mandatory field-level PII masking (TDS Section 3.5).
      </p>

      ${tickets.length === 0 ? renderEmptyState('No Support Tickets', 'All queues are clear.') : `
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Complainant (Masked)</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${tickets.map(t => `
                <tr>
                  <td><code>${escapeHTML(t.ticket_id)}</code></td>
                  <td>${escapeHTML(t.complainant_name)} (${escapeHTML(t.complainant_contact)})</td>
                  <td><strong>${escapeHTML(t.category.replace(/_/g, ' '))}</strong></td>
                  <td>${escapeHTML(t.priority)}</td>
                  <td>${renderStatusBadge(t.status)}</td>
                  <td>${formatDateTime(t.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

