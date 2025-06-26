const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SUPPORTED_LANGUAGES = ['en', 'es'];
const DIST_DIR = 'dist';
const SRC_DIR = 'src';

console.log('🌍 Building multi-language versions...');

// Clean dist directory
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true });
}

// Build each language version
for (const lang of SUPPORTED_LANGUAGES) {
  console.log(`\n🔧 Building ${lang} version...`);
  
  const langDir = path.join(DIST_DIR, lang);
  fs.mkdirSync(langDir, { recursive: true });
  
  // Create a simple modified Translation.ts for this language
  const translationPath = path.join(SRC_DIR, 'i18n', 'Translation.ts');
  const originalContent = fs.readFileSync(translationPath, 'utf8');
  
  // Create a simpler modified version that just sets the language to the build language
  const modifiedContent = `// Build-time i18n for language: ${lang}
// Translation types
export interface TranslationData {
  [key: string]: string | TranslationData;
}

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
}

// Supported languages
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' }
];

class TranslationService {
  private currentLanguage: string = '${lang}';
  private translations: Map<string, TranslationData> = new Map();
  private fallbackLanguage: string = 'en';

  async initialize(): Promise<void> {
    console.log(\`🌍 Initializing i18n with build-time language: ${lang}\`);
    await this.loadLanguage('${lang}');
    
    if ('${lang}' !== this.fallbackLanguage) {
      await this.loadLanguage(this.fallbackLanguage);
    }
  }

  private async loadLanguage(langCode: string): Promise<void> {
    try {
      console.log(\`📚 Loading language: \${langCode}\`);
      const response = await fetch(\`/locales/\${langCode}.json\`);
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      
      const translations: TranslationData = await response.json();
      this.translations.set(langCode, translations);
      console.log(\`✅ Loaded \${langCode} translations\`);
    } catch (error) {
      console.error(\`❌ Failed to load language \${langCode}:\`, error);
      
      if (langCode === this.fallbackLanguage) {
        this.translations.set(langCode, this.getBasicFallbacks());
      }
    }
  }

  private getBasicFallbacks(): TranslationData {
    return {
      ui: {
        buttons: {
          autoArrange: 'Auto Arrange',
          removeDuplicate: 'Remove Duplicate',
          clear: 'Clear',
          reset: 'Reset'
        },
        messages: {
          elementsArranged: 'Elements arranged!',
          noDuplicatesFound: 'No duplicates found!',
          removedDuplicates: 'Removed {{count}} duplicate{{s}}!',
          canvasCleared: 'Canvas cleared!',
          gameReset: 'Game reset!'
        }
      },
      elements: {
        names: {}
      }
    };
  }

  t(keyPath: string, variables?: Record<string, any>): string {
    let translation = this.getTranslation(keyPath, this.currentLanguage);
    
    if (!translation && this.currentLanguage !== this.fallbackLanguage) {
      translation = this.getTranslation(keyPath, this.fallbackLanguage);
    }
    
    if (!translation) {
      console.warn(\`🔍 Translation missing for key: \${keyPath}\`);
      translation = keyPath;
    }
    
    if (variables && typeof translation === 'string') {
      translation = this.interpolate(translation, variables);
    }
    
    return translation as string;
  }

  private getTranslation(keyPath: string, langCode: string): string | null {
    const translations = this.translations.get(langCode);
    if (!translations) return null;
    
    const keys = keyPath.split('.');
    let current: any = translations;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    return typeof current === 'string' ? current : null;
  }

  private interpolate(text: string, variables: Record<string, any>): string {
    return text.replace(/\\{\\{(\\w+)\\}\\}/g, (match, key) => {
      if (key in variables) {
        return String(variables[key]);
      }
      return match;
    });
  }

  async setLanguage(langCode: string): Promise<void> {
    console.warn('Language switching disabled in production build');
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  getCurrentLanguageConfig(): LanguageConfig | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === this.currentLanguage);
  }

  getSupportedLanguages(): LanguageConfig[] {
    return SUPPORTED_LANGUAGES;
  }

  getElementName(elementId: string, fallbackName?: string): string {
    const translatedName = this.t(\`elements.names.\${elementId}\`);
    
    if (translatedName === \`elements.names.\${elementId}\`) {
      return fallbackName || elementId;
    }
    
    return translatedName;
  }

  getDiscoveryMessage(elementId: string, fallbackName?: string): string {
    const elementName = this.getElementName(elementId, fallbackName);
    return this.t('ui.messages.discovered', { element: elementName });
  }
}

export const i18n = new TranslationService();

export const t = (keyPath: string, variables?: Record<string, any>): string => {
  return i18n.t(keyPath, variables);
};`;
  
  // Write modified translation file
  const tempTranslationPath = path.join(SRC_DIR, 'i18n', `Translation.${lang}.ts`);
  fs.writeFileSync(tempTranslationPath, modifiedContent);
  
  // Temporarily rename original and use modified version
  const backupPath = path.join(SRC_DIR, 'i18n', 'Translation.original.ts');
  fs.renameSync(translationPath, backupPath);
  fs.renameSync(tempTranslationPath, translationPath);
  
  try {
    // Build with Vite
    execSync(`npx vite build --outDir ${langDir}`, { 
      stdio: 'inherit',
      env: { ...process.env, VITE_BUILD_LANG: lang }
    });
    
    console.log(`✅ Built ${lang} version successfully`);
  } catch (error) {
    console.error(`❌ Failed to build ${lang} version:`, error.message);
  } finally {
    // Restore original translation file
    fs.unlinkSync(translationPath);
    fs.renameSync(backupPath, translationPath);
  }
}

console.log('\n🎉 Multi-language build completed!');
console.log('📁 Output directories:');
for (const lang of SUPPORTED_LANGUAGES) {
  console.log(`   - dist/${lang}/index.html`);
} 