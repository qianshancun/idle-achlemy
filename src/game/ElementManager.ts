import { Element } from './Element';
import { ELEMENT_DEFINITIONS, ElementDefinition } from '@/config/elements';
import { findRecipe, RECIPES } from '@/config/recipes';

export class ElementManager {
  private discoveredElements: Set<string> = new Set();
  private elementCounts: Map<string, number> = new Map();
  
  constructor() {
    // Initialize with basic elements
    this.discoverElement('water');
    this.discoverElement('fire');
    this.discoverElement('earth');
    this.discoverElement('air');
  }
  
  public discoverElement(elementId: string): boolean {
    if (!ELEMENT_DEFINITIONS[elementId]) {
      console.warn(`Element ${elementId} not found in definitions`);
      return false;
    }
    
    const wasAlreadyDiscovered = this.discoveredElements.has(elementId);
    this.discoveredElements.add(elementId);
    
    // Update count
    const currentCount = this.elementCounts.get(elementId) || 0;
    this.elementCounts.set(elementId, currentCount + 1);
    
    return !wasAlreadyDiscovered; // Return true if this is a new discovery
  }
  
  public isDiscovered(elementId: string): boolean {
    return this.discoveredElements.has(elementId);
  }
  
  public getDiscoveredElements(): ElementDefinition[] {
    return Array.from(this.discoveredElements)
      .map(id => ELEMENT_DEFINITIONS[id])
      .filter(Boolean);
  }
  
  public getElementCount(elementId: string): number {
    return this.elementCounts.get(elementId) || 0;
  }
  
  public createElement(elementId: string, x: number = 0, y: number = 0): Element | null {
    const definition = ELEMENT_DEFINITIONS[elementId];
    if (!definition || !this.isDiscovered(elementId)) {
      return null;
    }
    
    return new Element(definition, x, y);
  }
  
  public attemptMerge(element1: Element, element2: Element): {
    success: boolean;
    result?: string;
    isNewDiscovery?: boolean;
    message?: string;
  } {
    // Don't merge the same element with itself
    if (element1 === element2) {
      return { success: false };
    }
    
    const recipe = findRecipe(element1.definition.id, element2.definition.id);
    
    if (!recipe) {
      return { success: false };
    }
    
    const isNewDiscovery = this.discoverElement(recipe.output);
    
    return {
      success: true,
      result: recipe.output,
      isNewDiscovery,
      message: recipe.discoveryMessage
    };
  }
  
  public getAvailableRecipes(): Array<{
    recipe: typeof RECIPES[0];
    canMake: boolean;
    hasIngredients: boolean;
  }> {
    return RECIPES.map(recipe => {
      const hasIngredient1 = this.isDiscovered(recipe.inputs[0]);
      const hasIngredient2 = this.isDiscovered(recipe.inputs[1]);
      const hasIngredients = hasIngredient1 && hasIngredient2;
      const canMake = hasIngredients && !this.isDiscovered(recipe.output);
      
      return {
        recipe,
        canMake,
        hasIngredients
      };
    });
  }
  
  public getDiscoveryProgress(): {
    discovered: number;
    total: number;
    percentage: number;
  } {
    const total = Object.keys(ELEMENT_DEFINITIONS).length;
    const discovered = this.discoveredElements.size;
    
    return {
      discovered,
      total,
      percentage: Math.round((discovered / total) * 100)
    };
  }
  
  public getHint(): string | null {
    const availableRecipes = this.getAvailableRecipes();
    const possibleRecipes = availableRecipes.filter(r => r.canMake);
    
    if (possibleRecipes.length === 0) {
      return "Keep experimenting with your discovered elements!";
    }
    
    const randomRecipe = possibleRecipes[Math.floor(Math.random() * possibleRecipes.length)];
    const [input1, input2] = randomRecipe.recipe.inputs;
    const element1 = ELEMENT_DEFINITIONS[input1];
    const element2 = ELEMENT_DEFINITIONS[input2];
    
    return `Try combining ${element1.emoji} ${element1.name} with ${element2.emoji} ${element2.name}!`;
  }
  
  public saveProgress(): string {
    return JSON.stringify({
      discoveredElements: Array.from(this.discoveredElements),
      elementCounts: Object.fromEntries(this.elementCounts)
    });
  }
  
  public loadProgress(saveData: string): boolean {
    try {
      const data = JSON.parse(saveData);
      
      if (data.discoveredElements && Array.isArray(data.discoveredElements)) {
        this.discoveredElements = new Set(data.discoveredElements);
      }
      
      if (data.elementCounts && typeof data.elementCounts === 'object') {
        this.elementCounts = new Map(Object.entries(data.elementCounts));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to load progress:', error);
      return false;
    }
  }
} 