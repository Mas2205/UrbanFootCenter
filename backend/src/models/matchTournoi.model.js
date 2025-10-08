module.exports = (sequelize, DataTypes, defaultOptions) => {
  const MatchTournoi = sequelize.define('MatchTournoi', {
    id: {
      ...defaultOptions.id
    },
  tournoi_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tournois',
      key: 'id'
    }
  },
  phase: {
    type: DataTypes.ENUM('poule', 'huitieme', 'quart', 'demi', 'finale', 'petite_finale'),
    allowNull: false
  },
  groupe_poule: {
    type: DataTypes.STRING(1), // A, B, C, D... (null pour phases finales)
    allowNull: true
  },
  numero_match: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  equipe1_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'equipes',
      key: 'id'
    }
  },
  equipe2_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'equipes',
      key: 'id'
    }
  },
  score1: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  score2: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  score1_prolongation: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  score2_prolongation: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  tirs_au_but_equipe1: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  tirs_au_but_equipe2: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  statut: {
    type: DataTypes.ENUM('a_venir', 'en_cours', 'termine', 'reporte', 'annule'),
    defaultValue: 'a_venir'
  },
  winner_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'equipes',
      key: 'id'
    }
  },
  date_match: {
    type: DataTypes.DATE,
    allowNull: false
  },
  terrain_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'fields',
      key: 'id'
    }
  },
  arbitre: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'matchs_tournois',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tournoi_id']
    },
    {
      fields: ['equipe1_id']
    },
    {
      fields: ['equipe2_id']
    },
    {
      fields: ['phase']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['date_match']
    },
    {
      fields: ['winner_id']
    }  ]
  });

  return MatchTournoi;
};