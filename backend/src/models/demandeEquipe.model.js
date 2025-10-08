module.exports = (sequelize, DataTypes, defaultOptions) => {
  const DemandeEquipe = sequelize.define('DemandeEquipe', {
    id: {
      ...defaultOptions.id
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
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
    nom_equipe: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    couleur_maillot: {
      type: DataTypes.STRING(7), // Format hex #FFFFFF
      allowNull: true,
      defaultValue: '#FF6B35'
    },
    statut: {
      type: DataTypes.ENUM('en_attente', 'validee', 'refusee'),
      allowNull: false,
      defaultValue: 'en_attente'
    },
    motif_refus: {
      type: DataTypes.TEXT,
      allowNull: true
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
    notes_admin: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'demandes_equipes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['terrain_id']
      },
      {
        fields: ['statut']
      },
      {
        fields: ['validated_by']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return DemandeEquipe;
};
