module.exports = (sequelize, DataTypes, defaultOptions) => {
  const ParticipationTournoi = sequelize.define('ParticipationTournoi', {
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
  equipe_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'equipes',
      key: 'id'
    }
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'valide', 'refuse', 'retire'),
    defaultValue: 'en_attente'
  },
  requested_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  validated_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  validated_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  date_inscription: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  motif_refus: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  frais_payes: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  date_paiement: {
    type: DataTypes.DATE,
    allowNull: true
  },
  groupe_poule: {
    type: DataTypes.STRING(1), // A, B, C, D...
    allowNull: true
  },
  position_finale: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
  },
  points_poule: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  victoires_poule: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  nuls_poule: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  defaites_poule: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  buts_marques_poule: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  buts_encaisses_poule: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'participations_tournois',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['tournoi_id', 'equipe_id'] // Une équipe par tournoi
    },
    {
      fields: ['tournoi_id']
    },
    {
      fields: ['equipe_id']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['requested_by']
    }  ]
  });

  return ParticipationTournoi;
};