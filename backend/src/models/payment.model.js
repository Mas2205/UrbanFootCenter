module.exports = (sequelize, DataTypes, defaultOptions) => {
  const Payment = sequelize.define('Payment', {
    // UUID comme clé primaire pour sécuriser les transactions financières
    id: {
      ...defaultOptions.id
    },
    reservation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'reservations',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'credit_card, wave, orange_money, cash'
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'ID externe du système de paiement'
    },
    payment_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    receipt_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    payment_details: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Détails spécifiques au mode de paiement'
    }
  }, {
    tableName: 'payments',
    timestamps: false,
    indexes: [
      {
        fields: ['reservation_id'],
        name: 'payments_reservation_idx'
      },
      {
        fields: ['payment_status'],
        name: 'payments_status_idx'
      }
    ],
    hooks: {
      afterCreate: async (payment) => {
        if (payment.payment_status === 'completed') {
          // Mise à jour du statut de paiement de la réservation
          const reservation = await sequelize.models.Reservation.findByPk(payment.reservation_id);
          if (reservation) {
            await reservation.update({ 
              payment_status: 'paid',
              status: reservation.status === 'pending' ? 'confirmed' : reservation.status 
            });
            
            // Envoi de notification via le service de notification
            // Cette logique sera implémentée dans les services
          }
        }
      },
      afterUpdate: async (payment) => {
        if (payment.changed('payment_status') && payment.payment_status === 'completed') {
          const reservation = await sequelize.models.Reservation.findByPk(payment.reservation_id);
          if (reservation) {
            await reservation.update({ 
              payment_status: 'paid',
              status: reservation.status === 'pending' ? 'confirmed' : reservation.status 
            });
          }
        } else if (payment.changed('payment_status') && payment.payment_status === 'refunded') {
          const reservation = await sequelize.models.Reservation.findByPk(payment.reservation_id);
          if (reservation) {
            await reservation.update({ payment_status: 'refunded' });
          }
        }
      }
    }
  });

  // Définition des associations
  Payment.associate = (models) => {
    Payment.belongsTo(models.Reservation, {
      foreignKey: 'reservation_id',
      as: 'reservation',
      onDelete: 'CASCADE'
    });
  };

  return Payment;
};
