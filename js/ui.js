/**
 * Shared UI Layout and Component Helpers
 * Ensures consistent rendering of states (Loading, Empty, Error, Permission Denied, Success)
 * and strict XSS safety.
 */

export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const num = Number(amount);
  return '₹' + num.toLocaleString('en-IN');
}

export function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const datePart = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timePart = d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${datePart} ${timePart}`;
  } catch {
    return isoString;
  }
}

export function maskName(name) {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  return parts
    .map(p => (p.length > 2 ? p[0] + '*'.repeat(p.length - 2) + p[p.length - 1] : p[0] + '*'))
    .join(' ');
}

export function maskPhone(phone) {
  if (!phone) return '—';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 4) return '••••';
  return '•••• •••• ' + clean.slice(-2);
}

export function maskPAN(pan) {
  if (!pan) return '—';
  if (pan.length < 4) return '••••';
  return '••••••••' + pan.slice(-2);
}

export function maskBankAccount(accountNo) {
  if (!accountNo) return '—';
  const clean = accountNo.replace(/\s+/g, '');
  return '•••• •••• ' + clean.slice(-4);
}

export function renderStatusBadge(status) {
  if (!status) return '';
  const s = String(status).toUpperCase();
  let colorClass = 'status-neutral';

  if (['SANCTIONED', 'APPROVED', 'VERIFIED', 'CONFIRMED', 'CONFIRMED_BY_LENDER', 'ACTIVE', 'BORROWER_LINKED'].includes(s)) {
    colorClass = 'status-green';
  } else if (['SUBMITTED', 'PENDING_BORROWER_AUTH', 'SENT_TO_LENDER', 'LENDER_PENDING', 'ACTION_REQUIRED', 'AWAITING_HOSPITAL', 'DISBURSEMENT_PENDING', 'PROCESSING'].includes(s)) {
    colorClass = 'status-amber';
  } else if (['DECLINED', 'REJECTED', 'FAILED', 'CANCELLED', 'MISMATCH', 'DISPUTED', 'WITHDRAWN', 'INVITATION_EXPIRED'].includes(s)) {
    colorClass = 'status-red';
  }

  // Format readable text without underscores
  const readable = escapeHTML(s.replace(/_/g, ' '));
  return `<span class="status-badge ${colorClass}">${readable}</span>`;
}

export function renderLoadingState(message = 'Loading data...') {
  return `
    <div class="box" role="status" aria-live="polite">
      <p style="color:var(--text-muted);">${escapeHTML(message)}</p>
    </div>
  `;
}

export function renderEmptyState(title = 'No records found', message = 'There are currently no items in this view.') {
  return `
    <div class="box" style="text-align:center;padding:32px 16px;">
      <h3 style="margin-bottom:8px;">${escapeHTML(title)}</h3>
      <p style="color:var(--text-muted);max-width:400px;margin:0 auto 16px;">${escapeHTML(message)}</p>
    </div>
  `;
}

export function renderErrorState(title = 'Error', message = 'An error occurred.', detail = '') {
  return `
    <div class="alert alert-error" role="alert" aria-live="assertive">
      <h3 style="margin-bottom:6px;">${escapeHTML(title)}</h3>
      <p>${escapeHTML(message)}</p>
      ${detail ? `<pre style="font-size:0.8125rem;background:#ffffff;padding:8px;border:1px solid #f5c6cb;margin-top:8px;overflow-x:auto;">${escapeHTML(detail)}</pre>` : ''}
    </div>
  `;
}

export function renderPermissionDeniedState(reason = 'You do not have authorization to view this resource.') {
  return `
    <div class="alert alert-error" role="alert" aria-live="assertive">
      <h2 style="font-size:1.25rem;margin-bottom:8px;">Access Denied (403)</h2>
      <p>${escapeHTML(reason)}</p>
      <p style="font-size:0.875rem;margin-top:8px;">This access attempt has been recorded in the security audit log.</p>
      <div style="margin-top:16px;">
        <a href="#/" class="btn btn-secondary">Return to Home</a>
      </div>
    </div>
  `;
}

export function renderSuccessState(title, message, actionHtml = '') {
  return `
    <div class="alert alert-success" role="status">
      <h3 style="margin-bottom:6px;">${escapeHTML(title)}</h3>
      <p>${escapeHTML(message)}</p>
      ${actionHtml ? `<div style="margin-top:12px;">${actionHtml}</div>` : ''}
    </div>
  `;
}
