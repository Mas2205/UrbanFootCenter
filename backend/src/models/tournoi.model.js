module.exports = (sequelize, DataTypes, defaultOptions) => {
  const Tournoi = sequelize.define('Tournoi', {
    id: {
      ...defaultOptions.id
    },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 150]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  terrain_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'fields',
      key: 'id'
    }
  },
  date_debut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  date_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isAfterStartDate(value) {
        if (value <= this.date_debut) {
          throw new Error('La date de fin doit être après la date de début');
        }
      }
    }
  },
  date_limite_inscription: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isBeforeStartDate(value) {
        if (value >= this.date_debut) {
          throw new Error('La date limite d\'inscription doit être avant le début du tournoi');
        }
      }
    }
  },
  frais_inscription: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  recompense: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prix_total: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  format: {
    type: DataTypes.ENUM('poules_elimination', 'elimination_directe', 'championnat'),
    defaultValue: 'poules_elimination'
  },
  nombre_max_equipes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 16,
    validate: {
      min: 2, // Permettre 2 équipes minimum pour élimination directe (finale directe)
      max: 64
    }
  },
  nombre_equipes_qualifiees: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 2
    }
  },
  statut: {
    type: DataTypes.ENUM('en_preparation', 'inscriptions_ouvertes', 'inscriptions_fermees', 'en_cours', 'termine', 'annule'),
    defaultValue: 'en_preparation'
  },
  regles: {
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
  }
}, {
  tableName: 'tournois',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['terrain_id']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['date_debut', 'date_fin']
    }
  ]
  });

  return Tournoi;
};