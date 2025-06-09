#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Compiler for elements.tsv
 * Converts readable string IDs to optimized hex IDs for production use
 */

const TSV_PATH = path.join(__dirname, '../src/config/elements.tsv');
const OUTPUT_PATH = path.join(__dirname, '../src/config/elements-compiled.json');

function compileElements() {
  console.log('🔄 Compiling elements.tsv...');
  
  try {
    // Read the TSV file
    const tsvContent = fs.readFileSync(TSV_PATH, 'utf8');
    const lines = tsvContent.split('\n');
    
    const elements = [];
    const idMapping = new Map(); // string ID -> hex ID
    let hexCounter = 0;
    
    let isHeaderFound = false;
    
    // First pass: collect all elements and assign hex IDs
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
      if (columns.length >= 3) {
        const stringId = columns[0];
        const name = columns[1];
        const emoji = columns[2];
        const recipe = columns[3] || '';
        
        // Assign hex ID
        const hexId = hexCounter.toString(16).toUpperCase();
        idMapping.set(stringId, hexId);
        
        elements.push({
          stringId,
          hexId,
          name,
          emoji,
          recipe
        });
        
        hexCounter++;
      }
    }
    
    console.log(`📊 Found ${elements.length} elements`);
    
    // Second pass: convert recipes to use hex IDs
    const compiledElements = [];
    const recipes = [];
    
    for (const element of elements) {
      const compiledElement = {
        id: element.hexId,
        name: element.name,
        emoji: element.emoji,
        discovered: !element.recipe // Base elements are discovered by default
      };
      
      compiledElements.push(compiledElement);
      
      // Convert recipe if it exists
      if (element.recipe && element.recipe.includes('+')) {
        const [input1, input2] = element.recipe.split('+');
        const hexInput1 = idMapping.get(input1.trim());
        const hexInput2 = idMapping.get(input2.trim());
        
        if (hexInput1 && hexInput2) {
          recipes.push({
            inputs: [hexInput1, hexInput2],
            output: element.hexId
          });
        } else {
          console.warn(`⚠️  Warning: Could not find hex ID for recipe: ${element.recipe} (element: ${element.stringId})`);
        }
      }
    }
    
    // Create the compiled format
    const compiled = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      elements: compiledElements,
      recipes: recipes,
      // Include mapping for debugging (can be removed in production)
      idMapping: Object.fromEntries(idMapping)
    };
    
    // Write compiled file
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(compiled, null, 2));
    
    console.log(`✅ Compilation complete!`);
    console.log(`📁 Output: ${OUTPUT_PATH}`);
    console.log(`📊 ${compiledElements.length} elements, ${recipes.length} recipes`);
    console.log(`💾 Storage optimization: ${calculateStorageReduction(idMapping)}`);
    
    // Generate some example mappings for reference
    console.log('\n🔍 Sample ID mappings:');
    const sampleElements = ['water', 'fire', 'earth', 'air', 'steam'].filter(id => idMapping.has(id));
    for (const id of sampleElements) {
      console.log(`   ${id} -> ${idMapping.get(id)}`);
    }
    
  } catch (error) {
    console.error('❌ Compilation failed:', error.message);
    process.exit(1);
  }
}

function calculateStorageReduction(idMapping) {
  let originalSize = 0;
  let optimizedSize = 0;
  
  for (const [stringId, hexId] of idMapping) {
    originalSize += stringId.length;
    optimizedSize += hexId.length;
  }
  
  const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
  return `${reduction}% reduction (${originalSize} -> ${optimizedSize} chars)`;
}

// Run the compiler
compileElements(); 