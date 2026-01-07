import { I18n } from 'i18n-js';
import en from './translations/en.json';
import fr from './translations/fr.json';
import ar from './translations/ar.json';

const i18n = new I18n();

// Set translations
i18n.translations = { en, fr, ar };

// Configuration
i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.enableFallback = true;

// Export the translation function
// We call i18n.t dynamically so it always uses the current instance state
export const t = (key, options) => {
    return i18n.t(key, options);
};

// Export locale management functions
export const setLocale = (locale) => {
    console.log(`Setting i18n locale to: ${locale}`);
    i18n.locale = locale;
};

export const getLocale = () => i18n.locale;

export default i18n;
