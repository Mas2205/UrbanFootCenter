module.exports = (sequelize, DataTypes, defaultOptions) => {
  const MatchChampionnat = sequelize.define('MatchChampionnat', {
    id: {
      ...defaultOptions.id
    },
  championnat_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'championnats',
      key: 'id'
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
  statut: {
    type: DataTypes.ENUM('a_venir', 'en_cours', 'termine', 'reporte', 'annule'),
    defaultValue: 'a_venir'
  },
  date_match: {
    type: DataTypes.DATE,
    allowNull: false
  },
  journee: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
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
  buteurs_equipe1: {
    type: DataTypes.JSON, // [{user_id: 'uuid', minute: 45, type: 'but'/'penalty'/'csc'}]
    allowNull: true,
    defaultValue: []
  },
  buteurs_equipe2: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  cartons_equipe1: {
    type: DataTypes.JSON, // [{user_id: 'uuid', minute: 30, type: 'jaune'/'rouge'}]
    allowNull: true,
    defaultValue: []
  },
  cartons_equipe2: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
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
  tableName: 'matchs_championnats',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['championnat_id']
    },
    {
      fields: ['terrain_id']
    },
    {
      fields: ['equipe1_id']
    },
    {
      fields: ['equipe2_id']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['date_match']
    },
    {
      fields: ['journee']
    }  ]
  });

  return MatchChampionnat;
};