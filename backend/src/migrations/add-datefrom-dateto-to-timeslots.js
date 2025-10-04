'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Vérifier si les colonnes existent déjà
    const tableInfo = await queryInterface.describeTable('time_slots');
    const columnsToAdd = [];
    
    // Ajouter la colonne datefrom si elle n'existe pas
    if (!tableInfo.datefrom) {
      columnsToAdd.push(
        queryInterface.addColumn('time_slots', 'datefrom', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        })
      );
    }
    
    // Ajouter la colonne dateto si elle n'existe pas
    if (!tableInfo.dateto) {
      columnsToAdd.push(
        queryInterface.addColumn('time_slots', 'dateto', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        })
      );
    }
    
    // Exécuter toutes les modifications en même temps
    return Promise.all(columnsToAdd);
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les colonnes si nécessaire
    return Promise.all([
      queryInterface.removeColumn('time_slots', 'datefrom'),
      queryInterface.removeColumn('time_slots', 'dateto')
    ]);
  }
};
