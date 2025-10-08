module.exports = (sequelize, DataTypes, defaultOptions) => {
  const MembreEquipe = sequelize.define('MembreEquipe', {
    id: {
      ...defaultOptions.id
    },
  equipe_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'equipes',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('capitaine', 'joueur', 'remplacant'),
    defaultValue: 'joueur'
  },
  numero_maillot: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 99
    }
  },
  poste: {
    type: DataTypes.ENUM('gardien', 'defenseur', 'milieu', 'attaquant'),
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('actif', 'blesse', 'suspendu', 'inactif'),
    defaultValue: 'actif'
  },
  date_adhesion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  added_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'membres_equipes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id'] // Un utilisateur ne peut être que dans une équipe
    },
    {
      fields: ['equipe_id']
    },
    {
      unique: true,
      fields: ['equipe_id', 'numero_maillot'], // Numéro unique par équipe
      where: {
        numero_maillot: {
          [sequelize.Sequelize.Op.not]: null
        }
      }
    }  ]
  });

  return MembreEquipe;
};