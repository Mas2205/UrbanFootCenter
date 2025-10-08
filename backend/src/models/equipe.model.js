module.exports = (sequelize, DataTypes, defaultOptions) => {
  const Equipe = sequelize.define('Equipe', {
    id: {
      ...defaultOptions.id
    },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  logo_url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  terrain_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'fields',
      key: 'id'
    }
  },
  capitaine_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  couleur_maillot: {
    type: DataTypes.STRING(7), // Format hex #FFFFFF
    allowNull: true,
    defaultValue: '#1B5E20'
  },
  statut: {
    type: DataTypes.ENUM('active', 'inactive', 'suspendue'),
    defaultValue: 'active'
  }
}, {
  tableName: 'equipes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['terrain_id']
    },
    {
      fields: ['capitaine_id']
    },
    {
      fields: ['created_by']
    },
    {
      unique: true,
      fields: ['nom', 'terrain_id'] // Nom unique par terrain
    }
  ]
  });

  return Equipe;
};
