'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Ajouter colonnes marketplace aux terrains (venues)
    await queryInterface.addColumn('fields', 'owner_payout_channel', {
      type: Sequelize.ENUM('wave', 'orange_money', 'paydunya_push', 'bank_transfer'),
      allowNull: false,
      defaultValue: 'wave',
      comment: 'Canal de versement préféré du propriétaire'
    });

    await queryInterface.addColumn('fields', 'owner_mobile_e164', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Numéro mobile E.164 pour payouts (+221xxxxxxxxx)'
    });

    await queryInterface.addColumn('fields', 'owner_bank_info', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Informations bancaires pour virements (si applicable)'
    });

    await queryInterface.addColumn('fields', 'commission_rate_bps', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1000,
      comment: 'Taux de commission en basis points (1000 = 10%)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('fields', 'owner_payout_channel');
    await queryInterface.removeColumn('fields', 'owner_mobile_e164');
    await queryInterface.removeColumn('fields', 'owner_bank_info');
    await queryInterface.removeColumn('fields', 'commission_rate_bps');
    
    // Supprimer l'ENUM
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_fields_owner_payout_channel";');
  }
};
