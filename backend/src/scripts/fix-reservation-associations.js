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
  
  // Ajouter les alias dans les associations User <-> Reservation
  updatedData = updatedData.replace(
    "db.User.hasMany(db.Reservation, { foreignKey: 'user_id' });", 
    "db.User.hasMany(db.Reservation, { foreignKey: 'user_id', as: 'reservations' });"
  );
  
  updatedData = updatedData.replace(
    "db.Reservation.belongsTo(db.User, { foreignKey: 'user_id' });", 
    "db.Reservation.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });"
  );
  
  // Ajouter les alias dans les associations Field <-> Reservation
  updatedData = updatedData.replace(
    "db.Field.hasMany(db.Reservation, { foreignKey: 'field_id' });", 
    "db.Field.hasMany(db.Reservation, { foreignKey: 'field_id', as: 'reservations' });"
  );
  
  updatedData = updatedData.replace(
    "db.Reservation.belongsTo(db.Field, { foreignKey: 'field_id' });", 
    "db.Reservation.belongsTo(db.Field, { foreignKey: 'field_id', as: 'field' });"
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
    console.log('Les associations ont été corrigées avec les alias appropriés.');
  });
});
