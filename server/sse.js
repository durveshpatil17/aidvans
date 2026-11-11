/**
 * Server-Sent Events (SSE) Hub
 * Scoped real-time event streaming for authenticated clients
 * Route: /api/v1/events
 */

import { EventEmitter } from 'events';

export class SSEHub extends EventEmitter {
  constructor() {
    super();
    this.clients = new Set();
    // Heartbeat every 15 seconds to prevent connection drops
    this.heartbeatTimer = setInterval(() => {
      this.broadcast('heartbeat', { timestamp: Date.now() });
    }, 15000);
  }

  addClient(req, res, sessionUser) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.write(`retry: 3000\n\n`);
    res.write(`event: connected\ndata: ${JSON.stringify({ user_id: sessionUser.user_id, role: sessionUser.role })}\n\n`);

    const client = {
      req,
      res,
      user: sessionUser
    };
    this.clients.add(client);

    req.on('close', () => {
      this.clients.delete(client);
    });
  }

  broadcast(eventType, payload, targetFilter = () => true) {
    const dataStr = JSON.stringify(payload);
    for (const client of this.clients) {
      try {
        if (targetFilter(client.user, payload)) {
          client.res.write(`event: ${eventType}\ndata: ${dataStr}\n\n`);
        }
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  notifyCaseUpdate(caseRecord, actionName = 'UPDATE') {
    this.broadcast('case_updated', {
      case_id: caseRecord.case_id,
      frid: caseRecord.frid,
      case_status: caseRecord.case_status,
      action: actionName,
      timestamp: new Date().toISOString()
    }, (user) => {
      // Scoping: Executive sees their cases, hospital sees their hospital cases, ops/admin sees all
      if (['PLATFORM_ADMIN', 'SUPER_ADMIN', 'OPS_MANAGER'].includes(user.role)) return true;
      if (user.role === 'EXECUTIVE') {
        return caseRecord.assigned_executive_id === user.user_id ||
          (user.assigned_hospital_ids && user.assigned_hospital_ids.includes(caseRecord.hospital_id));
      }
      if (user.role.startsWith('HOSPITAL_')) {
        return caseRecord.hospital_id === user.org_id;
      }
      if (user.role === 'BORROWER') {
        return caseRecord.primary_borrower_id === user.user_id;
      }
      return false;
    });
  }

  notifySessionRevoked(userId) {
    this.broadcast('session_revoked', { user_id: userId }, (user) => user.user_id === userId);
  }

  destroy() {
    clearInterval(this.heartbeatTimer);
    for (const client of this.clients) {
      try {
        client.res.end();
      } catch {}
    }
    this.clients.clear();
  }
}
