export interface Recipe {
  id: string;
  inputs: [string, string]; // Two element IDs required for combination
  output: string; // Element ID of the result
  discoveryMessage?: string;
}

export const RECIPES: Recipe[] = [
  // Basic combinations - first tier
  {
    id: 'water_fire',
    inputs: ['water', 'fire'],
    output: 'steam',
    discoveryMessage: 'Water meets fire to create steam!'
  },
  {
    id: 'earth_water',
    inputs: ['earth', 'water'],
    output: 'mud',
    discoveryMessage: 'Earth and water mix to form mud!'
  },
  {
    id: 'fire_earth',
    inputs: ['fire', 'earth'],
    output: 'lava',
    discoveryMessage: 'Fire melts earth into molten lava!'
  },
  {
    id: 'air_earth',
    inputs: ['air', 'earth'],
    output: 'dust',
    discoveryMessage: 'Air scatters earth into dust!'
  },
  {
    id: 'fire_air',
    inputs: ['fire', 'air'],
    output: 'lightning',
    discoveryMessage: 'Fire and air create powerful lightning!'
  },
  {
    id: 'water_air',
    inputs: ['water', 'air'],
    output: 'cloud',
    discoveryMessage: 'Water rises with air to form clouds!'
  },

  // Second tier combinations
  {
    id: 'cloud_water',
    inputs: ['cloud', 'water'],
    output: 'rain',
    discoveryMessage: 'Clouds release their water as rain!'
  },
  {
    id: 'lightning_cloud',
    inputs: ['lightning', 'cloud'],
    output: 'storm',
    discoveryMessage: 'Lightning and clouds create a fierce storm!'
  },
  {
    id: 'lava_water',
    inputs: ['lava', 'water'],
    output: 'obsidian',
    discoveryMessage: 'Lava cools rapidly in water to form obsidian!'
  },
  {
    id: 'mud_air',
    inputs: ['mud', 'air'],
    output: 'plant',
    discoveryMessage: 'Life springs from mud with the breath of air!'
  },

  // Alternative combinations (same result, different inputs)
  {
    id: 'steam_earth',
    inputs: ['steam', 'earth'],
    output: 'mud',
    discoveryMessage: 'Steam condenses on earth to create mud!'
  },
  {
    id: 'dust_water',
    inputs: ['dust', 'water'],
    output: 'mud',
    discoveryMessage: 'Dust settles in water to form mud!'
  },
  {
    id: 'rain_earth',
    inputs: ['rain', 'earth'],
    output: 'plant',
    discoveryMessage: 'Rain nourishes the earth, giving birth to plants!'
  },

  // Identical element combinations
  {
    id: 'water_water',
    inputs: ['water', 'water'],
    output: 'lake',
    discoveryMessage: 'Two waters merge to form a lake!'
  },
  {
    id: 'fire_fire',
    inputs: ['fire', 'fire'],
    output: 'inferno',
    discoveryMessage: 'Fire intensifies into a raging inferno!'
  },
  {
    id: 'earth_earth',
    inputs: ['earth', 'earth'],
    output: 'mountain',
    discoveryMessage: 'Earth piles upon earth to form a mountain!'
  },
  {
    id: 'air_air',
    inputs: ['air', 'air'],
    output: 'wind',
    discoveryMessage: 'Air gathers force to become wind!'
  }
];

// Helper function to find recipe by input elements
export function findRecipe(element1: string, element2: string): Recipe | null {
  const recipe = RECIPES.find(recipe => 
    (recipe.inputs[0] === element1 && recipe.inputs[1] === element2) ||
    (recipe.inputs[0] === element2 && recipe.inputs[1] === element1)
  ) || null;
  
  if (recipe) {
    console.log('✅ Recipe found:', element1, '+', element2, '=', recipe.output);
  }
  return recipe;
}

// Get all possible combinations for an element
export function getRecipesForElement(elementId: string): Recipe[] {
  return RECIPES.filter(recipe => 
    recipe.inputs.includes(elementId)
  );
} 