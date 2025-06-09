# 🌍 Internationalization (i18n) Guide

## Overview

Idle Alchemy now supports multiple languages through a comprehensive i18n system. The architecture is designed for easy translation management and extensibility.

## 🏗️ Architecture

### Core Components

1. **Translation Service** (`src/i18n/Translation.ts`)
   - Central translation management
   - Language detection and switching
   - Fallback handling
   - Interpolation support

2. **Language Files** (`src/i18n/locales/`)
   - JSON-based translation files
   - Nested key structure
   - Element name translations

3. **UI Integration**
   - Dynamic content updates
   - Language selector component
   - Real-time language switching

## 📁 File Structure

```
src/i18n/
├── Translation.ts          # Main translation service
└── locales/
    ├── en.json            # English (default)
    ├── es.json            # Spanish
    ├── fr.json            # French (placeholder)
    ├── de.json            # German (placeholder)
    ├── zh.json            # Chinese (placeholder)
    └── ja.json            # Japanese (placeholder)
```

## 🔧 Usage

### Basic Translation

```typescript
import { t } from '@/i18n/Translation';

// Simple translation
const buttonText = t('ui.buttons.clear');

// With interpolation
const message = t('ui.messages.removedDuplicates', { 
  count: 3, 
  s: 's' 
});
```

### Element Names

```typescript
import { i18n } from '@/i18n/Translation';

// Get translated element name with fallback
const elementName = i18n.getElementName('0', 'Water');

// Get discovery message
const discoveryMsg = i18n.getDiscoveryMessage('4', 'Steam');
```

### Language Management

```typescript
import { i18n } from '@/i18n/Translation';

// Change language
await i18n.setLanguage('es');

// Get current language
const currentLang = i18n.getCurrentLanguage();

// Get supported languages
const languages = i18n.getSupportedLanguages();
```

## 📝 Translation Keys Structure

### UI Translations

```json
{
  "ui": {
    "buttons": {
      "autoArrange": "Auto Arrange",
      "removeDuplicate": "Remove Duplicate",
      "clear": "Clear",
      "reset": "Reset",
      "close": "✕"
    },
    "titles": {
      "elements": "🧪 Elements ({{count}})",
      "howToPlay": "🎯 How to Play:"
    },
    "messages": {
      "elementsArranged": "Elements arranged!",
      "noDuplicatesFound": "No duplicates found!",
      "removedDuplicates": "Removed {{count}} duplicate{{s}}!",
      "canvasCleared": "Canvas cleared!",
      "gameReset": "Game reset!",
      "added": "Added {{element}}!",
      "discovered": "{{element}} discovered!",
      "keepExperimenting": "Keep experimenting with your discovered elements!"
    },
    "confirmations": {
      "clearCanvas": {
        "title": "🧹 Clear Canvas",
        "message": "This will remove all elements from the canvas...",
        "confirm": "Clear",
        "cancel": "Cancel"
      }
    },
    "instructions": {
      "step1": "1. Click or drag elements from the discovery panel to the canvas",
      "step2": "2. Drag canvas elements onto each other to merge",
      "step3": "3. Double-tap canvas elements to duplicate them",
      "step4": "4. Drag empty space to pan around the unlimited canvas",
      "step5": "5. Discover new elements by experimenting!"
    }
  }
}
```

### Element Translations

```json
{
  "elements": {
    "names": {
      "0": "Water",
      "1": "Fire",
      "2": "Earth",
      "3": "Air",
      "4": "Steam",
      // ... more elements
    }
  }
}
```

## 🌐 Supported Languages

| Code | Language | Native Name | Status |
|------|----------|-------------|---------|
| `en` | English | English | ✅ Complete |
| `es` | Spanish | Español | ✅ Complete |
| `fr` | French | Français | 🚧 Placeholder |
| `de` | German | Deutsch | 🚧 Placeholder |
| `zh` | Chinese | 中文 | 🚧 Placeholder |
| `ja` | Japanese | 日本語 | 🚧 Placeholder |

## 🔄 Interpolation

The system supports variable interpolation using `{{variable}}` syntax:

```typescript
// Translation file
{
  "ui": {
    "messages": {
      "removedDuplicates": "Removed {{count}} duplicate{{s}}!"
    }
  }
}

// Usage
t('ui.messages.removedDuplicates', { count: 3, s: 's' });
// Result: "Removed 3 duplicates!"
```

## 🎯 Features

### Language Detection
- Automatic browser language detection
- Fallback to English if unsupported
- Persistent language preference

### Fallback System
- Primary language → English → Key path
- Graceful degradation
- No broken UI if translations missing

### Real-time Switching
- Instant UI updates
- No page reload required
- Maintains game state

### Element Integration
- Translated element names
- Discovery messages
- Hint system

## 🛠️ Adding New Languages

1. **Create Language File**
   ```bash
   cp src/i18n/locales/en.json src/i18n/locales/[code].json
   ```

2. **Add to Supported Languages**
   ```typescript
   // src/i18n/Translation.ts
   export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
     // ... existing languages
     { code: 'pt', name: 'Portuguese', nativeName: 'Português' }
   ];
   ```

3. **Translate Content**
   - Update all UI strings
   - Translate element names
   - Test thoroughly

## 🧪 Testing

### Manual Testing
1. Switch languages using the language selector
2. Verify all UI elements update
3. Check element names in discovery panel
4. Test discovery messages
5. Verify confirmations and toasts

### Automated Testing
```typescript
// Example test
describe('i18n System', () => {
  it('should translate UI elements', async () => {
    await i18n.setLanguage('es');
    expect(t('ui.buttons.clear')).toBe('Limpiar');
  });
});
```

## 🚀 Performance

### Optimizations
- Lazy loading of language files
- Caching of translations
- Minimal bundle impact
- Efficient key lookup

### Bundle Size
- ~2KB per language file
- Shared translation service
- Tree-shaking friendly

## 🔮 Future Enhancements

### Planned Features
- [ ] RTL language support
- [ ] Pluralization rules
- [ ] Date/number formatting
- [ ] Context-aware translations
- [ ] Translation validation tools

### Community Contributions
- Translation crowdsourcing
- Community language packs
- Translation validation
- Automated translation updates

## 📚 Best Practices

### For Developers
1. Always use translation keys, never hardcoded strings
2. Keep keys descriptive and hierarchical
3. Use interpolation for dynamic content
4. Test with different languages
5. Handle missing translations gracefully

### For Translators
1. Maintain context and tone
2. Consider UI space constraints
3. Test translations in-game
4. Use appropriate cultural references
5. Keep element names consistent

## 🐛 Troubleshooting

### Common Issues

**Translation not showing:**
- Check key path spelling
- Verify language file exists
- Check browser console for errors

**Language not switching:**
- Ensure language code is supported
- Check network requests for language files
- Verify localStorage permissions

**Element names not translated:**
- Check element ID mapping
- Verify fallback name is provided
- Test with different elements

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('i18n-debug', 'true');
```

## 📖 API Reference

### Translation Service

#### `t(keyPath: string, variables?: Record<string, any>): string`
Get translated text with optional interpolation.

#### `i18n.setLanguage(langCode: string): Promise<void>`
Change current language.

#### `i18n.getCurrentLanguage(): string`
Get current language code.

#### `i18n.getElementName(elementId: string, fallback?: string): string`
Get translated element name with fallback.

#### `i18n.getDiscoveryMessage(elementId: string, fallback?: string): string`
Format discovery message for element.

---

*This i18n system makes Idle Alchemy accessible to players worldwide! 🌍* 