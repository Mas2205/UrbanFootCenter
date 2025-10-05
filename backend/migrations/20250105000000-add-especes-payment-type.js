'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter le type 'especes' à l'ENUM payment_type
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_payment_methods_payment_type" 
      ADD VALUE IF NOT EXISTS 'especes';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL ne permet pas de supprimer des valeurs d'un ENUM facilement
    // Cette migration ne peut pas être facilement annulée
    console.log('Cannot easily remove ENUM value in PostgreSQL. Manual intervention required.');
  }
};
