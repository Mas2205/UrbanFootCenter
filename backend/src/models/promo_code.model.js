module.exports = (sequelize, DataTypes, defaultOptions) => {
  const PromoCode = sequelize.define('PromoCode', {
    // UUID comme clé primaire
    id: {
      ...defaultOptions.id
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    discount_type: {
      type: DataTypes.ENUM('percentage', 'fixed_amount'),
      allowNull: false
    },
    discount_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isValidDiscount(value) {
          if (this.discount_type === 'percentage' && (value < 0 || value > 100)) {
            throw new Error('Le pourcentage de réduction doit être entre 0 et 100');
          }
        }
      }
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
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    usage_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
    tableName: 'promo_codes',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: (promoCode) => {
        promoCode.code = promoCode.code.toUpperCase();
      },
      beforeUpdate: (promoCode) => {
        if (promoCode.changed('code')) {
          promoCode.code = promoCode.code.toUpperCase();
        }
      }
    }
  });

  // Méthode pour vérifier si un code promo est valide et applicable
  PromoCode.prototype.isValid = function() {
    const now = new Date();
    
    // Vérifier les dates de validité
    if (now < this.start_date || now > this.end_date) {
      return { valid: false, reason: 'Le code promotionnel a expiré ou n\'est pas encore actif' };
    }
    
    // Vérifier si le code est actif
    if (!this.is_active) {
      return { valid: false, reason: 'Le code promotionnel est désactivé' };
    }
    
    // Vérifier la limite d'utilisation
    if (this.usage_limit !== null && this.usage_count >= this.usage_limit) {
      return { valid: false, reason: 'Le code promotionnel a atteint sa limite d\'utilisation' };
    }
    
    return { valid: true };
  };

  // Méthode pour appliquer une réduction à un montant
  PromoCode.prototype.applyDiscount = function(amount) {
    if (this.discount_type === 'percentage') {
      const discountAmount = (amount * this.discount_value) / 100;
      return amount - discountAmount;
    } else { // fixed_amount
      return Math.max(0, amount - this.discount_value);
    }
  };

  // Définition des associations
  PromoCode.associate = (models) => {
    PromoCode.hasMany(models.Reservation, {
      foreignKey: 'promo_code_id',
      as: 'reservations'
    });
  };

  return PromoCode;
};
