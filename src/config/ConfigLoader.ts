export interface ElementDefinition {
  id: string; // Now uses hex ID (0, 1, A, B, etc.)
  name: string;
  emoji: string;
  color: number;
  category: 'basic' | 'nature' | 'human' | 'abstract' | 'advanced';
  discovered: boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface Recipe {
  id: string;
  inputs: [string, string]; // Now uses hex IDs
  output: string; // Now uses hex ID
  discoveryMessage?: string;
}

interface CompiledData {
  version: string;
  timestamp: string;
  elements: Array<{
    id: string; // hex ID
    name: string;
    emoji: string;
    discovered: boolean;
  }>;
  recipes: Array<{
    inputs: [string, string]; // hex IDs
    output: string; // hex ID
  }>;
  idMapping: Record<string, string>; // string ID -> hex ID mapping
}

class ConfigLoader {
  private elements: Map<string, ElementDefinition> = new Map();
  private recipes: Recipe[] = [];
  private initialized = false;

  // Color mapping for different elements (using hex IDs)
  private getElementColor(hexId: string, _emoji: string): number {
    const colorMap: Record<string, number> = {
      '0': 0x4FC3F7,    // water
      '1': 0xFF5722,    // fire
      '2': 0x8D6E63,    // earth
      '3': 0xE0E0E0,    // air
      '4': 0xF5F5F5,    // steam
      '5': 0x6D4C41,    // mud
      '6': 0xFF6B35,    // lava
      '7': 0xBCAAA4,    // dust
      '8': 0xFFEB3B,    // lightning
      '9': 0xF5F5F5,    // cloud
      'A': 0x42A5F5,    // rain
      'B': 0x455A64,    // storm
      'C': 0x212121,    // obsidian
      'D': 0x4CAF50,    // plant
      'E': 0x1976D2,    // lake
      'F': 0xD32F2F,    // inferno
      '10': 0x5D4037,   // mountain
      '11': 0x90A4AE    // wind
    };
    
    return colorMap[hexId] || 0x888888; // Default gray
  }

  // Determine element category based on hex ID range
  private getElementCategory(hexId: string): 'basic' | 'nature' | 'human' | 'abstract' | 'advanced' {
    const id = parseInt(hexId, 16);
    console.log(`🏷️ Categorizing element ${hexId} (decimal: ${id})`);
    if (id < 4) return 'basic';           // 0-3: basic elements
    if (id < 50) return 'nature';         // 4-49: nature elements
    if (id < 150) return 'human';         // 50-149: human/civilization
    if (id < 250) return 'abstract';      // 150-249: abstract/mythical
    return 'advanced';                    // 250+: advanced concepts
  }

  // Determine rarity based on hex ID range
  private getElementRarity(hexId: string, discovered: boolean): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    if (discovered) return 'common'; // Base elements
    const id = parseInt(hexId, 16);
    if (id < 20) return 'common';
    if (id < 50) return 'uncommon';
    if (id < 100) return 'rare';
    if (id < 200) return 'epic';
    return 'legendary';
  }

  private async loadCompiled(): Promise<void> {
    try {
      console.log('🔄 Loading compiled elements...');
      const response = await fetch('/src/config/elements-compiled.json');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const compiled: CompiledData = await response.json();
      
      console.log(`📊 Loaded compiled data v${compiled.version} (${compiled.timestamp})`);
      console.log(`📁 Raw data contains ${compiled.elements.length} elements and ${compiled.recipes.length} recipes`);
      
      // Process elements
      let discoveredCount = 0;
      for (const element of compiled.elements) {
        console.log(`🔍 Processing element: ${element.id} = ${element.name} ${element.emoji} (discovered: ${element.discovered})`);
        
        const elementDef: ElementDefinition = {
          id: element.id,
          name: element.name,
          emoji: element.emoji,
          color: this.getElementColor(element.id, element.emoji),
          category: this.getElementCategory(element.id),
          discovered: element.discovered,
          rarity: this.getElementRarity(element.id, element.discovered)
        };
        
        this.elements.set(element.id, elementDef);
        
        if (element.discovered) {
          discoveredCount++;
          console.log(`✅ Basic element discovered: ${element.id} (${element.name})`);
        }
      }
      
      console.log(`🎯 Total discovered elements: ${discoveredCount}`);
      
      // Process recipes
      for (const recipe of compiled.recipes) {
        const outputElement = this.elements.get(recipe.output);
        const elementName = outputElement?.name || 'Unknown';
        
        console.log(`🔧 Creating recipe: ${recipe.inputs[0]} + ${recipe.inputs[1]} = ${recipe.output} (${elementName})`);
        
        const recipeDef: Recipe = {
          id: `${recipe.inputs[0]}_${recipe.inputs[1]}`,
          inputs: recipe.inputs,
          output: recipe.output,
          discoveryMessage: `${elementName} discovered!`
        };
        
        this.recipes.push(recipeDef);
      }
      
      console.log(`✅ Loaded ${this.elements.size} elements and ${this.recipes.length} recipes`);
      console.log(`💾 Using optimized hex IDs for ${Math.round((1 - 676/1925) * 100)}% storage reduction`);
      
      // Debug: Show discovered elements
      const discoveredElements = Array.from(this.elements.values()).filter(e => e.discovered);
      console.log(`🔍 DEBUG: Discovered elements:`, discoveredElements.map(e => `${e.id}:${e.name}`));
      
    } catch (error) {
      console.error('❌ Failed to load compiled configuration:', error);
      console.log('🔄 Falling back to basic elements...');
      // Fallback to basic elements with hex IDs
      this.loadFallbackElements();
    }
  }

  private loadFallbackElements(): void {
    console.log('🔄 Loading fallback elements...');
    const fallbackElements = [
      { id: '0', name: 'Water', emoji: '💧' },
      { id: '1', name: 'Fire', emoji: '🔥' },
      { id: '2', name: 'Earth', emoji: '🌍' },
      { id: '3', name: 'Air', emoji: '🌬️' }
    ];
    
    for (const elem of fallbackElements) {
      const elementDef = {
        ...elem,
        color: this.getElementColor(elem.id, elem.emoji),
        category: 'basic' as const,
        discovered: true,
        rarity: 'common' as const
      };
      
      this.elements.set(elem.id, elementDef);
      console.log(`✅ Fallback element added: ${elem.id} (${elem.name})`);
    }
    
    console.log(`🎯 Fallback loaded: ${this.elements.size} elements`);
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
    
    // Final debug check
    const totalElements = this.elements.size;
    const discoveredElements = Array.from(this.elements.values()).filter(e => e.discovered).length;
    console.log(`📊 FINAL STATUS: ${discoveredElements}/${totalElements} elements discovered`);
  }

  getElements(): Map<string, ElementDefinition> {
    console.log(`📋 getElements() called - returning ${this.elements.size} elements`);
    const discoveredCount = Array.from(this.elements.values()).filter(e => e.discovered).length;
    console.log(`📋 ${discoveredCount} of those are discovered`);
    return this.elements;
  }

  getRecipes(): Recipe[] {
    return this.recipes;
  }

  findRecipe(element1: string, element2: string): Recipe | null {
    const recipe = this.recipes.find(recipe => 
      (recipe.inputs[0] === element1 && recipe.inputs[1] === element2) ||
      (recipe.inputs[0] === element2 && recipe.inputs[1] === element1)
    ) || null;
    
    if (recipe) {
      console.log('✅ Recipe found:', element1, '+', element2, '=', recipe.output);
    }
    return recipe;
  }

  // Check if a recipe exists without discovering (for highlighting)
  checkRecipe(element1: string, element2: string): boolean {
    return this.recipes.some(recipe => 
      (recipe.inputs[0] === element1 && recipe.inputs[1] === element2) ||
      (recipe.inputs[0] === element2 && recipe.inputs[1] === element1)
    );
  }

  getRecipesForElement(elementId: string): Recipe[] {
    return this.recipes.filter(recipe => 
      recipe.inputs[0] === elementId || recipe.inputs[1] === elementId
    );
  }

  getRecipesProducing(elementId: string): Recipe[] {
    return this.recipes.filter(recipe => recipe.output === elementId);
  }

  // Utility method to convert string ID to hex ID (for migration/debugging)
  getHexId(stringId: string): string | null {
    // This would use the idMapping from compiled data
    // For now, return the input if it's already a hex ID
    return stringId;
  }

  // Get element by name (useful for debugging)
  getElementsByName(name: string): ElementDefinition[] {
    return Array.from(this.elements.values()).filter(
      element => element.name.toLowerCase().includes(name.toLowerCase())
    );
  }
}

// Export singleton instance
export const configLoader = new ConfigLoader(); 