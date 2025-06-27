export interface DialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'confirm' | 'warning' | 'info';
}

export class Dialog {
  private static instance: Dialog | null = null;
  private overlay: HTMLElement | null = null;
  private dialog: HTMLElement | null = null;

  private constructor() {
    this.addStyles();
  }

  public static getInstance(): Dialog {
    if (!Dialog.instance) {
      Dialog.instance = new Dialog();
    }
    return Dialog.instance;
  }

  public async show(options: DialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.createDialog(options, resolve);
    });
  }

  private createDialog(options: DialogOptions, resolve: (value: boolean) => void): void {
    // Remove any existing dialog
    this.remove();

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'dialog-overlay';

    // Create dialog container
    this.dialog = document.createElement('div');
    this.dialog.className = `dialog-container dialog-${options.type || 'confirm'}`;

    // Dialog content
    this.dialog.innerHTML = `
      <div class="dialog-header">
        <h3 class="dialog-title">${options.title}</h3>
      </div>
      <div class="dialog-body">
        <p class="dialog-message">${options.message}</p>
      </div>
      <div class="dialog-actions">
        <button class="dialog-btn dialog-btn-cancel" data-action="cancel">
          ${options.cancelText || 'Cancel'}
        </button>
        <button class="dialog-btn dialog-btn-confirm ${options.type === 'warning' ? 'dialog-btn-warning' : 'dialog-btn-primary'}" data-action="confirm">
          ${options.confirmText || 'Confirm'}
        </button>
      </div>
    `;

    // Add event listeners
    const cancelBtn = this.dialog.querySelector('[data-action="cancel"]') as HTMLButtonElement;
    const confirmBtn = this.dialog.querySelector('[data-action="confirm"]') as HTMLButtonElement;

    const handleCancel = () => {
      this.remove();
      resolve(false);
    };

    const handleConfirm = () => {
      this.remove();
      resolve(true);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    cancelBtn.addEventListener('click', handleCancel);
    confirmBtn.addEventListener('click', handleConfirm);
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        handleCancel();
      }
    });
    document.addEventListener('keydown', handleEscape);

    // Store cleanup function
    (this.dialog as any)._cleanup = () => {
      document.removeEventListener('keydown', handleEscape);
    };

    // Add to DOM
    this.overlay.appendChild(this.dialog);
    document.body.appendChild(this.overlay);

    // Focus the confirm button
    setTimeout(() => {
      confirmBtn.focus();
    }, 100);

    // Animate in
    requestAnimationFrame(() => {
      if (this.overlay) {
        this.overlay.classList.add('dialog-visible');
      }
    });
  }

  private remove(): void {
    if (this.dialog && (this.dialog as any)._cleanup) {
      (this.dialog as any)._cleanup();
    }

    if (this.overlay) {
      this.overlay.classList.remove('dialog-visible');
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        this.dialog = null;
      }, 200);
    }
  }

  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .dialog-overlay.dialog-visible {
        opacity: 1;
      }

      .dialog-container {
        background: white;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        max-width: 448px;
        width: 90%;
        max-height: 90vh;
        overflow: hidden;
        transform: scale(0.9);
        transition: transform 0.2s ease;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .dark .dialog-container {
        background: #1e293b;
        border-color: #334155;
      }

      .dialog-overlay.dialog-visible .dialog-container {
        transform: scale(1);
      }

      .dialog-header {
        padding: 20px 24px 16px;
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
      }

      .dark .dialog-header {
        border-bottom-color: #334155;
        background: #0f172a;
      }

      .dialog-title {
        font-size: 18px;
        font-weight: 600;
        color: #0f172a;
        margin: 0;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .dark .dialog-title {
        color: #f1f5f9;
      }

      .dialog-body {
        padding: 20px 24px;
      }

      .dialog-message {
        font-size: 14px;
        color: #334155;
        line-height: 1.5;
        margin: 0;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .dark .dialog-message {
        color: #cbd5e1;
      }

      .dialog-actions {
        display: flex;
        gap: 12px;
        padding: 16px 24px 20px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        justify-content: flex-end;
      }

      .dark .dialog-actions {
        background: #0f172a;
        border-top-color: #334155;
      }

      .dialog-btn {
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 500;
        border-radius: 6px;
        border: 1px solid;
        cursor: pointer;
        transition: all 0.15s;
        min-width: 80px;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .dialog-btn-cancel {
        color: #475569;
        background: white;
        border-color: #cbd5e1;
      }

      .dialog-btn-cancel:hover {
        background: #f1f5f9;
        color: #1e293b;
      }

      .dark .dialog-btn-cancel {
        color: #cbd5e1;
        background: #334155;
        border-color: #475569;
      }

      .dark .dialog-btn-cancel:hover {
        background: #475569;
        color: #f1f5f9;
      }

      .dialog-btn-primary {
        color: white;
        background: #3b82f6;
        border-color: #3b82f6;
      }

      .dialog-btn-primary:hover {
        background: #2563eb;
        border-color: #2563eb;
      }

      .dialog-btn-warning {
        color: white;
        background: #dc2626;
        border-color: #dc2626;
      }

      .dialog-btn-warning:hover {
        background: #b91c1c;
        border-color: #b91c1c;
      }

      /* Mobile responsiveness */
      @media (max-width: 480px) {
        .dialog-container {
          width: 95%;
          margin: 20px;
        }

        .dialog-actions {
          flex-direction: column;
        }

        .dialog-btn {
          width: 100%;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Export a convenient function for easy usage
export async function showConfirm(options: DialogOptions): Promise<boolean> {
  const dialog = Dialog.getInstance();
  return dialog.show(options);
} 