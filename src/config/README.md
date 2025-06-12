# Configuration System Documentation

## Overview

The Idle Alchemy game uses a **per-language TSV-based configuration system** where each language has its own elements and recipes. This allows for localized gameplay experiences where different languages can have completely different recipe combinations.

## 🎯 **Key Features**

- **Per-language recipes**: English and Spanish can have different combinations
- **Single source of truth**: Only TSV files need to be maintained
- **Auto-compilation**: Generated files are never committed to git
- **Duplicate detection**: Compiler catches recipe conflicts automatically
- **Designer-friendly**: Simple spreadsheet-compatible format

## 📁 **File Structure**

```
src/config/
├── elements.en.tsv          # English elements with recipes
├── elements.es.tsv          # Spanish elements with recipes  
├── elements.template.tsv    # Template for new languages
├── compile-config.js        # Unified compiler
├── ConfigLoader.ts          # Game configuration loader
└── README.md               # This documentation

public/ (auto-generated, in .gitignore)
├── elements-compiled.json   # Compiled game data for all languages
├── id-mapping.json         # Debug mapping (per-language)
└── locales/
    ├── en.json             # UI translations
    └── es.json             # UI translations
```

## 🔧 **When to Run Compilation**

### **IMPORTANT: You MUST run compilation after ANY changes to TSV files!**

```bash
npm run compile
```

**Run this command whenever you:**
- ✅ Add new elements to any `.tsv` file
- ✅ Remove elements from any `.tsv` file  
- ✅ Change element names, emojis, or recipes
- ✅ Modify any TSV file content
- ✅ Create a new language file

**The game will NOT see your changes until you compile!**

### **Development Workflow:**
1. Edit `src/config/elements.en.tsv` or `src/config/elements.es.tsv`
2. Run `npm run compile` 
3. Run `npm run dev` to test your changes
4. Commit only the TSV files (generated files are in `.gitignore`)

## 📝 **TSV File Format**

Each language has its own TSV file with this format:

```tsv
# Language Elements with Recipes
# Format: TSV - id, name, emoji, parents (empty for base elements)
id	name	emoji	parents
water	Water	💧	
fire	Fire	🔥	
earth	Earth	🌍	
air	Air	🌬️	
steam	Steam	💨	water+fire
mud	Mud	🟫	water+earth
lava	Lava	🌋	fire+earth
```

### **Column Definitions:**
- **id**: Unique identifier (same across all languages)
- **name**: Localized element name
- **emoji**: Visual representation (same across languages)
- **parents**: Recipe ingredients separated by `+` (empty for base elements)

## 🌍 **Per-Language Recipes**

**Different languages can have completely different recipes!**

### English Example:
```tsv
water+air → cloud
air+air → wind
```

### Spanish Example:
```tsv
water+air → mist
air+air → pressure
```

This allows for localized gameplay experiences tailored to different cultures.

## ⚙️ **Compilation Process**

The `compile-config.js` script:

1. **Loads each language separately**
2. **Generates deterministic hex IDs** (base elements: 0,1,2,3)
3. **Extracts recipes from parents column**
4. **Detects duplicate recipe conflicts**
5. **Creates optimized JSON files**
6. **Generates UI translations**

### **Generated Files:**
- `public/elements-compiled.json` - Complete game data for all languages
- `public/id-mapping.json` - Debug hex ID mappings per language
- `public/locales/*.json` - UI translations only

## 🚨 **Error Detection**

The compiler automatically detects:

### **Duplicate Recipes:**
```
❌ DUPLICATE RECIPE ERROR in es: water+air produces both "cloud" and "mist"
   This will cause unpredictable behavior in the game!
   Please fix by using different ingredient combinations.
```

### **Missing Ingredients:**
```
Warning in es: Recipe for diamond contains unknown elements: carbon+pressure
```

## 🎮 **Game Integration**

### **ConfigLoader API:**
```typescript
// Load configuration
await configLoader.loadConfig();

// Set language (switches entire dataset)
configLoader.setLanguage('es');

// Get game data for current language
const config = configLoader.getGameConfig();

// Get specific element
const element = configLoader.getElementById('762'); // steam

// Find recipe
const recipe = configLoader.getRecipeByInputs('0', '1'); // water + fire
```

### **Language Switching:**
When the user changes language, the entire element and recipe dataset switches. This means:
- Element names change to the new language
- Available recipes change to the new language's combinations
- Game progress is maintained using hex IDs

## 📋 **Adding New Elements**

### **Step 1: Add to English**
Edit `src/config/elements.en.tsv`:
```tsv
volcano	Volcano	🌋	lava+earth
```

### **Step 2: Add to Spanish**
Edit `src/config/elements.es.tsv`:
```tsv
volcano	Volcán	🌋	lava+earth
```

### **Step 3: Compile**
```bash
npm run compile
```

### **Step 4: Test**
```bash
npm run dev
```

## 🌐 **Adding New Languages**

### **Step 1: Create Language File**
Copy `src/config/elements.template.tsv` to `src/config/elements.fr.tsv`

### **Step 2: Translate Names**
Translate only the `name` column, keep `id`, `emoji`, and `parents` identical (or modify recipes for localization)

### **Step 3: Update Compiler**
Add `'fr'` to the `LANGUAGES` array in `compile-config.js`

### **Step 4: Compile and Test**
```bash
npm run compile
npm run dev
```

## 🔍 **Debugging**

### **Check ID Mappings:**
Look at `public/id-mapping.json` to see hex ID assignments per language

### **Verify Compilation:**
```bash
npm run compile
```
Check for error messages and warnings

### **Test Language Switching:**
Use the in-game language selector to verify different datasets load correctly

## ⚠️ **Important Notes**

1. **Never edit generated files** in `public/` - they're overwritten on each compilation
2. **Always run `npm run compile`** after TSV changes
3. **Generated files are in `.gitignore** - don't commit them
4. **Base elements (water/fire/earth/air) must exist in all languages**
5. **Element IDs must be consistent across languages**
6. **Different recipes per language are encouraged for localization**

## 🎯 **Best Practices**

- Use descriptive element IDs (e.g., `steam_engine` not `se`)
- Keep emojis consistent across languages
- Test compilation after each change
- Use different recipes to create unique cultural experiences
- Document any complex recipe chains
- Validate that all recipe ingredients exist

---

## 🚀 **Quick Start**

1. Edit TSV files in `src/config/`
2. Run `npm run compile`
3. Run `npm run dev`
4. Test your changes
5. Commit only TSV files

**Remember: The game won't see your changes until you compile!** 