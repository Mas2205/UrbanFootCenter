'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Créer la table des demandes d'équipes
    await queryInterface.createTable('demandes_equipes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      terrain_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'fields',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      nom_equipe: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      couleur_maillot: {
        type: Sequelize.STRING(7), // Format hex #FFFFFF
        allowNull: true,
        defaultValue: '#FF6B35'
      },
      statut: {
        type: Sequelize.ENUM('en_attente', 'validee', 'refusee'),
        allowNull: false,
        defaultValue: 'en_attente'
      },
      motif_refus: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      validated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      validated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      notes_admin: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Contraintes uniques
    await queryInterface.addConstraint('demandes_equipes', {
      fields: ['user_id'],
      type: 'unique',
      name: 'unique_user_team_request',
      where: {
        statut: ['en_attente', 'validee']
      }
    });

    // Index pour les performances
    await queryInterface.addIndex('demandes_equipes', ['user_id']);
    await queryInterface.addIndex('demandes_equipes', ['terrain_id']);
    await queryInterface.addIndex('demandes_equipes', ['statut']);
    await queryInterface.addIndex('demandes_equipes', ['validated_by']);
    await queryInterface.addIndex('demandes_equipes', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer la table
    await queryInterface.dropTable('demandes_equipes');
  }
};
