// Build-time i18n for language: en
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
  private currentLanguage: string = 'en';
  private translations: Map<string, TranslationData> = new Map();
  private fallbackLanguage: string = 'en';

  async initialize(): Promise<void> {
    console.log(`🌍 Initializing i18n with build-time language: en`);
    await this.loadLanguage('en');
    
    if ('en' !== this.fallbackLanguage) {
      await this.loadLanguage(this.fallbackLanguage);
    }
  }

  private async loadLanguage(langCode: string): Promise<void> {
    try {
      console.log(`📚 Loading language: ${langCode}`);
      const response = await fetch(`./locales/${langCode}.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const translations: TranslationData = await response.json();
      this.translations.set(langCode, translations);
      console.log(`✅ Loaded ${langCode} translations`);
    } catch (error) {
      console.error(`❌ Failed to load language ${langCode}:`, error);
      
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
      console.warn(`🔍 Translation missing for key: ${keyPath}`);
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
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (key in variables) {
        return String(variables[key]);
      }
      return match;
    });
  }

  async setLanguage(langCode: string): Promise<void> {
    console.warn(`Language switching disabled in production build (requested: ${langCode})`);
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
    const translatedName = this.t(`elements.names.${elementId}`);
    
    if (translatedName === `elements.names.${elementId}`) {
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
};