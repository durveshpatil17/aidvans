/**
 * Append-Only Audit Log Manager
 * Meets TDS Section 11.5 & Non-Negotiable Process Rules
 */

export class AuditLogger {
  constructor(store) {
    this.store = store;
  }

  log({ actorId, actorRole, action, targetType, targetId, reason = '', metadata = {} }) {
    const event = {
      event_id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      actor_id: actorId || 'SYSTEM',
      actor_role: actorRole || 'ANONYMOUS',
      action,
      target_type: targetType,
      target_id: targetId || 'N/A',
      timestamp: new Date().toISOString(),
      reason,
      metadata: JSON.parse(JSON.stringify(metadata))
    };

    const currentLogs = this.store.getState().audit_logs || [];
    // Strict append-only: create new array reference
    this.store.update(state => ({
      ...state,
      audit_logs: [...currentLogs, Object.freeze(event)]
    }));

    return event;
  }
}

