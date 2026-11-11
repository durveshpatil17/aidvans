/**
 * Client Session & Idle Timeout Manager
 * Warns users 60 seconds before session expiry with "Stay Signed In" action
 */

import { api } from './api.js';

export class SessionManager {
  constructor(onWarning = () => {}, onExpired = () => {}) {
    this.user = null;
    this.workspace = null;
    this.onWarning = onWarning;
    this.onExpired = onExpired;
    this.warningTimer = null;
    this.expiryTimer = null;
  }

  async checkCurrentSession() {
    try {
      const data = await api.get('/api/v1/auth/me');
      this.user = data.user;
      this.workspace = data.workspace;
      api.setCsrfToken(data.csrfToken);
      this.resetIdleTimers();
      return { user: this.user, workspace: this.workspace };
    } catch (err) {
      this.user = null;
      this.workspace = null;
      return null;
    }
  }

  resetIdleTimers() {
    clearTimeout(this.warningTimer);
    clearTimeout(this.expiryTimer);

    if (!this.user) return;

    const timeoutMs = this.user.role === 'BORROWER' ? 10 * 60 * 1000 : 15 * 60 * 1000;
    const warningMs = timeoutMs - 60 * 1000;

    this.warningTimer = setTimeout(() => {
      this.onWarning(60);
    }, warningMs);

    this.expiryTimer = setTimeout(() => {
      this.onExpired();
    }, timeoutMs);
  }

  async staySignedIn() {
    try {
      await api.get('/api/v1/auth/me');
      this.resetIdleTimers();
      return true;
    } catch {
      this.onExpired();
      return false;
    }
  }

  async logout() {
    clearTimeout(this.warningTimer);
    clearTimeout(this.expiryTimer);
    try {
      await api.post('/api/v1/auth/logout');
    } finally {
      this.user = null;
      this.workspace = null;
    }
  }
}
