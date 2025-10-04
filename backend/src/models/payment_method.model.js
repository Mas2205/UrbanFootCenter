const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const PaymentMethod = sequelize.define('PaymentMethod', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false
    },
    field_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fields',
        key: 'id'
      }
    },
    payment_type: {
      type: DataTypes.ENUM('wave', 'orange_money', 'carte_bancaire'),
      allowNull: false,
      validate: {
        isIn: [['wave', 'orange_money', 'carte_bancaire']]
      }
    },
    api_url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: {
          msg: 'L\'URL de l\'API doit être une URL valide'
        }
      }
    },
    api_key: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    api_secret: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    merchant_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    configuration: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    ignore_validation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Si true, ignore la validation de l\'URL et simule un paiement réussi'
    }
  }, {
    tableName: 'payment_methods',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['field_id']
      },
      {
        fields: ['payment_type']
      },
      {
        unique: true,
        fields: ['field_id', 'payment_type'],
        name: 'unique_field_payment_type'
      }
    ]
  });

  PaymentMethod.associate = (models) => {
    // Association avec le modèle Field
    PaymentMethod.belongsTo(models.Field, {
      foreignKey: 'field_id',
      as: 'field'
    });
  };

  return PaymentMethod;
};
