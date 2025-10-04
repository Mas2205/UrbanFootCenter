const fs = require('fs');
const path = require('path');

// Chemin vers le fichier de traduction française
const translationFilePath = path.resolve(__dirname, '../locales/fr/translation.json');

// Lire le contenu du fichier de traduction
fs.readFile(translationFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier de traduction:', err);
    return;
  }

  // Parser le JSON
  let translations;
  try {
    translations = JSON.parse(data);
  } catch (parseErr) {
    console.error('Erreur lors du parsing du fichier JSON:', parseErr);
    return;
  }

  // Définir les traductions communes manquantes
  const commonTranslations = {
    // Éléments communs pour tous les composants d'interface
    "common.refresh": "Actualiser",
    "common.clearFilters": "Effacer les filtres",
    
    // Traduction spécifique pour la barre de recherche des paiements
    "admin.payments.searchPlaceholder": "Rechercher un paiement..."
  };

  // Ajouter les traductions au fichier
  Object.entries(commonTranslations).forEach(([key, value]) => {
    translations[key] = value;
  });

  // Convertir en JSON bien formaté
  const updatedTranslations = JSON.stringify(translations, null, 2);

  // Écrire le fichier mis à jour
  fs.writeFile(translationFilePath, updatedTranslations, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Erreur lors de l\'écriture du fichier de traduction:', writeErr);
      return;
    }
    console.log('Fichier de traduction mis à jour avec succès!');
    console.log(`${Object.keys(commonTranslations).length} clés de traduction communes ont été ajoutées ou mises à jour`);
  });
});
