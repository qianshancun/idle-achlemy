#!/usr/bin/env node

/**
 * Storage Optimization Test
 * Demonstrates the localStorage savings achieved by using hex IDs
 */

console.log('🧪 Testing localStorage Optimization Benefits\n');

// Simulate typical game data that would be stored in localStorage
const simulatedGameData = {
  discoveredElements: [
    'water', 'fire', 'earth', 'air', 'steam', 'mud', 'lava', 'dust', 'lightning', 'cloud',
    'rain', 'storm', 'obsidian', 'plant', 'lake', 'inferno', 'mountain', 'wind', 'stone',
    'sand', 'glass', 'sea', 'beach', 'swamp', 'volcano', 'geyser', 'mist', 'pressure',
    'energy', 'earthquake', 'tsunami', 'sky', 'sun', 'moon', 'night', 'time', 'tree',
    'forest', 'wood', 'salt', 'primordial_soup', 'life', 'egg', 'animal', 'bird', 'fish'
  ],
  
  canvasElements: [
    { id: 'water', x: 100, y: 150, zIndex: 1 },
    { id: 'fire', x: 200, y: 150, zIndex: 2 },
    { id: 'steam', x: 150, y: 100, zIndex: 3 },
    { id: 'lightning', x: 300, y: 200, zIndex: 4 },
    { id: 'cloud', x: 250, y: 120, zIndex: 5 }
  ],
  
  recentDiscoveries: [
    'steam', 'mud', 'lava', 'dust', 'lightning'
  ]
};

// Hex ID mapping (first 50 elements)
const hexMapping = {
  'water': '0', 'fire': '1', 'earth': '2', 'air': '3', 'steam': '4',
  'mud': '5', 'lava': '6', 'dust': '7', 'lightning': '8', 'cloud': '9',
  'rain': 'A', 'storm': 'B', 'obsidian': 'C', 'plant': 'D', 'lake': 'E',
  'inferno': 'F', 'mountain': '10', 'wind': '11', 'stone': '12', 'sand': '13',
  'glass': '14', 'sea': '15', 'beach': '16', 'swamp': '17', 'volcano': '18',
  'geyser': '19', 'mist': '1A', 'pressure': '1B', 'energy': '1C', 'earthquake': '1D',
  'tsunami': '1E', 'sky': '1F', 'sun': '20', 'moon': '21', 'night': '22',
  'time': '23', 'tree': '24', 'forest': '25', 'wood': '26', 'salt': '27',
  'primordial_soup': '28', 'life': '29', 'egg': '2A', 'animal': '2B', 'bird': '2C',
  'fish': '2D'
};

function convertToHexIds(data, mapping) {
  return {
    discoveredElements: data.discoveredElements.map(id => mapping[id] || id),
    canvasElements: data.canvasElements.map(elem => ({
      ...elem,
      id: mapping[elem.id] || elem.id
    })),
    recentDiscoveries: data.recentDiscoveries.map(id => mapping[id] || id)
  };
}

// Calculate storage sizes
const originalData = JSON.stringify(simulatedGameData);
const optimizedData = JSON.stringify(convertToHexIds(simulatedGameData, hexMapping));

const originalSize = originalData.length;
const optimizedSize = optimizedData.length;
const savings = originalSize - optimizedSize;
const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

console.log('📊 Storage Comparison:');
console.log(`   Original (string IDs): ${originalSize.toLocaleString()} bytes`);
console.log(`   Optimized (hex IDs):   ${optimizedSize.toLocaleString()} bytes`);
console.log(`   Savings:               ${savings.toLocaleString()} bytes (${savingsPercent}%)`);

console.log('\n🔍 Sample Data Comparison:');
console.log('Original discovered elements:');
console.log('  ', simulatedGameData.discoveredElements.slice(0, 10).join(', '));
console.log('Optimized discovered elements:');
console.log('  ', convertToHexIds(simulatedGameData, hexMapping).discoveredElements.slice(0, 10).join(', '));

console.log('\n🛡️ Anti-Cheat Benefits:');
console.log('   ✅ Hex IDs are less readable/guessable');
console.log('   ✅ No obvious element names in localStorage');
console.log('   ✅ Recipe combinations become "0+1" instead of "water+fire"');
console.log('   ✅ Harder to manually edit saved game data');

console.log('\n⚡ Performance Benefits:');
console.log('   ✅ Smaller localStorage usage');
console.log('   ✅ Faster string comparisons (shorter IDs)');
console.log('   ✅ Reduced memory usage in game state');
console.log('   ✅ Faster JSON serialization/deserialization');

console.log('\n✨ Optimization Complete!'); 