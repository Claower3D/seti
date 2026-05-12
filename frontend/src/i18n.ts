import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ru from './locales/ru.json';
import kk from './locales/kk.json';

// Get saved language or fallback to 'ru'
const savedLanguage = localStorage.getItem('appLanguage') || 'ru';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      kk: { translation: kk }
    },
    lng: savedLanguage,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false // React already escapes by default
    }
  });

export default i18n;
