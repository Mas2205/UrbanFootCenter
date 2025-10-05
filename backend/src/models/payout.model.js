const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payout = sequelize.define('Payout', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    marketplace_payment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'marketplace_payments',
        key: 'id'
      }
    },
    field_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fields',
        key: 'id'
      }
    },
    channel: {
      type: DataTypes.ENUM('wave', 'orange_money', 'paydunya_push', 'bank_transfer'),
      allowNull: false,
      comment: 'Canal de versement utilisé'
    },
    amount_cfa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Montant versé en FCFA'
    },
    status: {
      type: DataTypes.ENUM('processing', 'succeeded', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'processing'
    },
    provider_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID de transaction chez le provider'
    },
    provider_error: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Détails erreur du provider'
    },
    idempotency_key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Clé d\'idempotence pour éviter doublons'
    },
    retry_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Nombre de tentatives'
    },
    next_retry_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Prochaine tentative programmée'
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date de finalisation'
    }
  }, {
    tableName: 'payouts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['marketplace_payment_id'] },
      { fields: ['field_id'] },
      { fields: ['status'] },
      { fields: ['idempotency_key'] },
      { fields: ['next_retry_at'] }
    ]
  });

  // Associations
  Payout.associate = (models) => {
    Payout.belongsTo(models.MarketplacePayment, {
      foreignKey: 'marketplace_payment_id',
      as: 'payment'
    });
    
    Payout.belongsTo(models.Field, {
      foreignKey: 'field_id',
      as: 'field'
    });
  };

  // Méthodes utilitaires
  Payout.prototype.isCompleted = function() {
    return ['succeeded', 'failed', 'cancelled'].includes(this.status);
  };

  Payout.prototype.canRetry = function() {
    return this.status === 'failed' && this.retry_count < 5;
  };

  Payout.prototype.markCompleted = function(status = 'succeeded') {
    this.status = status;
    this.completed_at = new Date();
    return this.save();
  };

  // Générer clé d'idempotence
  Payout.generateIdempotencyKey = function(paymentId, fieldId) {
    const { v4: uuidv4 } = require('uuid');
    return `payout-${paymentId}-${fieldId}-${uuidv4()}`;
  };

  return Payout;
};
