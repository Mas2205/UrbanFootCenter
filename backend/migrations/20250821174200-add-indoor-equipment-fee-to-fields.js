'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('fields', 'equipment_fee', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      },
      comment: 'Frais d\'équipement optionnels'
    });

    await queryInterface.addColumn('fields', 'indoor', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'Terrain couvert ou extérieur'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('fields', 'equipment_fee');
    await queryInterface.removeColumn('fields', 'indoor');
  }
};
