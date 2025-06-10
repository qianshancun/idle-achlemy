# Idle Alchemy Configuration System

This directory contains the TSV-based configuration system for the Idle Alchemy game. As a game designer, you only need to maintain the TSV files - everything else is generated automatically.

## 📁 Source Files (What you maintain)

### Language Files
- **`elements.en.tsv`** - English element names and emojis
- **`elements.es.tsv`** - Spanish element names and emojis
- *Add more language files as needed (elements.fr.tsv, elements.de.tsv, etc.)*

### Game Logic
- **`recipes.tsv`** - Element combination recipes (language-agnostic)

## 🔧 Generated Files (Automatic)

### Production Files
- **`public/elements-compiled.json`** - Complete game configuration with hex IDs
- **`public/locales/en.json`** - English UI and element translations
- **`public/locales/es.json`** - Spanish UI and element translations
- **`public/id-mapping.json`** - Debug mapping between string and hex IDs

## 📝 TSV File Formats

### Element Language Files (`elements.{lang}.tsv`)
```
id      name        emoji
water   Water       💧
fire    Fire        🔥
earth   Earth       🌍
```

### Recipes File (`recipes.tsv`)
```
id          recipe
water       
fire        
steam       water+fire
mud         earth+water
```

## 🚀 Compilation Process

### Automatic (during build)
```bash
npm run build  # Compiles TSV → JSON, then builds the game
```

### Manual
```bash
npm run compile  # Just compile TSV → JSON
```

## ✨ Features

- **Hex ID Generation**: String IDs are automatically converted to hex values for storage efficiency
- **Multi-language Support**: Add new languages by creating `elements.{lang}.tsv`
- **Fallback System**: Missing translations fall back to English
- **Base Elements**: First 4 elements (water, fire, earth, air) are automatically discovered
- **Category System**: Elements are automatically categorized based on their hex ID range
- **Rarity System**: Element rarity is determined by category

## 🎮 Adding New Content

### Adding a New Element
1. Add to all language files (`elements.en.tsv`, `elements.es.tsv`, etc.)
2. Add recipe to `recipes.tsv` (if not a base element)
3. Run `npm run compile`

### Adding a New Language
1. Create `elements.{lang}.tsv` with translated names
2. Add language code to `LANGUAGES` object in `compile-config.js`
3. Run `npm run compile`

### Modifying Recipes
1. Edit `recipes.tsv`
2. Run `npm run compile`

## 🐛 Debugging

- Check `public/id-mapping.json` for string → hex ID mappings
- Compilation warnings show missing recipe ingredients
- Console logs during game startup show configuration loading status

## 📊 Categories & Rarity

Elements are automatically categorized by hex ID range:
- **0-3**: Basic (Common) - water, fire, earth, air
- **4-49**: Nature (Uncommon) - plants, weather, natural phenomena
- **50-149**: Human (Rare) - civilization, technology, culture
- **150-249**: Abstract (Epic) - concepts, mythology, magic
- **250+**: Advanced (Legendary) - futuristic, complex combinations

## 🔄 Architecture Benefits

- **Single Source of Truth**: All content comes from TSV files
- **Version Control Friendly**: TSV files are easy to diff and merge
- **Designer Friendly**: No JSON editing, just simple tab-separated values
- **Build Integration**: Automatically compiles during production builds
- **Performance**: Hex IDs reduce bundle size and improve lookup speed
- **Maintainable**: Clear separation between source data and generated files

## ⚠️ Important Notes

- Never edit the generated JSON files directly - they're overwritten on each compilation
- Always run compilation after modifying TSV files
- Element IDs must be unique across all languages
- Recipe ingredients must reference existing element IDs
- Base elements (water, fire, earth, air) cannot have recipes 