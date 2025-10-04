module.exports = (sequelize, DataTypes, defaultOptions) => {
  const SpecialEvent = sequelize.define('SpecialEvent', {
    // UUID comme clé primaire pour la sécurité
    id: {
      ...defaultOptions.id
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isAfterStartDate(value) {
          if (new Date(value) <= new Date(this.start_date)) {
            throw new Error('La date de fin doit être postérieure à la date de début');
          }
        }
      }
    },
    field_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'fields',
        key: 'id'
      }
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    max_participants: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    current_participants: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    price_per_participant: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
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
    tableName: 'special_events',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (event) => {
        // Vérification des conflits avec les réservations existantes
        if (event.field_id) {
          const overlappingReservations = await sequelize.models.Reservation.findAll({
            where: {
              field_id: event.field_id,
              reservation_date: {
                [sequelize.Op.between]: [
                  sequelize.fn('DATE', event.start_date),
                  sequelize.fn('DATE', event.end_date)
                ]
              },
              status: {
                [sequelize.Op.notIn]: ['cancelled']
              }
            }
          });

          if (overlappingReservations.length > 0) {
            throw new Error('Des réservations existent déjà pour ce terrain pendant cette période');
          }
        }
      }
    }
  });

  // Définition des associations
  SpecialEvent.associate = (models) => {
    SpecialEvent.belongsTo(models.Field, {
      foreignKey: 'field_id',
      as: 'field',
      onDelete: 'SET NULL'
    });
  };

  return SpecialEvent;
};
