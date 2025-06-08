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

export const ELEMENT_DEFINITIONS: Record<string, ElementDefinition> = {
  // Basic Elements - Starting elements
  water: {
    id: 'water',
    name: 'Water',
    emoji: '💧',
    color: 0x4FC3F7,
    description: 'The essence of life, fluid and adaptable',
    category: 'basic',
    discovered: true,
    rarity: 'common'
  },
  fire: {
    id: 'fire',
    name: 'Fire',
    emoji: '🔥',
    color: 0xFF5722,
    description: 'Pure energy, destructive yet creative',
    category: 'basic',
    discovered: true,
    rarity: 'common'
  },
  earth: {
    id: 'earth',
    name: 'Earth',
    emoji: '🌍',
    color: 0x8D6E63,
    description: 'Solid foundation, stable and enduring',
    category: 'basic',
    discovered: true,
    rarity: 'common'
  },
  air: {
    id: 'air',
    name: 'Air',
    emoji: '🌬️',
    color: 0xE0E0E0,
    description: 'Invisible force, ever-moving and free',
    category: 'basic',
    discovered: true,
    rarity: 'common'
  },

  // First-tier combinations
  steam: {
    id: 'steam',
    name: 'Steam',
    emoji: '💨',
    color: 0xF5F5F5,
    description: 'Water transformed by fire',
    category: 'nature',
    discovered: false,
    rarity: 'common'
  },
  mud: {
    id: 'mud',
    name: 'Mud',
    emoji: '🟫',
    color: 0x6D4C41,
    description: 'Earth mixed with water',
    category: 'nature',
    discovered: false,
    rarity: 'common'
  },
  lava: {
    id: 'lava',
    name: 'Lava',
    emoji: '🌋',
    color: 0xFF6B35,
    description: 'Earth melted by fire',
    category: 'nature',
    discovered: false,
    rarity: 'uncommon'
  },
  dust: {
    id: 'dust',
    name: 'Dust',
    emoji: '💨',
    color: 0xBCAAA4,
    description: 'Earth scattered by air',
    category: 'nature',
    discovered: false,
    rarity: 'common'
  },
  lightning: {
    id: 'lightning',
    name: 'Lightning',
    emoji: '⚡',
    color: 0xFFEB3B,
    description: 'Fire channeled through air',
    category: 'nature',
    discovered: false,
    rarity: 'rare'
  },
  cloud: {
    id: 'cloud',
    name: 'Cloud',
    emoji: '☁️',
    color: 0xF5F5F5,
    description: 'Water suspended in air',
    category: 'nature',
    discovered: false,
    rarity: 'common'
  },

  // Second-tier combinations
  rain: {
    id: 'rain',
    name: 'Rain',
    emoji: '🌧️',
    color: 0x42A5F5,
    description: 'Water falling from clouds',
    category: 'nature',
    discovered: false,
    rarity: 'common'
  },
  storm: {
    id: 'storm',
    name: 'Storm',
    emoji: '⛈️',
    color: 0x455A64,
    description: 'Lightning and clouds combined',
    category: 'nature',
    discovered: false,
    rarity: 'uncommon'
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    emoji: '⬛',
    color: 0x212121,
    description: 'Lava cooled rapidly',
    category: 'nature',
    discovered: false,
    rarity: 'uncommon'
  },
  plant: {
    id: 'plant',
    name: 'Plant',
    emoji: '🌱',
    color: 0x4CAF50,
    description: 'Life sprouting from mud',
    category: 'nature',
    discovered: false,
    rarity: 'common'
  },

  // Identical element combinations
  lake: {
    id: 'lake',
    name: 'Lake',
    emoji: '🏞️',
    color: 0x1976D2,
    description: 'A large body of still water',
    category: 'nature',
    discovered: false,
    rarity: 'uncommon'
  },
  inferno: {
    id: 'inferno',
    name: 'Inferno',
    emoji: '🔥',
    color: 0xD32F2F,
    description: 'An intense, destructive fire',
    category: 'nature',
    discovered: false,
    rarity: 'rare'
  },
  mountain: {
    id: 'mountain',
    name: 'Mountain',
    emoji: '⛰️',
    color: 0x5D4037,
    description: 'A towering peak of earth and stone',
    category: 'nature',
    discovered: false,
    rarity: 'uncommon'
  },
  wind: {
    id: 'wind',
    name: 'Wind',
    emoji: '💨',
    color: 0x90A4AE,
    description: 'Moving air with great force',
    category: 'nature',
    discovered: false,
    rarity: 'common'
  }
}; 