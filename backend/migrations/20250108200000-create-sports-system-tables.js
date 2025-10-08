'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Table des équipes
    await queryInterface.createTable('equipes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      nom: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      logo_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      couleur_maillot: {
        type: Sequelize.STRING(7), // Format hex #FFFFFF
        allowNull: true,
        defaultValue: '#FF6B35'
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
      capitaine_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      statut: {
        type: Sequelize.ENUM('active', 'inactive', 'suspendue'),
        allowNull: false,
        defaultValue: 'active'
      },
      date_creation: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
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

    // Table des membres d'équipes
    await queryInterface.createTable('membres_equipes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      equipe_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'equipes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      role: {
        type: Sequelize.ENUM('capitaine', 'membre', 'remplacant'),
        allowNull: false,
        defaultValue: 'membre'
      },
      numero_maillot: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 99
        }
      },
      poste: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      date_adhesion: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      statut: {
        type: Sequelize.ENUM('actif', 'inactif', 'suspendu'),
        allowNull: false,
        defaultValue: 'actif'
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

    // Table des tournois
    await queryInterface.createTable('tournois', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      nom: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
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
      date_debut: {
        type: Sequelize.DATE,
        allowNull: false
      },
      date_fin: {
        type: Sequelize.DATE,
        allowNull: false
      },
      date_limite_inscription: {
        type: Sequelize.DATE,
        allowNull: false
      },
      frais_inscription: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      recompense: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      prix_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      format: {
        type: Sequelize.ENUM('poules_elimination', 'elimination_directe', 'championnat'),
        allowNull: false,
        defaultValue: 'poules_elimination'
      },
      nombre_max_equipes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 16
      },
      statut: {
        type: Sequelize.ENUM('en_preparation', 'inscriptions_ouvertes', 'inscriptions_fermees', 'en_cours', 'termine', 'annule'),
        allowNull: false,
        defaultValue: 'en_preparation'
      },
      regles_specifiques: {
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

    // Table des participations aux tournois
    await queryInterface.createTable('participations_tournois', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      tournoi_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tournois',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      equipe_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'equipes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      statut: {
        type: Sequelize.ENUM('en_attente', 'valide', 'refuse', 'elimine'),
        allowNull: false,
        defaultValue: 'en_attente'
      },
      date_inscription: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      motif_refus: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      groupe: {
        type: Sequelize.STRING(10),
        allowNull: true // Pour les tournois avec poules
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

    // Table des matchs de tournois
    await queryInterface.createTable('matchs_tournois', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      tournoi_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tournois',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      equipe1_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'equipes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      equipe2_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'equipes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
      phase: {
        type: Sequelize.ENUM('poules', 'huitiemes', 'quarts', 'demi', 'finale', 'petite_finale'),
        allowNull: false
      },
      groupe: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      date_match: {
        type: Sequelize.DATE,
        allowNull: false
      },
      score1: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      },
      score2: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      },
      winner_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'equipes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      statut: {
        type: Sequelize.ENUM('a_venir', 'en_cours', 'termine', 'reporte', 'annule'),
        allowNull: false,
        defaultValue: 'a_venir'
      },
      arbitre: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      notes: {
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

    // Table des championnats
    await queryInterface.createTable('championnats', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      nom: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      saison: {
        type: Sequelize.STRING(20),
        allowNull: false // Ex: "2024-T1", "2024-T2"
      },
      periode: {
        type: Sequelize.ENUM('T1', 'T2', 'T3', 'T4'),
        allowNull: false
      },
      annee: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      date_debut: {
        type: Sequelize.DATE,
        allowNull: false
      },
      date_fin: {
        type: Sequelize.DATE,
        allowNull: false
      },
      statut: {
        type: Sequelize.ENUM('a_venir', 'en_cours', 'termine'),
        allowNull: false,
        defaultValue: 'a_venir'
      },
      actif: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      regles: {
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

    // Table des matchs de championnats
    await queryInterface.createTable('matchs_championnats', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      championnat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'championnats',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      equipe1_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'equipes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      equipe2_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'equipes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
      journee: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      date_match: {
        type: Sequelize.DATE,
        allowNull: false
      },
      score1: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      },
      score2: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      },
      winner_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'equipes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      statut: {
        type: Sequelize.ENUM('a_venir', 'en_cours', 'termine', 'reporte', 'annule'),
        allowNull: false,
        defaultValue: 'a_venir'
      },
      arbitre: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      notes: {
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

    // Table du classement des championnats
    await queryInterface.createTable('classement_championnat', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      championnat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'championnats',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      equipe_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'equipes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      position_precedente: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      matchs_joues: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      victoires: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      nuls: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      defaites: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      buts_marques: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      buts_encaisses: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      difference_buts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      forme_recente: {
        type: Sequelize.STRING(10),
        allowNull: true // Ex: "VVNDD" pour les 5 derniers matchs
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
    await queryInterface.addConstraint('membres_equipes', {
      fields: ['user_id'],
      type: 'unique',
      name: 'unique_user_per_team'
    });

    await queryInterface.addConstraint('membres_equipes', {
      fields: ['equipe_id', 'numero_maillot'],
      type: 'unique',
      name: 'unique_jersey_number_per_team'
    });

    await queryInterface.addConstraint('participations_tournois', {
      fields: ['tournoi_id', 'equipe_id'],
      type: 'unique',
      name: 'unique_team_per_tournament'
    });

    await queryInterface.addConstraint('classement_championnat', {
      fields: ['championnat_id', 'equipe_id'],
      type: 'unique',
      name: 'unique_team_per_championship'
    });

    await queryInterface.addConstraint('championnats', {
      fields: ['saison'],
      type: 'unique',
      name: 'unique_season'
    });

    // Index pour les performances
    await queryInterface.addIndex('equipes', ['terrain_id']);
    await queryInterface.addIndex('equipes', ['capitaine_id']);
    await queryInterface.addIndex('membres_equipes', ['equipe_id']);
    await queryInterface.addIndex('membres_equipes', ['user_id']);
    await queryInterface.addIndex('tournois', ['terrain_id']);
    await queryInterface.addIndex('tournois', ['statut']);
    await queryInterface.addIndex('participations_tournois', ['tournoi_id']);
    await queryInterface.addIndex('participations_tournois', ['equipe_id']);
    await queryInterface.addIndex('matchs_tournois', ['tournoi_id']);
    await queryInterface.addIndex('matchs_tournois', ['date_match']);
    await queryInterface.addIndex('matchs_championnats', ['championnat_id']);
    await queryInterface.addIndex('matchs_championnats', ['date_match']);
    await queryInterface.addIndex('classement_championnat', ['championnat_id', 'position']);
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les tables dans l'ordre inverse (à cause des clés étrangères)
    await queryInterface.dropTable('classement_championnat');
    await queryInterface.dropTable('matchs_championnats');
    await queryInterface.dropTable('championnats');
    await queryInterface.dropTable('matchs_tournois');
    await queryInterface.dropTable('participations_tournois');
    await queryInterface.dropTable('tournois');
    await queryInterface.dropTable('membres_equipes');
    await queryInterface.dropTable('equipes');
  }
};
