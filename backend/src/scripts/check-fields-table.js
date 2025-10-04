const { sequelize } = require('../config/database');

async function checkFieldsTable() {
  try {
    // Exécuter une requête SQL pour afficher la structure de la table fields
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'fields'
      ORDER BY ordinal_position;
    `);
    
    console.log('Structure de la table fields:');
    console.table(results);
    
    // Vérifier si la colonne location existe
    const locationColumn = results.find(col => col.column_name === 'location');
    if (locationColumn) {
      console.log('✅ La colonne location existe dans la table fields');
      console.log('Type:', locationColumn.data_type);
      console.log('Longueur maximale:', locationColumn.character_maximum_length);
      console.log('Nullable:', locationColumn.is_nullable);
    } else {
      console.log('❌ La colonne location n\'existe pas dans la table fields');
    }
    
    // Lire quelques terrains de la base de données pour voir si la colonne a des données
    const [fields] = await sequelize.query(`
      SELECT id, name, location
      FROM fields
      LIMIT 5;
    `);
    
    console.log('\nDonnées des terrains:');
    console.table(fields);
    
  } catch (error) {
    console.error('Erreur lors de la vérification de la table fields:', error);
  } finally {
    await sequelize.close();
  }
}

checkFieldsTable();
