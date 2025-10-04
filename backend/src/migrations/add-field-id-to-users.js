const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Migration pour ajouter la colonne field_id à la table users
 * Cette colonne permet d'associer un administrateur à un terrain spécifique
 */
async function up() {
  try {
    console.log('=== Début de la migration: ajout de field_id à la table users ===');
    
    // Vérifier si la colonne existe déjà
    const [results] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'field_id'
    `);
    
    if (results.length === 0) {
      console.log('La colonne field_id n\'existe pas encore, création en cours...');
      
      // Ajouter la colonne field_id
      await sequelize.query(`
        ALTER TABLE users
        ADD COLUMN field_id UUID NULL,
        ADD CONSTRAINT fk_user_field 
        FOREIGN KEY (field_id) 
        REFERENCES fields(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
      `);
      
      console.log('Colonne field_id ajoutée avec succès à la table users');
    } else {
      console.log('La colonne field_id existe déjà dans la table users');
    }
    
    console.log('=== Fin de la migration: ajout de field_id à la table users ===');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    throw error;
  }
}

/**
 * Migration pour supprimer la colonne field_id de la table users
 */
async function down() {
  try {
    console.log('=== Début de la migration inverse: suppression de field_id de la table users ===');
    
    // Vérifier si la colonne existe
    const [results] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'field_id'
    `);
    
    if (results.length > 0) {
      console.log('La colonne field_id existe, suppression en cours...');
      
      // Supprimer la contrainte de clé étrangère d'abord
      await sequelize.query(`
        ALTER TABLE users
        DROP CONSTRAINT IF EXISTS fk_user_field
      `);
      
      // Supprimer la colonne
      await sequelize.query(`
        ALTER TABLE users
        DROP COLUMN field_id
      `);
      
      console.log('Colonne field_id supprimée avec succès de la table users');
    } else {
      console.log('La colonne field_id n\'existe pas dans la table users');
    }
    
    console.log('=== Fin de la migration inverse: suppression de field_id de la table users ===');
  } catch (error) {
    console.error('Erreur lors de la migration inverse:', error);
    throw error;
  }
}

module.exports = { up, down };
