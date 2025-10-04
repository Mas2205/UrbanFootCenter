const fs = require('fs');
const path = require('path');

// Chemin vers le contrôleur de paiements
const controllerPath = path.resolve(__dirname, '../controllers/payment.controller.js');

// Lire le contenu du fichier
fs.readFile(controllerPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier du contrôleur:', err);
    return;
  }

  // Vérifier si Op est déjà importé
  if (!data.includes('const { Op }')) {
    // Ajouter l'import de Op à la première ligne d'import des modèles
    const updatedContent = data.replace(
      'const { Payment, Reservation, User, Field } = require(\'../models\');',
      'const { Payment, Reservation, User, Field, Sequelize } = require(\'../models\');\nconst { Op } = Sequelize;'
    );

    // Écrire le fichier mis à jour
    fs.writeFile(controllerPath, updatedContent, 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Erreur lors de l\'écriture du fichier du contrôleur:', writeErr);
        return;
      }
      console.log('Import de Op ajouté avec succès au contrôleur payment.controller.js');
    });
  } else {
    console.log('L\'import de Op existe déjà dans le contrôleur payment.controller.js');
  }
});
