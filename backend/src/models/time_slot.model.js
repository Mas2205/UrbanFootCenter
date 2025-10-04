module.exports = (sequelize, DataTypes, defaultOptions) => {
  const TimeSlot = sequelize.define('TimeSlot', {
    // UUID comme clé primaire pour la sécurité
    id: {
      ...defaultOptions.id
    },
    field_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fields',
        key: 'id'
      }
    },
    datefrom: {
      type: DataTypes.DATE,
      allowNull: false
    },
    dateto: {
      type: DataTypes.DATE,
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
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
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
    tableName: 'time_slots',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['field_id', 'datefrom', 'start_time']
      }
    ]
  });

  // Définition des associations
  TimeSlot.associate = (models) => {
    TimeSlot.belongsTo(models.Field, {
      foreignKey: 'field_id',
      as: 'field',
      onDelete: 'CASCADE'
    });
  };

  return TimeSlot;
};
