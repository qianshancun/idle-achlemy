import { Game } from '@/game/Game';
import { showConfirm } from '@/ui/Dialog';
import { configLoader } from '@/config/ConfigLoader';
import { i18n, t } from '@/i18n/Translation';

export class UI {
  private game: Game;
  private uiContainer: HTMLElement;
  private elementGrid!: HTMLElement;
  private helpManuallyClosed: boolean = false;
  private currentSort: string = 'discovery-asc';
  private discoveryOrder: string[] = [];
  
  constructor(game: Game) {
    this.game = game;
    this.uiContainer = document.getElementById('ui-overlay')!;
    
    // Set up dark mode class
    this.setupDarkModeClass();
    
    // Initialize discovery order from localStorage
    this.loadDiscoveryOrder();
    
    this.createUI();
    this.updateUI();
    
    // Check if help should be shown based on progress
    this.hideInstructionsIfNeeded();
    
    // Listen for language changes
    window.addEventListener('languageChanged', () => {
      this.refreshUI();
    });
  }
  
  private loadDiscoveryOrder(): void {
    const saved = localStorage.getItem('idle-alchemy-discovery-order');
    if (saved) {
      try {
        this.discoveryOrder = JSON.parse(saved);
      } catch (e) {
        this.discoveryOrder = [];
      }
    }
  }
  
  private saveDiscoveryOrder(): void {
    localStorage.setItem('idle-alchemy-discovery-order', JSON.stringify(this.discoveryOrder));
  }
  
  private addToDiscoveryOrder(elementId: string): void {
    if (!this.discoveryOrder.includes(elementId)) {
      this.discoveryOrder.push(elementId);
      this.saveDiscoveryOrder();
    }
  }
  
  private createUI(): void {
    this.uiContainer.innerHTML = `
      <!-- Discovery Panel -->
      <div class="discovery-panel pointer-events-auto" id="discovery-panel">
        <!-- Panel Header -->
        <div class="panel-header">
          <!-- System Controls -->
          <div class="control-row">
            <button class="control-btn" id="reset-action" title="Reset Game">
              <span class="material-symbols-outlined">restart_alt</span>
            </button>
            <button class="control-btn" id="font-size-decrease" title="Decrease Font Size">
              <span class="material-symbols-outlined">text_decrease</span>
            </button>
            <button class="control-btn" id="font-size-increase" title="Increase Font Size">
              <span class="material-symbols-outlined">text_increase</span>
            </button>
            <button class="control-btn" id="dark-mode-toggle" title="Toggle Dark Mode">
              <span class="material-symbols-outlined">dark_mode</span>
            </button>
          </div>
          
          <!-- Title Section -->
          <div class="title-section">
            <h2 id="elements-title" class="panel-title">Elements</h2>
            <div class="title-divider"></div>
          </div>
          
          <!-- Search & Sort Controls -->
          <div class="search-section">
            <div class="search-input-container">
              <input type="text" id="element-search" placeholder="Search elements..." class="search-input" />
              <span class="material-symbols-outlined search-icon">search</span>
            </div>
            <div class="sort-controls">
              <button class="sort-btn" id="sort-alphabetical" title="Sort Alphabetically">
                <span class="material-symbols-outlined">sort_by_alpha</span>
              </button>
              <button class="sort-btn" id="sort-discovery-time" title="Sort by Discovery Time">
                <span class="material-symbols-outlined">schedule</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Element Grid -->
        <div class="element-grid-container">
          <div class="element-grid" id="element-grid"></div>
        </div>
        
        <!-- Resize Handle -->
        <div class="resize-handle" id="panel-resize-handle"></div>
      </div>
      
      <!-- Game Actions -->
      <div class="game-actions pointer-events-auto" id="bottom-actions">
        <div class="action-group">
          <button class="action-btn" id="auto-arrange-action"></button>
          <div class="action-divider"></div>
          <button class="action-btn" id="remove-duplicate-action"></button>
          <div class="action-divider"></div>
          <button class="action-btn" id="clear-action"></button>
        </div>
      </div>
      
      <!-- Help Tooltip -->
      <div class="help-overlay pointer-events-auto" id="help-tooltip">
        <div class="help-modal">
          <button class="help-close" id="close-tooltip">
            <span class="material-symbols-outlined">close</span>
          </button>
          <div class="help-content">
            <h3 class="help-title" id="help-title"></h3>
            <div class="help-steps">
              <p id="help-step1"></p>
              <p id="help-step2"></p>
              <p id="help-step3"></p>
              <p id="help-step4"></p>
              <p id="help-step5"></p>
            </div>
          </div>
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
      /* Global Font */
      * {
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      /* Discovery Panel */
      .discovery-panel {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 320px;
        min-width: 288px;
        max-width: 384px;
        display: flex;
        flex-direction: column;
        background: white;
        border-left: 1px solid #e2e8f0;
        z-index: 1000;
      }
      
      .dark .discovery-panel {
        background: #1e293b;
        border-left-color: #334155;
      }
      
      /* Panel Header */
      .panel-header {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
      }
      
      .dark .panel-header {
        border-bottom-color: #334155;
        background: #0f172a;
      }
      
      /* Control Row */
      .control-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      
      .control-btn {
        width: 36px;
        height: 36px;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        background: white;
        color: #475569;
        transition: all 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 18px;
      }
      
      .control-btn:hover {
        background: #f1f5f9;
        color: #1e293b;
      }
      
      .dark .control-btn {
        border-color: #475569;
        background: #334155;
        color: #cbd5e1;
      }
      
      .dark .control-btn:hover {
        background: #475569;
        color: #f1f5f9;
      }
      
      /* Title Section */
      .title-section {
        text-align: center;
      }
      
      .panel-title {
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 8px;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      .dark .panel-title {
        color: #e2e8f0;
      }
      
      .title-divider {
        height: 1px;
        background: #cbd5e1;
      }
      
      .dark .title-divider {
        background: #475569;
      }
      
      /* Search Section */
      .search-section {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .search-input-container {
        flex: 1;
        position: relative;
      }
      
      .search-input {
        width: 100%;
        padding: 8px 32px 8px 12px;
        font-size: 14px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: white;
        color: #0f172a;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      .search-input::placeholder {
        color: #64748b;
      }
      
      .search-input:focus {
        outline: none;
        border-color: #3b82f6;
      }
      
      .dark .search-input {
        border-color: #475569;
        background: #334155;
        color: #f1f5f9;
      }
      
      .dark .search-input::placeholder {
        color: #94a3b8;
      }
      
      .search-icon {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
        font-size: 18px;
        pointer-events: none;
      }
      
      .sort-controls {
        display: flex;
        gap: 4px;
      }
      
      .sort-btn {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        border: 1px solid #cbd5e1;
        background: white;
        color: #475569;
        transition: all 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
      }
      
      .sort-btn:hover {
        background: #f1f5f9;
      }
      
      .sort-btn.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
      
      /* Sort direction arrows */
      .sort-btn[data-direction="asc"]::after {
        content: "↑";
        position: absolute;
        top: -2px;
        right: 1px;
        font-size: 10px;
        font-weight: bold;
      }
      
      .sort-btn[data-direction="desc"]::after {
        content: "↓";
        position: absolute;
        top: -2px;
        right: 1px;
        font-size: 10px;
        font-weight: bold;
      }
      
      .sort-btn {
        position: relative;
      }
      
      .dark .sort-btn {
        border-color: #475569;
        background: #334155;
        color: #cbd5e1;
      }
      
      .dark .sort-btn:hover {
        background: #475569;
      }
      
      /* Element Grid Container */
      .element-grid-container {
        flex: 1;
        overflow-y: auto;
      }
      
      .element-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 8px;
      }
      
      /* Minimal Element Layout - Content Fit */
      .element-card {
        display: flex;
        align-items: center;
        padding: 6px 10px;
        cursor: pointer;
        transition: background-color 0.15s;
        border-radius: 4px;
        gap: 8px;
        font-family: system-ui, -apple-system, sans-serif;
        width: fit-content;
        min-width: fit-content;
      }
      
      .element-card:hover {
        background: #f1f5f9;
      }
      
      .element-card.clicked {
        background: #dbeafe;
      }
      
      .dark .element-card:hover {
        background: #334155;
      }
      
      .dark .element-card.clicked {
        background: #1e3a8a;
      }
      
      .element-emoji {
        font-size: 18px;
        line-height: 1;
        flex-shrink: 0;
      }
      
      .element-name {
        font-size: 14px;
        font-weight: 500;
        color: #334155;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      .dark .element-name {
        color: #e2e8f0;
      }
      
      /* Resize Handle */
      .resize-handle {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        cursor: ew-resize;
        background: transparent;
      }
      
      .resize-handle:hover {
        background: #3b82f6;
      }
      
      /* Game Actions */
      .game-actions {
        position: fixed;
        top: 16px;
        left: 16px;
        z-index: 50;
        background: white;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
      }
      
      .dark .game-actions {
        background: #1e293b;
        border-color: #334155;
      }
      
      .action-group {
        display: flex;
        align-items: center;
        padding: 6px 10px;
      }
      
      .action-btn {
        padding: 4px 12px;
        font-size: 14px;
        font-weight: 500;
        color: #475569;
        cursor: pointer;
        transition: color 0.15s;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      .action-btn:hover {
        color: #1e293b;
      }
      
      .dark .action-btn {
        color: #cbd5e1;
      }
      
      .dark .action-btn:hover {
        color: #f1f5f9;
      }
      
      .action-divider {
        width: 1px;
        height: 16px;
        background: #cbd5e1;
        margin: 0 8px;
      }
      
      .dark .action-divider {
        background: #475569;
      }
      
      /* Help/Confirm Modal */
      .help-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.5);
      }
      
      .help-overlay.hidden {
        display: none;
      }
      
      .help-modal {
        background: white;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        max-width: 448px;
        width: 100%;
        padding: 24px;
        position: relative;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      .dark .help-modal {
        background: #1e293b;
        border-color: #334155;
      }
      
      .help-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        cursor: pointer;
        transition: color 0.15s;
        font-size: 18px;
      }
      
      .help-close:hover {
        color: #475569;
      }
      
      .dark .help-close:hover {
        color: #e2e8f0;
      }
      
      .help-title {
        font-size: 18px;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 16px;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      .dark .help-title {
        color: #f1f5f9;
      }
      
      .help-steps {
        display: flex;
        flex-direction: column;
        gap: 12px;
        font-size: 14px;
        color: #334155;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      .dark .help-steps {
        color: #cbd5e1;
      }
      
      /* Confirm Dialog Buttons */
      button {
        cursor: pointer;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      /* Mobile Responsive */
      @media (max-width: 768px) {
        .discovery-panel {
          position: fixed;
          top: auto;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100vw;
          height: 280px;
          max-height: 60vh;
        }
        
        .element-card {
          padding: 6px 12px;
          gap: 8px;
        }
        
        .element-emoji {
          font-size: 16px;
        }
        
        .element-name {
          font-size: 13px;
        }
        
        .game-actions {
          top: 8px;
          left: 8px;
        }
      }
      
      /* Utility Classes */
      .element-card.hidden {
        display: none;
      }
      
      .no-results-message {
        padding: 32px;
        text-align: center;
        color: #64748b;
        font-style: italic;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      .dark .no-results-message {
        color: #94a3b8;
      }
      `;
    
    document.head.appendChild(style);
  }
  
  private setupDarkModeClass(): void {
    // Apply dark classes to body based on saved preference
    const isDarkMode = localStorage.getItem('idle-alchemy-dark-mode') === 'true';
    if (isDarkMode) {
      document.body.classList.add('dark-mode', 'dark');
    }
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
    
    // Font size controls
    this.setupFontSizeControls();
    
    // Sorting controls
    this.setupSortingControls();

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
    elementsTitle.textContent = `Elements (${progress.discovered})`;
    
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
      
      // Track discovery order
      this.addToDiscoveryOrder(element.id);
      
      const elementCard = document.createElement('div');
      elementCard.className = `element-card`;
      elementCard.draggable = true;
      elementCard.setAttribute('data-element-id', element.id);
      const elementName = i18n.getElementName(element.id, element.name);
      
      // Create minimal element layout (icon + name)
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
    
    // Apply current sorting
    const currentSort = localStorage.getItem('idle-alchemy-sort') || 'discovery-asc';
    this.applySorting(currentSort);
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
      const isCurrentlyDark = document.body.classList.contains('dark-mode') || document.body.classList.contains('dark');
      
      if (isCurrentlyDark) {
        document.body.classList.remove('dark-mode', 'dark');
        localStorage.setItem('idle-alchemy-dark-mode', 'false');
        this.updateDarkModeIcon(false);
      } else {
        document.body.classList.add('dark-mode', 'dark');
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
  
  private setupFontSizeControls(): void {
    const increaseBtn = document.getElementById('font-size-increase');
    const decreaseBtn = document.getElementById('font-size-decrease');
    
    if (!increaseBtn || !decreaseBtn) {
      console.error('❌ Font size control buttons not found!');
      return;
    }
    
    // Load saved font size preference
    const savedFontSize = localStorage.getItem('idle-alchemy-font-size') || '100';
    this.applyFontSize(parseInt(savedFontSize));
    
    // Increase font size
    increaseBtn.addEventListener('click', () => {
      const current = parseInt(localStorage.getItem('idle-alchemy-font-size') || '100');
      const newSize = Math.min(150, current + 10); // Max 150%
      this.applyFontSize(newSize);
      localStorage.setItem('idle-alchemy-font-size', newSize.toString());
      this.showToast(`Font size: ${newSize}%`);
    });
    
    // Decrease font size
    decreaseBtn.addEventListener('click', () => {
      const current = parseInt(localStorage.getItem('idle-alchemy-font-size') || '100');
      const newSize = Math.max(70, current - 10); // Min 70%
      this.applyFontSize(newSize);
      localStorage.setItem('idle-alchemy-font-size', newSize.toString());
      this.showToast(`Font size: ${newSize}%`);
    });
  }
  
  private applyFontSize(percentage: number): void {
    const scale = percentage / 100;
    document.documentElement.style.setProperty('--font-scale', scale.toString());
    console.log(`🔤 Applied font scale: ${scale} (${percentage}%)`);
  }
  
  private setupSortingControls(): void {
    const sortAlphabeticalBtn = document.getElementById('sort-alphabetical');
    const sortDiscoveryTimeBtn = document.getElementById('sort-discovery-time');
    
    if (!sortAlphabeticalBtn || !sortDiscoveryTimeBtn) {
      console.error('❌ Sorting control buttons not found!');
      return;
    }
    
    // Track current sort state
    this.currentSort = localStorage.getItem('idle-alchemy-sort') || 'discovery-asc';
    this.updateSortIcons(this.currentSort);
    
    // Alphabetical sort toggle (A-Z / Z-A)
    sortAlphabeticalBtn.addEventListener('click', () => {
      if (this.currentSort === 'alphabetical-asc') {
        this.currentSort = 'alphabetical-desc';
      } else {
        this.currentSort = 'alphabetical-asc';
      }
      
      localStorage.setItem('idle-alchemy-sort', this.currentSort);
      this.updateSortIcons(this.currentSort);
      this.applySorting(this.currentSort);
      
      const direction = this.currentSort === 'alphabetical-asc' ? 'A-Z' : 'Z-A';
      this.showToast(`Sorted by name: ${direction}`);
    });
    
    // Discovery time sort toggle (newest first / oldest first)
    sortDiscoveryTimeBtn.addEventListener('click', () => {
      if (this.currentSort === 'discovery-asc') {
        this.currentSort = 'discovery-desc';
      } else {
        this.currentSort = 'discovery-asc';
      }
      
      localStorage.setItem('idle-alchemy-sort', this.currentSort);
      this.updateSortIcons(this.currentSort);
      this.applySorting(this.currentSort);
      
      const direction = this.currentSort === 'discovery-asc' ? 'Oldest first' : 'Newest first';
      this.showToast(`Sorted by discovery: ${direction}`);
    });
    
    // Apply initial sorting
    this.applySorting(this.currentSort);
  }
  
  private updateSortIcons(sortType: string): void {
    const sortAlphabeticalBtn = document.getElementById('sort-alphabetical');
    const sortDiscoveryTimeBtn = document.getElementById('sort-discovery-time');
    
    if (sortAlphabeticalBtn && sortDiscoveryTimeBtn) {
      const alphaIcon = sortAlphabeticalBtn.querySelector('.material-symbols-outlined');
      const timeIcon = sortDiscoveryTimeBtn.querySelector('.material-symbols-outlined');
      
      if (alphaIcon && timeIcon) {
        // Clear active states
        sortAlphabeticalBtn.classList.remove('active');
        sortDiscoveryTimeBtn.classList.remove('active');
        
        // Update alphabetical sort icon
        if (sortType === 'alphabetical-asc') {
          alphaIcon.textContent = 'sort_by_alpha';
          sortAlphabeticalBtn.classList.add('active');
          sortAlphabeticalBtn.title = 'Sort Z-A (currently A-Z)';
          // Add arrow indicator
          sortAlphabeticalBtn.setAttribute('data-direction', 'asc');
        } else if (sortType === 'alphabetical-desc') {
          alphaIcon.textContent = 'sort_by_alpha';
          sortAlphabeticalBtn.classList.add('active');
          sortAlphabeticalBtn.title = 'Sort A-Z (currently Z-A)';
          sortAlphabeticalBtn.setAttribute('data-direction', 'desc');
        } else {
          alphaIcon.textContent = 'sort_by_alpha';
          sortAlphabeticalBtn.title = 'Sort A-Z';
          sortAlphabeticalBtn.removeAttribute('data-direction');
        }
        
        // Update discovery time sort icon
        if (sortType === 'discovery-asc') {
          timeIcon.textContent = 'schedule';
          sortDiscoveryTimeBtn.classList.add('active');
          sortDiscoveryTimeBtn.title = 'Sort Newest First (currently Oldest First)';
          sortDiscoveryTimeBtn.setAttribute('data-direction', 'asc');
        } else if (sortType === 'discovery-desc') {
          timeIcon.textContent = 'schedule';
          sortDiscoveryTimeBtn.classList.add('active');
          sortDiscoveryTimeBtn.title = 'Sort Oldest First (currently Newest First)';
          sortDiscoveryTimeBtn.setAttribute('data-direction', 'desc');
        } else {
          timeIcon.textContent = 'schedule';
          sortDiscoveryTimeBtn.title = 'Sort by Discovery Time';
          sortDiscoveryTimeBtn.removeAttribute('data-direction');
        }
      }
    }
  }
  
  private applySorting(sortType: string): void {
    const elementCards = Array.from(this.elementGrid.querySelectorAll('.element-card:not(.no-results-message)'));
    
    elementCards.sort((a, b) => {
      const nameA = a.querySelector('.element-name')?.textContent || '';
      const nameB = b.querySelector('.element-name')?.textContent || '';
      const idA = (a as HTMLElement).getAttribute('data-element-id') || '';
      const idB = (b as HTMLElement).getAttribute('data-element-id') || '';
      
      if (sortType.startsWith('alphabetical')) {
        const comparison = nameA.localeCompare(nameB);
        return sortType === 'alphabetical-desc' ? -comparison : comparison;
      } else if (sortType.startsWith('discovery')) {
        // Use actual discovery order tracking
        const indexA = this.discoveryOrder.indexOf(idA);
        const indexB = this.discoveryOrder.indexOf(idB);
        
        // If both elements are in discovery order, use their positions
        if (indexA !== -1 && indexB !== -1) {
          const comparison = indexA - indexB;
          return sortType === 'discovery-desc' ? -comparison : comparison;
        }
        
        // If only one is in discovery order, prioritize it
        if (indexA !== -1 && indexB === -1) return sortType === 'discovery-asc' ? -1 : 1;
        if (indexA === -1 && indexB !== -1) return sortType === 'discovery-asc' ? 1 : -1;
        
        // If neither is in discovery order, fall back to alphabetical
        const comparison = nameA.localeCompare(nameB);
        return comparison;
      }
      
      return 0;
    });
    
    // Reorder the DOM elements
    elementCards.forEach(card => {
      this.elementGrid.appendChild(card);
    });
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
        gameContainer.style.top = '0';
        gameContainer.style.left = '0';
        gameContainer.style.right = 'auto';
        gameContainer.style.bottom = 'auto';
        
        const panelWidth = newWidth || discoveryPanel.offsetWidth;
        gameContainer.style.marginRight = `${panelWidth}px`;
        gameContainer.style.width = `calc(100vw - ${panelWidth}px)`;
        
        // Ensure discovery panel is properly positioned
        discoveryPanel.style.position = 'fixed';
        discoveryPanel.style.top = '0';
        discoveryPanel.style.right = '0';
        discoveryPanel.style.bottom = '0';
        discoveryPanel.style.width = `${panelWidth}px`;
        discoveryPanel.style.height = '100vh';
      } else {
        // Mobile: reset desktop styles and adjust for bottom panel
        gameContainer.style.marginRight = '0';
        gameContainer.style.width = '100vw';
        gameContainer.style.top = '0';
        gameContainer.style.left = '0';
        gameContainer.style.right = 'auto';
        gameContainer.style.bottom = 'auto';
        
        const panelHeight = newHeight || discoveryPanel.offsetHeight;
        gameContainer.style.marginBottom = `${panelHeight}px`;
        gameContainer.style.height = `calc(100vh - ${panelHeight}px)`;
        
        // Ensure discovery panel is properly positioned
        discoveryPanel.style.position = 'fixed';
        discoveryPanel.style.bottom = '0';
        discoveryPanel.style.left = '0';
        discoveryPanel.style.right = '0';
        discoveryPanel.style.width = '100vw';
        discoveryPanel.style.height = `${panelHeight}px`;
      }
      
      // Trigger PIXI resize with proper timing
      requestAnimationFrame(() => {
        if ((window as any).game && (window as any).game.app) {
          const canvas = (window as any).game.app.view;
          const container = canvas.parentElement;
          if (container) {
            const rect = container.getBoundingClientRect();
            (window as any).game.app.renderer.resize(rect.width, rect.height);
          }
        }
      });
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