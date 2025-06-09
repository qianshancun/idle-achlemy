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
        <button class="dialog-btn dialog-btn-confirm" data-action="confirm">
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
        backdrop-filter: blur(2px);
      }

      .dialog-overlay.dialog-visible {
        opacity: 1;
      }

      .dialog-container {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        transform: scale(0.9);
        transition: transform 0.2s ease;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }

      .dialog-overlay.dialog-visible .dialog-container {
        transform: scale(1);
      }

      .dialog-header {
        background: #f8f9fa;
        padding: 16px 20px;
        border-bottom: 1px solid #e9ecef;
      }

      .dialog-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }

      .dialog-body {
        padding: 20px;
      }

      .dialog-message {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        color: #666;
      }

      .dialog-actions {
        display: flex;
        gap: 12px;
        padding: 16px 20px;
        background: #f8f9fa;
        border-top: 1px solid #e9ecef;
        justify-content: flex-end;
      }

      .dialog-btn {
        padding: 8px 16px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 80px;
        background: white;
      }

      .dialog-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .dialog-btn:active {
        transform: translateY(0);
      }

      .dialog-btn-cancel {
        color: #666;
        border-color: #ddd;
      }

      .dialog-btn-cancel:hover {
        background: #f8f9fa;
        border-color: #bbb;
      }

      .dialog-btn-confirm {
        background: #007bff;
        color: white;
        border-color: #007bff;
      }

      .dialog-btn-confirm:hover {
        background: #0056b3;
        border-color: #0056b3;
      }

      .dialog-warning .dialog-btn-confirm {
        background: #dc3545;
        border-color: #dc3545;
      }

      .dialog-warning .dialog-btn-confirm:hover {
        background: #c82333;
        border-color: #c82333;
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