# Idle Alchemy Configuration System

This directory contains the unified configuration system for Idle Alchemy. The new design uses a single TSV file per language that contains everything: elements, names, emojis, and recipes.

## 🎯 Design Philosophy

**Single Source of Truth**: Each language has one TSV file containing all elements and their recipes. No more scattered files!

**Easy Maintenance**: To add a new element or recipe, you only need to edit the TSV file. To add i18n support, you only need to translate the name column.

**Automatic Compilation**: The system compiles TSV files into optimized JSON with hex IDs for efficient storage and loading.

## 📁 File Structure

```
src/config/
├── elements.en.tsv          # English elements with recipes
├── elements.es.tsv          # Spanish elements with recipes  
├── elements.template.tsv    # Template for new languages
├── compile-config.js        # Unified compiler
├── ConfigLoader.ts          # Game configuration loader
└── README.md               # This file

public/
├── elements-compiled.json   # Compiled game data (auto-generated)
├── locales/
│   ├── en.json             # English UI translations (auto-generated)
│   └── es.json             # Spanish UI translations (auto-generated)
└── id-mapping.json         # Debug mapping (auto-generated)
```

## 📝 TSV File Format

Each language file follows this unified format:

```tsv
id	name	emoji	parents
water	Water	💧	
fire	Fire	🔥	
earth	Earth	🌍	
air	Air	🌬️	
steam	Steam	💨	water+fire
mud	Mud	🟫	water+earth
lava	Lava	🌋	fire+earth
```

### Columns:
- **id**: Unique element identifier (same across all languages)
- **name**: Translated element name (only column that changes per language)
- **emoji**: Element emoji (same across all languages)
- **parents**: Recipe definition (empty for base elements, "element1+element2" for crafted elements)

## 🔧 Adding New Elements

1. **Add to English file** (`elements.en.tsv`):
   ```tsv
   new_element	New Element	🆕	parent1+parent2
   ```

2. **Add to all other language files** with translated names:
   ```tsv
   new_element	Nuevo Elemento	🆕	parent1+parent2
   ```

3. **Compile**: Run `npm run compile` to generate the compiled files

## 🌍 Adding New Languages

1. **Copy template**: `cp elements.template.tsv elements.{lang}.tsv`
2. **Translate names**: Only change the `name` column, keep everything else identical
3. **Update compiler**: Add the new language code to `LANGUAGES` array in `compile-config.js`
4. **Compile**: Run `npm run compile`

## ⚙️ Compilation Process

The compiler (`compile-config.js`) processes the TSV files and generates:

### 1. Hex ID Generation
- Base elements (water, fire, earth, air) get fixed IDs: 0, 1, 2, 3
- Other elements get hash-generated hex IDs for efficient storage

### 2. Element Processing
- Extracts element definitions with names for all languages
- Assigns categories and rarities based on hex ID ranges
- Preserves emojis (same across languages)

### 3. Recipe Extraction
- Parses `parents` column to generate recipe definitions
- Converts string IDs to hex IDs
- Validates that all recipe ingredients exist

### 4. Output Generation
- `elements-compiled.json`: Complete game configuration
- `locales/{lang}.json`: UI translations for each language
- `id-mapping.json`: Debug mapping between string and hex IDs

## 🚀 Usage

### Development
```bash
# Compile configuration after changes
npm run compile

# Run development server
npm run dev
```

### Production
```bash
# Build includes compilation
npm run build
```

## 🎮 Game Integration

The game loads compiled configuration via `ConfigLoader.ts`:

```typescript
import { configLoader } from '@/config/ConfigLoader';

// Initialize (loads compiled JSON)
await configLoader.initialize();

// Get elements
const elements = configLoader.getElements();

// Find recipes
const recipe = configLoader.findRecipe('0', '1'); // water + fire = steam
```

## 🔍 Debugging

- **ID Mapping**: Check `public/id-mapping.json` to see string ↔ hex ID mappings
- **Compiled Data**: Inspect `public/elements-compiled.json` for the full compiled structure
- **Console Logs**: The compiler provides detailed logging during the build process

## 📊 Benefits of New Design

### For Game Designers
- ✅ **Single file per language** - everything in one place
- ✅ **Simple TSV format** - edit in any spreadsheet program
- ✅ **Recipe definition inline** - no separate recipe files
- ✅ **Easy to add elements** - just add a row

### For Translators
- ✅ **Only translate names** - emojis and recipes stay the same
- ✅ **Clear template** - copy and translate
- ✅ **No technical knowledge needed** - just edit the name column

### For Developers
- ✅ **Automatic compilation** - no manual JSON editing
- ✅ **Hex ID optimization** - efficient storage and lookup
- ✅ **Type safety** - TypeScript interfaces for all data
- ✅ **Hot reload** - changes reflect immediately in development

### For Maintenance
- ✅ **Version control friendly** - TSV files diff cleanly
- ✅ **No scattered files** - everything organized
- ✅ **Consistent structure** - same format across languages
- ✅ **Validation** - compiler catches errors early 