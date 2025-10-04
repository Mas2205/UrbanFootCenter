const { Sequelize } = require('sequelize');

// Migration pour ajouter la colonne location à la table fields
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Ajouter la colonne location à la table fields
      await queryInterface.addColumn('fields', 'location', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Emplacement du terrain'
      });
      
      console.log('Migration réussie: Colonne location ajoutée à la table fields');
      return Promise.resolve();
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
      return Promise.reject(error);
    }
  },
  
  down: async (queryInterface, Sequelize) => {
    try {
      // Supprimer la colonne location de la table fields (en cas de rollback)
      await queryInterface.removeColumn('fields', 'location');
      
      console.log('Rollback réussi: Colonne location supprimée de la table fields');
      return Promise.resolve();
    } catch (error) {
      console.error('Erreur lors du rollback:', error);
      return Promise.reject(error);
    }
  }
};
