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

  console.log('=== CORRECTION DES RÉFÉRENCES AUX COLONNES DANS PAYMENT CONTROLLER ===');

  // Remplacer les références à 'created_at' par 'payment_date' dans les ORDER BY
  let updatedContent = data.replace(
    /order: \[\['created_at', 'DESC'\]\]/g,
    "order: [['payment_date', 'DESC']]"
  );

  // Remplacer les références à 'created_at' dans les filtres de date
  updatedContent = updatedContent.replace(
    /dateWhereClause\.created_at = {/g,
    "dateWhereClause.payment_date = {"
  );

  // Compter le nombre de remplacements effectués
  const orderByMatches = (data.match(/order: \[\['created_at', 'DESC'\]\]/g) || []).length;
  const filterMatches = (data.match(/dateWhereClause\.created_at = {/g) || []).length;

  console.log(`📊 Remplacements effectués:`);
  console.log(`  - ORDER BY created_at -> payment_date: ${orderByMatches} occurrences`);
  console.log(`  - Filtres created_at -> payment_date: ${filterMatches} occurrences`);

  // Écrire le fichier mis à jour
  fs.writeFile(controllerPath, updatedContent, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Erreur lors de l\'écriture du fichier du contrôleur:', writeErr);
      return;
    }
    console.log('✅ Contrôleur des paiements corrigé avec succès!');
    console.log('Les requêtes utilisent maintenant payment_date au lieu de created_at');
    console.log('Redémarrez le serveur backend pour appliquer les modifications');
  });
});
