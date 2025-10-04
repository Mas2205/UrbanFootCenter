'use strict';

const db = require('../models');
const migration = require('./add-datefrom-dateto-to-timeslots');

async function runMigration() {
  try {
    console.log('🚀 Démarrage de la migration pour ajouter datefrom et dateto aux créneaux horaires...');
    await migration.up(db.sequelize.queryInterface, db.Sequelize);
    console.log('✅ Migration terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();
