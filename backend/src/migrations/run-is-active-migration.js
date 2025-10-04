const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const addIsActiveToUsers = require('./add-is-active-to-users');

// Fonction pour exécuter la migration
async function runMigration() {
  try {
    console.log('🚀 Début de la migration pour ajouter la colonne is_active à la table users...');
    
    // Créer une instance de queryInterface
    const queryInterface = sequelize.getQueryInterface();
    
    // Exécuter la migration
    await addIsActiveToUsers.up(queryInterface, Sequelize);
    
    console.log('✅ Migration terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la migration:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter la migration
runMigration();
