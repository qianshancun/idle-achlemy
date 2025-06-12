#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Configuration Compiler for Idle Alchemy Game
 * 
 * This script compiles TSV source files into production-ready JSON files:
 * - Reads language-specific TSV files (elements.en.tsv, elements.es.tsv)
 * - Reads recipes.tsv for element combinations
 * - Converts string IDs to hex values
 * - Generates compiled game configuration and i18n translation files
 */

console.log('🔧 Starting unified configuration compilation...');

// Configuration
const CONFIG_DIR = path.join(__dirname);
const OUTPUT_DIR = path.join(__dirname, '../../public');
const LANGUAGES = ['en', 'es'];

// Base elements get fixed hex IDs
const BASE_ELEMENTS = {
  'water': '0',
  'fire': '1', 
  'earth': '2',
  'air': '3'
};

// Generate hex ID for non-base elements
function generateHexId(elementId) {
  if (BASE_ELEMENTS[elementId]) {
    return BASE_ELEMENTS[elementId];
  }
  
  // Generate hash and take first 3 characters, offset by 4 to avoid base element IDs
  const hash = crypto.createHash('md5').update(elementId).digest('hex');
  const hexValue = parseInt(hash.substring(0, 3), 16) + 4;
  return hexValue.toString(16).toUpperCase();
}

// Parse TSV file
function parseTSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  if (lines.length === 0) {
    throw new Error(`No data found in ${filePath}`);
  }
  
  const headers = lines[0].split('\t');
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    if (values.length >= headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] ? values[index].trim() : '';
      });
      data.push(row);
    }
  }
  
  return data;
}

// Load and process all language files
console.log('📚 Loading unified source files...');
const languageData = {};
const allElementIds = new Set();

for (const lang of LANGUAGES) {
  const filePath = path.join(CONFIG_DIR, `elements.${lang}.tsv`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing language file: ${filePath}`);
  }
  
  const data = parseTSV(filePath);
  languageData[lang] = data;
  
  // Collect all element IDs
  data.forEach(row => {
    if (row.id) {
      allElementIds.add(row.id);
    }
  });
  
  console.log(`✓ Loaded ${data.length} elements for ${lang === 'en' ? 'English' : 'Español'}`);
}

console.log('⚙️  Generating compiled data...');

// Generate hex IDs for all elements
const idMapping = {};
const hexToOriginal = {};
allElementIds.forEach(id => {
  const hexId = generateHexId(id);
  idMapping[id] = hexId;
  hexToOriginal[hexId] = id;
});

// Build elements and recipes data
const elements = {};
const recipes = [];
const translations = {};

// Initialize translations for each language
LANGUAGES.forEach(lang => {
  translations[lang] = {
    ui: {
      buttons: {
        autoArrange: lang === 'es' ? 'Organizar Automáticamente' : 'Auto Arrange',
        removeDuplicate: lang === 'es' ? 'Eliminar Duplicados' : 'Remove Duplicate',
        clear: lang === 'es' ? 'Limpiar' : 'Clear',
        reset: lang === 'es' ? 'Reiniciar' : 'Reset',
        close: lang === 'es' ? 'Cerrar' : 'Close'
      },
      titles: {
        discovered: lang === 'es' ? 'Descubiertos ({{count}})' : 'Discovered ({{count}})',
        canvas: lang === 'es' ? 'Lienzo ({{count}})' : 'Canvas ({{count}})',
        help: lang === 'es' ? 'Ayuda' : 'Help',
        howToPlay: lang === 'es' ? 'Cómo Jugar' : 'How to Play',
        elements: lang === 'es' ? 'Elementos' : 'Elements'
      },
      messages: {
        discovered: lang === 'es' ? '¡Descubierto {{element}}!' : 'Discovered {{element}}!',
        duplicate: lang === 'es' ? 'Ya tienes este elemento' : 'You already have this element',
        cannotCombine: lang === 'es' ? 'No se pueden combinar estos elementos' : 'Cannot combine these elements',
        cleared: lang === 'es' ? 'Lienzo limpiado' : 'Canvas cleared',
        reset: lang === 'es' ? 'Juego reiniciado' : 'Game reset',
        elementsArranged: lang === 'es' ? '¡Elementos organizados!' : 'Elements arranged!',
        noDuplicatesFound: lang === 'es' ? '¡No se encontraron duplicados!' : 'No duplicates found!',
        removedDuplicates: lang === 'es' ? '¡Eliminados {{count}} duplicado{{s}}!' : 'Removed {{count}} duplicate{{s}}!',
        canvasCleared: lang === 'es' ? '¡Lienzo limpiado!' : 'Canvas cleared!',
        gameReset: lang === 'es' ? '¡Juego reiniciado!' : 'Game reset!',
        added: lang === 'es' ? '¡Agregado {{element}}!' : 'Added {{element}}!',
        keepExperimenting: lang === 'es' ? '¡Sigue experimentando!' : 'Keep experimenting!'
      },
      instructions: {
        step1: lang === 'es' ? 'Arrastra elementos desde el panel de descubrimientos' : 'Drag elements from the discovery panel',
        step2: lang === 'es' ? 'Combina dos elementos arrastrando uno sobre otro' : 'Combine two elements by dragging one onto another',
        step3: lang === 'es' ? 'Descubre nuevos elementos experimentando' : 'Discover new elements by experimenting',
        step4: lang === 'es' ? 'Usa los botones para organizar y limpiar' : 'Use buttons to arrange and clean up',
        step5: lang === 'es' ? 'Haz clic en el botón de ayuda para más información' : 'Click the help button for more information'
      },
      confirmations: {
        clear: lang === 'es' ? '¿Limpiar todos los elementos del lienzo?' : 'Clear all elements from canvas?',
        reset: lang === 'es' ? '¿Reiniciar el juego y perder todo el progreso?' : 'Reset game and lose all progress?',
        clearCanvas: {
          title: lang === 'es' ? 'Limpiar Lienzo' : 'Clear Canvas',
          message: lang === 'es' ? '¿Estás seguro de que quieres limpiar todos los elementos del lienzo?' : 'Are you sure you want to clear all elements from the canvas?',
          confirm: lang === 'es' ? 'Limpiar' : 'Clear',
          cancel: lang === 'es' ? 'Cancelar' : 'Cancel'
        },
        resetGame: {
          title: lang === 'es' ? 'Reiniciar Juego' : 'Reset Game',
          message: lang === 'es' ? '¿Estás seguro de que quieres reiniciar el juego? Se perderá todo el progreso.' : 'Are you sure you want to reset the game? All progress will be lost.',
          confirm: lang === 'es' ? 'Reiniciar' : 'Reset',
          cancel: lang === 'es' ? 'Cancelar' : 'Cancel'
        }
      },
      languageSelector: {
        label: lang === 'es' ? 'Idioma' : 'Language'
      },
      dragToCanvas: lang === 'es' ? 'Arrastra al lienzo' : 'Drag to canvas'
    },
    hints: {
      tryCombing: lang === 'es' ? 'Intenta combinar {{element1}} con {{element2}}' : 'Try combining {{element1}} with {{element2}}'
    }
  };
});

// Process each language to build elements and extract recipes
const processedRecipes = new Map(); // Track recipe inputs -> outputs for duplicate detection

languageData['en'].forEach(row => {
  const hexId = idMapping[row.id];
  
  // Build element definition
  if (!elements[hexId]) {
    elements[hexId] = {
      id: hexId,
      originalId: row.id,
      emoji: row.emoji,
      names: {},
      rarity: determineRarity(hexId),
      category: determineCategory(hexId)
    };
  }
  
  // Add names for all languages
  LANGUAGES.forEach(lang => {
    const langData = languageData[lang].find(item => item.id === row.id);
    if (langData) {
      elements[hexId].names[lang] = langData.name;
    }
  });
  
  // Process recipe if it has parents
  if (row.parents && row.parents.trim()) {
    const parents = row.parents.split('+').map(p => p.trim());
    if (parents.length === 2) {
      const input1 = idMapping[parents[0]];
      const input2 = idMapping[parents[1]];
      
      if (input1 && input2) {
        const recipeKey = [input1, input2].sort().join('+');
        
        // Check for duplicate recipes (same inputs, different outputs)
        if (processedRecipes.has(recipeKey)) {
          const existingOutput = processedRecipes.get(recipeKey);
          const existingElement = Object.values(elements).find(e => e.id === existingOutput);
          console.error(`❌ DUPLICATE RECIPE ERROR: ${row.parents} produces both "${existingElement?.originalId}" and "${row.id}"`);
          console.error(`   This will cause unpredictable behavior in the game!`);
          console.error(`   Please fix by using different ingredient combinations.`);
        } else {
          recipes.push({
            inputs: [input1, input2],
            output: hexId
          });
          processedRecipes.set(recipeKey, hexId);
        }
      } else {
        console.warn(`Warning: Recipe for ${row.id} contains unknown elements: ${row.parents}`);
      }
    }
  }
});

// Determine rarity based on hex ID ranges
function determineRarity(hexId) {
  const numericId = parseInt(hexId, 16);
  if (numericId < 4) return 'basic';
  if (numericId < 50) return 'common';
  if (numericId < 200) return 'uncommon';
  if (numericId < 500) return 'rare';
  return 'legendary';
}

// Determine category based on hex ID ranges  
function determineCategory(hexId) {
  const numericId = parseInt(hexId, 16);
  if (numericId < 4) return 'basic';
  if (numericId < 20) return 'nature';
  if (numericId < 50) return 'science';
  if (numericId < 100) return 'life';
  if (numericId < 200) return 'civilization';
  if (numericId < 300) return 'technology';
  if (numericId < 400) return 'magic';
  return 'abstract';
}

console.log(`✓ Generated ${Object.keys(elements).length} elements with hex IDs`);
console.log(`✓ Generated translations for ${LANGUAGES.length} languages`);
console.log(`✓ Generated ${recipes.length} recipes`);

// Save compiled files
console.log('💾 Saving compiled files...');

// Save main elements file
const compiledData = {
  elements,
  recipes,
  metadata: {
    version: '2.0.0',
    compiledAt: new Date().toISOString(),
    totalElements: Object.keys(elements).length,
    totalRecipes: recipes.length,
    languages: LANGUAGES
  }
};

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'elements-compiled.json'),
  JSON.stringify(compiledData, null, 2)
);
console.log('✓ Saved elements-compiled.json');

// Save translation files
LANGUAGES.forEach(lang => {
  const langName = lang === 'en' ? 'English' : 'Español';
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'locales', `${lang}.json`),
    JSON.stringify(translations[lang], null, 2)
  );
  console.log(`✓ Saved ${lang}.json`);
});

// Save ID mapping for debugging
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'id-mapping.json'),
  JSON.stringify({ originalToHex: idMapping, hexToOriginal }, null, 2)
);
console.log('✓ Saved id-mapping.json');

console.log('🎉 Unified compilation completed successfully!');
console.log('📊 Summary:');
console.log(`   • ${Object.keys(elements).length} elements compiled`);
console.log(`   • ${LANGUAGES.length} languages supported`);
console.log(`   • ${recipes.length} recipes processed`);
console.log(`   • Files saved to: ${OUTPUT_DIR}`);

// The compilation runs immediately when the script is executed
// No need for additional function calls since the code above already runs 