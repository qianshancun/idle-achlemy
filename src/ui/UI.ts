import { Game } from '@/game/Game';

export class UI {
  private game: Game;
  private uiContainer: HTMLElement;
  private discoveryPanel!: HTMLElement;
  private progressBar!: HTMLElement;
  private progressText!: HTMLElement;
  private elementGrid!: HTMLElement;
  private hintButton!: HTMLElement;
  private resetButton!: HTMLElement;
  private menuToggle!: HTMLElement;
  private mobileMenu!: HTMLElement;
  
  constructor(game: Game) {
    this.game = game;
    this.uiContainer = document.getElementById('ui-overlay')!;
    
    this.createUI();
    this.setupEventListeners();
    this.updateUI();
  }
  
  private createUI(): void {
    this.uiContainer.innerHTML = `
      <div class="ui-header ui-element">
        <div class="progress-container">
          <div class="progress-text">Elements: <span id="progress-text">0/0</span></div>
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
        </div>
        <div class="header-buttons">
          <button class="ui-button hint-button" id="hint-button">💡 Hint</button>
          <button class="ui-button menu-toggle" id="menu-toggle">☰</button>
        </div>
      </div>
      
      <div class="mobile-menu ui-element" id="mobile-menu">
        <div class="menu-content">
          <h3>Game Menu</h3>
          <button class="ui-button" id="reset-button">🔄 Reset Game</button>
          <button class="ui-button" id="save-button">💾 Save Game</button>
          <button class="ui-button" id="close-menu">✕ Close</button>
        </div>
      </div>
      
      <div class="discovery-panel ui-element" id="discovery-panel">
        <div class="panel-header">
          <h3>🧪 Elements</h3>
          <div class="panel-info">Drag to canvas</div>
          <button class="panel-toggle" id="panel-toggle">−</button>
        </div>
        <div class="element-grid" id="element-grid"></div>
      </div>
      
      <div class="help-tooltip ui-element" id="help-tooltip">
        <div class="tooltip-content">
          <p>🎯 <strong>How to Play:</strong></p>
          <p>1. Drag elements from the bottom panel to the canvas</p>
          <p>2. Drag canvas elements onto each other to merge</p>
          <p>3. Double-tap canvas elements to duplicate them</p>
          <p>4. Discover new elements by experimenting!</p>
          <button class="close-tooltip" id="close-tooltip">✕</button>
        </div>
      </div>
    `;
    
    // Get references
    this.progressBar = document.getElementById('progress-fill')!;
    this.progressText = document.getElementById('progress-text')!;
    this.discoveryPanel = document.getElementById('discovery-panel')!;
    this.elementGrid = document.getElementById('element-grid')!;
    this.hintButton = document.getElementById('hint-button')!;
    this.resetButton = document.getElementById('reset-button')!;
    this.menuToggle = document.getElementById('menu-toggle')!;
    this.mobileMenu = document.getElementById('mobile-menu')!;
    
    this.addStyles();
  }
  
  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .ui-header {
        position: absolute;
        top: 20px;
        left: 20px;
        right: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 15px;
        padding: 15px 20px;
        backdrop-filter: blur(10px);
      }
      
      .progress-container {
        display: flex;
        align-items: center;
        gap: 15px;
        flex: 1;
      }
      
      .progress-text {
        color: white;
        font-weight: bold;
        font-size: 16px;
        min-width: 120px;
      }
      
      .progress-bar {
        flex: 1;
        height: 8px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        overflow: hidden;
        max-width: 200px;
      }
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #4CAF50, #8BC34A);
        width: 0%;
        transition: width 0.5s ease;
      }
      
      .header-buttons {
        display: flex;
        gap: 10px;
      }
      
      .ui-button {
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        transition: all 0.3s ease;
        touch-action: manipulation;
      }
      
      .ui-button:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
      }
      
      .ui-button:active {
        transform: translateY(0);
      }
      
      .mobile-menu {
        position: absolute;
        top: 80px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        border-radius: 15px;
        padding: 20px;
        min-width: 200px;
        display: none;
        backdrop-filter: blur(10px);
      }
      
      .mobile-menu.active {
        display: block;
      }
      
      .menu-content h3 {
        color: white;
        margin: 0 0 15px 0;
        text-align: center;
      }
      
      .menu-content .ui-button {
        width: 100%;
        margin-bottom: 10px;
        justify-content: center;
        display: flex;
        align-items: center;
      }
      
      .discovery-panel {
        position: absolute;
        bottom: 20px;
        left: 20px;
        right: 20px;
        max-height: 40vh;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 15px;
        padding: 20px;
        backdrop-filter: blur(10px);
        overflow: hidden;
        transition: max-height 0.3s ease;
      }
      
      .discovery-panel.collapsed {
        max-height: 60px;
      }
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: white;
        margin-bottom: 15px;
      }
      
      .panel-header h3 {
        margin: 0;
        font-size: 18px;
      }
      
      .panel-info {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        font-style: italic;
      }
      
      .panel-toggle {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: background 0.2s ease;
      }
      
      .panel-toggle:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .element-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 10px;
        max-height: 200px;
        overflow-y: auto;
      }
      
      .element-card {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 12px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid transparent;
      }
      
      .element-card:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
      }
      
      .element-card.rare {
        border-color: rgba(0, 128, 255, 0.5);
        box-shadow: 0 0 10px rgba(0, 128, 255, 0.3);
      }
      
      .element-card.epic {
        border-color: rgba(128, 0, 255, 0.5);
        box-shadow: 0 0 10px rgba(128, 0, 255, 0.3);
      }
      
      .element-card.legendary {
        border-color: rgba(255, 128, 0, 0.5);
        box-shadow: 0 0 10px rgba(255, 128, 0, 0.3);
      }
      
      .element-emoji {
        font-size: 24px;
        display: block;
        margin-bottom: 5px;
      }
      
      .element-name {
        color: white;
        font-size: 12px;
        font-weight: bold;
      }
      
      .help-tooltip {
        position: absolute;
        top: 100px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        border-radius: 15px;
        padding: 20px;
        max-width: 280px;
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255, 255, 255, 0.2);
        transition: opacity 0.3s ease;
      }
      
      .help-tooltip.hidden {
        opacity: 0;
        pointer-events: none;
      }
      
      .tooltip-content {
        color: white;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .tooltip-content p {
        margin-bottom: 8px;
      }
      
      .tooltip-content strong {
        color: #FFD700;
      }
      
      .close-tooltip {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      
      .close-tooltip:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
      }
      
      /* Mobile optimizations */
      @media (max-width: 768px) {
        .ui-header {
          flex-direction: column;
          gap: 15px;
          padding: 15px;
        }
        
        .progress-container {
          width: 100%;
          justify-content: center;
        }
        
        .progress-bar {
          max-width: none;
        }
        
        .discovery-panel {
          max-height: 35vh;
        }
        
        .element-grid {
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          max-height: 150px;
        }
        
        .help-tooltip {
          top: 80px;
          right: 10px;
          left: 10px;
          max-width: none;
        }
        
        .tooltip-content {
          font-size: 12px;
        }
      }
      
      /* Scrollbar styling */
      .element-grid::-webkit-scrollbar {
        width: 6px;
      }
      
      .element-grid::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
      }
      
      .element-grid::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  private setupEventListeners(): void {
    // Panel toggle
    const panelToggle = document.getElementById('panel-toggle')!;
    panelToggle.addEventListener('click', () => {
      this.discoveryPanel.classList.toggle('collapsed');
      panelToggle.textContent = this.discoveryPanel.classList.contains('collapsed') ? '+' : '−';
    });
    
    // Mobile menu toggle
    this.menuToggle.addEventListener('click', () => {
      this.mobileMenu.classList.toggle('active');
    });
    
    // Close menu button
    const closeMenu = document.getElementById('close-menu')!;
    closeMenu.addEventListener('click', () => {
      this.mobileMenu.classList.remove('active');
    });
    
    // Close help tooltip
    const closeTooltip = document.getElementById('close-tooltip')!;
    closeTooltip.addEventListener('click', () => {
      const tooltip = document.getElementById('help-tooltip');
      if (tooltip) {
        tooltip.classList.add('hidden');
        localStorage.setItem('idle-alchemy-hide-help', 'true');
      }
    });
    
    // Hint button
    this.hintButton.addEventListener('click', () => {
      const hint = this.game.getHint();
      if (hint) {
        this.showToast(hint);
      }
    });
    
    // Reset button
    this.resetButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset your progress?')) {
        this.game.reset();
        this.mobileMenu.classList.remove('active');
      }
    });
    
    // Save button
    const saveButton = document.getElementById('save-button')!;
    saveButton.addEventListener('click', () => {
      this.showToast('Game saved!');
      this.mobileMenu.classList.remove('active');
    });
    
    // Game state changes
    window.addEventListener('gameStateChanged', (() => {
      this.updateUI();
      this.hideInstructionsIfNeeded();
    }) as EventListener);
    
    // Click outside to close menu
    document.addEventListener('click', (event) => {
      if (!this.mobileMenu.contains(event.target as Node) && 
          !this.menuToggle.contains(event.target as Node)) {
        this.mobileMenu.classList.remove('active');
      }
    });
  }
  
  private updateUI(): void {
    const progress = this.game.getProgress();
    
    // Update progress bar
    this.progressText.textContent = `${progress.discovered}/${progress.total}`;
    this.progressBar.style.width = `${progress.percentage}%`;
    
    // Update element grid
    this.updateElementGrid();
  }
  
  private updateElementGrid(): void {
    this.elementGrid.innerHTML = '';
    
    // Add basic elements first (always available)
    const basicElements = [
      { id: 'water', name: 'Water', emoji: '💧', rarity: 'common' },
      { id: 'fire', name: 'Fire', emoji: '🔥', rarity: 'common' },
      { id: 'earth', name: 'Earth', emoji: '🌍', rarity: 'common' },
      { id: 'air', name: 'Air', emoji: '🌬️', rarity: 'common' },
    ];
    
    // Add any other discovered elements (this would be expanded with actual element manager integration)
    const allElements = [...basicElements];
    
    allElements.forEach(element => {
      const elementCard = document.createElement('div');
      elementCard.className = `element-card ${element.rarity}`;
      elementCard.draggable = true;
      elementCard.innerHTML = `
        <span class="element-emoji">${element.emoji}</span>
        <span class="element-name">${element.name}</span>
      `;
      
      // Add drag functionality only - no click to add
      elementCard.addEventListener('dragstart', (e) => {
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/plain', element.id);
          e.dataTransfer.effectAllowed = 'copy';
        }
      });
      
      this.elementGrid.appendChild(elementCard);
    });
  }
  
  private hideInstructionsIfNeeded(): void {
    // Check if help should be hidden based on user preference
    const shouldHideHelp = localStorage.getItem('idle-alchemy-hide-help');
    const helpTooltip = document.getElementById('help-tooltip');
    
    if (helpTooltip && shouldHideHelp === 'true') {
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