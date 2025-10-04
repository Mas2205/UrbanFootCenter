/**
 * Script pour exécuter la migration add-field-id-to-users.js
 * Ajoute la colonne field_id à la table users pour associer un administrateur à un terrain
 */

const { up } = require('./add-field-id-to-users');

// Fonction principale pour exécuter la migration
async function runMigration() {
  try {
    console.log('=== Début de l\'exécution de la migration field_id ===');
    await up();
    console.log('=== Migration field_id exécutée avec succès ===');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la migration field_id:', error);
    process.exit(1);
  }
}

// Exécution de la migration
runMigration();
