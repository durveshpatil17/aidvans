/**
 * Shared Timeline Component
 * Enforces Non-Negotiable Rule: Six separate money lifecycle events, zero 'Paid'.
 */

export function renderTimeline(events) {
  if (!events || events.length === 0) {
    return `<div style="padding:20px 0;color:var(--text-muted);">No timeline activity recorded yet.</div>`;
  }

  const sorted = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return `
    <div class="timeline-container" style="border-left:2px solid var(--border-light);margin-left:12px;padding-left:16px;">
      ${sorted.map(evt => {
        const timeStr = new Date(evt.timestamp).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        let badgeClass = 'badge-blue';
        if (evt.action.includes('REVERS') || evt.action.includes('FAIL')) badgeClass = 'badge-danger';
        if (evt.action.includes('CONFIRM') || evt.action.includes('RECEIPT')) badgeClass = 'badge-emerald';
        if (evt.action.includes('MISMATCH') || evt.action.includes('DISCREPANCY')) badgeClass = 'badge-amber';

        return `
          <div class="timeline-item" style="position:relative;margin-bottom:16px;">
            <div style="position:absolute;left:-23px;top:4px;width:12px;height:12px;border-radius:50%;background:var(--primary);border:2px solid #ffffff;"></div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
              <span class="badge ${badgeClass}">${evt.action.replace(/_/g, ' ')}</span>
              <small style="color:var(--text-subtle);">${timeStr} IST</small>
            </div>
            <p style="margin:4px 0 0 0;font-size:13px;color:var(--text-main);">${evt.reason || evt.metadata?.details || 'Standard lifecycle event'}</p>
            <small style="color:var(--text-subtle);">Actor: <strong>${evt.actor_role}</strong> (${evt.actor_id})</small>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

