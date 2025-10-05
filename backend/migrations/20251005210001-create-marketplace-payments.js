'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Table payments marketplace (distincte des payment_methods existants)
    await queryInterface.createTable('marketplace_payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      reservation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'reservations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      client_reference: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Référence unique côté client (BK-xxxxx)'
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'ID de session de paiement'
      },
      provider: {
        type: Sequelize.ENUM('paydunya', 'wave_direct', 'stripe'),
        allowNull: false,
        defaultValue: 'paydunya'
      },
      checkout_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL de checkout PayDunya'
      },
      provider_token: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Token de facture PayDunya'
      },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'failed', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      amount_cfa: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Montant total en FCFA (centimes)'
      },
      fee_platform_cfa: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Commission plateforme en FCFA'
      },
      net_to_owner_cfa: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Montant net à verser au propriétaire'
      },
      provider_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Données brutes du provider'
      },
      webhook_received_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp de réception du webhook'
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
    await queryInterface.addIndex('marketplace_payments', ['reservation_id']);
    await queryInterface.addIndex('marketplace_payments', ['client_reference']);
    await queryInterface.addIndex('marketplace_payments', ['provider_token']);
    await queryInterface.addIndex('marketplace_payments', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('marketplace_payments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_marketplace_payments_provider";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_marketplace_payments_status";');
  }
};
