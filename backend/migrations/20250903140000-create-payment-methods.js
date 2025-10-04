'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_methods', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      field_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'fields',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      payment_type: {
        type: Sequelize.ENUM('wave', 'orange_money', 'carte_bancaire'),
        allowNull: false
      },
      api_url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      api_key: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      api_secret: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      merchant_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      configuration: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Configuration supplémentaire spécifique au moyen de paiement'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Index pour optimiser les requêtes
    await queryInterface.addIndex('payment_methods', ['field_id']);
    await queryInterface.addIndex('payment_methods', ['payment_type']);
    await queryInterface.addIndex('payment_methods', ['field_id', 'payment_type'], {
      unique: true,
      name: 'unique_field_payment_type'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payment_methods');
  }
};
