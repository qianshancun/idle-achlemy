import * as PIXI from 'pixi.js';
import { ElementDefinition } from '@/config/ConfigLoader';

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
  }
  
  private setupGraphics(): void {
    // Clickable background area - made smaller
    this.background = new PIXI.Graphics();
    this.background.beginFill(0xffffff, 0.9);
    this.background.drawRoundedRect(-35, -35, 70, 70, 6);
    this.background.endFill();
    
    // Subtle border
    this.background.lineStyle(1, 0xdddddd, 0.8);
    this.background.drawRoundedRect(-35, -35, 70, 70, 6);
    
    this.addChild(this.background);
    
    // Emoji - smaller
    this.emojiText = new PIXI.Text(this.definition.emoji, {
      fontSize: 24,
      align: 'center'
    });
    this.emojiText.anchor.set(0.5, 0.6);
    this.emojiText.y = -8;
    this.addChild(this.emojiText);
    
    // Name - smaller
    this.nameText = new PIXI.Text(this.definition.name, {
      fontSize: 10,
      fill: 0x333333,
      align: 'center',
      fontWeight: 'bold'
    });
    this.nameText.anchor.set(0.5, 0.5);
    this.nameText.y = 20;
    this.addChild(this.nameText);
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
        
        // Apply drag offset
        this.x = canvasX - this.dragOffset.x;
        this.y = canvasY - this.dragOffset.y;
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
  
  public getDistanceTo(other: Element): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
} 