import { Game } from '@/game/Game';
import { showConfirm } from '@/ui/Dialog';
import { configLoader } from '@/config/ConfigLoader';

export class UI {
  private game: Game;
  private uiContainer: HTMLElement;
  private elementGrid!: HTMLElement;
  
  constructor(game: Game) {
    this.game = game;
    this.uiContainer = document.getElementById('ui-overlay')!;
    
    this.createUI();
    this.setupEventListeners();
    this.updateUI();
    
    // Check if help should be shown based on progress
    this.hideInstructionsIfNeeded();
  }
  
  private createUI(): void {
    this.uiContainer.innerHTML = `

      
              <div class="discovery-panel ui-element" id="discovery-panel">
        <div class="panel-header">
          <h3 id="elements-title">🧪 Elements (4)</h3>
          <div class="panel-info">Drag to canvas</div>
        </div>
        <div class="element-grid" id="element-grid"></div>
      </div>
      
      <div class="bottom-actions ui-element" id="bottom-actions">
        <span class="action-link" id="clear-action">Clear</span>
        <span class="action-separator">|</span>
        <span class="action-link" id="reset-action">Reset</span>
      </div>
      
      <div class="help-tooltip ui-element" id="help-tooltip">
        <div class="tooltip-content">
          <p>🎯 <strong>How to Play:</strong></p>
          <p>1. Click or drag elements from the discovery panel to the canvas</p>
          <p>2. Drag canvas elements onto each other to merge</p>
          <p>3. Double-tap canvas elements to duplicate them</p>
          <p>4. Drag empty space to pan around the unlimited canvas</p>
          <p>5. Discover new elements by experimenting!</p>
          <button class="close-tooltip" id="close-tooltip">✕</button>
        </div>
      </div>
    `;
    
    // Get references
    this.elementGrid = document.getElementById('element-grid')!;
    
    this.addStyles();
  }
  
  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .bottom-actions {
        position: absolute;
        top: 20px;
        left: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 100;
        background: rgba(255, 255, 255, 0.9);
        padding: 6px 10px;
        border-radius: 6px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
      }
      
      .action-link {
        color: #666;
        font-size: 14px;
        cursor: pointer;
        text-decoration: underline;
        transition: color 0.2s ease;
      }
      
      .action-link:hover {
        color: #333;
      }
      
      .action-separator {
        color: #ccc;
        font-size: 14px;
      }
      
      .discovery-panel {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 240px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 0;
        padding: 12px;
        backdrop-filter: blur(10px);
        overflow: hidden;
        transition: all 0.3s ease;
        border-left: 1px solid rgba(0, 0, 0, 0.15);
      }
      

      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #333;
        margin-bottom: 10px;
      }
      
      .panel-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
      }
      
      .panel-info {
        font-size: 10px;
        color: #666;
        font-style: italic;
      }
      

      
      .element-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        height: calc(100% - 40px);
        overflow-y: auto;
        align-content: flex-start;
      }
      
      .element-card {
        border-radius: 4px;
        padding: 2px 4px;
        cursor: pointer;
        transition: all 0.15s ease;
        border: 1px solid #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        background: white;
      }
      
      .element-card:hover {
        background: #f0f0f0;
        border-color: #bbb;
      }
      
      .element-card:active {
        transform: scale(0.95);
      }
      
      .element-card.clicked {
        transform: scale(0.9);
        background: #e3f2fd;
        border-color: #2196f3;
      }
      
      .element-emoji {
        font-size: 12px;
        line-height: 1;
      }
      
      .element-name {
        color: #333;
        font-size: 10px;
        font-weight: 500;
        line-height: 1;
        white-space: nowrap;
      }
      
      .help-tooltip {
        position: fixed;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 8px;
        padding: 12px;
        max-width: 280px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.1);
        transition: opacity 0.3s ease;
        z-index: 1000;
        box-sizing: border-box;
      }
      
      /* Desktop: center in canvas area (exclude right sidebar) */
      @media (min-width: 769px) {
        .help-tooltip {
          top: 50%;
          left: calc(50vw - 120px); /* Center of (viewport - 240px sidebar) */
          transform: translate(-50%, -50%);
          max-width: calc(100vw - 280px); /* Ensure it fits in canvas area */
        }
      }
      
      /* Mobile: just ensure it fits and has proper margins */
      @media (max-width: 768px) {
        .help-tooltip {
          max-width: calc(100vw - 40px);
          margin: 0 20px;
        }
      }
      
      .help-tooltip.hidden {
        opacity: 0;
        pointer-events: none;
      }
      
      .tooltip-content {
        color: #333;
        font-size: 11px;
        line-height: 1.3;
      }
      
      .tooltip-content p {
        margin-bottom: 6px;
      }
      
      .tooltip-content strong {
        color: #FFD700;
      }
      
      .close-tooltip {
        position: absolute;
        top: 4px;
        right: 4px;
        background: none;
        border: none;
        color: #666;
        font-size: 14px;
        cursor: pointer;
        padding: 2px;
        border-radius: 3px;
        transition: all 0.2s ease;
      }
      
      .close-tooltip:hover {
        color: #333;
        background: rgba(0, 0, 0, 0.1);
      }
      
      /* Mobile optimizations */
      @media (max-width: 768px) {
        .ui-header {
          right: 10px;
          flex-direction: column;
          gap: 8px;
          padding: 8px;
        }
        
        .progress-container {
          width: 100%;
          justify-content: center;
        }
        
        .progress-bar {
          max-width: none;
        }
        
        .discovery-panel {
          top: auto;
          bottom: 0;
          left: 0;
          right: 0;
          width: auto;
          height: 180px;
          border-left: none;
          border-top: 1px solid rgba(0, 0, 0, 0.15);
        }
        
        .element-grid {
          height: calc(100% - 40px);
        }
        
        .help-tooltip {
          top: 50px;
          right: 5px;
          left: 5px;
          max-width: none;
        }
        
        .mobile-menu {
          right: 5px;
        }
        
        .tooltip-content {
          font-size: 10px;
        }
      }
      
      /* Scrollbar styling */
      .element-grid::-webkit-scrollbar {
        width: 6px;
      }
      
      .element-grid::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 3px;
      }
      
      .element-grid::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }
      
      .element-grid::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
      }
    `;
    
    document.head.appendChild(style);
  }
  
  private setupEventListeners(): void {
    // Close help tooltip
    const closeTooltip = document.getElementById('close-tooltip')!;
    closeTooltip.addEventListener('click', () => {
      const tooltip = document.getElementById('help-tooltip');
      if (tooltip) {
        tooltip.classList.add('hidden');
        localStorage.setItem('idle-alchemy-hide-help', 'true');
      }
    });
    
    // Clear action
    const clearAction = document.getElementById('clear-action')!;
    clearAction.addEventListener('click', async () => {
      const confirmed = await showConfirm({
        title: '🧹 Clear Canvas',
        message: 'This will remove all elements from the canvas, but keep your discovered elements. Are you sure?',
        confirmText: 'Clear',
        cancelText: 'Cancel',
        type: 'confirm'
      });
      
      if (confirmed) {
        this.game.clearCanvas();
        this.showToast('Canvas cleared!');
      }
    });
    
    // Reset action
    const resetAction = document.getElementById('reset-action')!;
    resetAction.addEventListener('click', async () => {
      const confirmed = await showConfirm({
        title: '🔄 Reset Game',
        message: 'This will reset your entire progress and remove all discovered elements. You will start over with just the 4 basic elements. This action cannot be undone!',
        confirmText: 'Reset Game',
        cancelText: 'Cancel',
        type: 'warning'
      });
      
      if (confirmed) {
        this.game.reset();
        this.showToast('Game reset!');
      }
    });
    
    // Game state changes
    window.addEventListener('gameStateChanged', ((event: CustomEvent) => {
      // Store game state for element grid updates
      (window as any).lastGameState = event;
      this.updateUI();
      this.hideInstructionsIfNeeded();
    }) as EventListener);
  }
  
  private updateUI(): void {
    const progress = this.game.getProgress();
    
    // Update elements title with count
    const elementsTitle = document.getElementById('elements-title')!;
    elementsTitle.textContent = `🧪 Elements (${progress.discovered})`;
    
    // Update element grid
    this.updateElementGrid();
  }
  
  private updateElementGrid(): void {
    console.log('🎨 updateElementGrid() called');
    this.elementGrid.innerHTML = '';
    
    // Get discovered elements from the game's event data
    let discoveredElements: any[] = [];
    
    // Listen for game state changes to get discovered elements
    const gameStateEvent = (window as any).lastGameState;
    console.log('🎮 gameStateEvent:', gameStateEvent);
    
    if (gameStateEvent?.detail?.discoveredElements) {
      discoveredElements = gameStateEvent.detail.discoveredElements;
      console.log('✅ Using game state elements:', discoveredElements);
    } else {
      // Fallback to basic elements using HEX IDs
      discoveredElements = [
        { id: '0', name: 'Water', emoji: '💧', rarity: 'common' },
        { id: '1', name: 'Fire', emoji: '🔥', rarity: 'common' },
        { id: '2', name: 'Earth', emoji: '🌍', rarity: 'common' },
        { id: '3', name: 'Air', emoji: '🌬️', rarity: 'common' },
      ];
      console.log('⚠️ Using fallback hex ID elements:', discoveredElements);
    }
    
    console.log(`🏗️ Creating ${discoveredElements.length} element cards`);
    
    discoveredElements.forEach((element, index) => {
      console.log(`🃏 Creating card ${index}: ${element.id} = ${element.name} ${element.emoji}`);
      
      const elementCard = document.createElement('div');
      elementCard.className = `element-card`;
      elementCard.draggable = true;
      elementCard.innerHTML = `
        <span class="element-emoji">${element.emoji}</span>
        <span class="element-name">${element.name}</span>
      `;
      
      // Add drag functionality
      elementCard.addEventListener('dragstart', (e) => {
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/plain', element.id);
          e.dataTransfer.effectAllowed = 'copy';
        }
      });
      
      // Add click to add functionality
      elementCard.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Add visual feedback
        elementCard.classList.add('clicked');
        setTimeout(() => {
          elementCard.classList.remove('clicked');
        }, 150);
        
        this.addElementToCanvas(element.id);
      });
      
      this.elementGrid.appendChild(elementCard);
    });
    
    console.log(`✅ Element grid updated with ${this.elementGrid.children.length} cards`);
  }
  
  private addElementToCanvas(elementId: string): void {
    // Add element near the center of current view with some randomness
    // Get canvas center in world coordinates
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Add random offset around center (within 150px radius)
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 150;
    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;
    
    // Convert to global coordinates and add the element
    const globalX = rect.left + centerX + offsetX;
    const globalY = rect.top + centerY + offsetY;
    
    const success = this.game.addElementFromPanel(elementId, globalX, globalY);
    
    if (success) {
      // Get element name from config for display
      const element = configLoader.getElements().get(elementId);
      const elementName = element ? element.name : elementId;
      this.showToast(`Added ${elementName}!`);
    }
  }

  private hideInstructionsIfNeeded(): void {
    const helpTooltip = document.getElementById('help-tooltip');
    if (!helpTooltip) return;

    // Check if user manually closed the tooltip
    const manuallyHidden = localStorage.getItem('idle-alchemy-hide-help') === 'true';
    
    // Get current progress to determine if help should be shown
    const progress = this.game.getProgress();
    
    // Show help if:
    // 1. User hasn't manually closed it AND
    // 2. User has discovered 5 or fewer elements (basic 4 + at most 1 more)
    const shouldShowHelp = !manuallyHidden && progress.discovered <= 5;
    
    if (shouldShowHelp) {
      helpTooltip.classList.remove('hidden');
    } else {
      helpTooltip.classList.add('hidden');
    }
  }
  
  private showToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      font-weight: bold;
      z-index: 1000;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });
    
    // Remove after delay
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 2000);
  }
} 