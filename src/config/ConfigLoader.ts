export interface ElementDefinition {
  id: string; // hex ID
  stringId: string; // original string ID for debugging
  name: string; // current language name
  emoji: string; // current language emoji
  color: number;
  category: 'basic' | 'nature' | 'human' | 'abstract' | 'advanced';
  discovered: boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  recipe: [string, string] | null; // hex IDs of ingredients, null for base elements
}

export interface Recipe {
  id: string;
  inputs: [string, string]; // hex IDs
  output: string; // hex ID
  discoveryMessage?: string;
}

interface CompiledElementData {
  id: string; // hex ID
  stringId: string; // original string ID
  names: Record<string, string>; // language -> name mapping
  emojis: Record<string, string>; // language -> emoji mapping  
  recipe: [string, string] | null; // hex IDs
}

interface CompiledConfig {
  elements: Record<string, CompiledElementData>; // hex ID -> element data
  metadata: {
    version: string;
    compiled: string;
    totalElements: number;
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
      'basic': 0x4FC3F7,      // Light blue
      'nature': 0x4CAF50,     // Green
      'human': 0xFF9800,      // Orange
      'abstract': 0x9C27B0,   // Purple
      'advanced': 0xF44336    // Red
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

  // Determine element category based on hex ID range
  private getElementCategory(hexId: string): 'basic' | 'nature' | 'human' | 'abstract' | 'advanced' {
    const id = parseInt(hexId, 16);
    if (id < 4) return 'basic';           // 0-3: basic elements
    if (id < 50) return 'nature';         // 4-49: nature elements  
    if (id < 150) return 'human';         // 50-149: human/civilization
    if (id < 250) return 'abstract';      // 150-249: abstract/mythical
    return 'advanced';                    // 250+: advanced concepts
  }

  // Determine rarity based on category and discovery status
  private getElementRarity(category: string, isBasic: boolean): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    if (isBasic) return 'common';
    
    switch (category) {
      case 'basic': return 'common';
      case 'nature': return 'uncommon';
      case 'human': return 'rare';
      case 'abstract': return 'epic';
      case 'advanced': return 'legendary';
      default: return 'common';
    }
  }

  // Set the current language for element names/emojis
  setLanguage(language: string): void {
    this.currentLanguage = language;
    this.updateElementLanguage();
  }

  // Update all element names/emojis when language changes
  private updateElementLanguage(): void {
    // This will be called when language changes to update element names
    // For now, we'll reload the data with the new language
    if (this.initialized) {
      console.log(`🌐 Switching to language: ${this.currentLanguage}`);
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
      console.log(`🌐 Supported languages: ${compiled.metadata.languages.join(', ')}`);
      
      // Clear existing data
      this.elements.clear();
      this.recipes = [];
      
      // Base elements that should be discovered by default (first 4)
      const baseElementIds = ['0', '1', '2', '3']; // water, fire, earth, air hex IDs
      
      // Process elements
      let discoveredCount = 0;
      for (const [hexId, elementData] of Object.entries(compiled.elements)) {
        const category = this.getElementCategory(hexId);
        const isBasic = baseElementIds.includes(hexId);
        const discovered = isBasic;
        
        // Get name and emoji for current language, fallback to English
        const name = elementData.names[this.currentLanguage] || elementData.names['en'] || elementData.stringId;
        const emoji = elementData.emojis[this.currentLanguage] || elementData.emojis['en'] || '❓';
        
        const elementDef: ElementDefinition = {
          id: hexId,
          stringId: elementData.stringId,
          name,
          emoji,
          color: this.getElementColor(hexId, category),
          category,
          discovered,
          rarity: this.getElementRarity(category, isBasic),
          recipe: elementData.recipe
        };
        
        this.elements.set(hexId, elementDef);
        
        if (discovered) {
          discoveredCount++;
          console.log(`✅ Base element: ${hexId} (${name})`);
        }
        
        // Create recipe if element has one
        if (elementData.recipe) {
          const recipeDef: Recipe = {
            id: `${elementData.recipe[0]}_${elementData.recipe[1]}`,
            inputs: elementData.recipe,
            output: hexId,
            discoveryMessage: name
          };
          this.recipes.push(recipeDef);
        }
      }
      
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
      { id: '0', stringId: 'water', name: 'Water', emoji: '💧' },
      { id: '1', stringId: 'fire', name: 'Fire', emoji: '🔥' },
      { id: '2', stringId: 'earth', name: 'Earth', emoji: '🌍' },
      { id: '3', stringId: 'air', name: 'Air', emoji: '🌬️' }
    ];
    
    for (const elem of fallbackElements) {
      const elementDef: ElementDefinition = {
        ...elem,
        color: this.getElementColor(elem.id, 'basic'),
        category: 'basic',
        discovered: true,
        rarity: 'common',
        recipe: null
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

  // Update element name/emoji for current language (used by i18n system)
  updateElementForLanguage(elementId: string, name: string, emoji: string): void {
    const element = this.elements.get(elementId);
    if (element) {
      element.name = name;
      element.emoji = emoji;
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