'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Ajout de la colonne age
    await queryInterface.addColumn('users', 'age', {
      type: Sequelize.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 120
      }
    });
    
    // Ajout de la colonne sexe (genre)
    await queryInterface.addColumn('users', 'sexe', {
      type: Sequelize.ENUM('M', 'F', 'Autre'),
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Supprimer les colonnes en cas de rollback
    await queryInterface.removeColumn('users', 'age');
    await queryInterface.removeColumn('users', 'sexe');
    
    // Supprimer le type ENUM créé
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_sexe";');
  }
};
