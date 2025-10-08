module.exports = (sequelize, DataTypes, defaultOptions) => {
  const Championnat = sequelize.define('Championnat', {
    id: {
      ...defaultOptions.id
    },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  saison: {
    type: DataTypes.STRING(9), // Format: 2025-2026
    allowNull: false
  },
  trimestre: {
    type: DataTypes.ENUM('T1', 'T2', 'T3', 'T4'),
    allowNull: false
  },
  periode_debut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  periode_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  statut: {
    type: DataTypes.ENUM('en_preparation', 'en_cours', 'termine', 'archive'),
    defaultValue: 'en_preparation'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  regles: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'Victoire: 3 points, Match nul: 1 point, Défaite: 0 point'
  },
  prix_champion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  prix_vice_champion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  prix_troisieme: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  }
}, {
  tableName: 'championnats',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['saison', 'trimestre'] // Un seul championnat par trimestre
    },
    {
      fields: ['actif']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['periode_debut', 'periode_fin']
    }
  ]
  });

  return Championnat;
};
