import { Element } from './Element';
import { configLoader, ElementDefinition } from '@/config/ConfigLoader';
import { i18n, t } from '@/i18n/Translation';

export class ElementManager {
  private discoveredElements: Set<string> = new Set();
  private elementCounts: Map<string, number> = new Map();
  
  constructor() {
    // Initialize with basic elements immediately (config is already loaded when Game creates ElementManager)
    this.initializeBasicElements();
  }
  
  private initializeBasicElements() {
    // Force immediate discovery of basic elements using HEX IDs
    console.log('🔧 Initializing basic elements with hex IDs...');
    this.discoveredElements.add('0'); // water
    this.discoveredElements.add('1'); // fire
    this.discoveredElements.add('2'); // earth
    this.discoveredElements.add('3'); // air
    console.log('✅ Basic elements initialized:', Array.from(this.discoveredElements));
  }
  
  public resetToBasicElements() {
    // Reset discovered elements to only basic ones
    this.discoveredElements.clear();
    this.elementCounts.clear();
    this.initializeBasicElements();
  }
  
  public discoverElement(elementId: string): boolean {
    const elements = configLoader.getElements();
    if (!elements.has(elementId)) {
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
    // Basic elements are always considered discovered (using HEX IDs)
    const basicElements = ['0', '1', '2', '3']; // water, fire, earth, air
    if (basicElements.includes(elementId)) {
      return true;
    }
    return this.discoveredElements.has(elementId);
  }
  
  public getDiscoveredElements(): ElementDefinition[] {
    const elements = configLoader.getElements();
    
    console.log('🔍 ElementManager.getDiscoveredElements() called');
    console.log('   📦 Discovered IDs:', Array.from(this.discoveredElements));
    console.log('   📚 Available elements in config:', elements.size);
    
    const result = Array.from(this.discoveredElements)
      .map(id => {
        const element = elements.get(id);
        console.log(`   🔗 Mapping ${id} -> ${element ? element.name : 'NOT FOUND'}`);
        return element;
      })
      .filter(Boolean) as ElementDefinition[];
    
    console.log('   ✅ Final discovered elements:', result);
    return result;
  }
  
  public getElementCount(elementId: string): number {
    return this.elementCounts.get(elementId) || 0;
  }
  
  public createElement(elementId: string, x: number = 0, y: number = 0): Element | null {
    const elements = configLoader.getElements();
    const definition = elements.get(elementId);
    if (!definition || !this.isDiscovered(elementId)) {
      return null;
    }
    
    return new Element(definition, x, y);
  }
  
  public checkRecipe(element1: Element, element2: Element): {
    success: boolean;
    result?: string;
  } {
    // Don't merge the same element with itself
    if (element1 === element2) {
      return { success: false };
    }
    
    const recipe = configLoader.findRecipe(element1.definition.id, element2.definition.id);
    
    if (!recipe) {
      return { success: false };
    }
    
    return {
      success: true,
      result: recipe.output
    };
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
    
    const recipe = configLoader.findRecipe(element1.definition.id, element2.definition.id);
    
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
    recipe: any;
    canMake: boolean;
    hasIngredients: boolean;
  }> {
    const recipes = configLoader.getRecipes();
    return recipes.map(recipe => {
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
    const elements = configLoader.getElements();
    const total = elements.size;
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
      return t('ui.messages.keepExperimenting');
    }
    
    const randomRecipe = possibleRecipes[Math.floor(Math.random() * possibleRecipes.length)];
    const [input1, input2] = randomRecipe.recipe.inputs;
    const elements = configLoader.getElements();
    const element1 = elements.get(input1);
    const element2 = elements.get(input2);
    
    if (!element1 || !element2) {
      return t('ui.messages.keepExperimenting');
    }
    
    const element1Name = i18n.getElementName(input1, element1.name);
    const element2Name = i18n.getElementName(input2, element2.name);
    
    return t('ui.hints.tryCombing', { 
      element1: `${element1.emoji} ${element1Name}`, 
      element2: `${element2.emoji} ${element2Name}` 
    });
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