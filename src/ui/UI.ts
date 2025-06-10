import { Game } from '@/game/Game';
import { showConfirm } from '@/ui/Dialog';
import { configLoader } from '@/config/ConfigLoader';
import { i18n, t } from '@/i18n/Translation';

export class UI {
  private game: Game;
  private uiContainer: HTMLElement;
  private elementGrid!: HTMLElement;
  
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
          <h3 id="elements-title">🧪 Elements (4)</h3>
          <div class="language-selector" id="language-selector">
            <button class="language-button" id="language-button"></button>
            <div class="language-dropdown" id="language-dropdown"></div>
          </div>
        </div>
        <div class="element-grid" id="element-grid"></div>
      </div>
      
      <div class="bottom-actions ui-element" id="bottom-actions">
        <span class="action-link" id="auto-arrange-action"></span>
        <span class="action-separator">|</span>
        <span class="action-link" id="remove-duplicate-action"></span>
        <span class="action-separator">|</span>
        <span class="action-link" id="clear-action"></span>
        <span class="action-separator">|</span>
        <span class="action-link" id="reset-action"></span>
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
          top: calc(50% - 59px);
          right: 5px;
          left: 5px;
          max-width: none;
          transform: translateY(-50%);
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
      
      /* Language Selector */
      .language-selector {
        position: relative;
        z-index: 1000;
      }
      
      .language-button {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(0, 0, 0, 0.1);
        color: #666;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      
      .language-button:hover {
        background: rgba(255, 255, 255, 1);
        border-color: rgba(0, 0, 0, 0.2);
        color: #333;
      }
      
      .language-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: rgba(255, 255, 255, 0.98);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        min-width: 120px;
        max-height: 200px;
        overflow-y: auto;
        display: none;
        margin-top: 2px;
        z-index: 1001;
      }
      
      .language-dropdown.show {
        display: block;
      }
      
      .language-option {
        padding: 8px 12px;
        color: #333;
        cursor: pointer;
        transition: background-color 0.2s ease;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        font-size: 10px;
      }
      
      .language-option:last-child {
        border-bottom: none;
      }
      
      .language-option:hover {
        background: rgba(0, 0, 0, 0.05);
      }
      
      .language-option.active {
        background: rgba(33, 150, 243, 0.1);
        color: #1976d2;
        font-weight: bold;
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
    
    // Reset action
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
    
    // Language selector
    this.setupLanguageSelector();

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
      const element = configLoader.getElements().get(elementId);
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

    
    // Get current progress to determine if help should be shown
    const progress = this.game.getProgress();
    
    // Show help if:
    // 1. User hasn't manually closed it AND
    // 2. User has discovered 5 or fewer elements (basic 4 + at most 1 more)
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
    
    // Reattach language selector listeners
    this.setupLanguageOptions();
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
    if (resetAction) resetAction.textContent = t('ui.buttons.reset');
    
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
    
    // Update language selector
    this.updateLanguageSelector();
  }
  
  private updateLanguageSelector(): void {
    console.log('🔄 Updating language selector...');
    const languageButton = document.getElementById('language-button');
    if (languageButton) {
      const currentLang = i18n.getCurrentLanguageConfig();
      const buttonText = `🌍 ${currentLang?.nativeName || 'English'}`;
      languageButton.textContent = buttonText;
      console.log('🔄 Updated button text to:', buttonText);
    } else {
      console.error('❌ Language button not found during update!');
    }
    
    // Update language dropdown
    const languageDropdown = document.getElementById('language-dropdown');
    if (languageDropdown) {
      const currentLang = i18n.getCurrentLanguage();
      const dropdownHTML = i18n.getSupportedLanguages().map(lang => 
        `<div class="language-option ${lang.code === currentLang ? 'active' : ''}" data-lang="${lang.code}">
          ${lang.nativeName}
        </div>`
      ).join('');
      languageDropdown.innerHTML = dropdownHTML;
      console.log('🔄 Updated dropdown with', i18n.getSupportedLanguages().length, 'languages');
    } else {
      console.error('❌ Language dropdown not found during update!');
    }
  }
  
  private setupLanguageSelector(): void {
    console.log('🔧 Setting up language selector...');
    const languageButton = document.getElementById('language-button');
    const languageDropdown = document.getElementById('language-dropdown');
    
    console.log('🔍 Language button:', languageButton);
    console.log('🔍 Language dropdown:', languageDropdown);
    
    if (!languageButton || !languageDropdown) {
      console.error('❌ Language selector elements not found!');
      return;
    }
    
    // Store reference for cleanup (avoid cloning)
    (languageButton as any)._clickHandler = (e: Event) => {
      console.log('🖱️ Language button clicked!');
      e.stopPropagation();
      const currentDropdown = document.getElementById('language-dropdown')!;
      const isShowing = currentDropdown.classList.contains('show');
      console.log('🔍 Dropdown currently showing:', isShowing);
      currentDropdown.classList.toggle('show');
      console.log('🔍 Dropdown after toggle:', currentDropdown.classList.contains('show'));
    };
    
    // Remove old listener if exists
    if ((languageButton as any)._oldClickHandler) {
      languageButton.removeEventListener('click', (languageButton as any)._oldClickHandler);
    }
    
    console.log('🔧 Adding click listener to language button...');
    languageButton.addEventListener('click', (languageButton as any)._clickHandler);
    (languageButton as any)._oldClickHandler = (languageButton as any)._clickHandler;
    
    // Close dropdown when clicking outside
    const closeDropdown = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.language-selector')) {
        const currentDropdown = document.getElementById('language-dropdown');
        if (currentDropdown) {
          currentDropdown.classList.remove('show');
        }
      }
    };
    document.addEventListener('click', closeDropdown);
    
    // Set up language option listeners
    this.setupLanguageOptions();
  }
  
  private setupLanguageOptions(): void {
    console.log('🔧 Setting up language options...');
    const languageDropdown = document.getElementById('language-dropdown');
    
    if (!languageDropdown) {
      console.error('❌ Language dropdown not found!');
      return;
    }
    
    console.log('🔍 Language dropdown found:', languageDropdown);
    
    // Store reference for cleanup (avoid cloning)
    (languageDropdown as any)._clickHandler = async (e: Event) => {
      console.log('🖱️ Language dropdown clicked!');
      e.stopPropagation();
      const target = e.target as HTMLElement;
      console.log('🔍 Clicked target:', target);
      
      if (target.classList.contains('language-option')) {
        const langCode = target.dataset.lang;
        console.log('🌍 Language option clicked:', langCode);
        if (langCode) {
          try {
            await i18n.setLanguage(langCode);
            languageDropdown.classList.remove('show');
          } catch (error) {
            console.error('Failed to change language:', error);
          }
        }
      }
    };
    
    // Remove old listener if exists
    if ((languageDropdown as any)._oldClickHandler) {
      languageDropdown.removeEventListener('click', (languageDropdown as any)._oldClickHandler);
    }
    
    console.log('🔧 Adding click listener to language dropdown...');
    languageDropdown.addEventListener('click', (languageDropdown as any)._clickHandler);
    (languageDropdown as any)._oldClickHandler = (languageDropdown as any)._clickHandler;
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