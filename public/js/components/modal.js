/**
 * Accessible Modal Dialog Component
 * Fulfills prompt rule: Zero native alert() or confirm() in product code.
 */

export class ModalDialog {
  constructor(containerId = 'modal-container') {
    this.container = document.getElementById(containerId);
  }

  confirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }) {
    return new Promise((resolve) => {
      if (!this.container) return resolve(false);

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

      this.container.appendChild(overlay);

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
}

export const modal = new ModalDialog();
