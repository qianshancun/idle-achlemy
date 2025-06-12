export interface ElementDefinition {
  id: string; // hex ID
  originalId: string; // original string ID for debugging
  name: string; // current language name
  emoji: string; // emoji (same across languages)
  color: number;
  category: 'basic' | 'nature' | 'science' | 'life' | 'civilization' | 'technology' | 'magic' | 'abstract';
  discovered: boolean;
  rarity: 'basic' | 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface Recipe {
  id: string;
  inputs: [string, string]; // hex IDs
  output: string; // hex ID
  discoveryMessage?: string;
}

interface CompiledElementData {
  id: string; // hex ID
  originalId: string; // original string ID
  emoji: string; // emoji (same across languages)
  names: Record<string, string>; // language -> name mapping
  rarity: string;
  category: string;
}

interface CompiledConfig {
  elements: Record<string, CompiledElementData>; // hex ID -> element data
  recipes: Recipe[]; // recipes array
  metadata: {
    version: string;
    compiledAt: string;
    totalElements: number;
    totalRecipes: number;
    languages: string[];
  };
}

class ConfigLoader {
  private elements: Map<string, ElementDefinition> = new Map();
  private recipes: Recipe[] = [];
  private initialized = false;
  private currentLanguage = 'en';

  // Color mapping for different categories
  private getElementColor(hexId: string, category: string): number {
    // Use category-based coloring with some specific overrides
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

  // Set the current language for element names
  setLanguage(language: string): void {
    this.currentLanguage = language;
    this.updateElementLanguage();
  }

  // Update all element names when language changes
  private updateElementLanguage(): void {
    if (this.initialized) {
      console.log(`🌐 Switching to language: ${this.currentLanguage}`);
      // For now, we'll trigger a reload when language changes
      // This could be optimized later to update names in place
    }
  }

  private async loadCompiled(): Promise<void> {
    try {
      console.log('🔄 Loading compiled configuration...');
      const response = await fetch('/elements-compiled.json');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const compiled: CompiledConfig = await response.json();
      
      console.log(`📊 Loaded compiled config v${compiled.metadata.version}`);
      console.log(`📁 Contains ${compiled.metadata.totalElements} elements`);
      console.log(`🔧 Contains ${compiled.metadata.totalRecipes} recipes`);
      console.log(`🌐 Supported languages: ${compiled.metadata.languages.join(', ')}`);
      
      // Clear existing data
      this.elements.clear();
      this.recipes = [];
      
      // Base elements that should be discovered by default (first 4)
      const baseElementIds = ['0', '1', '2', '3']; // water, fire, earth, air hex IDs
      
      // Process elements
      let discoveredCount = 0;
      for (const [hexId, elementData] of Object.entries(compiled.elements)) {
        const isBasic = baseElementIds.includes(hexId);
        const discovered = isBasic;
        
        // Get name for current language, fallback to English
        const name = elementData.names[this.currentLanguage] || elementData.names['en'] || elementData.originalId;
        
        const elementDef: ElementDefinition = {
          id: hexId,
          originalId: elementData.originalId,
          name,
          emoji: elementData.emoji,
          color: this.getElementColor(hexId, elementData.category),
          category: elementData.category as any,
          discovered,
          rarity: elementData.rarity as any
        };
        
        this.elements.set(hexId, elementDef);
        
        if (discovered) {
          discoveredCount++;
          console.log(`✅ Base element: ${hexId} (${name})`);
        }
      }
      
      // Process recipes
      this.recipes = compiled.recipes.map(recipe => ({
        id: `${recipe.inputs[0]}_${recipe.inputs[1]}`,
        inputs: recipe.inputs,
        output: recipe.output,
        discoveryMessage: this.elements.get(recipe.output)?.name || 'New element discovered!'
      }));
      
      console.log(`✅ Loaded ${this.elements.size} elements and ${this.recipes.length} recipes`);
      console.log(`🎯 ${discoveredCount} base elements discovered`);
      
    } catch (error) {
      console.error('❌ Failed to load compiled configuration:', error);
      console.log('🔄 Falling back to basic elements...');
      this.loadFallbackElements();
    }
  }

  private loadFallbackElements(): void {
    console.log('🔄 Loading fallback elements...');
    const fallbackElements = [
      { id: '0', originalId: 'water', name: 'Water', emoji: '💧' },
      { id: '1', originalId: 'fire', name: 'Fire', emoji: '🔥' },
      { id: '2', originalId: 'earth', name: 'Earth', emoji: '🌍' },
      { id: '3', originalId: 'air', name: 'Air', emoji: '🌬️' }
    ];
    
    for (const elem of fallbackElements) {
      const elementDef: ElementDefinition = {
        ...elem,
        color: this.getElementColor(elem.id, 'basic'),
        category: 'basic',
        discovered: true,
        rarity: 'basic'
      };
      
      this.elements.set(elem.id, elementDef);
      console.log(`✅ Fallback element: ${elem.id} (${elem.name})`);
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('⚠️ ConfigLoader already initialized');
      return;
    }
    
    console.log('🚀 Initializing ConfigLoader...');
    await this.loadCompiled();
    this.initialized = true;
    console.log('✅ ConfigLoader initialization complete');
    
    const totalElements = this.elements.size;
    const discoveredElements = Array.from(this.elements.values()).filter(e => e.discovered).length;
    console.log(`📊 STATUS: ${discoveredElements}/${totalElements} elements discovered`);
  }

  getElements(): Map<string, ElementDefinition> {
    return this.elements;
  }

  getElement(id: string): ElementDefinition | null {
    return this.elements.get(id) || null;
  }

  getRecipes(): Recipe[] {
    return this.recipes;
  }

  findRecipe(element1: string, element2: string): Recipe | null {
    // Try both combinations since order shouldn't matter
    const recipe1 = this.recipes.find(r => 
      (r.inputs[0] === element1 && r.inputs[1] === element2) ||
      (r.inputs[0] === element2 && r.inputs[1] === element1)
    );
    
    return recipe1 || null;
  }

  checkRecipe(element1: string, element2: string): boolean {
    return this.findRecipe(element1, element2) !== null;
  }

  getRecipesForElement(elementId: string): Recipe[] {
    return this.recipes.filter(r => r.inputs.includes(elementId));
  }

  getRecipesProducing(elementId: string): Recipe[] {
    return this.recipes.filter(r => r.output === elementId);
  }

  // Update element name for current language (used by i18n system)
  updateElementForLanguage(elementId: string, name: string): void {
    const element = this.elements.get(elementId);
    if (element) {
      element.name = name;
    }
  }

  getElementsByName(name: string): ElementDefinition[] {
    return Array.from(this.elements.values()).filter(e => 
      e.name.toLowerCase().includes(name.toLowerCase())
    );
  }
}

// Export singleton instance
export const configLoader = new ConfigLoader(); 