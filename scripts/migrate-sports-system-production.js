#!/usr/bin/env node

/**
 * Script de migration pour le système sportif en production
 * À exécuter sur Railway après déploiement
 * 
 * Usage: node scripts/migrate-sports-system-production.js
 */

const { Sequelize } = require('sequelize');

// Configuration pour la production (Railway)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function runProductionMigration() {
  try {
    console.log('🚀 Début de la migration du système sportif en production...');
    
    // Vérifier la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données Railway établie');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Vérifier si les tables existent déjà
    const tables = await queryInterface.showAllTables();
    const sportsTables = ['equipes', 'membres_equipes', 'tournois', 'participations_tournois', 
                         'matchs_tournois', 'championnats', 'matchs_championnats', 'classement_championnat'];
    
    const existingTables = sportsTables.filter(table => tables.includes(table));
    
    if (existingTables.length > 0) {
      console.log('⚠️  Certaines tables sportives existent déjà:', existingTables.join(', '));
      console.log('Migration annulée pour éviter les conflits');
      return;
    }
    
    console.log('📋 Création des tables sportives...');
    
    // Créer les ENUMs
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_equipes_statut AS ENUM('active', 'inactive', 'suspendue');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_membres_equipes_role AS ENUM('capitaine', 'membre', 'remplacant');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_membres_equipes_statut AS ENUM('actif', 'inactif', 'suspendu');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_tournois_format AS ENUM('poules_elimination', 'elimination_directe', 'championnat');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_tournois_statut AS ENUM('en_preparation', 'inscriptions_ouvertes', 'inscriptions_fermees', 'en_cours', 'termine', 'annule');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_participations_tournois_statut AS ENUM('en_attente', 'valide', 'refuse', 'elimine');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_matchs_tournois_phase AS ENUM('poules', 'huitiemes', 'quarts', 'demi', 'finale', 'petite_finale');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_matchs_tournois_statut AS ENUM('a_venir', 'en_cours', 'termine', 'reporte', 'annule');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_championnats_periode AS ENUM('T1', 'T2', 'T3', 'T4');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_championnats_statut AS ENUM('a_venir', 'en_cours', 'termine');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_matchs_championnats_statut AS ENUM('a_venir', 'en_cours', 'termine', 'reporte', 'annule');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    // Importer et exécuter la migration
    const migration = require('../migrations/20250108200000-create-sports-system-tables');
    await migration.up(queryInterface, Sequelize);
    
    console.log('✅ Migration des tables sportives terminée avec succès');
    
    // Vérifier que les tables ont été créées
    const newTables = await queryInterface.showAllTables();
    console.log('\n📋 Vérification des tables créées:');
    sportsTables.forEach(table => {
      const exists = newTables.includes(table);
      console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? 'CRÉÉE' : 'MANQUANTE'}`);
    });
    
    console.log('\n🎉 Migration production terminée avec succès !');
    console.log('🔗 Les endpoints suivants sont maintenant disponibles:');
    console.log('   - GET /api/equipes');
    console.log('   - GET /api/tournois');
    console.log('   - GET /api/championnats');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration production:', error);
    
    if (error.message && error.message.includes('already exists')) {
      console.log('ℹ️  Les tables existent déjà, migration ignorée');
    } else {
      throw error;
    }
  } finally {
    await sequelize.close();
  }
}

// Exécuter seulement si appelé directement
if (require.main === module) {
  runProductionMigration().catch(error => {
    console.error('💥 Échec de la migration:', error);
    process.exit(1);
  });
}

module.exports = { runProductionMigration };
