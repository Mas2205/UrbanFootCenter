const fs = require('fs');
const path = require('path');

// Chemin vers le fichier de traduction
const translationFilePath = path.resolve(__dirname, '../locales/fr/translation.json');

// Nouvelles traductions à ajouter
const newTranslations = {
  // Filtres
  'admin.reservations.filters.start': 'Date de début',
  'admin.reservations.filters.end': 'Date de fin',
  'admin.reservations.filters.status': 'Statut',
  'admin.reservations.filters.field': 'Terrain',
  'admin.reservations.filters.client': 'Client',
  
  // En-têtes de colonnes
  'admin.reservations.payment': 'Paiement',
  'admin.reservations.paymentStatus': 'Statut de paiement',
  'admin.reservations.actions': 'Actions',
  
  // Messages d'erreur et états
  'admin.reservations.fetchError': 'Erreur lors du chargement des réservations',
  'admin.reservations.loading': 'Chargement des réservations...',
  'admin.reservations.noReservations': 'Aucune réservation trouvée',
  
  // Statuts possibles
  'admin.reservations.status.pending': 'En attente',
  'admin.reservations.status.confirmed': 'Confirmée',
  'admin.reservations.status.cancelled': 'Annulée',
  'admin.reservations.status.completed': 'Terminée',
  
  // Statuts de paiement possibles
  'admin.reservations.paymentStatus.pending': 'En attente',
  'admin.reservations.paymentStatus.paid': 'Payé',
  'admin.reservations.paymentStatus.refunded': 'Remboursé',
  'admin.reservations.paymentStatus.failed': 'Échoué'
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
    
    // Ajouter les nouvelles traductions
    let addedCount = 0;
    Object.keys(newTranslations).forEach(key => {
      if (!translationData[key]) {
        translationData[key] = newTranslations[key];
        addedCount++;
        console.log(`Ajout de la clé "${key}": "${newTranslations[key]}"`);
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
        console.log(`Fichier de traduction mis à jour avec succès! ${addedCount} clés ajoutées.`);
      }
    );
  } catch (parseError) {
    console.error('Erreur lors du parsing du fichier JSON:', parseError);
  }
});
