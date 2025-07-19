import * as PIXI from 'pixi.js';
import { ElementDefinition } from '@/config/ConfigLoader';
import { i18n } from '@/i18n/Translation';

export class Element extends PIXI.Container {
  public definition: ElementDefinition;
  private background!: PIXI.Graphics;
  private emojiText!: PIXI.Text;
  private nameText!: PIXI.Text;
  private isDragging: boolean = false;
  private dragOffset: PIXI.Point = new PIXI.Point();
  
  constructor(definition: ElementDefinition, x: number = 0, y: number = 0) {
    super();
    
    this.definition = definition;
    this.x = x;
    this.y = y;
    
    this.setupGraphics();
    this.setupInteraction();
    this.setupLanguageListener();
  }
  
  private setupGraphics(): void {
    // Create graphics with dark mode awareness
    this.background = new PIXI.Graphics();
    this.updateGraphicsForTheme();
    this.addChild(this.background);
    
    // HD rendering scale factor for crisp zoom
    const hdScale = 2.0; // Render at 2x resolution
    
    // Emoji - rendered at HD scale
    this.emojiText = new PIXI.Text(this.definition.emoji, {
      fontSize: 24 * hdScale,
      align: 'center'
    });
    this.emojiText.anchor.set(0.5, 0.6);
    this.emojiText.y = -8;
    this.emojiText.scale.set(1 / hdScale); // Scale down to normal size
    this.addChild(this.emojiText);
    
    // Name - rendered at HD scale (use i18n for translation)
    const translatedName = i18n.getElementName(this.definition.id, this.definition.name);
    this.nameText = new PIXI.Text(translatedName, {
      fontSize: 10 * hdScale,
      fill: this.getTextColor(),
      align: 'center',
      fontWeight: 'bold'
    });
    this.nameText.anchor.set(0.5, 0.5);
    this.nameText.y = 20;
    this.nameText.scale.set(1 / hdScale); // Scale down to normal size
    this.addChild(this.nameText);
    
    // Set up dark mode listener
    this.setupDarkModeListener();
  }
  
  private updateGraphicsForTheme(): void {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const backgroundColor = isDarkMode ? 0x2a2a2a : 0xffffff;
    const borderColor = isDarkMode ? 0x404040 : 0xdddddd;
    const backgroundAlpha = isDarkMode ? 0.95 : 0.9;
    
    this.background.clear();
    this.background.beginFill(backgroundColor, backgroundAlpha);
    this.background.drawRoundedRect(-35, -35, 70, 70, 6);
    this.background.endFill();
    
    // Subtle border
    this.background.lineStyle(1, borderColor, 0.8);
    this.background.drawRoundedRect(-35, -35, 70, 70, 6);
  }
  
  private getTextColor(): number {
    const isDarkMode = document.body.classList.contains('dark-mode');
    return isDarkMode ? 0xe0e0e0 : 0x333333;
  }
  
  private setupDarkModeListener(): void {
    // Listen for dark mode changes
    const updateTheme = () => {
      this.updateGraphicsForTheme();
      if (this.nameText) {
        this.nameText.style.fill = this.getTextColor();
      }
    };
    
    // Use MutationObserver to detect dark mode class changes on body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateTheme();
        }
      });
    });
    
    // Start observing body for class changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Store reference for cleanup
    (this as any)._darkModeObserver = observer;
  }
  
  private setupInteraction(): void {
    this.eventMode = 'static';
    this.cursor = 'pointer';
    
    this.on('pointerdown', this.onDragStart, this);
    this.on('pointerup', this.onDragEnd, this);
    this.on('pointerupoutside', this.onDragEnd, this);
    
    // Double click to copy
    this.on('pointertap', this.onTap, this);
    
    // Hover effects
    this.on('pointerover', this.onHover, this);
    this.on('pointerout', this.onHoverEnd, this);
  }
  
  private setupLanguageListener(): void {
    // Listen for language changes and update the name text
    const updateLanguage = () => {
      const translatedName = i18n.getElementName(this.definition.id, this.definition.name);
      this.nameText.text = translatedName;
    };
    
    window.addEventListener('languageChanged', updateLanguage);
    
    // Store reference for cleanup
    (this as any)._languageListener = updateLanguage;
  }
  
  private lastTapTime: number = 0;
  
  private onDragStart(event: PIXI.FederatedPointerEvent): void {
    console.log('🖱️ Drag started:', this.definition.id);
    this.isDragging = true;
    this.alpha = 0.9;
    this.scale.set(1.05);
    
    // Debug parent hierarchy
    console.log('🔍 Parent hierarchy:', {
      hasParent: !!this.parent,
      hasGrandParent: !!(this.parent?.parent),
      appView: !!(this.parent?.parent as any)?.view
    });
    
    // Get canvas coordinates for the initial position with proper null checks
    const app = this.parent?.parent as any;
    const canvas = app?.view as HTMLCanvasElement;
    
    if (canvas && canvas.getBoundingClientRect) {
      const rect = canvas.getBoundingClientRect();
      
      // Store offset from mouse to element center
      this.dragOffset.set(
        event.global.x - rect.left - this.x,
        event.global.y - rect.top - this.y
      );
      console.log('📍 Drag offset set:', this.dragOffset.x, this.dragOffset.y);
    } else {
      // Fallback: use global coordinates directly
      this.dragOffset.set(
        event.global.x - this.x,
        event.global.y - this.y
      );
      console.warn('⚠️ Canvas not found, using fallback drag offset');
    }
    
    // Bring to front
    if (this.parent) {
      this.parent.setChildIndex(this, this.parent.children.length - 1);
    }
    
    // Add global move listener for smooth dragging
    document.addEventListener('mousemove', this.onGlobalMouseMove, { passive: false });
    document.addEventListener('mouseup', this.onGlobalDragEnd);
    document.addEventListener('pointermove', this.onGlobalDragMove, { passive: false });
    document.addEventListener('pointerup', this.onGlobalDragEnd);
    
    this.emit('dragstart', this);
  }
  

  
  private onDragEnd(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.alpha = 1;
      this.scale.set(1);
      
      // Remove global listeners
      document.removeEventListener('mousemove', this.onGlobalMouseMove);
      document.removeEventListener('mouseup', this.onGlobalDragEnd);
      document.removeEventListener('pointermove', this.onGlobalDragMove);
      document.removeEventListener('pointerup', this.onGlobalDragEnd);
      
      this.emit('dragend', this);
    }
  }
  
  private onGlobalDragMove = (event: PointerEvent): void => {
    this.handleDragMove(event.clientX, event.clientY);
  };
  
  private onGlobalMouseMove = (event: MouseEvent): void => {
    this.handleDragMove(event.clientX, event.clientY);
  };
  
  private handleDragMove(clientX: number, clientY: number): void {
    if (this.isDragging && this.parent) {
      // Try to get the canvas element and its bounding rect
      const app = this.parent.parent as any;
      const canvas = app?.view as HTMLCanvasElement;
      
      if (canvas && canvas.getBoundingClientRect) {
        const rect = canvas.getBoundingClientRect();
        
        // Convert screen coordinates to canvas coordinates
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;
        
        // Get the game instance to access zoom and pan information
        const game = (window as any).game;
        if (game) {
          // Convert canvas coordinates to world coordinates (accounting for zoom and pan)
          const worldX = (canvasX - game.gameContainer.x) / game.getZoom();
          const worldY = (canvasY - game.gameContainer.y) / game.getZoom();
          
          // Apply drag offset in world coordinates
          this.x = worldX - this.dragOffset.x;
          this.y = worldY - this.dragOffset.y;
        } else {
          // Fallback: use direct positioning if game not available
          this.x = canvasX - this.dragOffset.x;
          this.y = canvasY - this.dragOffset.y;
        }
      } else {
        // Fallback: use direct positioning (less accurate but prevents crashes)
        this.x = clientX - this.dragOffset.x;
        this.y = clientY - this.dragOffset.y;
        
        if (Math.random() < 0.01) {
          console.warn('Using fallback drag positioning - canvas not available');
        }
      }
      
      // Only log occasionally to avoid spam
      if (Math.random() < 0.02) {
        console.log('📍 Moving', this.definition.id, 'to:', Math.round(this.x), Math.round(this.y));
      }
      
      this.emit('dragmove', this);
    }
  }
  
  private onGlobalDragEnd = (): void => {
    if (this.isDragging) {
      this.onDragEnd();
    }
  };
  
  private onHover(): void {
    if (!this.isDragging) {
      this.scale.set(1.03);
    }
  }
  
  private onHoverEnd(): void {
    if (!this.isDragging) {
      this.scale.set(1);
    }
  }
  
  private onTap(event: PIXI.FederatedPointerEvent): void {
    const currentTime = Date.now();
    
    if (currentTime - this.lastTapTime < 300) {
      // Double tap detected
      console.log('👆 Double tap detected on', this.definition.id);
      this.emit('doubletap', this);
      event.stopPropagation();
    }
    this.lastTapTime = currentTime;
  }
  

  
  public highlight(color: number = 0xffff00): void {
    this.background.tint = color;
  }
  
  public removeHighlight(): void {
    this.background.tint = 0xffffff;
  }
  
  public playDiscoveryAnimation(): void {
    // Simple and fast scale animation for new discoveries
    this.scale.set(0.8);
    this.alpha = 0.5;
    
    const tween = {
      scale: 0.8,
      alpha: 0.5
    };
    
    // Fast animation using requestAnimationFrame
    const animate = () => {
      tween.scale += (1 - tween.scale) * 0.25;
      tween.alpha += (1 - tween.alpha) * 0.25;
      
      this.scale.set(tween.scale);
      this.alpha = tween.alpha;
      
      if (Math.abs(tween.scale - 1) > 0.01) {
        requestAnimationFrame(animate);
      } else {
        this.scale.set(1);
        this.alpha = 1;
      }
    };
    
    animate();
  }
  
  public playMergeAnimation(targetX: number, targetY: number): Promise<void> {
    return new Promise((resolve) => {
      // Quick zoom-in-zoom-out animation with movement towards target
      const originalX = this.x;
      const originalY = this.y;
      let progress = 0;
      const duration = 300; // 300ms animation
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / duration, 1);
        
        if (progress < 0.5) {
          // First half: zoom in and move toward target (merge position)
          const moveProgress = progress * 2;
          const easedMove = 1 - Math.pow(1 - moveProgress, 2); // Ease-out quadratic for movement
          
          this.scale.set(1 + moveProgress * 0.3);
          
          // Move towards the target position (midpoint between the two elements)
          this.x = originalX + (targetX - originalX) * easedMove * 0.8; // Move 80% of the way
          this.y = originalY + (targetY - originalY) * easedMove * 0.8;
        } else {
          // Second half: zoom out quickly and fade while continuing to move
          const zoomProgress = (progress - 0.5) * 2;
          
          this.scale.set(1.3 - zoomProgress * 0.8);
          this.alpha = 1 - zoomProgress * 0.7;
          
          // Complete the movement to target
          const totalMoveProgress = 0.8 + (zoomProgress * 0.2); // Complete the final 20%
          this.x = originalX + (targetX - originalX) * totalMoveProgress;
          this.y = originalY + (targetY - originalY) * totalMoveProgress;
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Reset to original state (will be removed anyway)
          this.scale.set(1);
          this.alpha = 1;
          this.x = originalX;
          this.y = originalY;
          resolve();
        }
      };
      
      animate();
    });
  }
  
  public getDistanceTo(other: Element): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  public destroy(): void {
    // Clean up language listener
    if ((this as any)._languageListener) {
      window.removeEventListener('languageChanged', (this as any)._languageListener);
    }
    
    // Clean up dark mode observer
    if ((this as any)._darkModeObserver) {
      (this as any)._darkModeObserver.disconnect();
    }
    
    // Call parent destroy
    super.destroy();
  }
} 