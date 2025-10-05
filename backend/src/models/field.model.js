module.exports = (sequelize, DataTypes, defaultOptions) => {
  const Field = sequelize.define('Field', {
    // Utilisation de UUID comme clé primaire sécurisée
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
    size: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Par exemple "5v5", "7v7"'
    },
    surface_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Par exemple "gazon synthétique", "futsal"'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Emplacement du terrain'
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Ville du terrain'
    },
    price_per_hour: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    equipment_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      },
      comment: 'Frais d\'équipement optionnels'
    },
    // Champs marketplace
    owner_payout_channel: {
      type: DataTypes.ENUM('wave', 'orange_money', 'paydunya_push', 'bank_transfer'),
      allowNull: false,
      defaultValue: 'wave',
      comment: 'Canal de versement préféré du propriétaire'
    },
    owner_mobile_e164: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Numéro mobile E.164 pour payouts (+221xxxxxxxxx)'
    },
    owner_bank_info: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Informations bancaires pour virements (si applicable)'
    },
    commission_rate_bps: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
      comment: 'Taux de commission en basis points (1000 = 10%)'
    },
    indoor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Terrain couvert ou extérieur'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true
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
    tableName: 'fields',
    timestamps: true,
    underscored: true
  });

  // Définition des associations
  Field.associate = (models) => {
    Field.hasMany(models.TimeSlot, {
      foreignKey: 'field_id',
      as: 'timeSlots'
    });

    Field.hasMany(models.Reservation, {
      foreignKey: 'field_id',
      as: 'reservations'
    });

    Field.hasMany(models.SpecialEvent, {
      foreignKey: 'field_id',
      as: 'specialEvents'
    });

    Field.hasMany(models.HolidayAndClosure, {
      foreignKey: 'field_id',
      as: 'closures'
    });
  };

  return Field;
};
