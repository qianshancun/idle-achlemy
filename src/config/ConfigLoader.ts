export interface Element {
  id: string;
  originalId: string;
  name: string;
  emoji: string;
  rarity: 'basic' | 'common' | 'uncommon' | 'rare' | 'legendary';
  category: 'basic' | 'nature' | 'science' | 'life' | 'civilization' | 'technology' | 'magic' | 'abstract';
}

export interface Recipe {
  inputs: [string, string];
  output: string;
}

export interface GameConfig {
  elements: Element[];
  recipes: Recipe[];
  metadata: {
    version: string;
    language: string;
    totalElements: number;
    totalRecipes: number;
    compiledAt: string;
  };
}

export interface ElementDefinition {
  id: string; // hex ID
  originalId: string; // original string ID from TSV
  name: string;
  emoji: string;
  color: number;
  category: 'basic' | 'nature' | 'science' | 'life' | 'civilization' | 'technology' | 'magic' | 'abstract';
  discovered: boolean;
  rarity: 'basic' | 'common' | 'uncommon' | 'rare' | 'legendary';
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

export interface CompiledElement {
  id: string;
  originalId: string;
  emoji: string;
  name: string;
  rarity: 'basic' | 'common' | 'uncommon' | 'rare' | 'legendary';
  category: 'basic' | 'nature' | 'science' | 'life' | 'civilization' | 'technology' | 'magic' | 'abstract';
}

export interface CompiledRecipe {
  inputs: [string, string];
  output: string;
}

export interface CompiledLanguageData {
  elements: Record<string, CompiledElement>;
  recipes: CompiledRecipe[];
  metadata: {
    version: string;
    language: string;
    compiledAt: string;
    totalElements: number;
    totalRecipes: number;
  };
}

export interface CompiledData {
  languages: string[];
  data: Record<string, CompiledLanguageData>;
  metadata: {
    version: string;
    compiledAt: string;
    supportedLanguages: string[];
  };
}

export class ConfigLoader {
  private static instance: ConfigLoader;
  private compiledData: CompiledData | null = null;
  private currentLanguage: string = 'en';

  private constructor() {}

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  public async loadConfig(): Promise<void> {
    try {
      const response = await fetch('/elements-compiled.json');
      if (!response.ok) {
        throw new Error(`Failed to load compiled config: ${response.status}`);
      }
      this.compiledData = await response.json();
      console.log('✅ Loaded per-language compiled configuration');
      if (this.compiledData) {
        console.log(`📊 Supported languages: ${this.compiledData.languages.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Failed to load compiled configuration:', error);
      throw error;
    }
  }

  public setLanguage(language: string): void {
    if (!this.compiledData) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    
    if (!this.compiledData.languages.includes(language)) {
      throw new Error(`Language '${language}' not supported. Available: ${this.compiledData.languages.join(', ')}`);
    }
    
    this.currentLanguage = language;
    console.log(`🌍 Language set to: ${language}`);
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  public getSupportedLanguages(): string[] {
    return this.compiledData?.languages || [];
  }

  public getGameConfig(): GameConfig {
    if (!this.compiledData) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }

    const languageData = this.compiledData.data[this.currentLanguage];
    if (!languageData) {
      throw new Error(`No data available for language: ${this.currentLanguage}`);
    }

    // Convert compiled elements to game elements
    const elements: Element[] = Object.values(languageData.elements).map(compiledElement => ({
      id: compiledElement.id,
      originalId: compiledElement.originalId,
      name: compiledElement.name,
      emoji: compiledElement.emoji,
      rarity: compiledElement.rarity,
      category: compiledElement.category
    }));

    // Convert compiled recipes to game recipes
    const recipes: Recipe[] = languageData.recipes.map(compiledRecipe => ({
      inputs: compiledRecipe.inputs,
      output: compiledRecipe.output
    }));

    return {
      elements,
      recipes,
      metadata: {
        version: languageData.metadata.version,
        language: this.currentLanguage,
        totalElements: elements.length,
        totalRecipes: recipes.length,
        compiledAt: languageData.metadata.compiledAt
      }
    };
  }

  public getElementById(id: string): Element | undefined {
    if (!this.compiledData) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }

    const languageData = this.compiledData.data[this.currentLanguage];
    if (!languageData) {
      return undefined;
    }

    const compiledElement = languageData.elements[id];
    if (!compiledElement) {
      return undefined;
    }

    return {
      id: compiledElement.id,
      originalId: compiledElement.originalId,
      name: compiledElement.name,
      emoji: compiledElement.emoji,
      rarity: compiledElement.rarity,
      category: compiledElement.category
    };
  }

  public getRecipeByInputs(input1: string, input2: string): Recipe | undefined {
    if (!this.compiledData) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }

    const languageData = this.compiledData.data[this.currentLanguage];
    if (!languageData) {
      return undefined;
    }

    // Sort inputs to match how recipes are stored
    const sortedInputs = [input1, input2].sort();
    
    const recipe = languageData.recipes.find(r => {
      const recipeInputs = [...r.inputs].sort();
      return recipeInputs[0] === sortedInputs[0] && recipeInputs[1] === sortedInputs[1];
    });

    return recipe ? {
      inputs: recipe.inputs,
      output: recipe.output
    } : undefined;
  }

  public getBaseElements(): Element[] {
    const config = this.getGameConfig();
    return config.elements.filter(element => 
      ['0', '1', '2', '3'].includes(element.id)
    );
  }

  public getMetadata() {
    if (!this.compiledData) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }

    const languageData = this.compiledData.data[this.currentLanguage];
    return languageData?.metadata;
  }
}

// Export singleton instance
export const configLoader = ConfigLoader.getInstance(); 