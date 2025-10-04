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
