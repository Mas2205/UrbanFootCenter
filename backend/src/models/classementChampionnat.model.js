module.exports = (sequelize, DataTypes, defaultOptions) => {
  const ClassementChampionnat = sequelize.define('ClassementChampionnat', {
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
  equipe_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'equipes',
      key: 'id'
    }
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  matchs_joues: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  victoires: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  nuls: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  defaites: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  buts_marques: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  buts_encaisses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  difference_buts: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.buts_marques - this.buts_encaisses;
    }
  },
  forme_recente: {
    type: DataTypes.STRING(5), // Ex: "VVNDD" (5 derniers matchs)
    allowNull: true,
    defaultValue: ''
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
  },
  position_precedente: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
  },
  serie_victoires: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  serie_defaites: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  serie_sans_defaite: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'classement_championnat',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['championnat_id', 'equipe_id'] // Une équipe par championnat
    },
    {
      fields: ['championnat_id']
    },
    {
      fields: ['equipe_id']
    },
    {
      fields: ['points', 'difference_buts', 'buts_marques'] // Pour le classement
    },
    {
      fields: ['position']
    }  ]
  });

  return ClassementChampionnat;
};