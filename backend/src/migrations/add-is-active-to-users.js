'use strict';

/**
 * Migration pour ajouter la colonne is_active à la table users
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Vérifier si la colonne existe déjà
      const tableDescription = await queryInterface.describeTable('users');
      if (!tableDescription.is_active) {
        // Ajouter la colonne is_active si elle n'existe pas
        await queryInterface.addColumn('users', 'is_active', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true // Par défaut, les utilisateurs sont actifs
        });
        console.log('✅ Colonne is_active ajoutée avec succès à la table users');
      } else {
        console.log('⚠️ La colonne is_active existe déjà dans la table users');
      }
      return Promise.resolve();
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la colonne is_active:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Vérifier si la colonne existe avant de la supprimer
      const tableDescription = await queryInterface.describeTable('users');
      if (tableDescription.is_active) {
        // Supprimer la colonne is_active
        await queryInterface.removeColumn('users', 'is_active');
        console.log('✅ Colonne is_active supprimée avec succès de la table users');
      } else {
        console.log('⚠️ La colonne is_active n\'existe pas dans la table users');
      }
      return Promise.resolve();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la colonne is_active:', error);
      return Promise.reject(error);
    }
  }
};
