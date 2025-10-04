const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes, defaultOptions) => {
  const User = sequelize.define('User', {
    // Utilisation de UUID comme clé primaire
    id: {
      ...defaultOptions.id
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('client', 'admin', 'super_admin'),
      allowNull: false,
      defaultValue: 'client'
    },
    profile_picture_url: {
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
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verification_token: {
      type: DataTypes.UUID,
      allowNull: true
    },
    reset_password_token: {
      type: DataTypes.UUID,
      allowNull: true
    },
    reset_token_expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 120
      }
    },
    sexe: {
      type: DataTypes.ENUM('M', 'F', 'Autre'),
      allowNull: true
    },
    field_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'fields',
        key: 'id'
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      },
      beforeUpdate: async (user) => {
        // Ne hasher que si le mot de passe a changé ET qu'il n'est pas déjà haché
        if (user.changed('password_hash') && user.password_hash) {
          // Vérifier si le mot de passe est déjà haché (commence par $2a$ ou $2b$)
          if (!user.password_hash.startsWith('$2a$') && !user.password_hash.startsWith('$2b$')) {
            user.password_hash = await bcrypt.hash(user.password_hash, 10);
          }
        }
      }
    }
  });

  // Méthode pour vérifier le mot de passe
  User.prototype.verifyPassword = async function(password) {
    console.log('=== VÉRIFICATION DU MOT DE PASSE ===');
    console.log(`Mot de passe fourni: ${password ? '******' : 'non fourni'}`);
    console.log(`Hash stocké dans la base: ${this.password_hash ? this.password_hash.substring(0, 10) + '...' : 'non disponible'}`);
    
    try {
      const isValid = await bcrypt.compare(password, this.password_hash);
      console.log(`Résultat de la comparaison: ${isValid ? 'VALIDE' : 'INVALIDE'}`);
      return isValid;
    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe:', error);
      return false;
    }
  };

  // Méthode pour générer un token de vérification
  User.prototype.generateVerificationToken = function() {
    this.verification_token = DataTypes.UUIDV4();
    return this.verification_token;
  };

  // Méthode pour générer un token de réinitialisation de mot de passe
  User.prototype.generatePasswordResetToken = function() {
    this.reset_password_token = DataTypes.UUIDV4();
    this.reset_token_expires_at = new Date(Date.now() + 3600000); // 1 heure
    return this.reset_password_token;
  };

  // Définition des associations
  User.associate = (models) => {
    User.hasMany(models.Reservation, {
      foreignKey: 'user_id',
      as: 'reservations'
    });

    User.hasMany(models.Notification, {
      foreignKey: 'user_id',
      as: 'notifications'
    });

    User.hasMany(models.Team, {
      foreignKey: 'captain_id',
      as: 'captainedTeams'
    });

    User.belongsToMany(models.Team, {
      through: 'user_teams',
      foreignKey: 'user_id',
      otherKey: 'team_id',
      as: 'teams'
    });
    
    // Association avec le terrain (pour les administrateurs)
    User.belongsTo(models.Field, {
      foreignKey: 'field_id',
      as: 'field'
    });
  };

  return User;
};
