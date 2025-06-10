#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Configuration Compiler for Idle Alchemy Game
 * 
 * This script compiles TSV source files into production-ready JSON files:
 * - Reads language-specific TSV files (elements.en.tsv, elements.es.tsv)
 * - Reads recipes.tsv for element combinations
 * - Converts string IDs to hex values
 * - Generates compiled game configuration and i18n translation files
 */

// Configuration
const SOURCE_DIR = path.join(__dirname);
const OUTPUT_DIR = path.join(__dirname, '../../public');
const LOCALES_DIR = path.join(OUTPUT_DIR, 'locales');

// Supported languages
const LANGUAGES = {
    en: 'English',
    es: 'Español'
};

/**
 * Parse TSV file into array of objects
 */
function parseTSV(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`TSV file not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    if (lines.length < 2) {
        throw new Error(`Invalid TSV file: ${filePath} - need at least header and one data row`);
    }
    
    const headers = lines[0].split('\t');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        if (values.length !== headers.length) {
            console.warn(`Warning: Row ${i + 1} in ${filePath} has ${values.length} columns, expected ${headers.length}`);
            continue;
        }
        
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        data.push(row);
    }
    
    return data;
}

/**
 * Convert string ID to hexadecimal value
 * Uses a simple hash function to generate consistent hex IDs
 * Base elements get special fixed IDs
 */
function stringToHex(str) {
    // Fixed IDs for base elements
    const baseElements = {
        'water': '0',
        'fire': '1', 
        'earth': '2',
        'air': '3'
    };
    
    if (baseElements[str]) {
        return baseElements[str];
    }
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive hex value (2-3 characters)
    // Skip 0-3 since they're reserved for base elements
    let hex = (Math.abs(hash) % 0xFFF) + 4;
    return hex.toString(16).toUpperCase();
}

/**
 * Load all language data from TSV files
 */
function loadLanguageData() {
    const languageData = {};
    
    for (const [langCode, langName] of Object.entries(LANGUAGES)) {
        const tsvPath = path.join(SOURCE_DIR, `elements.${langCode}.tsv`);
        try {
            const data = parseTSV(tsvPath);
            languageData[langCode] = data;
            console.log(`✓ Loaded ${data.length} elements for ${langName}`);
        } catch (error) {
            console.error(`✗ Failed to load ${langName} language file:`, error.message);
        }
    }
    
    return languageData;
}

/**
 * Load recipe data from TSV file
 */
function loadRecipeData() {
    const recipePath = path.join(SOURCE_DIR, 'recipes.tsv');
    try {
        const data = parseTSV(recipePath);
        console.log(`✓ Loaded ${data.length} recipes`);
        return data;
    } catch (error) {
        console.error('✗ Failed to load recipes:', error.message);
        return [];
    }
}

/**
 * Generate element definitions with hex IDs
 */
function generateElements(languageData, recipes) {
    const elements = {};
    const idToHex = {};
    
    // Use English as the master list for element IDs
    const masterElements = languageData.en || [];
    
    masterElements.forEach(element => {
        const hexId = stringToHex(element.id);
        idToHex[element.id] = hexId;
        
        elements[hexId] = {
            id: hexId,
            stringId: element.id,
            names: {},
            emojis: {},
            recipe: null
        };
        
        // Add names and emojis for all languages
        for (const [langCode, langElements] of Object.entries(languageData)) {
            const langElement = langElements.find(e => e.id === element.id);
            if (langElement) {
                elements[hexId].names[langCode] = langElement.name;
                elements[hexId].emojis[langCode] = langElement.emoji;
            }
        }
    });
    
    // Add recipes
    recipes.forEach(recipe => {
        const hexId = idToHex[recipe.id];
        if (hexId && elements[hexId]) {
            if (recipe.recipe && recipe.recipe.includes('+')) {
                const [id1, id2] = recipe.recipe.split('+');
                const hex1 = idToHex[id1];
                const hex2 = idToHex[id2];
                
                if (hex1 && hex2) {
                    elements[hexId].recipe = [hex1, hex2];
                } else {
                    console.warn(`Warning: Recipe for ${recipe.id} contains unknown elements: ${recipe.recipe}`);
                }
            }
        }
    });
    
    return { elements, idToHex };
}

/**
 * Generate i18n translation files
 */
function generateTranslations(elements, languageData) {
    const translations = {};
    
    for (const langCode of Object.keys(LANGUAGES)) {
              translations[langCode] = {
        ui: {
          buttons: {
            autoArrange: langCode === 'es' ? 'Auto Organizar' : 'Auto Arrange',
            removeDuplicate: langCode === 'es' ? 'Eliminar Duplicados' : 'Remove Duplicate',
            clear: langCode === 'es' ? 'Limpiar' : 'Clear',
            reset: langCode === 'es' ? 'Reiniciar' : 'Reset',
            close: langCode === 'es' ? 'Cerrar' : 'Close'
          },
          titles: {
            discovered: langCode === 'es' ? 'Descubierto ({{count}})' : 'Discovered ({{count}})',
            canvas: langCode === 'es' ? 'Lienzo ({{count}})' : 'Canvas ({{count}})',
            help: langCode === 'es' ? 'Ayuda' : 'Help',
            howToPlay: langCode === 'es' ? 'Cómo Jugar' : 'How to Play',
            elements: langCode === 'es' ? 'Elementos' : 'Elements'
          },
          messages: {
            discovered: langCode === 'es' ? '¡Descubierto {{element}}!' : 'Discovered {{element}}!',
            duplicate: langCode === 'es' ? 'Ya tienes este elemento' : 'You already have this element',
            cannotCombine: langCode === 'es' ? 'No se pueden combinar estos elementos' : 'Cannot combine these elements',
            cleared: langCode === 'es' ? 'Lienzo limpiado' : 'Canvas cleared',
            reset: langCode === 'es' ? 'Juego reiniciado' : 'Game reset',
            elementsArranged: langCode === 'es' ? '¡Elementos organizados!' : 'Elements arranged!',
            noDuplicatesFound: langCode === 'es' ? '¡No se encontraron duplicados!' : 'No duplicates found!',
            removedDuplicates: langCode === 'es' ? '¡Se eliminaron {{count}} duplicado{{s}}!' : 'Removed {{count}} duplicate{{s}}!',
            canvasCleared: langCode === 'es' ? '¡Lienzo limpiado!' : 'Canvas cleared!',
            gameReset: langCode === 'es' ? '¡Juego reiniciado!' : 'Game reset!',
            added: langCode === 'es' ? '¡Añadido {{element}}!' : 'Added {{element}}!',
            keepExperimenting: langCode === 'es' ? '¡Sigue experimentando!' : 'Keep experimenting!'
          },
          instructions: {
            step1: langCode === 'es' ? 'Arrastra elementos desde el panel de descubrimientos' : 'Drag elements from the discovery panel',
            step2: langCode === 'es' ? 'Combina dos elementos arrastrando uno sobre otro' : 'Combine two elements by dragging one onto another',
            step3: langCode === 'es' ? 'Descubre nuevos elementos experimentando' : 'Discover new elements by experimenting',
            step4: langCode === 'es' ? 'Usa los botones para organizar y limpiar' : 'Use buttons to arrange and clean up',
            step5: langCode === 'es' ? 'Haz clic en el botón de ayuda para obtener más información' : 'Click the help button for more information'
          },
          confirmations: {
            clear: langCode === 'es' ? '¿Limpiar todos los elementos del lienzo?' : 'Clear all elements from canvas?',
            reset: langCode === 'es' ? '¿Reiniciar el juego y perder todo el progreso?' : 'Reset game and lose all progress?',
            clearCanvas: {
              title: langCode === 'es' ? 'Limpiar Lienzo' : 'Clear Canvas',
              message: langCode === 'es' ? '¿Estás seguro de que quieres limpiar todos los elementos del lienzo?' : 'Are you sure you want to clear all elements from the canvas?',
              confirm: langCode === 'es' ? 'Limpiar' : 'Clear',
              cancel: langCode === 'es' ? 'Cancelar' : 'Cancel'
            },
            resetGame: {
              title: langCode === 'es' ? 'Reiniciar Juego' : 'Reset Game',
              message: langCode === 'es' ? '¿Estás seguro de que quieres reiniciar el juego? Se perderá todo el progreso.' : 'Are you sure you want to reset the game? All progress will be lost.',
              confirm: langCode === 'es' ? 'Reiniciar' : 'Reset',
              cancel: langCode === 'es' ? 'Cancelar' : 'Cancel'
            }
          },
          languageSelector: {
            label: langCode === 'es' ? 'Idioma' : 'Language'
          },
          dragToCanvas: langCode === 'es' ? 'Arrastra al lienzo' : 'Drag to canvas'
        },
        hints: {
          tryCombing: langCode === 'es' ? 'Intenta combinar {{element1}} con {{element2}}' : 'Try combining {{element1}} with {{element2}}'
        },
        elements: {
          names: {}
        }
      };
        
        // Add element names
        Object.values(elements).forEach(element => {
            if (element.names[langCode]) {
                translations[langCode].elements.names[element.id] = element.names[langCode];
            }
        });
    }
    
    return translations;
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Save JSON file with pretty formatting
 */
function saveJSON(filePath, data) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Main compilation function
 */
function compile() {
    console.log('🔧 Starting configuration compilation...\n');
    
    try {
        // Load source data
        console.log('📚 Loading source files...');
        const languageData = loadLanguageData();
        const recipes = loadRecipeData();
        
        if (Object.keys(languageData).length === 0) {
            throw new Error('No language files found');
        }
        
        // Generate compiled data
        console.log('\n⚙️  Generating compiled data...');
        const { elements, idToHex } = generateElements(languageData, recipes);
        const translations = generateTranslations(elements, languageData);
        
        console.log(`✓ Generated ${Object.keys(elements).length} elements with hex IDs`);
        console.log(`✓ Generated translations for ${Object.keys(translations).length} languages`);
        
        // Save compiled files
        console.log('\n💾 Saving compiled files...');
        
        // Save main game configuration
        const gameConfig = {
            elements,
            metadata: {
                version: '2.0',
                compiled: new Date().toISOString(),
                totalElements: Object.keys(elements).length,
                languages: Object.keys(LANGUAGES)
            }
        };
        
        saveJSON(path.join(OUTPUT_DIR, 'elements-compiled.json'), gameConfig);
        console.log('✓ Saved elements-compiled.json');
        
        // Save translation files
        for (const [langCode, translation] of Object.entries(translations)) {
            saveJSON(path.join(LOCALES_DIR, `${langCode}.json`), translation);
            console.log(`✓ Saved ${langCode}.json`);
        }
        
        // Save ID mapping for debugging
        saveJSON(path.join(OUTPUT_DIR, 'id-mapping.json'), {
            stringToHex: idToHex,
            hexToString: Object.fromEntries(Object.entries(idToHex).map(([str, hex]) => [hex, str]))
        });
        console.log('✓ Saved id-mapping.json');
        
        console.log('\n🎉 Compilation completed successfully!');
        console.log(`📊 Summary:`);
        console.log(`   • ${Object.keys(elements).length} elements compiled`);
        console.log(`   • ${Object.keys(LANGUAGES).length} languages supported`);
        console.log(`   • ${recipes.length} recipes processed`);
        console.log(`   • Files saved to: ${OUTPUT_DIR}`);
        
    } catch (error) {
        console.error('\n❌ Compilation failed:', error.message);
        process.exit(1);
    }
}

// Run compilation if called directly
if (require.main === module) {
    compile();
}

module.exports = { compile }; 