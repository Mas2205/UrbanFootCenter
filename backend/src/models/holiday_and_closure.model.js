module.exports = (sequelize, DataTypes, defaultOptions) => {
  const HolidayAndClosure = sequelize.define('HolidayAndClosure', {
    // UUID comme clé primaire pour la sécurité
    id: {
      ...defaultOptions.id
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    affects_all_fields: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    field_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'fields',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'holidays_and_closures',
    timestamps: false,
    validate: {
      eitherAllFieldsOrSpecificField() {
        if (!this.affects_all_fields && !this.field_id) {
          throw new Error('Si affects_all_fields est false, field_id doit être spécifié');
        }
      }
    }
  });

  // Définition des associations
  HolidayAndClosure.associate = (models) => {
    HolidayAndClosure.belongsTo(models.Field, {
      foreignKey: 'field_id',
      as: 'field',
      onDelete: 'CASCADE'
    });
  };

  return HolidayAndClosure;
};
