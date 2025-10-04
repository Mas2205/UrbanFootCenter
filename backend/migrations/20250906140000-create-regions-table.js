'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('regions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      region_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      department_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      city_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      region_code: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      department_code: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      population: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      area_km2: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Ajouter des index pour améliorer les performances
    await queryInterface.addIndex('regions', ['region_name']);
    await queryInterface.addIndex('regions', ['department_name']);
    await queryInterface.addIndex('regions', ['city_name']);
    await queryInterface.addIndex('regions', ['region_name', 'department_name']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('regions');
  }
};
