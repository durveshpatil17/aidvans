/**
 * Accessible Modal Dialog Component
 * Fulfills prompt rule: Zero native alert() or confirm() in product code.
 */

export class ModalDialog {
  constructor(containerId = 'modal-container') {
    this.container = document.getElementById(containerId);
  }

  ensureContainer() {
    if (!this.container) {
      this.container = document.getElementById('modal-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'modal-container';
        document.body.appendChild(this.container);
      }
    }
    return this.container;
  }

  confirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }) {
    return new Promise((resolve) => {
      const container = this.ensureContainer();

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'modal-title');

      overlay.innerHTML = `
        <div class="modal-dialog">
          <h2 id="modal-title" style="margin-top:0;">${title}</h2>
          <p style="color:var(--text-muted);margin-bottom:20px;">${message}</p>
          <div style="display:flex;justify-content:flex-end;gap:12px;">
            <button type="button" class="btn btn-secondary" id="modal-cancel-btn">${cancelText}</button>
            <button type="button" class="btn ${isDanger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm-btn">${confirmText}</button>
          </div>
        </div>
      `;

      container.appendChild(overlay);

      const confirmBtn = overlay.querySelector('#modal-confirm-btn');
      const cancelBtn = overlay.querySelector('#modal-cancel-btn');

      confirmBtn.focus();

      const cleanup = () => {
        document.removeEventListener('keydown', handleKey);
        overlay.remove();
      };

      const handleKey = (e) => {
        if (e.key === 'Escape') {
          cleanup();
          resolve(false);
        }
      };

      document.addEventListener('keydown', handleKey);

      confirmBtn.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });
    });
  }

  prompt({ title, message, defaultValue = '', inputLabel = 'Value', confirmText = 'Submit', cancelText = 'Cancel' }) {
    return new Promise((resolve) => {
      const container = this.ensureContainer();

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'modal-title');

      overlay.innerHTML = `
        <div class="modal-dialog">
          <h2 id="modal-title" style="margin-top:0;">${title}</h2>
          <p style="color:var(--text-muted);margin-bottom:12px;">${message}</p>
          <div style="margin-bottom:20px;">
            <label for="modal-prompt-input" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;">${inputLabel}</label>
            <input type="text" id="modal-prompt-input" value="${defaultValue}" style="width:100%;padding:8px 10px;font-size:14px;border:1px solid var(--border-medium);border-radius:2px;">
          </div>
          <div style="display:flex;justify-content:flex-end;gap:12px;">
            <button type="button" class="btn btn-secondary" id="modal-cancel-btn">${cancelText}</button>
            <button type="button" class="btn btn-primary" id="modal-confirm-btn">${confirmText}</button>
          </div>
        </div>
      `;

      container.appendChild(overlay);

      const input = overlay.querySelector('#modal-prompt-input');
      const confirmBtn = overlay.querySelector('#modal-confirm-btn');
      const cancelBtn = overlay.querySelector('#modal-cancel-btn');

      input.focus();
      input.select();

      const cleanup = () => {
        document.removeEventListener('keydown', handleKey);
        overlay.remove();
      };

      const handleKey = (e) => {
        if (e.key === 'Escape') {
          cleanup();
          resolve(null);
        } else if (e.key === 'Enter') {
          cleanup();
          resolve(input.value);
        }
      };

      document.addEventListener('keydown', handleKey);

      confirmBtn.addEventListener('click', () => {
        const val = input.value;
        cleanup();
        resolve(val);
      });

      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(null);
      });
    });
  }

  alert({ title = 'Notice', message, buttonText = 'Dismiss' }) {
    return new Promise((resolve) => {
      const container = this.ensureContainer();

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'modal-title');

      overlay.innerHTML = `
        <div class="modal-dialog">
          <h2 id="modal-title" style="margin-top:0;">${title}</h2>
          <p style="color:var(--text-muted);margin-bottom:20px;">${message}</p>
          <div style="display:flex;justify-content:flex-end;">
            <button type="button" class="btn btn-primary" id="modal-dismiss-btn">${buttonText}</button>
          </div>
        </div>
      `;

      container.appendChild(overlay);

      const dismissBtn = overlay.querySelector('#modal-dismiss-btn');
      dismissBtn.focus();

      const cleanup = () => {
        document.removeEventListener('keydown', handleKey);
        overlay.remove();
      };

      const handleKey = (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          cleanup();
          resolve(true);
        }
      };

      document.addEventListener('keydown', handleKey);

      dismissBtn.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });
    });
  }
}

export const modal = new ModalDialog();
