'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('payment_methods', 'ignore_validation', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Si true, ignore la validation de l\'URL et simule un paiement réussi'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('payment_methods', 'ignore_validation');
  }
};
