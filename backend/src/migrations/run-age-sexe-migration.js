const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const addAgeSexeToUsers = require('./add-age-sexe-to-users');

// Fonction pour exécuter la migration spécifique
async function runMigration() {
  try {
    console.log('Début de la migration pour ajouter les colonnes age et sexe à la table users...');
    
    // Créer une instance de queryInterface
    const queryInterface = sequelize.getQueryInterface();
    
    // Exécuter la migration
    await addAgeSexeToUsers.up(queryInterface, Sequelize);
    
    console.log('Migration terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la migration:', error);
    process.exit(1);
  }
}

// Exécuter la migration
runMigration();
