const fs = require('fs');
const path = require('path');

// Chemin vers le fichier de traduction
const translationFilePath = path.resolve(__dirname, '../locales/fr/translation.json');

// Nouvelles traductions à ajouter spécifiquement pour les filtres
const filterTranslations = {
  // Filtres de date
  'admin.reservations.filters.startDate': 'Date de début',
  'admin.reservations.filters.endDate': 'Date de fin',
  
  // Sélecteurs et options
  'admin.reservations.filters.allStatuses': 'Tous les statuts',
  'admin.reservations.filters.allFields': 'Tous les terrains',
  'admin.reservations.filters.selectStatus': 'Sélectionner un statut',
  'admin.reservations.filters.selectField': 'Sélectionner un terrain',
  
  // Labels des filtres
  'admin.reservations.filters.date': 'Date',
  'admin.reservations.filters.dateRange': 'Période',
  
  // Messages et états
  'admin.reservations.filters.from': 'Du',
  'admin.reservations.filters.to': 'Au',
  'admin.reservations.filters.apply': 'Appliquer',
  'admin.reservations.filters.reset': 'Réinitialiser',
  'admin.reservations.filters.noResults': 'Aucun résultat ne correspond aux critères'
};

// Lire le fichier de traduction actuel
fs.readFile(translationFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier de traduction:', err);
    return;
  }

  try {
    // Parser le JSON
    const translationData = JSON.parse(data);
    
    // Ajouter les nouvelles traductions de filtres
    let addedCount = 0;
    Object.keys(filterTranslations).forEach(key => {
      if (!translationData[key]) {
        translationData[key] = filterTranslations[key];
        addedCount++;
        console.log(`Ajout de la clé "${key}": "${filterTranslations[key]}"`);
      } else {
        console.log(`La clé "${key}" existe déjà avec la valeur: "${translationData[key]}"`);
      }
    });
    
    // Écrire le fichier mis à jour
    fs.writeFile(
      translationFilePath,
      JSON.stringify(translationData, null, 2),
      'utf8',
      (writeErr) => {
        if (writeErr) {
          console.error('Erreur lors de l\'écriture du fichier de traduction:', writeErr);
          return;
        }
        console.log(`Fichier de traduction mis à jour avec succès! ${addedCount} clés de filtres ajoutées.`);
      }
    );
  } catch (parseError) {
    console.error('Erreur lors du parsing du fichier JSON:', parseError);
  }
});
