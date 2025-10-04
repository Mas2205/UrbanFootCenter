require('dotenv').config();
const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

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

async function createTestDataWithCorrectEnums() {
  try {
    console.log('=== CRÉATION DE DONNÉES DE TEST AVEC ÉNUMÉRATIONS CORRECTES ===');
    
    // Tester la connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
    
    // Récupérer les utilisateurs et terrains existants
    const [users] = await sequelize.query('SELECT id FROM users LIMIT 1;');
    const [fields] = await sequelize.query('SELECT id FROM fields LIMIT 1;');
    
    console.log(`📊 Utilisateurs trouvés: ${users.length}`);
    console.log(`📊 Terrains trouvés: ${fields.length}`);
    
    if (users.length === 0 || fields.length === 0) {
      console.log('❌ Pas assez d\'utilisateurs ou de terrains pour créer des réservations');
      return;
    }
    
    const testUserId = users[0].id;
    const testFieldId = fields[0].id;
    
    // Générer des UUIDs pour les réservations
    const reservationIds = [uuidv4(), uuidv4(), uuidv4()];
    
    // Créer des réservations de test avec les bonnes valeurs d'énumération
    console.log('Création de réservations de test...');
    const testReservations = [
      {
        id: reservationIds[0],
        user_id: testUserId,
        field_id: testFieldId,
        reservation_date: '2024-01-15',
        start_time: '10:00:00',
        end_time: '12:00:00',
        status: 'confirmed',
        total_price: 50000,
        payment_status: 'paid'  // Valeur valide: pending, paid, refunded, failed
      },
      {
        id: reservationIds[1],
        user_id: testUserId,
        field_id: testFieldId,
        reservation_date: '2024-01-16',
        start_time: '14:00:00',
        end_time: '16:00:00',
        status: 'confirmed',
        total_price: 50000,
        payment_status: 'paid'
      },
      {
        id: reservationIds[2],
        user_id: testUserId,
        field_id: testFieldId,
        reservation_date: '2024-01-17',
        start_time: '16:00:00',
        end_time: '18:00:00',
        status: 'pending',
        total_price: 50000,
        payment_status: 'pending'
      }
    ];
    
    for (const reservation of testReservations) {
      const reservationInsert = `
        INSERT INTO reservations (id, user_id, field_id, reservation_date, start_time, end_time, status, total_price, payment_status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `;
      
      await sequelize.query(reservationInsert, {
        bind: [
          reservation.id,
          reservation.user_id,
          reservation.field_id,
          reservation.reservation_date,
          reservation.start_time,
          reservation.end_time,
          reservation.status,
          reservation.total_price,
          reservation.payment_status
        ]
      });
    }
    
    console.log(`✅ ${testReservations.length} réservations de test créées`);
    
    // Créer des paiements de test avec les bonnes valeurs d'énumération
    console.log('Création de paiements de test...');
    const testPayments = [
      {
        id: uuidv4(),
        reservation_id: reservationIds[0],
        amount: 25000,
        payment_method: 'wave',
        payment_status: 'completed',  // Valeur valide: pending, completed, failed, refunded
        transaction_id: 'TRX001234567',
        payment_date: new Date('2024-01-15T10:30:00Z'),
        receipt_url: 'https://example.com/receipt/001',
        payment_details: JSON.stringify({ phone: '+221771234567', reference: 'WAVE001' })
      },
      {
        id: uuidv4(),
        reservation_id: reservationIds[1],
        amount: 30000,
        payment_method: 'orange_money',
        payment_status: 'completed',
        transaction_id: 'TRX001234568',
        payment_date: new Date('2024-01-16T14:15:00Z'),
        receipt_url: 'https://example.com/receipt/002',
        payment_details: JSON.stringify({ phone: '+221771234568', reference: 'OM002' })
      },
      {
        id: uuidv4(),
        reservation_id: reservationIds[0],
        amount: 25000,
        payment_method: 'stripe',
        payment_status: 'completed',
        transaction_id: 'TRX001234569',
        payment_date: new Date('2024-01-15T11:00:00Z'),
        receipt_url: 'https://example.com/receipt/003',
        payment_details: JSON.stringify({ card_last4: '4242', brand: 'visa' })
      },
      {
        id: uuidv4(),
        reservation_id: reservationIds[2],
        amount: 20000,
        payment_method: 'wave',
        payment_status: 'pending',
        transaction_id: 'TRX001234570',
        payment_date: new Date('2024-01-17T16:45:00Z'),
        receipt_url: null,
        payment_details: JSON.stringify({ phone: '+221771234569', reference: 'WAVE004' })
      },
      {
        id: uuidv4(),
        reservation_id: reservationIds[1],
        amount: 15000,
        payment_method: 'stripe',
        payment_status: 'failed',
        transaction_id: 'TRX001234571',
        payment_date: new Date('2024-01-16T15:00:00Z'),
        receipt_url: null,
        payment_details: JSON.stringify({ card_last4: '1234', brand: 'mastercard', error: 'insufficient_funds' })
      }
    ];
    
    for (const payment of testPayments) {
      const paymentInsert = `
        INSERT INTO payments (id, reservation_id, amount, payment_method, payment_status, transaction_id, payment_date, receipt_url, payment_details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING;
      `;
      
      await sequelize.query(paymentInsert, {
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
    
    console.log(`✅ ${testPayments.length} paiements de test créés`);
    
    // Vérifier les données créées
    const [paymentCount] = await sequelize.query('SELECT COUNT(*) as total FROM payments;');
    const [reservationCount] = await sequelize.query('SELECT COUNT(*) as total FROM reservations;');
    
    console.log(`\n📊 Résumé des données créées:`);
    console.log(`  - Réservations: ${reservationCount[0].total}`);
    console.log(`  - Paiements: ${paymentCount[0].total}`);
    
    // Afficher quelques exemples avec jointures
    const [examples] = await sequelize.query(`
      SELECT 
        p.id, 
        p.amount, 
        p.payment_method, 
        p.payment_status, 
        p.payment_date, 
        r.id as reservation_id,
        u.first_name,
        u.last_name,
        f.name as field_name
      FROM payments p
      JOIN reservations r ON p.reservation_id = r.id
      JOIN users u ON r.user_id = u.id
      JOIN fields f ON r.field_id = f.id
      ORDER BY p.payment_date DESC
      LIMIT 5;
    `);
    
    console.log('\n🔍 Exemples de paiements avec détails:');
    examples.forEach((payment, index) => {
      console.log(`\nPaiement ${index + 1}:`);
      console.log(`  ID: ${payment.id}`);
      console.log(`  Client: ${payment.first_name} ${payment.last_name}`);
      console.log(`  Terrain: ${payment.field_name}`);
      console.log(`  Montant: ${payment.amount} XOF`);
      console.log(`  Statut: ${payment.payment_status}`);
      console.log(`  Méthode: ${payment.payment_method}`);
      console.log(`  Date: ${payment.payment_date}`);
    });
    
    console.log('\n🎉 Données de test créées avec succès !');
    console.log('Vous pouvez maintenant rafraîchir l\'interface des paiements pour voir les données.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error);
  } finally {
    await sequelize.close();
  }
}

createTestDataWithCorrectEnums();
