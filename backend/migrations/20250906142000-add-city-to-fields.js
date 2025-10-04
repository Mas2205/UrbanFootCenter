'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('fields', 'city', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'location'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('fields', 'city');
  }
};
