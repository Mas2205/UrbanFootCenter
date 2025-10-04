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

  // Modifier la structure de la réponse dans getAllPayments pour utiliser "payments" au lieu de "data"
  const updatedContent = data.replace(
    `res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: payments,
      metrics: {
        totalAmount,
        currency: 'FCFA'
      }
    });`,
    `res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      payments: payments, // Changé "data" en "payments" pour correspondre à l'attente du frontend
      total: count, // Ajouté "total" pour correspondre à l'attente du frontend
      metrics: {
        totalAmount,
        currency: 'FCFA'
      }
    });`
  );

  // Écrire le fichier mis à jour
  fs.writeFile(controllerPath, updatedContent, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Erreur lors de l\'écriture du fichier du contrôleur:', writeErr);
      return;
    }
    console.log('Structure de réponse API des paiements modifiée avec succès!');
    console.log('Le backend renvoie maintenant "payments" et "total" pour correspondre aux attentes du frontend');
  });
});
