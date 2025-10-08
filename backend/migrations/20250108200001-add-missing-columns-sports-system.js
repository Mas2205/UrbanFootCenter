'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter la colonne created_by à la table tournois
    await queryInterface.addColumn('tournois', 'created_by', {
      type: Sequelize.UUID,
      allowNull: true, // Nullable pour les tournois existants
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Ajouter d'autres colonnes manquantes si nécessaires
    await queryInterface.addColumn('tournois', 'nombre_equipes_qualifiees', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('tournois', 'regles', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Ajouter des colonnes manquantes pour les participations_tournois
    try {
      await queryInterface.addColumn('participations_tournois', 'requested_by', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    } catch (error) {
      // Colonne peut déjà exister
      console.log('Colonne requested_by déjà présente ou erreur:', error.message);
    }

    try {
      await queryInterface.addColumn('participations_tournois', 'validated_by', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    } catch (error) {
      console.log('Colonne validated_by déjà présente ou erreur:', error.message);
    }

    try {
      await queryInterface.addColumn('participations_tournois', 'validated_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    } catch (error) {
      console.log('Colonne validated_at déjà présente ou erreur:', error.message);
    }

    try {
      await queryInterface.addColumn('participations_tournois', 'frais_payes', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    } catch (error) {
      console.log('Colonne frais_payes déjà présente ou erreur:', error.message);
    }

    try {
      await queryInterface.addColumn('participations_tournois', 'date_paiement', {
        type: Sequelize.DATE,
        allowNull: true
      });
    } catch (error) {
      console.log('Colonne date_paiement déjà présente ou erreur:', error.message);
    }

    try {
      await queryInterface.addColumn('participations_tournois', 'groupe_poule', {
        type: Sequelize.STRING(10),
        allowNull: true
      });
    } catch (error) {
      console.log('Colonne groupe_poule déjà présente ou erreur:', error.message);
    }

    try {
      await queryInterface.addColumn('participations_tournois', 'position_finale', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    } catch (error) {
      console.log('Colonne position_finale déjà présente ou erreur:', error.message);
    }

    try {
      await queryInterface.addColumn('participations_tournois', 'points_poule', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    } catch (error) {
      console.log('Colonne points_poule déjà présente ou erreur:', error.message);
    }

    try {
      await queryInterface.addColumn('participations_tournois', 'victoires_poule', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    } catch (error) {
      console.log('Colonne victoires_poule déjà présente ou erreur:', error.message);
    }

    try {
      await queryInterface.addColumn('participations_tournois', 'nuls_poule', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    } catch (error) {
      console.log('Colonne nuls_poule déjà présente ou erreur:', error.message);
    }

    try {
      await queryInterface.addColumn('participations_tournois', 'defaites_poule', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    } catch (error) {
      console.log('Colonne defaites_poule déjà présente ou erreur:', error.message);
    }

    try {
      await queryInterface.addColumn('participations_tournois', 'buts_marques_poule', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    } catch (error) {
      console.log('Colonne buts_marques_poule déjà présente ou erreur:', error.message);
    }

    try {
      await queryInterface.addColumn('participations_tournois', 'buts_encaisses_poule', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    } catch (error) {
      console.log('Colonne buts_encaisses_poule déjà présente ou erreur:', error.message);
    }

    // Ajouter des index pour les nouvelles colonnes
    await queryInterface.addIndex('tournois', ['created_by']);
    await queryInterface.addIndex('participations_tournois', ['requested_by']);
    await queryInterface.addIndex('participations_tournois', ['validated_by']);
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les colonnes ajoutées
    await queryInterface.removeColumn('tournois', 'created_by');
    await queryInterface.removeColumn('tournois', 'nombre_equipes_qualifiees');
    await queryInterface.removeColumn('tournois', 'regles');
    
    await queryInterface.removeColumn('participations_tournois', 'requested_by');
    await queryInterface.removeColumn('participations_tournois', 'validated_by');
    await queryInterface.removeColumn('participations_tournois', 'validated_at');
    await queryInterface.removeColumn('participations_tournois', 'frais_payes');
    await queryInterface.removeColumn('participations_tournois', 'date_paiement');
    await queryInterface.removeColumn('participations_tournois', 'groupe_poule');
    await queryInterface.removeColumn('participations_tournois', 'position_finale');
    await queryInterface.removeColumn('participations_tournois', 'points_poule');
    await queryInterface.removeColumn('participations_tournois', 'victoires_poule');
    await queryInterface.removeColumn('participations_tournois', 'nuls_poule');
    await queryInterface.removeColumn('participations_tournois', 'defaites_poule');
    await queryInterface.removeColumn('participations_tournois', 'buts_marques_poule');
    await queryInterface.removeColumn('participations_tournois', 'buts_encaisses_poule');
  }
};
