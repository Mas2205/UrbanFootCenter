const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MarketplacePayment = sequelize.define('MarketplacePayment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reservation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'reservations',
        key: 'id'
      }
    },
    client_reference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Référence unique côté client (BK-xxxxx)'
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID de session de paiement'
    },
    provider: {
      type: DataTypes.ENUM('paydunya', 'wave_direct', 'stripe'),
      allowNull: false,
      defaultValue: 'paydunya'
    },
    checkout_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL de checkout PayDunya'
    },
    provider_token: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Token de facture PayDunya'
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    amount_cfa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Montant total en FCFA (centimes)'
    },
    fee_platform_cfa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Commission plateforme en FCFA'
    },
    net_to_owner_cfa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Montant net à verser au propriétaire'
    },
    provider_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Données brutes du provider'
    },
    webhook_received_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp de réception du webhook'
    }
  }, {
    tableName: 'marketplace_payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['reservation_id'] },
      { fields: ['client_reference'] },
      { fields: ['provider_token'] },
      { fields: ['status'] }
    ]
  });

  // Associations
  MarketplacePayment.associate = (models) => {
    MarketplacePayment.belongsTo(models.Reservation, {
      foreignKey: 'reservation_id',
      as: 'reservation'
    });
    
    MarketplacePayment.hasMany(models.Payout, {
      foreignKey: 'marketplace_payment_id',
      as: 'payouts'
    });
  };

  // Méthodes utilitaires
  MarketplacePayment.prototype.isPaid = function() {
    return this.status === 'paid';
  };

  MarketplacePayment.prototype.canRetry = function() {
    return ['failed', 'expired'].includes(this.status);
  };

  // Générer référence client unique
  MarketplacePayment.generateClientReference = function(reservationId, sessionId) {
    const shortReservation = reservationId.substring(0, 8);
    const shortSession = sessionId.substring(0, 4);
    return `BK-${shortReservation}-${shortSession}`;
  };

  return MarketplacePayment;
};
