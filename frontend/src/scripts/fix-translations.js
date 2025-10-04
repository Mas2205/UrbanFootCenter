const fs = require('fs');
const path = require('path');

// Chemin vers le fichier de traduction
const translationFilePath = path.resolve(__dirname, '../locales/fr/translation.json');

// Lire le fichier de traduction actuel
fs.readFile(translationFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier de traduction:', err);
    return;
  }

  try {
    // Parser le JSON
    const translationData = JSON.parse(data);

    // Vérifier si l'objet admin existe
    if (!translationData.admin) {
      console.error('La section "admin" n\'existe pas dans le fichier de traduction');
      return;
    }

    // Remplacer la chaîne simple par un objet complet pour les réservations
    translationData.admin.reservations = {
      "title": "Gestion des Réservations",
      "filters": {
        "start": "Date de début",
        "end": "Date de fin",
        "status": "Statut",
        "field": "Terrain",
        "client": "Client"
      },
      "id": "ID Réservation",
      "client": "Client",
      "field": "Terrain",
      "date": "Date",
      "duration": "Durée",
      "price": "Prix",
      "status": "Statut",
      "noReservations": "Aucune réservation trouvée",
      "error": "Erreur de chargement des réservations"
    };

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
        console.log('Fichier de traduction mis à jour avec succès!');
      }
    );
  } catch (parseError) {
    console.error('Erreur lors du parsing du fichier JSON:', parseError);
  }
});
