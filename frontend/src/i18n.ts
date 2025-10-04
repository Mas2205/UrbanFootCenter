import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationFR from './locales/fr/translation.json';

// Les ressources de traduction
const resources = {
  fr: {
    translation: translationFR
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'fr', // langue par défaut
    fallbackLng: 'fr', // langue de secours si la traduction n'existe pas
    debug: true, // Activer le debug pour voir les clés manquantes
    
    interpolation: {
      escapeValue: false // non nécessaire pour React
    },

    react: {
      useSuspense: false // Désactiver Suspense pour éviter les problèmes de cache
    },

    // Désactiver le cache pour forcer le rechargement
    cache: {
      enabled: false
    }
  });

export default i18n;
