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
      type: DataTypes.ENUM('wave', 'orange_money', 'carte_bancaire', 'especes', 'marketplace_digital'),
      allowNull: false,
      validate: {
        isIn: [['wave', 'orange_money', 'carte_bancaire', 'especes', 'marketplace_digital']]
      }
    },
    api_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        customValidator(value) {
          // Pour les paiements en espèces et marketplace, l'URL n'est pas requise
          if (this.payment_type === 'especes' || this.payment_type === 'marketplace_digital') {
            return true;
          }
          // Pour les autres types, l'URL est requise et doit être valide
          if (!value) {
            throw new Error('L\'URL de l\'API est requise pour ce type de paiement');
          }
          const urlPattern = /^https?:\/\/.+/;
          if (!urlPattern.test(value)) {
            throw new Error('L\'URL de l\'API doit être une URL valide');
          }
        }
      }
    },
    api_key: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        customValidator(value) {
          // Pour les paiements en espèces et marketplace, la clé API n'est pas requise
          if (this.payment_type === 'especes' || this.payment_type === 'marketplace_digital') {
            return true;
          }
          // Pour les autres types (sauf Wave), la clé API est requise
          if (this.payment_type !== 'wave' && !value) {
            throw new Error('La clé API est requise pour ce type de paiement');
          }
        }
      }
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
