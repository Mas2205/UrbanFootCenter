module.exports = (sequelize, DataTypes, defaultOptions) => {
  const Team = sequelize.define('Team', {
    // UUID comme clé primaire pour la sécurité
    id: {
      ...defaultOptions.id
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    captain_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    logo_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'teams',
    timestamps: true,
    underscored: true
  });

  // Définition des associations
  Team.associate = (models) => {
    Team.belongsTo(models.User, {
      foreignKey: 'captain_id',
      as: 'captain'
    });

    Team.belongsToMany(models.User, {
      through: models.TeamMember,
      foreignKey: 'team_id',
      otherKey: 'user_id',
      as: 'members'
    });
  };

  return Team;
};
