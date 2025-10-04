const fs = require('fs');
const path = require('path');

// Chemin vers le composant AdminReservations
const filePath = path.resolve(__dirname, '../components/admin/reservations/AdminReservations.tsx');

// Lire le contenu du fichier
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier:', err);
    return;
  }

  // Remplacer l'appel API incorrect par le bon
  const updatedData = data.replace(
    /reservationAPI\.getAllReservationsWithDetails\(\)/g, 
    'reservationAPI.getAllReservations()'
  );

  // Si aucune modification n'a été faite, le problème est peut-être ailleurs
  if (data === updatedData) {
    console.log('Aucune occurrence de "getAllReservationsWithDetails" n\'a été trouvée. Le problème pourrait être ailleurs.');
    return;
  }

  // Écrire le fichier mis à jour
  fs.writeFile(filePath, updatedData, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Erreur lors de l\'écriture du fichier:', writeErr);
      return;
    }
    console.log('Le fichier AdminReservations.tsx a été mis à jour avec succès!');
    console.log('L\'appel API incorrect "getAllReservationsWithDetails()" a été remplacé par "getAllReservations()".');
  });
});
