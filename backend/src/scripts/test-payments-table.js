const { Sequelize } = require('sequelize');
const path = require('path');

// Importer la configuration de la base de données
const config = require('../config/database');

// Créer une connexion Sequelize
const sequelize = new Sequelize(config.development);

async function testPaymentsTable() {
  try {
    console.log('=== TEST DE LA TABLE PAYMENTS ===');
    
    // Tester la connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
    
    // Exécuter une requête directe sur la table payments
    const [results, metadata] = await sequelize.query('SELECT * FROM payments LIMIT 5;');
    
    console.log(`📊 Nombre de paiements trouvés: ${results.length}`);
    
    if (results.length > 0) {
      console.log('🔍 Exemple de données:');
      console.log(JSON.stringify(results[0], null, 2));
    } else {
      console.log('⚠️  Aucun paiement trouvé dans la table');
    }
    
    // Vérifier la structure de la table
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Structure de la table payments:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du test de la table payments:', error);
  } finally {
    await sequelize.close();
  }
}

testPaymentsTable();
