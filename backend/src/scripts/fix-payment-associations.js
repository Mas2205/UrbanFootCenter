const fs = require('fs');
const path = require('path');

// Chemin vers le fichier index.js des modèles
const indexFilePath = path.resolve(__dirname, '../models/index.js');

// Lire le contenu du fichier
fs.readFile(indexFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier:', err);
    return;
  }

  // Modifier les associations problématiques pour ajouter les alias corrects
  let updatedData = data;
  
  // Modifier la relation Reservation <-> Payment pour utiliser hasMany au lieu de hasOne
  // et ajouter l'alias 'payments' pour correspondre à ce qui est utilisé dans le contrôleur
  updatedData = updatedData.replace(
    "db.Reservation.hasOne(db.Payment, { foreignKey: 'reservation_id' });", 
    "db.Reservation.hasMany(db.Payment, { foreignKey: 'reservation_id', as: 'payments' });"
  );
  
  updatedData = updatedData.replace(
    "db.Payment.belongsTo(db.Reservation, { foreignKey: 'reservation_id' });", 
    "db.Payment.belongsTo(db.Reservation, { foreignKey: 'reservation_id', as: 'reservation' });"
  );

  // Vérifier si des modifications ont été effectuées
  if (data === updatedData) {
    console.log('Aucune modification n\'a été apportée. Vérifiez le fichier index.js manuellement.');
    return;
  }

  // Écrire le fichier mis à jour
  fs.writeFile(indexFilePath, updatedData, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Erreur lors de l\'écriture du fichier:', writeErr);
      return;
    }
    console.log('Le fichier index.js a été mis à jour avec succès!');
    console.log('Les associations Reservation <-> Payment ont été corrigées avec les alias appropriés.');
    console.log('La relation a été modifiée de hasOne à hasMany pour permettre plusieurs paiements par réservation.');
  });
});
