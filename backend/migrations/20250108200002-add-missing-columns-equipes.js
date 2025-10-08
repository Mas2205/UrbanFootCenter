'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter la colonne created_by à la table equipes
    try {
      await queryInterface.addColumn('equipes', 'created_by', {
        type: Sequelize.UUID,
        allowNull: true, // Nullable pour les équipes existantes
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Colonne created_by ajoutée à equipes');
    } catch (error) {
      console.log('⚠️ Colonne created_by déjà présente dans equipes ou erreur:', error.message);
    }

    // Ajouter les colonnes manquantes dans membres_equipes
    try {
      await queryInterface.addColumn('membres_equipes', 'joined_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW
      });
      console.log('✅ Colonne joined_at ajoutée à membres_equipes');
    } catch (error) {
      console.log('⚠️ Colonne joined_at déjà présente dans membres_equipes ou erreur:', error.message);
    }

    try {
      await queryInterface.addColumn('membres_equipes', 'added_by', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Colonne added_by ajoutée à membres_equipes');
    } catch (error) {
      console.log('⚠️ Colonne added_by déjà présente dans membres_equipes ou erreur:', error.message);
    }

    // Renommer la colonne date_adhesion en joined_at si elle existe
    try {
      const tableDescription = await queryInterface.describeTable('membres_equipes');
      if (tableDescription.date_adhesion && !tableDescription.joined_at) {
        await queryInterface.renameColumn('membres_equipes', 'date_adhesion', 'joined_at');
        console.log('✅ Colonne date_adhesion renommée en joined_at');
      }
    } catch (error) {
      console.log('⚠️ Erreur lors du renommage date_adhesion → joined_at:', error.message);
    }

    // Ajouter des index pour les nouvelles colonnes
    try {
      await queryInterface.addIndex('equipes', ['created_by']);
      console.log('✅ Index créé pour equipes.created_by');
    } catch (error) {
      console.log('⚠️ Index equipes.created_by déjà présent ou erreur:', error.message);
    }

    try {
      await queryInterface.addIndex('membres_equipes', ['added_by']);
      console.log('✅ Index créé pour membres_equipes.added_by');
    } catch (error) {
      console.log('⚠️ Index membres_equipes.added_by déjà présent ou erreur:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les colonnes ajoutées
    await queryInterface.removeColumn('equipes', 'created_by');
    await queryInterface.removeColumn('membres_equipes', 'joined_at');
    await queryInterface.removeColumn('membres_equipes', 'added_by');
  }
};
