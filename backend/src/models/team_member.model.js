module.exports = (sequelize, DataTypes, defaultOptions) => {
  const TeamMember = sequelize.define('TeamMember', {
    // UUID comme clé primaire pour la sécurité
    id: {
      ...defaultOptions.id
    },
    team_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teams',
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
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'team_members',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['team_id', 'user_id']
      },
      {
        fields: ['team_id'],
        name: 'team_members_team_idx'
      },
      {
        fields: ['user_id'],
        name: 'team_members_user_idx'
      }
    ]
  });

  // Définition des associations
  TeamMember.associate = (models) => {
    // Les associations sont déjà définies dans les modèles User et Team
  };

  return TeamMember;
};
