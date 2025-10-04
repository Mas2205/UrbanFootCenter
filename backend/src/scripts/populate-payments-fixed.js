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

async function populateTestPayments() {
  try {
    console.log('=== CRÉATION DE DONNÉES DE TEST POUR LES PAIEMENTS ===');
    
    // Tester la connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
    
    // Vérifier s'il existe des réservations pour créer des paiements réalistes
    const [reservations] = await sequelize.query('SELECT id FROM reservations LIMIT 5;');
    
    if (reservations.length === 0) {
      console.log('⚠️  Aucune réservation trouvée. Création de paiements avec des IDs de réservation fictifs...');
    }
    
    // Générer des données de test pour les paiements (utilisant seulement les colonnes existantes)
    const testPayments = [
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        reservation_id: reservations.length > 0 ? reservations[0].id : 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
        amount: 25000,
        payment_method: 'wave',
        payment_status: 'completed',
        transaction_id: 'TRX001234567',
        payment_date: new Date('2024-01-15T10:30:00Z'),
        receipt_url: 'https://example.com/receipt/001',
        payment_details: JSON.stringify({ phone: '+221771234567', reference: 'WAVE001' })
      },
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
        reservation_id: reservations.length > 1 ? reservations[1].id : 'a47ac10b-58cc-4372-a567-0e02b2c3d480',
        amount: 30000,
        payment_method: 'orange_money',
        payment_status: 'completed',
        transaction_id: 'TRX001234568',
        payment_date: new Date('2024-01-16T14:15:00Z'),
        receipt_url: 'https://example.com/receipt/002',
        payment_details: JSON.stringify({ phone: '+221771234568', reference: 'OM002' })
      },
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
        reservation_id: reservations.length > 2 ? reservations[2].id : 'a47ac10b-58cc-4372-a567-0e02b2c3d481',
        amount: 20000,
        payment_method: 'stripe',
        payment_status: 'pending',
        transaction_id: 'TRX001234569',
        payment_date: new Date('2024-01-17T16:45:00Z'),
        receipt_url: null,
        payment_details: JSON.stringify({ card_last4: '4242', brand: 'visa' })
      }
    ];
    
    // Insérer les données de test (utilisant seulement les colonnes existantes)
    for (const payment of testPayments) {
      const insertQuery = `
        INSERT INTO payments (id, reservation_id, amount, payment_method, payment_status, transaction_id, payment_date, receipt_url, payment_details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING;
      `;
      
      await sequelize.query(insertQuery, {
        bind: [
          payment.id,
          payment.reservation_id,
          payment.amount,
          payment.payment_method,
          payment.payment_status,
          payment.transaction_id,
          payment.payment_date,
          payment.receipt_url,
          payment.payment_details
        ]
      });
    }
    
    console.log(`✅ ${testPayments.length} paiements de test créés avec succès`);
    
    // Vérifier les données insérées
    const [results] = await sequelize.query('SELECT COUNT(*) as total FROM payments;');
    console.log(`📊 Nombre total de paiements maintenant: ${results[0].total}`);
    
    // Afficher quelques exemples
    const [examples] = await sequelize.query('SELECT * FROM payments LIMIT 3;');
    console.log('\n🔍 Exemples de paiements créés:');
    examples.forEach((payment, index) => {
      console.log(`\nPaiement ${index + 1}:`);
      console.log(`  ID: ${payment.id}`);
      console.log(`  Montant: ${payment.amount} XOF`);
      console.log(`  Statut: ${payment.payment_status}`);
      console.log(`  Méthode: ${payment.payment_method}`);
      console.log(`  Date: ${payment.payment_date}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error);
  } finally {
    await sequelize.close();
  }
}

populateTestPayments();
