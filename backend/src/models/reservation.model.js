const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes, defaultOptions) => {
  const Reservation = sequelize.define('Reservation', {
    // UUID comme clé primaire pour la sécurité des transactions
    id: {
      ...defaultOptions.id
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
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
    reservation_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    promo_code_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'promo_codes',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'reservations',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['field_id', 'reservation_date', 'start_time'],
        name: 'unique_reservation_idx'
      },
      {
        fields: ['user_id'],
        name: 'reservations_user_idx'
      },
      {
        fields: ['status'],
        name: 'reservations_status_idx'
      }
    ],
    hooks: {
      beforeCreate: async (reservation) => {
        // Vérification des conflits de réservation
        const conflictingReservation = await sequelize.models.Reservation.findOne({
          where: {
            field_id: reservation.field_id,
            reservation_date: reservation.reservation_date,
            start_time: reservation.start_time,
            status: {
              [Op.notIn]: ['cancelled']
            }
          }
        });

        if (conflictingReservation) {
          throw new Error('Ce créneau horaire est déjà réservé pour ce terrain.');
        }

        // Vérification des jours fériés et fermetures
        const closure = await sequelize.models.HolidayAndClosure.findOne({
          where: {
            date: reservation.reservation_date,
            [Op.or]: [
              { affects_all_fields: true },
              { field_id: reservation.field_id }
            ]
          }
        });

        if (closure) {
          throw new Error(`Le complexe est fermé à cette date pour la raison suivante: ${closure.reason}`);
        }
      }
    }
  });

  // Définition des associations
  Reservation.associate = (models) => {
    Reservation.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    Reservation.belongsTo(models.Field, {
      foreignKey: 'field_id',
      as: 'field',
      onDelete: 'CASCADE'
    });

    Reservation.belongsTo(models.PromoCode, {
      foreignKey: 'promo_code_id',
      as: 'promoCode'
    });

    Reservation.hasMany(models.Payment, {
      foreignKey: 'reservation_id',
      as: 'payments'
    });
  };

  return Reservation;
};
