'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Table payouts pour versements aux propriétaires
    await queryInterface.createTable('payouts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      marketplace_payment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'marketplace_payments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      channel: {
        type: Sequelize.ENUM('wave', 'orange_money', 'paydunya_push', 'bank_transfer'),
        allowNull: false,
        comment: 'Canal de versement utilisé'
      },
      amount_cfa: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Montant versé en FCFA'
      },
      status: {
        type: Sequelize.ENUM('processing', 'succeeded', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'processing'
      },
      provider_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID de transaction chez le provider (Wave, PayDunya)'
      },
      provider_error: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Détails erreur du provider'
      },
      idempotency_key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Clé d\'idempotence pour éviter doublons'
      },
      retry_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Nombre de tentatives'
      },
      next_retry_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Prochaine tentative programmée'
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date de finalisation'
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

    // Index pour performance
    await queryInterface.addIndex('payouts', ['marketplace_payment_id']);
    await queryInterface.addIndex('payouts', ['field_id']);
    await queryInterface.addIndex('payouts', ['status']);
    await queryInterface.addIndex('payouts', ['idempotency_key']);
    await queryInterface.addIndex('payouts', ['next_retry_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payouts');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payouts_channel";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payouts_status";');
  }
};
