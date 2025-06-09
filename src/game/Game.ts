import * as PIXI from 'pixi.js';
import { Element } from './Element';
import { ElementManager } from './ElementManager';

export class Game {
  private app: PIXI.Application;
  private elementManager: ElementManager;
  private gameContainer: PIXI.Container;
  private elements: Element[] = [];
  private draggedElement: Element | null = null;
  private mergeDistance: number = 80;
  
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
        
        // Check if dropping on existing element for merge
        const targetElement = this.findElementAtPosition(canvasX, canvasY);
        
        if (targetElement) {
          // Attempt merge
          const tempElement = this.elementManager.createElement(elementId, canvasX, canvasY);
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
              this.addElement(elementId, canvasX + 50, canvasY + 50);
            }
          }
        } else {
          // Drop on empty space
          this.addElement(elementId, canvasX, canvasY);
        }
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
      
      // Ensure element has proper event listeners
      element.on('dragstart', (el: Element) => this.onElementDragStart(el));
      element.on('dragmove', () => this.onElementDragMove());
      element.on('dragend', () => this.onElementDragEnd());
      element.on('doubletap', (el: Element) => this.onElementDoubleTap(el));
      return element;
    }
    return null;
  }
  
  private onElementDragStart(element: Element): void {
    this.draggedElement = element;
    
    // Highlight potential merge targets
    if (this.draggedElement) {
      this.elements.forEach(el => {
        if (el !== this.draggedElement) {
          const mergeResult = this.elementManager.attemptMerge(this.draggedElement!, el);
          if (mergeResult.success) {
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
        console.log('🎉 Merge successful!', this.draggedElement.definition.id, '+', target.definition.id, '=', mergeResult.result);
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
      // Snap back to a valid position if no merge occurred
      this.snapElementToValidPosition(this.draggedElement);
    }
    
    this.draggedElement = null;
  }
  
  private onElementDoubleTap(element: Element): void {
    console.log('🔄 Creating copy of', element.definition.id);
    
    // Create a copy of the element near the original
    const offsetX = 80 + Math.random() * 40 - 20; // Random offset between 60-100
    const offsetY = 80 + Math.random() * 40 - 20;
    
    const newX = element.x + offsetX;
    const newY = element.y + offsetY;
    
    const copy = this.createElementAtPosition(element.definition.id, newX, newY);
    if (copy) {
      copy.playDiscoveryAnimation();
      console.log('✅ Copy created successfully');
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
  
  private snapElementToValidPosition(element: Element): void {
    // Ensure element is within screen bounds
    const margin = 60;
    element.x = Math.max(margin, Math.min(this.app.screen.width - margin, element.x));
    element.y = Math.max(margin, Math.min(this.app.screen.height - margin, element.y));
  }
  
  private findElementAtPosition(x: number, y: number): Element | null {
    // Find element at the given position
    for (const element of this.elements) {
      const bounds = element.getBounds();
      if (x >= bounds.x && x <= bounds.x + bounds.width &&
          y >= bounds.y && y <= bounds.y + bounds.height) {
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
    text.x = this.app.screen.width / 2;
    text.y = this.app.screen.height / 2; // Center vertically to avoid UI elements
    text.alpha = 0;
    text.zIndex = 1000; // High z-index to appear above everything
    
    this.app.stage.addChild(text);
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
            this.app.stage.removeChild(text);
            text.destroy();
          }
        };
        setTimeout(fadeOut, 1500);
      }
    };
    
    animate();
  }
  
  private onGameStateChanged(): void {
    // Emit event for UI updates
    const progress = this.elementManager.getDiscoveryProgress();
    window.dispatchEvent(new CustomEvent('gameStateChanged', {
      detail: {
        discoveredElements: this.elementManager.getDiscoveredElements(),
        progress
      }
    }));
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
    
    // Use provided position or find a good random position
    const posX = x !== undefined ? x : Math.random() * (this.app.screen.width - 200) + 100;
    const posY = y !== undefined ? y : Math.random() * (this.app.screen.height - 200) + 100;
    
    const element = this.createElementAtPosition(elementId, posX, posY);
    return element !== null;
  }
  
  public addElementFromPanel(elementId: string, globalX: number, globalY: number): boolean {
    // Convert global coordinates to canvas coordinates
    const rect = (this.app.view as HTMLCanvasElement).getBoundingClientRect();
    const x = globalX - rect.left;
    const y = globalY - rect.top;
    
    return this.addElement(elementId, x, y);
  }
  
  public getHint(): string | null {
    return this.elementManager.getHint();
  }
  
  public getProgress(): ReturnType<ElementManager['getDiscoveryProgress']> {
    return this.elementManager.getDiscoveryProgress();
  }
  
  public clearCanvas(): void {
    // Clear all elements from canvas
    this.elements.forEach(element => {
      this.removeElement(element);
    });
    this.onGameStateChanged();
  }
  
  public reset(): void {
    // Clear all elements except basics
    this.elements.forEach(element => {
      if (!['water', 'fire', 'earth', 'air'].includes(element.definition.id)) {
        this.removeElement(element);
      }
    });
    
    // Reset element manager
    this.elementManager = new ElementManager();
    localStorage.removeItem('idle-alchemy-save');
    this.onGameStateChanged();
  }
  
  public destroy(): void {
    this.app.destroy(true);
  }
} 