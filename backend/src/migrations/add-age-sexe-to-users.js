'use strict';

/**
 * Migration pour ajouter les colonnes age et sexe à la table users
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Vérifier si les colonnes existent déjà
      const tableDescription = await queryInterface.describeTable('users');
      
      // Ajouter la colonne age si elle n'existe pas
      if (!tableDescription.age) {
        await queryInterface.addColumn('users', 'age', {
          type: Sequelize.INTEGER,
          allowNull: true,
          validate: {
            min: 0,
            max: 120
          }
        });
        console.log('✅ Colonne age ajoutée avec succès à la table users');
      } else {
        console.log('⚠️ La colonne age existe déjà dans la table users');
      }
      
      // Créer le type ENUM pour sexe
      try {
        await queryInterface.sequelize.query('CREATE TYPE "enum_users_sexe" AS ENUM (\'M\', \'F\', \'Autre\')');
        console.log('✅ Type ENUM pour sexe créé avec succès');
      } catch (error) {
        // Si l'erreur est que le type existe déjà, on l'ignore
        if (error.message.includes('already exists')) {
          console.log('⚠️ Le type ENUM pour sexe existe déjà');
        } else {
          throw error;
        }
      }

      // Ajouter la colonne sexe si elle n'existe pas
      if (!tableDescription.sexe) {
        await queryInterface.addColumn('users', 'sexe', {
          type: Sequelize.ENUM('M', 'F', 'Autre'),
          allowNull: true
        });
        console.log('✅ Colonne sexe ajoutée avec succès à la table users');
      } else {
        console.log('⚠️ La colonne sexe existe déjà dans la table users');
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout des colonnes age et sexe:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Supprimer les colonnes en cas de rollback
      await queryInterface.removeColumn('users', 'age');
      await queryInterface.removeColumn('users', 'sexe');
      
      // Supprimer le type ENUM créé
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_sexe";');
      
      console.log('✅ Colonnes age et sexe supprimées avec succès de la table users');
      return Promise.resolve();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression des colonnes age et sexe:', error);
      return Promise.reject(error);
    }
  }
};
