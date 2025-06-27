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
    // Load saved language preference
    const savedLanguage = localStorage.getItem('idle-alchemy-language');
    if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
      this.currentLanguage = savedLanguage;
    } else {
      // Try to detect browser language
      const browserLang = this.detectBrowserLanguage();
      if (browserLang && this.isLanguageSupported(browserLang)) {
        this.currentLanguage = browserLang;
      }
    }

    console.log(`🌍 Initializing i18n with language: ${this.currentLanguage}`);
    
    // Load translations for current language
    await this.loadLanguage(this.currentLanguage);
    
    // Load fallback language if different
    if (this.currentLanguage !== this.fallbackLanguage) {
      await this.loadLanguage(this.fallbackLanguage);
    }
  }

  private detectBrowserLanguage(): string | null {
    // Try to get language from browser
    const browserLang = navigator.language || (navigator as any).userLanguage;
    if (browserLang) {
      // Extract language code (e.g., 'en-US' -> 'en')
      return browserLang.split('-')[0].toLowerCase();
    }
    return null;
  }

  private isLanguageSupported(langCode: string): boolean {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === langCode);
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
      
      // If this is the fallback language, use basic fallbacks
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

  /**
   * Get translated text by key path (e.g., 'ui.buttons.clear')
   * Supports interpolation with {{variable}} syntax
   */
  t(keyPath: string, variables?: Record<string, any>): string {
    let translation = this.getTranslation(keyPath, this.currentLanguage);
    
    // Fall back to fallback language if not found
    if (!translation && this.currentLanguage !== this.fallbackLanguage) {
      translation = this.getTranslation(keyPath, this.fallbackLanguage);
    }
    
    // Final fallback to the key itself
    if (!translation) {
      console.warn(`🔍 Translation missing for key: ${keyPath}`);
      translation = keyPath;
    }
    
    // Handle interpolation
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

  /**
   * Change current language
   */
  async setLanguage(langCode: string): Promise<void> {
    if (!this.isLanguageSupported(langCode)) {
      throw new Error(`Unsupported language: ${langCode}`);
    }
    
    this.currentLanguage = langCode;
    localStorage.setItem('idle-alchemy-language', langCode);
    
    // Load language if not already loaded
    if (!this.translations.has(langCode)) {
      await this.loadLanguage(langCode);
    }
    
    // Emit language change event
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: langCode }
    }));
    
    console.log(`🌍 Language changed to: ${langCode}`);
  }

  /**
   * Get current language code
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Get current language config
   */
  getCurrentLanguageConfig(): LanguageConfig | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === this.currentLanguage);
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): LanguageConfig[] {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Special method for element names (with fallback to element ID)
   */
  getElementName(elementId: string, fallbackName?: string): string {
    const translatedName = this.t(`elements.names.${elementId}`);
    
    // If translation is just the key path, use fallback
    if (translatedName === `elements.names.${elementId}`) {
      return fallbackName || elementId;
    }
    
    return translatedName;
  }

  /**
   * Format discovery message for element
   */
  getDiscoveryMessage(elementId: string, fallbackName?: string): string {
    const elementName = this.getElementName(elementId, fallbackName);
    return this.t('ui.messages.discovered', { element: elementName });
  }
}

// Export singleton instance
export const i18n = new TranslationService();

// Helper function for components
export const t = (keyPath: string, variables?: Record<string, any>): string => {
  return i18n.t(keyPath, variables);
}; 