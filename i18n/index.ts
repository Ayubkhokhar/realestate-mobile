import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import ur from './locales/ur.json';
import ar from './locales/ar.json';
import he from './locales/he.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import it from './locales/it.json';
import tr from './locales/tr.json';
import ru from './locales/ru.json';

export const RTL_LANGUAGES = ['ur', 'ar', 'he'];

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', rtl: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', rtl: true },
  { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', rtl: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', rtl: false },
];

const deviceLang = getLocales()[0]?.languageCode ?? 'en';
const supported = SUPPORTED_LANGUAGES.map((l) => l.code);
const initialLang = supported.includes(deviceLang) ? deviceLang : 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ur: { translation: ur }, ar: { translation: ar }, he: { translation: he }, fr: { translation: fr }, es: { translation: es }, it: { translation: it }, tr: { translation: tr }, ru: { translation: ru } },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
