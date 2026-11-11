/**
 * Accessible Toast Notifications Manager
 */

export class ToastManager {
  constructor(containerId = 'toast-container') {
    this.container = document.getElementById(containerId);
  }

  show(message, type = 'info', durationMs = 4000) {
    if (!this.container) return;

    const toast = document.createElement('div');
    toast.className = `toast alert alert-${type}`;
    toast.setAttribute('role', 'alert');
    toast.textContent = message;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }, durationMs);
  }

  info(msg) { this.show(msg, 'info'); }
  success(msg) { this.show(msg, 'success'); }
  warning(msg) { this.show(msg, 'warning'); }
  danger(msg) { this.show(msg, 'danger'); }
}

export const toast = new ToastManager();

