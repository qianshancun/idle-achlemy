import { Element } from './Element';
import { configLoader, Element as ElementType } from '@/config/ConfigLoader';
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
    const element = configLoader.getElementById(elementId);
    if (!element) {
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
  
  public getDiscoveredElements(): ElementType[] {
    const gameConfig = configLoader.getGameConfig();
    
    console.log('🔍 ElementManager.getDiscoveredElements() called');
    console.log('   📦 Discovered IDs:', Array.from(this.discoveredElements));
    console.log('   📚 Available elements in config:', gameConfig.elements.length);
    
    const result = Array.from(this.discoveredElements)
      .map(id => {
        const element = configLoader.getElementById(id);
        console.log(`   🔗 Mapping ${id} -> ${element ? element.name : 'NOT FOUND'}`);
        return element;
      })
      .filter(Boolean) as ElementType[];
    
    console.log('   ✅ Final discovered elements:', result);
    return result;
  }
  
  public getElementCount(elementId: string): number {
    return this.elementCounts.get(elementId) || 0;
  }
  
  public createElement(elementId: string, x: number = 0, y: number = 0): Element | null {
    const element = configLoader.getElementById(elementId);
    if (!element || !this.isDiscovered(elementId)) {
      return null;
    }
    
    // Convert to old ElementDefinition format for compatibility
    const definition = {
      id: element.id,
      originalId: element.originalId,
      name: element.name,
      emoji: element.emoji,
      color: this.getElementColor(element.id, element.category),
      category: element.category,
      discovered: this.isDiscovered(element.id),
      rarity: element.rarity
    };
    
    return new Element(definition, x, y);
  }
  
  private getElementColor(hexId: string, category: string): number {
    // Color mapping for different categories
    const categoryColors: Record<string, number> = {
      'basic': 0x4FC3F7,        // Light blue
      'nature': 0x4CAF50,       // Green
      'science': 0x2196F3,      // Blue
      'life': 0x8BC34A,         // Light green
      'civilization': 0xFF9800, // Orange
      'technology': 0x607D8B,   // Blue grey
      'magic': 0x9C27B0,        // Purple
      'abstract': 0xE91E63      // Pink
    };
    
    // Specific hex ID overrides
    const specificColors: Record<string, number> = {
      '0': 0x4FC3F7,    // water - blue
      '1': 0xFF5722,    // fire - red-orange
      '2': 0x8D6E63,    // earth - brown
      '3': 0xE0E0E0,    // air - light gray
    };
    
    return specificColors[hexId] || categoryColors[category] || 0x888888;
  }
  
  public checkRecipe(element1: Element, element2: Element): {
    success: boolean;
    result?: string;
  } {
    // Don't merge the same element with itself
    if (element1 === element2) {
      return { success: false };
    }
    
    const recipe = configLoader.getRecipeByInputs(element1.definition.id, element2.definition.id);
    
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
    console.log(`[MERGE ATTEMPT] Trying to merge ${element1.definition.originalId}(${element1.definition.id}) + ${element2.definition.originalId}(${element2.definition.id})`);

    // Don't merge the same element with itself
    if (element1 === element2) {
      console.log(`[MERGE FAILED] Reason: Cannot merge an element with itself.`);
      return { success: false };
    }
    
    const recipe = configLoader.getRecipeByInputs(element1.definition.id, element2.definition.id);
    
    if (!recipe) {
      console.log(`[MERGE FAILED] Reason: No recipe found in ConfigLoader for these inputs.`);
      return { success: false };
    }
    
    console.log(`[MERGE SUCCESS] Found recipe! Output: ${recipe.output}`);
    const isNewDiscovery = this.discoverElement(recipe.output);
    console.log(`[MERGE DISCOVERY] Is new discovery? ${isNewDiscovery}`);
    const resultElement = configLoader.getElementById(recipe.output);
    
    return {
      success: true,
      result: recipe.output,
      isNewDiscovery,
      message: resultElement ? `Discovered ${resultElement.name}!` : 'New element discovered!'
    };
  }
  
  public getAvailableRecipes(): Array<{
    recipe: any;
    canMake: boolean;
    hasIngredients: boolean;
  }> {
    const gameConfig = configLoader.getGameConfig();
    return gameConfig.recipes.map(recipe => {
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
    const gameConfig = configLoader.getGameConfig();
    const total = gameConfig.elements.length;
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
    const element1 = configLoader.getElementById(input1);
    const element2 = configLoader.getElementById(input2);
    
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