import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import id from './locales/id.json' with { type: 'json' };
import en from './locales/en.json' with { type: 'json' };

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { id: { translation: id }, en: { translation: en } },
    fallbackLng: 'id',
    detection: {
      lookupLocalStorage: 'language',
      lookupQuerystring: 'lang',
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
