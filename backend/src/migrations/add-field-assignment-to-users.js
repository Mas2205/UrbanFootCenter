const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function addFieldAssignmentToUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Ajout de la colonne field_id à la table users...');
    
    // Ajouter la colonne field_id à la table users
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS field_id UUID REFERENCES fields(id) ON DELETE SET NULL;
    `);
    
    console.log('✅ Colonne field_id ajoutée avec succès à la table users');
    
    // Créer un index pour optimiser les requêtes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_field_id ON users(field_id);
    `);
    
    console.log('✅ Index créé pour field_id');
    
    console.log('🎉 Migration terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  addFieldAssignmentToUsers()
    .then(() => {
      console.log('Migration terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erreur de migration:', error);
      process.exit(1);
    });
}

module.exports = { addFieldAssignmentToUsers };
