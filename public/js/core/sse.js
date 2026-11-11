/**
 * Client Server-Sent Events (SSE) Listener
 * Connects to /api/v1/events and triggers live view updates
 */

export class SSEClient {
  constructor(onEvent = () => {}) {
    this.onEvent = onEvent;
    this.eventSource = null;
    this.reconnectTimer = null;
  }

  connect() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource('/api/v1/events');

      this.eventSource.addEventListener('case_updated', (e) => {
        try {
          const payload = JSON.parse(e.data);
          this.onEvent('case_updated', payload);
        } catch {}
      });

      this.eventSource.addEventListener('session_revoked', (e) => {
        try {
          const payload = JSON.parse(e.data);
          this.onEvent('session_revoked', payload);
        } catch {}
      });

      this.eventSource.onerror = () => {
        this.eventSource.close();
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), 5000);
      };
    } catch (err) {
      // Fallback
    }
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
