export interface ElementDefinition {
  id: string;
  name: string;
  emoji: string;
  color: number;
  description: string;
  category: 'basic' | 'nature' | 'human' | 'abstract' | 'advanced';
  discovered: boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface Recipe {
  id: string;
  inputs: [string, string];
  output: string;
  discoveryMessage?: string;
}

interface TSVElement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  recipe: string;
}

class ConfigLoader {
  private elements: Map<string, ElementDefinition> = new Map();
  private recipes: Recipe[] = [];
  private initialized = false;

  // Color mapping for different elements
  private getElementColor(id: string, emoji: string): number {
    const colorMap: Record<string, number> = {
      water: 0x4FC3F7,
      fire: 0xFF5722,
      earth: 0x8D6E63,
      air: 0xE0E0E0,
      steam: 0xF5F5F5,
      mud: 0x6D4C41,
      lava: 0xFF6B35,
      dust: 0xBCAAA4,
      lightning: 0xFFEB3B,
      cloud: 0xF5F5F5,
      rain: 0x42A5F5,
      storm: 0x455A64,
      obsidian: 0x212121,
      plant: 0x4CAF50,
      lake: 0x1976D2,
      inferno: 0xD32F2F,
      mountain: 0x5D4037,
      wind: 0x90A4AE
    };
    
    return colorMap[id] || 0x888888; // Default gray
  }

  // Determine element category based on recipe
  private getElementCategory(recipe: string): 'basic' | 'nature' | 'human' | 'abstract' | 'advanced' {
    if (!recipe) return 'basic';
    return 'nature'; // Most combinations are nature-based
  }

  // Determine rarity based on recipe complexity
  private getElementRarity(recipe: string): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    if (!recipe) return 'common'; // Base elements
    if (recipe.includes('+')) {
      const parts = recipe.split('+');
      if (parts[0] === parts[1]) return 'uncommon'; // Same element combinations
      return 'common'; // Different element combinations
    }
    return 'common';
  }

  private async loadTSV(): Promise<void> {
    try {
      const response = await fetch('/src/config/elements.tsv');
      const text = await response.text();
      
      const lines = text.split('\n');
      const tsvElements: TSVElement[] = [];
      
      let isHeaderFound = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          continue;
        }
        
        // Skip header line
        if (!isHeaderFound && trimmedLine.startsWith('id\t')) {
          isHeaderFound = true;
          continue;
        }
        
        const columns = trimmedLine.split('\t');
        if (columns.length >= 4) {
          tsvElements.push({
            id: columns[0],
            name: columns[1],
            emoji: columns[2],
            description: columns[3],
            recipe: columns[4] || ''
          });
        }
      }
      
      this.processElements(tsvElements);
      console.log(`Loaded ${this.elements.size} elements and ${this.recipes.length} recipes from TSV`);
      
    } catch (error) {
      console.error('Failed to load TSV configuration:', error);
      // Fallback to basic elements
      this.loadFallbackElements();
    }
  }

  private processElements(tsvElements: TSVElement[]): void {
    // First pass: create all elements
    for (const tsvElement of tsvElements) {
      const element: ElementDefinition = {
        id: tsvElement.id,
        name: tsvElement.name,
        emoji: tsvElement.emoji,
        color: this.getElementColor(tsvElement.id, tsvElement.emoji),
        description: tsvElement.description,
        category: this.getElementCategory(tsvElement.recipe),
        discovered: !tsvElement.recipe, // Base elements are discovered by default
        rarity: this.getElementRarity(tsvElement.recipe)
      };
      
      this.elements.set(tsvElement.id, element);
    }
    
    // Second pass: create recipes
    for (const tsvElement of tsvElements) {
      if (tsvElement.recipe && tsvElement.recipe.includes('+')) {
        const [input1, input2] = tsvElement.recipe.split('+');
        
        const recipe: Recipe = {
          id: `${input1}_${input2}`,
          inputs: [input1.trim(), input2.trim()] as [string, string],
          output: tsvElement.id,
          discoveryMessage: `${tsvElement.name} discovered! ${tsvElement.description}`
        };
        
        this.recipes.push(recipe);
      }
    }
  }

  private loadFallbackElements(): void {
    // Minimal fallback if TSV loading fails
    const fallbackElements = [
      { id: 'water', name: 'Water', emoji: '💧', description: 'The essence of life' },
      { id: 'fire', name: 'Fire', emoji: '🔥', description: 'Pure energy' },
      { id: 'earth', name: 'Earth', emoji: '🌍', description: 'Solid foundation' },
      { id: 'air', name: 'Air', emoji: '🌬️', description: 'Invisible force' }
    ];
    
    for (const elem of fallbackElements) {
      this.elements.set(elem.id, {
        ...elem,
        color: this.getElementColor(elem.id, elem.emoji),
        category: 'basic',
        discovered: true,
        rarity: 'common'
      });
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    await this.loadTSV();
    this.initialized = true;
  }

  getElements(): Map<string, ElementDefinition> {
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

  getRecipesForElement(elementId: string): Recipe[] {
    return this.recipes.filter(recipe => 
      recipe.inputs.includes(elementId)
    );
  }
}

// Export singleton instance
export const configLoader = new ConfigLoader(); 