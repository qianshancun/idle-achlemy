import * as PIXI from 'pixi.js';
import { Element } from './Element';
import { ElementManager } from './ElementManager';
import { i18n } from '@/i18n/Translation';

export class Game {
  private app: PIXI.Application;
  private elementManager: ElementManager;
  private gameContainer: PIXI.Container;
  private elements: Element[] = [];
  private draggedElement: Element | null = null;
  private mergeDistance: number = 50;
  
  // Canvas panning
  private isPanning: boolean = false;
  private lastPanPoint: { x: number; y: number } = { x: 0, y: 0 };
  private panOffset: { x: number; y: number } = { x: 0, y: 0 };
  
  constructor(container: HTMLElement) {
    this.app = new PIXI.Application({
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: 0xf8f8f8,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1
    });
    
    container.appendChild(this.app.view as HTMLCanvasElement);
    
    this.elementManager = new ElementManager();
    this.gameContainer = new PIXI.Container();
    this.app.stage.addChild(this.gameContainer);
    
    this.initialize();
    this.setupEventListeners();
  }
  
  private initialize(): void {
    // Start with empty canvas - elements will be dragged from the panel
    this.loadGameProgress();
  }
  
  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', this.onResize.bind(this));
    
    // Save progress periodically
    setInterval(() => {
      this.saveGameProgress();
    }, 10000); // Save every 10 seconds
    
    // Add drop support for dragging from element panel
    const canvas = this.app.view as HTMLCanvasElement;
    canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      const elementId = e.dataTransfer?.getData('text/plain');
      if (elementId) {
        const rect = canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        // Transform to world coordinates (account for panning)
        const worldX = canvasX - this.panOffset.x;
        const worldY = canvasY - this.panOffset.y;
        
        // Check if dropping on existing element for merge
        const targetElement = this.findElementAtPosition(canvasX, canvasY);
        
        if (targetElement) {
          // Attempt merge
          const tempElement = this.elementManager.createElement(elementId, worldX, worldY);
          if (tempElement) {
            const mergeResult = this.elementManager.attemptMerge(tempElement, targetElement);
            console.log('Drop merge attempt:', elementId, '+', targetElement.definition.id, '=', mergeResult);
            
            if (mergeResult.success && mergeResult.result) {
              // Successful merge - remove target and create result
              this.performMerge(tempElement, targetElement, mergeResult.result, mergeResult.isNewDiscovery || false);
              
              if (mergeResult.isNewDiscovery && mergeResult.message) {
                const discoveryMessage = i18n.getDiscoveryMessage(mergeResult.result!, mergeResult.message);
                this.showDiscoveryMessage(discoveryMessage);
              }
            } else {
              // Failed merge - place element nearby
              this.addElement(elementId, worldX + 50, worldY + 50);
            }
          }
        } else {
          // Drop on empty space
          this.addElement(elementId, worldX, worldY);
        }
      }
    });
    
    // Canvas panning controls
    this.setupCanvasPanning(canvas);
  }
  
  private setupCanvasPanning(canvas: HTMLCanvasElement): void {
    // Set default cursor style
    canvas.style.cursor = 'grab';
    
    // Mouse events for canvas panning
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      
      // Only start panning if clicking on empty space (not on an element)
      const targetElement = this.findElementAtPosition(canvasX, canvasY);
      if (!targetElement && !this.draggedElement) {
        this.isPanning = true;
        this.lastPanPoint = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });
    
    canvas.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        const deltaX = e.clientX - this.lastPanPoint.x;
        const deltaY = e.clientY - this.lastPanPoint.y;
        
        this.panOffset.x += deltaX;
        this.panOffset.y += deltaY;
        
        this.gameContainer.x = this.panOffset.x;
        this.gameContainer.y = this.panOffset.y;
        
        this.lastPanPoint = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      }
    });
    
    canvas.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        canvas.style.cursor = 'grab';
      }
    });
    
    canvas.addEventListener('mouseleave', () => {
      if (this.isPanning) {
        this.isPanning = false;
        canvas.style.cursor = 'grab';
      }
    });
    
    // Touch events for mobile panning
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const canvasX = touch.clientX - rect.left;
        const canvasY = touch.clientY - rect.top;
        
        // Only start panning if touching empty space
        const targetElement = this.findElementAtPosition(canvasX, canvasY);
        if (!targetElement && !this.draggedElement) {
          this.isPanning = true;
          this.lastPanPoint = { x: touch.clientX, y: touch.clientY };
          e.preventDefault();
        }
      }
    });
    
    canvas.addEventListener('touchmove', (e) => {
      if (this.isPanning && e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.lastPanPoint.x;
        const deltaY = touch.clientY - this.lastPanPoint.y;
        
        this.panOffset.x += deltaX;
        this.panOffset.y += deltaY;
        
        this.gameContainer.x = this.panOffset.x;
        this.gameContainer.y = this.panOffset.y;
        
        this.lastPanPoint = { x: touch.clientX, y: touch.clientY };
        e.preventDefault();
      }
    });
    
    canvas.addEventListener('touchend', () => {
      if (this.isPanning) {
        this.isPanning = false;
      }
    });
  }

  private onResize(): void {
    const canvas = this.app.view as HTMLCanvasElement;
    const container = canvas.parentElement;
    if (container) {
      this.app.renderer.resize(container.clientWidth, container.clientHeight);
    }
  }
  
  private createElementAtPosition(elementId: string, x: number, y: number): Element | null {
    const element = this.elementManager.createElement(elementId, x, y);
    if (element) {
      this.gameContainer.addChild(element);
      this.elements.push(element);
      
      // Set high z-index so new elements appear on top
      element.zIndex = this.elements.length + 100;
      
      // Ensure element has proper event listeners
      element.on('dragstart', (el: Element) => this.onElementDragStart(el));
      element.on('dragmove', () => this.onElementDragMove());
      element.on('dragend', () => this.onElementDragEnd());
      element.on('doubletap', (el: Element) => this.onElementDoubleTap(el));
      
      // Sort children to respect z-index
      this.gameContainer.sortChildren();
      
      return element;
    }
    return null;
  }
  
  private onElementDragStart(element: Element): void {
    this.draggedElement = element;
    
    // Highlight potential merge targets (CHECK ONLY, don't discover)
    if (this.draggedElement) {
      this.elements.forEach(el => {
        if (el !== this.draggedElement) {
          const recipeCheck = this.elementManager.checkRecipe(this.draggedElement!, el);
          if (recipeCheck.success) {
            el.highlight(0x00ff00); // Green for valid merge
          }
        }
      });
    }
  }
  
  private onElementDragMove(): void {
    // Visual feedback could be added here
  }
  
  private onElementDragEnd(): void {
    if (!this.draggedElement) return;
    
    // Check for merges with nearby elements
    const nearbyElements = this.elements.filter(el => {
      if (el === this.draggedElement) return false;
      const distance = this.draggedElement!.getDistanceTo(el);
      return distance < this.mergeDistance;
    });
    
    let merged = false;
    for (const target of nearbyElements) {
      const mergeResult = this.elementManager.attemptMerge(this.draggedElement, target);
      
      if (mergeResult.success && mergeResult.result) {
        this.performMerge(this.draggedElement, target, mergeResult.result, mergeResult.isNewDiscovery || false);
        merged = true;
        
                  if (mergeResult.isNewDiscovery && mergeResult.message) {
            const discoveryMessage = i18n.getDiscoveryMessage(mergeResult.result!, mergeResult.message);
            this.showDiscoveryMessage(discoveryMessage);
          }
        break;
      }
    }
    
    // Remove all highlights
    this.elements.forEach(el => el.removeHighlight());
    
    if (!merged) {
      // Element stays where it was dragged - no position constraints for unlimited canvas
    }
    
    this.draggedElement = null;
  }
  
  private onElementDoubleTap(element: Element): void {
    // Create a copy of the element near the original
    const offsetX = 80 + Math.random() * 40 - 20; // Random offset between 60-100
    const offsetY = 80 + Math.random() * 40 - 20;
    
    const newX = element.x + offsetX;
    const newY = element.y + offsetY;
    
    const copy = this.createElementAtPosition(element.definition.id, newX, newY);
    if (copy) {
      copy.playDiscoveryAnimation();
    }
  }
  
  private performMerge(element1: Element, element2: Element, resultId: string, isNewDiscovery: boolean): void {
    // Calculate merge position (midpoint)
    const mergeX = (element1.x + element2.x) / 2;
    const mergeY = (element1.y + element2.y) / 2;
    
    // Remove the two input elements
    this.removeElement(element1);
    this.removeElement(element2);
    
    // Create the result element
    const resultElement = this.createElementAtPosition(resultId, mergeX, mergeY);
    
    if (resultElement && isNewDiscovery) {
      resultElement.playDiscoveryAnimation();
    }
    
    // Update UI
    this.onGameStateChanged();
  }
  
  private removeElement(element: Element): void {
    const index = this.elements.indexOf(element);
    if (index > -1) {
      this.elements.splice(index, 1);
      this.gameContainer.removeChild(element);
      element.destroy();
    }
  }
  

  
  private findElementAtPosition(x: number, y: number): Element | null {
    // Transform canvas coordinates to world coordinates (account for panning)
    const worldX = x - this.panOffset.x;
    const worldY = y - this.panOffset.y;
    
    // Find element at the given position
    for (const element of this.elements) {
      const bounds = element.getBounds();
      if (worldX >= bounds.x && worldX <= bounds.x + bounds.width &&
          worldY >= bounds.y && worldY <= bounds.y + bounds.height) {
        return element;
      }
    }
    return null;
  }
  
  private showDiscoveryMessage(message: string): void {
    // Create a floating message
    const text = new PIXI.Text(message, {
      fontSize: 24,
      fill: 0xffd700,
      fontWeight: 'bold',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 4,
      dropShadowDistance: 2
    });
    
    text.anchor.set(0.5);
    // Position in world coordinates so it appears centered in the current view
    text.x = (this.app.screen.width / 2) - this.panOffset.x;
    text.y = (this.app.screen.height / 2) - this.panOffset.y;
    text.alpha = 0;
    text.zIndex = 1000; // High z-index to appear above everything
    
    this.gameContainer.addChild(text);
    this.app.stage.sortChildren(); // Ensure z-index is respected
    
    // Animate the message
    let alpha = 0;
    let startY = this.app.screen.height / 2;
    let currentY = startY;
    
    const animate = () => {
      alpha += 0.08;
      currentY -= 0.5;
      
      text.alpha = Math.min(alpha, 1);
      text.y = currentY;
      
      if (alpha < 1.5) {
        requestAnimationFrame(animate);
      } else {
        // Fade out
        const fadeOut = () => {
          text.alpha -= 0.03;
          currentY -= 0.5;
          text.y = currentY;
          
          if (text.alpha > 0) {
            requestAnimationFrame(fadeOut);
          } else {
            this.gameContainer.removeChild(text);
            text.destroy();
          }
        };
        setTimeout(fadeOut, 1500);
      }
    };
    
    animate();
  }
  
  private onGameStateChanged(): void {
    // Auto-save progress
    this.saveGameProgress();
    
    // Emit event for UI updates
    const progress = this.elementManager.getDiscoveryProgress();
    const discoveredElements = this.elementManager.getDiscoveredElements();
    
    console.log('🎮 Game state changed:');
    console.log('   📊 Progress:', progress);
    console.log('   🔍 Discovered elements:', discoveredElements);
    
    window.dispatchEvent(new CustomEvent('gameStateChanged', {
      detail: {
        discoveredElements: discoveredElements,
        progress
      }
    }));
    
    console.log('   📡 Event dispatched to UI');
  }
  
  private saveGameProgress(): void {
    const saveData = this.elementManager.saveProgress();
    localStorage.setItem('idle-alchemy-save', saveData);
  }
  
  private loadGameProgress(): void {
    const saveData = localStorage.getItem('idle-alchemy-save');
    if (saveData) {
      this.elementManager.loadProgress(saveData);
      this.onGameStateChanged();
    }
  }
  
  // Public API methods
  public addElement(elementId: string, x?: number, y?: number): boolean {
    if (!this.elementManager.isDiscovered(elementId)) {
      return false;
    }
    
    // Use provided position or find a random position near the current view center
    const posX = x !== undefined ? x : -this.panOffset.x + (Math.random() * 400 - 200);
    const posY = y !== undefined ? y : -this.panOffset.y + (Math.random() * 400 - 200);
    
    const element = this.createElementAtPosition(elementId, posX, posY);
    return element !== null;
  }
  
  public addElementFromPanel(elementId: string, globalX: number, globalY: number): boolean {
    // Convert global coordinates to canvas coordinates, then to world coordinates
    const rect = (this.app.view as HTMLCanvasElement).getBoundingClientRect();
    const canvasX = globalX - rect.left;
    const canvasY = globalY - rect.top;
    
    // Transform to world coordinates (account for panning)
    const worldX = canvasX - this.panOffset.x;
    const worldY = canvasY - this.panOffset.y;
    
    return this.addElement(elementId, worldX, worldY);
  }
  
  public getHint(): string | null {
    return this.elementManager.getHint();
  }
  
  public getProgress(): ReturnType<ElementManager['getDiscoveryProgress']> {
    return this.elementManager.getDiscoveryProgress();
  }
  
  public clearCanvas(): void {
    // Clear all elements from canvas - use while loop to avoid iteration issues
    while (this.elements.length > 0) {
      this.removeElement(this.elements[0]);
    }
    
    // Reset camera position when clearing
    this.resetCamera();
    
    this.onGameStateChanged();
  }
  
  public reset(): void {
    // Clear all elements from canvas
    while (this.elements.length > 0) {
      this.removeElement(this.elements[0]);
    }
    
    // Reset discovered elements to only basic 4 elements 
    this.elementManager.resetToBasicElements();
    localStorage.removeItem('idle-alchemy-save');
    
    // Reset camera position
    this.resetCamera();
    
    // Update UI to reflect reset state (canvas empty, discovery panel with basic 4 elements)
    this.onGameStateChanged();
  }
  
  public resetCamera(): void {
    // Reset canvas view to center
    this.panOffset = { x: 0, y: 0 };
    this.gameContainer.x = 0;
    this.gameContainer.y = 0;
  }

  public refreshUI(): void {
    // Force UI update - useful after loading progress
    this.onGameStateChanged();
  }

  public autoArrangeElements(): void {
    if (this.elements.length === 0) return;

    console.log('🔧 AUTO ARRANGE DEBUG:');
    console.log('  Current panOffset:', this.panOffset);
    console.log('  GameContainer position:', { x: this.gameContainer.x, y: this.gameContainer.y });

    // Get canvas dimensions (excluding discovery panel on desktop)
    const canvas = this.app.view as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    
    // On desktop, exclude the 240px discovery panel from the right
    // On mobile, use full width (discovery panel is at bottom)
    const isDesktop = window.innerWidth > 768;
    const availableWidth = isDesktop ? rect.width - 240 : rect.width;
    const availableHeight = rect.height;

    console.log('  Canvas rect:', rect);
    console.log('  Available area:', { width: availableWidth, height: availableHeight });
    
    // Add some padding from edges
    const padding = 20;
    const usableWidth = availableWidth - (padding * 2);
    const usableHeight = availableHeight - (padding * 2);
    
    // Each element is roughly 60px diameter
    const elementSize = 60;
    
    // Calculate optimal grid dimensions
    const elementCount = this.elements.length;
    const cols = Math.ceil(Math.sqrt(elementCount * (usableWidth / usableHeight)));
    const rows = Math.ceil(elementCount / cols);
    
    // Calculate spacing
    let spacingX = 9; // Default 9px margin
    let spacingY = 9;
    
    // If elements don't fit with 9px spacing, reduce it
    const requiredWidth = cols * elementSize + (cols - 1) * spacingX;
    const requiredHeight = rows * elementSize + (rows - 1) * spacingY;
    
    if (requiredWidth > usableWidth) {
      spacingX = Math.max(2, Math.floor((usableWidth - cols * elementSize) / (cols - 1)));
    }
    
    if (requiredHeight > usableHeight) {
      spacingY = Math.max(2, Math.floor((usableHeight - rows * elementSize) / (rows - 1)));
    }
    
    // Calculate grid starting position (center the grid in screen space)
    const gridWidth = cols * elementSize + (cols - 1) * spacingX;
    const gridHeight = rows * elementSize + (rows - 1) * spacingY;
    const screenStartX = padding + (usableWidth - gridWidth) / 2;
    const screenStartY = padding + (usableHeight - gridHeight) / 2;
    
    console.log('  Screen grid start:', { x: screenStartX, y: screenStartY });

    // Let's check what coordinate system we're actually using
    // Look at current element positions to understand the pattern
    if (this.elements.length > 0) {
      console.log('  Current element positions:');
      this.elements.slice(0, 3).forEach((el, i) => {
        console.log(`    Element ${i}:`, { x: el.x, y: el.y });
      });
    }

    // Test both coordinate conversion approaches
    const worldStartX_add = screenStartX + this.panOffset.x;
    const worldStartY_add = screenStartY + this.panOffset.y;
    const worldStartX_subtract = screenStartX - this.panOffset.x;
    const worldStartY_subtract = screenStartY - this.panOffset.y;

    console.log('  Coordinate conversion options:');
    console.log('    ADD panOffset:', { x: worldStartX_add, y: worldStartY_add });
    console.log('    SUBTRACT panOffset:', { x: worldStartX_subtract, y: worldStartY_subtract });

    // For now, let's use the subtract approach like addElementFromPanel does
    const worldStartX = screenStartX - this.panOffset.x;
    const worldStartY = screenStartY - this.panOffset.y;

    console.log('  Using world start:', { x: worldStartX, y: worldStartY });
    
    // Arrange elements in grid
    console.log('  Arranging elements:');
    this.elements.forEach((element, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = worldStartX + col * (elementSize + spacingX);
      const y = worldStartY + row * (elementSize + spacingY);

      if (index < 3) {
        console.log(`    Element ${index}: col=${col}, row=${row}, target=(${x}, ${y})`);
      }
      
      // Animate to new position
      const startX = element.x;
      const startY = element.y;
      const targetX = x;
      const targetY = y;
      
      let progress = 0;
      const animate = () => {
        progress += 0.1;
        if (progress >= 1) {
          element.x = targetX;
          element.y = targetY;
          return;
        }
        
        // Smooth easing
        const eased = 1 - Math.pow(1 - progress, 3);
        element.x = startX + (targetX - startX) * eased;
        element.y = startY + (targetY - startY) * eased;
        
        requestAnimationFrame(animate);
      };
      
      animate();
    });
  }

  public removeDuplicateElements(): number {
    if (this.elements.length === 0) return 0;

    // Group elements by their type (definition.id)
    const elementGroups = new Map<string, Element[]>();
    
    this.elements.forEach(element => {
      const elementType = element.definition.id;
      if (!elementGroups.has(elementType)) {
        elementGroups.set(elementType, []);
      }
      elementGroups.get(elementType)!.push(element);
    });
    
    let removedCount = 0;
    
    // For each group, keep only the last element (most recently created)
    elementGroups.forEach((elementsOfType, _elementType) => {
      if (elementsOfType.length > 1) {
        // Keep the last element, remove all others
        const elementsToRemove = elementsOfType.slice(0, -1); // All except the last
        
        elementsToRemove.forEach(element => {
          this.removeElement(element);
          removedCount++;
        });
      }
    });
    
    // Update game state if any elements were removed
    if (removedCount > 0) {
      this.onGameStateChanged();
    }
    
    return removedCount;
  }

  public destroy(): void {
    this.app.destroy(true);
  }
} 