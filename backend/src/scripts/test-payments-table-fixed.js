require('dotenv').config();
const { Sequelize } = require('sequelize');

// Créer une connexion Sequelize avec la configuration correcte
const sequelize = new Sequelize(
  process.env.DB_NAME || 'urban_foot_center',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function testPaymentsTable() {
  try {
    console.log('=== TEST DE LA TABLE PAYMENTS ===');
    
    // Tester la connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
    
    // Compter le nombre total de paiements
    const [countResult] = await sequelize.query('SELECT COUNT(*) as total FROM payments;');
    console.log(`📊 Nombre total de paiements: ${countResult[0].total}`);
    
    // Récupérer quelques exemples de paiements
    const [results] = await sequelize.query('SELECT * FROM payments LIMIT 5;');
    
    if (results.length > 0) {
      console.log('\n🔍 Exemples de données:');
      results.forEach((payment, index) => {
        console.log(`\nPaiement ${index + 1}:`);
        console.log(`  ID: ${payment.id}`);
        console.log(`  Montant: ${payment.amount} ${payment.currency || 'XOF'}`);
        console.log(`  Statut: ${payment.status}`);
        console.log(`  Méthode: ${payment.payment_method}`);
        console.log(`  Date: ${payment.created_at}`);
      });
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
