module.exports = (sequelize, DataTypes, defaultOptions) => {
  const Notification = sequelize.define('Notification', {
    // UUID comme clé primaire pour la sécurité
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'reservation_reminder, promo, cancellation, etc.'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    related_entity_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Peut référencer une réservation, une promotion, etc.'
    },
    related_entity_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Indique le type d\'entité référencée'
    }
  }, {
    tableName: 'notifications',
    timestamps: false,
    indexes: [
      {
        fields: ['user_id'],
        name: 'notifications_user_idx'
      },
      {
        fields: ['user_id', 'is_read'],
        name: 'notifications_read_idx'
      }
    ]
  });

  // Définition des associations
  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return Notification;
};
