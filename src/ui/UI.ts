import { Game } from '@/game/Game';
import { showConfirm } from '@/ui/Dialog';
import { configLoader } from '@/config/ConfigLoader';
import { i18n, t } from '@/i18n/Translation';

export class UI {
  private game: Game;
  private uiContainer: HTMLElement;
  private elementGrid!: HTMLElement;
  private helpManuallyClosed: boolean = false;
  
  constructor(game: Game) {
    this.game = game;
    this.uiContainer = document.getElementById('ui-overlay')!;
    
    this.createUI();
    this.updateUI();
    
    // Check if help should be shown based on progress
    this.hideInstructionsIfNeeded();
    
    // Listen for language changes
    window.addEventListener('languageChanged', () => {
      this.refreshUI();
    });
  }
  
  private createUI(): void {
    this.uiContainer.innerHTML = `
      <div class="discovery-panel ui-element" id="discovery-panel">
        <div class="panel-header">
          <div class="title-row">
            <h3 id="elements-title">🧪 Elements (4)</h3>
            <div class="title-actions">
              <button class="title-btn" id="reset-action" title="Reset Game">
                <span class="btn-icon">🔄</span>
              </button>
              <button class="title-btn" id="dark-mode-toggle" title="Toggle Dark Mode">
                <span class="btn-icon">🌙</span>
              </button>
            </div>
          </div>
          <div class="header-actions">
            <div class="search-container">
              <input type="text" id="element-search" placeholder="Search..." class="search-input" />
              <span class="search-icon">🔍</span>
            </div>
          </div>
        </div>
        <div class="element-grid" id="element-grid"></div>
        <div class="panel-resize-handle" id="panel-resize-handle"></div>
      </div>
      
      <div class="bottom-actions ui-element" id="bottom-actions">
        <span class="action-link" id="auto-arrange-action"></span>
        <span class="action-separator">|</span>
        <span class="action-link" id="remove-duplicate-action"></span>
        <span class="action-separator">|</span>
        <span class="action-link" id="clear-action"></span>
      </div>
      
      <div class="help-tooltip ui-element" id="help-tooltip">
        <div class="tooltip-content">
          <p><strong id="help-title"></strong></p>
          <p id="help-step1"></p>
          <p id="help-step2"></p>
          <p id="help-step3"></p>
          <p id="help-step4"></p>
          <p id="help-step5"></p>
          <button class="close-tooltip" id="close-tooltip"></button>
        </div>
      </div>
    `;
    
    // Now populate with translated content
    this.updateTranslatedContent();
    
    // Get references
    this.elementGrid = document.getElementById('element-grid')!;
    
    this.addStyles();
    this.setupEventListeners();
  }
  
  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .bottom-actions {
        position: absolute;
        top: 10px;
        left: 10px;
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
        font-size: 12px;
        cursor: pointer;
        text-decoration: underline;
        transition: color 0.2s ease;
      }
      
      .action-link:hover {
        color: #333;
      }
      
      .action-separator {
        color: #ccc;
        font-size: 9px;
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
        border-left: 1px solid rgba(0, 0, 0, 0.15);
        min-width: 200px;
        max-width: 500px;
        box-sizing: border-box;
      }
      
      .panel-resize-handle {
        position: absolute;
        left: -3px;
        top: 0;
        bottom: 0;
        width: 6px;
        cursor: ew-resize;
        background: transparent;
        z-index: 10;
        transition: background 0.15s ease;
      }
      
      .panel-resize-handle:hover {
        background: rgba(0, 123, 255, 0.15);
        box-shadow: inset 2px 0 0 rgba(0, 123, 255, 0.4);
      }
      
      .panel-header {
        display: flex;
        flex-direction: column;
        gap: 8px;
        color: #333;
        margin-bottom: 12px;
      }
      
      .title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
      }
      
      .panel-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #2c3e50;
        flex: 1;
      }
      
      .title-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .title-btn {
        background: rgba(0, 0, 0, 0.03);
        border: 1px solid rgba(0, 0, 0, 0.06);
        border-radius: 4px;
        padding: 3px 5px;
        cursor: pointer;
        transition: all 0.15s ease;
        font-size: 9px;
        color: #777;
        min-width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .title-btn:hover {
        background: rgba(0, 0, 0, 0.06);
        border-color: rgba(0, 0, 0, 0.12);
        color: #555;
      }
      
      .title-btn:active {
        transform: scale(0.95);
      }
      
      .header-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .search-container {
        position: relative;
        width: 100%;
      }
      
      .search-input {
        width: 100%;
        padding: 6px 30px 6px 10px;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.9);
        font-size: 11px;
        outline: none;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }
      
      .search-input:focus {
        border-color: rgba(0, 123, 255, 0.4);
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
      }
      
      .search-input::placeholder {
        color: #999;
      }
      
      .search-icon {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        color: #666;
        pointer-events: none;
      }
      
      .secondary-actions {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
        position: relative;
      }
      
      .secondary-btn {
        background: rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 4px;
        padding: 4px 6px;
        cursor: pointer;
        transition: all 0.15s ease;
        font-size: 10px;
        color: #666;
        min-width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .secondary-btn:hover {
        background: rgba(0, 0, 0, 0.08);
        border-color: rgba(0, 0, 0, 0.15);
        color: #333;
      }
      
      .secondary-btn:active {
        transform: scale(0.95);
      }
      
      .btn-icon {
        font-size: 10px;
        line-height: 1;
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
        color: #000;
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
          .discovery-panel {
            position: fixed !important;
            top: auto !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100vw !important;
            min-width: auto !important;
            max-width: none !important;
            height: 200px;
            border-left: none;
            border-top: 1px solid rgba(0, 0, 0, 0.15);
            min-height: 120px;
            max-height: 350px;
            border-radius: 0;
            margin: 0 !important;
            padding: 12px;
            box-sizing: border-box;
          }
          
          .panel-resize-handle {
            left: 0;
            right: 0;
            top: -3px;
            bottom: auto;
            width: 100%;
            height: 6px;
            cursor: ns-resize;
          }
          
          .panel-resize-handle:hover {
            background: rgba(0, 123, 255, 0.15);
            box-shadow: inset 0 2px 0 rgba(0, 123, 255, 0.4);
          }
          
          .title-row {
            margin-bottom: 6px;
          }
          
          .header-actions {
            flex-direction: row;
            align-items: center;
            justify-content: center;
          }
          
          .search-container {
            flex: 1;
          }
          
          .element-grid {
            height: calc(100% - 60px);
          }
          
          .help-tooltip {
            top: calc(50% - 100px);
            right: 10px;
            left: 10px;
            max-width: none;
            transform: translateY(-50%);
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
      
      /* Dark Mode Support */
      body.dark-mode {
        background: #1a1a1a;
        color: #e0e0e0;
      }
      
      body.dark-mode .discovery-panel {
        background: rgba(40, 40, 40, 0.95);
        border-left-color: rgba(255, 255, 255, 0.15);
        border-top-color: rgba(255, 255, 255, 0.15);
      }
      
      body.dark-mode .panel-header h3 {
        color: #e0e0e0;
      }
      
      body.dark-mode .title-btn {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
        color: #ccc;
      }
      
      body.dark-mode .title-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
      
      body.dark-mode .search-input {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.15);
        color: #e0e0e0;
      }
      
      body.dark-mode .search-input:focus {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(100, 181, 246, 0.5);
      }
      
      body.dark-mode .search-input::placeholder {
        color: #aaa;
      }
      
      body.dark-mode .element-card {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
      }
      
      body.dark-mode .element-card:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.25);
      }
      
      body.dark-mode .element-name {
        color: #e0e0e0;
      }
      
      body.dark-mode .bottom-actions {
        background: rgba(40, 40, 40, 0.9);
        border-color: rgba(255, 255, 255, 0.1);
      }
      
      body.dark-mode .action-link {
        color: #bbb;
      }
      
      body.dark-mode .action-link:hover {
        color: #fff;
      }
      
      body.dark-mode .help-tooltip {
        background: rgba(40, 40, 40, 0.95);
        border-color: rgba(255, 255, 255, 0.1);
        color: #e0e0e0;
      }
      
      /* Loading Screen Support */
      .loading-screen {
        color: #333;
      }
      
      body.dark-mode .loading-screen {
        color: #e0e0e0;
      }
      
      /* Error Screen Support */
      .error-screen {
        color: #333;
      }
      
      body.dark-mode .error-screen {
        color: #e0e0e0;
      }
      
      .error-reload-btn {
        transition: all 0.2s ease;
      }
      
      .error-reload-btn:hover {
        background: rgba(51, 51, 51, 0.2) !important;
        border-color: rgba(51, 51, 51, 0.5) !important;
      }
      
      body.dark-mode .error-reload-btn {
        background: rgba(255, 255, 255, 0.1) !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
        color: #e0e0e0 !important;
      }
      
      body.dark-mode .error-reload-btn:hover {
        background: rgba(255, 255, 255, 0.2) !important;
        border-color: rgba(255, 255, 255, 0.5) !important;
      }
      
      /* Element Grid with Search */
      .element-card.hidden {
        display: none;
      }
      
      .no-results-message {
        text-align: center;
        color: #999;
        font-size: 11px;
        padding: 20px;
        font-style: italic;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  private setupEventListeners(): void {
    console.log('📋 Setting up event listeners...');
    // Close help tooltip
    const closeTooltip = document.getElementById('close-tooltip')!;
    closeTooltip.addEventListener('click', () => {
      const tooltip = document.getElementById('help-tooltip');
      if (tooltip) {
        tooltip.classList.add('hidden');
        this.helpManuallyClosed = true; // Track manual closure
      }
    });
    
    // Auto arrange action
    const autoArrangeAction = document.getElementById('auto-arrange-action')!;
    autoArrangeAction.addEventListener('click', () => {
      this.autoArrangeElements();
      this.showToast(t('ui.messages.elementsArranged'));
    });
    
    // Remove duplicate action
    const removeDuplicateAction = document.getElementById('remove-duplicate-action')!;
    removeDuplicateAction.addEventListener('click', () => {
      const removedCount = this.removeDuplicateElements();
      if (removedCount > 0) {
        const pluralS = removedCount > 1 ? 's' : '';
        this.showToast(t('ui.messages.removedDuplicates', { count: removedCount, s: pluralS }));
      } else {
        this.showToast(t('ui.messages.noDuplicatesFound'));
      }
    });
    
    // Clear action
    const clearAction = document.getElementById('clear-action')!;
    clearAction.addEventListener('click', async () => {
      const confirmed = await showConfirm({
        title: t('ui.confirmations.clearCanvas.title'),
        message: t('ui.confirmations.clearCanvas.message'),
        confirmText: t('ui.confirmations.clearCanvas.confirm'),
        cancelText: t('ui.confirmations.clearCanvas.cancel'),
        type: 'confirm'
      });
      
      if (confirmed) {
        this.game.clearCanvas();
        this.showToast(t('ui.messages.canvasCleared'));
      }
    });
    
    // Reset action (now in panel header)
    const resetAction = document.getElementById('reset-action')!;
    resetAction.addEventListener('click', async () => {
      const confirmed = await showConfirm({
        title: t('ui.confirmations.resetGame.title'),
        message: t('ui.confirmations.resetGame.message'),
        confirmText: t('ui.confirmations.resetGame.confirm'),
        cancelText: t('ui.confirmations.resetGame.cancel'),
        type: 'warning'
      });
      
      if (confirmed) {
        this.game.reset();
        this.showToast(t('ui.messages.gameReset'));
      }
    });
    
    // Search functionality
    this.setupElementSearch();
    
    // Panel resize functionality
    this.setupPanelResize();
    
    // Dark mode toggle
    this.setupDarkModeToggle();

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
      const elementName = i18n.getElementName(element.id, element.name);
      elementCard.innerHTML = `
        <span class="element-emoji">${element.emoji}</span>
        <span class="element-name">${elementName}</span>
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
      const element = configLoader.getElementById(elementId);
      const elementName = element ? i18n.getElementName(elementId, element.name) : elementId;
      this.showToast(t('ui.messages.added', { element: elementName }));
    }
  }

  private autoArrangeElements(): void {
    this.game.autoArrangeElements();
  }

  private removeDuplicateElements(): number {
    return this.game.removeDuplicateElements();
  }

  private hideInstructionsIfNeeded(): void {
    const helpTooltip = document.getElementById('help-tooltip');
    if (!helpTooltip) return;

    // If user manually closed help, never show it again
    if (this.helpManuallyClosed) {
      helpTooltip.classList.add('hidden');
      return;
    }
    
    // Get current progress to determine if help should be shown
    const progress = this.game.getProgress();
    
    // Show help if user has discovered 5 or fewer elements (basic 4 + at most 1 more)
    const shouldShowHelp = progress.discovered <= 5;
    
    if (shouldShowHelp) {
      helpTooltip.classList.remove('hidden');
    } else {
      helpTooltip.classList.add('hidden');
    }
  }
  
  private refreshUI(): void {
    // Update translated content without recreating the entire UI
    this.updateTranslatedContent();
    this.updateUI();
    this.hideInstructionsIfNeeded();
  }
  
  private updateTranslatedContent(): void {
    console.log('🌍 Updating translated content...');
    // Update action buttons
    const autoArrangeAction = document.getElementById('auto-arrange-action');
    if (autoArrangeAction) autoArrangeAction.textContent = t('ui.buttons.autoArrange');
    
    const removeDuplicateAction = document.getElementById('remove-duplicate-action');
    if (removeDuplicateAction) removeDuplicateAction.textContent = t('ui.buttons.removeDuplicate');
    
    const clearAction = document.getElementById('clear-action');
    if (clearAction) clearAction.textContent = t('ui.buttons.clear');
    
    const resetAction = document.getElementById('reset-action');
    if (resetAction) resetAction.title = t('ui.buttons.reset') || 'Reset Game';
    
    // Update search placeholder
    const searchInput = document.getElementById('element-search') as HTMLInputElement;
    if (searchInput) searchInput.placeholder = t('ui.placeholder.search') || 'Search...';
    
    // Update help tooltip
    const helpTitle = document.getElementById('help-title');
    if (helpTitle) helpTitle.textContent = t('ui.titles.howToPlay');
    
    const helpStep1 = document.getElementById('help-step1');
    if (helpStep1) helpStep1.textContent = t('ui.instructions.step1');
    
    const helpStep2 = document.getElementById('help-step2');
    if (helpStep2) helpStep2.textContent = t('ui.instructions.step2');
    
    const helpStep3 = document.getElementById('help-step3');
    if (helpStep3) helpStep3.textContent = t('ui.instructions.step3');
    
    const helpStep4 = document.getElementById('help-step4');
    if (helpStep4) helpStep4.textContent = t('ui.instructions.step4');
    
    const helpStep5 = document.getElementById('help-step5');
    if (helpStep5) helpStep5.textContent = t('ui.instructions.step5');
    
    const closeTooltip = document.getElementById('close-tooltip');
    if (closeTooltip) closeTooltip.textContent = t('✕');
  }
  

  
  private setupDarkModeToggle(): void {
    console.log('🔧 Setting up dark mode toggle...');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    if (!darkModeToggle) {
      console.error('❌ Dark mode toggle button not found!');
      return;
    }
    
    // Load saved dark mode preference
    const isDarkMode = localStorage.getItem('idle-alchemy-dark-mode') === 'true';
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      this.updateDarkModeIcon(true);
    }
    
    // Dark mode toggle handler
    darkModeToggle.addEventListener('click', () => {
      const isCurrentlyDark = document.body.classList.contains('dark-mode');
      
      if (isCurrentlyDark) {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('idle-alchemy-dark-mode', 'false');
        this.updateDarkModeIcon(false);
      } else {
        document.body.classList.add('dark-mode');
        localStorage.setItem('idle-alchemy-dark-mode', 'true');
        this.updateDarkModeIcon(true);
      }
    });
  }
  
  private updateDarkModeIcon(isDark: boolean): void {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
      const icon = darkModeToggle.querySelector('.btn-icon');
      if (icon) {
        icon.textContent = isDark ? '☀️' : '🌙';
      }
    }
  }
  

  
    private setupPanelResize(): void {
    const resizeHandle = document.getElementById('panel-resize-handle');
    const discoveryPanel = document.getElementById('discovery-panel');
    const gameContainer = document.getElementById('game-container');
    
    if (!resizeHandle || !discoveryPanel || !gameContainer) {
      console.error('❌ Panel resize elements not found!');
      return;
    }
    
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    
    const updateGameContainerSize = (newWidth?: number, newHeight?: number) => {
      const isDesktop = window.innerWidth > 768;
      
      if (isDesktop) {
        // Desktop: reset mobile styles and adjust for side panel
        gameContainer.style.marginBottom = '0';
        gameContainer.style.height = '100vh';
        if (newWidth) {
          gameContainer.style.marginRight = `${newWidth}px`;
          gameContainer.style.width = `calc(100vw - ${newWidth}px)`;
        } else {
          gameContainer.style.marginRight = '240px';
          gameContainer.style.width = 'calc(100vw - 240px)';
        }
      } else {
        // Mobile: reset desktop styles and adjust for bottom panel
        gameContainer.style.marginRight = '0';
        gameContainer.style.width = '100vw';
        if (newHeight) {
          gameContainer.style.marginBottom = `${newHeight}px`;
          gameContainer.style.height = `calc(100vh - ${newHeight}px)`;
        } else {
          gameContainer.style.marginBottom = '200px';
          gameContainer.style.height = 'calc(100vh - 200px)';
        }
      }
      
      // Trigger PIXI resize without causing infinite loop
      setTimeout(() => {
        if ((window as any).game && (window as any).game.app) {
          const canvas = (window as any).game.app.view;
          const container = canvas.parentElement;
          if (container) {
            (window as any).game.app.renderer.resize(container.clientWidth, container.clientHeight);
          }
        }
      }, 0);
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const isDesktop = window.innerWidth > 768;
      if (isDesktop) {
        startWidth = discoveryPanel.offsetWidth;
      } else {
        startHeight = discoveryPanel.offsetHeight;
      }
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isDesktop ? 'ew-resize' : 'ns-resize';
      document.body.style.userSelect = 'none';
      // Disable pointer events on iframe/canvas during resize to prevent issues
      document.body.style.pointerEvents = 'none';
      resizeHandle.style.pointerEvents = 'auto';
      e.preventDefault();
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const isDesktop = window.innerWidth > 768;
      
      if (isDesktop) {
        // Desktop: horizontal resize (right panel)
        const deltaX = startX - e.clientX; // Reversed because panel is on the right
        const maxWidth = Math.min(500, window.innerWidth * 0.6); // Max 60% of viewport
        const newWidth = Math.min(maxWidth, Math.max(200, startWidth + deltaX));
        
        discoveryPanel.style.width = `${newWidth}px`;
        updateGameContainerSize(newWidth);
      } else {
        // Mobile: vertical resize (bottom panel)
        const deltaY = startY - e.clientY; // Reversed because panel is at the bottom
        const maxHeight = Math.min(350, window.innerHeight * 0.5); // Max 50% of viewport
        const newHeight = Math.min(maxHeight, Math.max(120, startHeight + deltaY));
        
        discoveryPanel.style.height = `${newHeight}px`;
        updateGameContainerSize(undefined, newHeight);
      }
    };
    
    const handleMouseUp = () => {
      isResizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      resizeHandle.style.pointerEvents = '';
    };
    
    // Touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      isResizing = true;
      startX = touch.clientX;
      startY = touch.clientY;
      
      const isDesktop = window.innerWidth > 768;
      if (isDesktop) {
        startWidth = discoveryPanel.offsetWidth;
      } else {
        startHeight = discoveryPanel.offsetHeight;
      }
      
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.body.style.userSelect = 'none';
      e.preventDefault();
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isResizing || e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const isDesktop = window.innerWidth > 768;
      
      if (isDesktop) {
        // Desktop: horizontal resize
        const deltaX = startX - touch.clientX;
        const maxWidth = Math.min(500, window.innerWidth * 0.6);
        const newWidth = Math.min(maxWidth, Math.max(200, startWidth + deltaX));
        
        discoveryPanel.style.width = `${newWidth}px`;
        updateGameContainerSize(newWidth);
      } else {
        // Mobile: vertical resize
        const deltaY = startY - touch.clientY;
        const maxHeight = Math.min(350, window.innerHeight * 0.5);
        const newHeight = Math.min(maxHeight, Math.max(120, startHeight + deltaY));
        
        discoveryPanel.style.height = `${newHeight}px`;
        updateGameContainerSize(undefined, newHeight);
      }
      
      e.preventDefault();
    };
    
    const handleTouchEnd = () => {
      isResizing = false;
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.userSelect = '';
    };
    
    resizeHandle.addEventListener('mousedown', handleMouseDown);
    resizeHandle.addEventListener('touchstart', handleTouchStart);
    
    // Handle window resize to transition between desktop/mobile layouts
    const handleWindowResize = () => {
      // Update layout based on current window size
      updateGameContainerSize();
    };
    
    window.addEventListener('resize', handleWindowResize);
    
    // Initial layout setup
    updateGameContainerSize();
  }
  
  private setupElementSearch(): void {
    const searchInput = document.getElementById('element-search') as HTMLInputElement;
    
    if (!searchInput) {
      console.error('❌ Search input not found!');
      return;
    }
    
    let searchTimeout: NodeJS.Timeout;
    
    const performSearch = () => {
      const query = searchInput.value.toLowerCase().trim();
      const elementCards = this.elementGrid.querySelectorAll('.element-card');
      let visibleCount = 0;
      
      elementCards.forEach(card => {
        const elementName = card.querySelector('.element-name')?.textContent?.toLowerCase() || '';
        const shouldShow = query === '' || elementName.includes(query);
        
        if (shouldShow) {
          card.classList.remove('hidden');
          visibleCount++;
        } else {
          card.classList.add('hidden');
        }
      });
      
      // Remove any existing no-results message
      const existingMessage = this.elementGrid.querySelector('.no-results-message');
      if (existingMessage) {
        existingMessage.remove();
      }
      
      // Show no results message if needed
      if (query !== '' && visibleCount === 0) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results-message';
        noResultsDiv.textContent = t('ui.messages.noElementsFound') || 'No elements found';
        this.elementGrid.appendChild(noResultsDiv);
      }
    };
    
    // Debounced search
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(performSearch, 150);
    });
    
    // Clear search on escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        performSearch();
        searchInput.blur();
      }
    });
  }
 
  private showToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      z-index: 1000;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
      max-width: 250px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });
    
    // Remove after shorter delay
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 200);
    }, 1500);
  }
} 