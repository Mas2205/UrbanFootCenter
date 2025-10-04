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

  // Corriger l'accès aux données de réservation
  // Le backend envoie { success: true, count: X, data: [...] }
  // donc nous devons accéder à response.data.data au lieu de response.data
  const updatedData = data.replace(
    "const response = await reservationAPI.getAllReservations();\n      let filtered = response.data;",
    "const response = await reservationAPI.getAllReservations();\n      let filtered = response.data.data || [];"
  );

  // Si aucune modification n'a été faite, le problème est peut-être ailleurs
  if (data === updatedData) {
    console.log('Aucune occurrence du modèle à remplacer n\'a été trouvée. Le problème pourrait être ailleurs.');
    return;
  }

  // Écrire le fichier mis à jour
  fs.writeFile(filePath, updatedData, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Erreur lors de l\'écriture du fichier:', writeErr);
      return;
    }
    console.log('Le fichier AdminReservations.tsx a été mis à jour avec succès!');
    console.log('L\'accès aux données des réservations a été corrigé pour prendre en compte la structure de réponse API correcte.');
  });
});
