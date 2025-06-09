import * as PIXI from 'pixi.js';
import { Element } from './Element';
import { ElementManager } from './ElementManager';

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
                this.showDiscoveryMessage(mergeResult.message);
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
          this.showDiscoveryMessage(mergeResult.message);
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
    
    // Reset help tooltip visibility so it shows again for new players
    localStorage.removeItem('idle-alchemy-hide-help');
    
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

  public destroy(): void {
    this.app.destroy(true);
  }
} 