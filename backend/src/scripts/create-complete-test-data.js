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

async function createCompleteTestData() {
  try {
    console.log('=== CRÉATION DE DONNÉES DE TEST COMPLÈTES ===');
    
    // Tester la connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
    
    // Vérifier les tables existantes et leurs structures
    const [users] = await sequelize.query('SELECT id FROM users LIMIT 1;');
    const [fields] = await sequelize.query('SELECT id FROM fields LIMIT 1;');
    
    console.log(`📊 Utilisateurs trouvés: ${users.length}`);
    console.log(`📊 Terrains trouvés: ${fields.length}`);
    
    // Créer des utilisateurs de test si nécessaire
    let testUserId = users.length > 0 ? users[0].id : null;
    if (!testUserId) {
      console.log('Création d\'un utilisateur de test...');
      const userInsert = `
        INSERT INTO users (id, first_name, last_name, email, password, phone, role, is_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO NOTHING
        RETURNING id;
      `;
      
      const [userResult] = await sequelize.query(userInsert, {
        bind: [
          'test-user-id-123',
          'John',
          'Doe',
          'john.doe@test.com',
          '$2a$10$hashedpassword',
          '+221771234567',
          'user',
          true
        ]
      });
      
      testUserId = userResult.length > 0 ? userResult[0].id : 'test-user-id-123';
    }
    
    // Créer des terrains de test si nécessaire
    let testFieldId = fields.length > 0 ? fields[0].id : null;
    if (!testFieldId) {
      console.log('Création d\'un terrain de test...');
      const fieldInsert = `
        INSERT INTO fields (id, name, description, size, surface_type, price_per_hour, location, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
        RETURNING id;
      `;
      
      const [fieldResult] = await sequelize.query(fieldInsert, {
        bind: [
          'test-field-id-123',
          'Terrain de Test',
          'Terrain pour les tests',
          'standard',
          'grass',
          25000,
          'Dakar, Sénégal',
          true
        ]
      });
      
      testFieldId = fieldResult.length > 0 ? fieldResult[0].id : 'test-field-id-123';
    }
    
    // Créer des réservations de test
    console.log('Création de réservations de test...');
    const testReservations = [
      {
        id: 'test-reservation-1',
        user_id: testUserId,
        field_id: testFieldId,
        start_time: new Date('2024-01-15T10:00:00Z'),
        end_time: new Date('2024-01-15T12:00:00Z'),
        status: 'confirmed',
        total_amount: 50000
      },
      {
        id: 'test-reservation-2',
        user_id: testUserId,
        field_id: testFieldId,
        start_time: new Date('2024-01-16T14:00:00Z'),
        end_time: new Date('2024-01-16T16:00:00Z'),
        status: 'confirmed',
        total_amount: 50000
      }
    ];
    
    for (const reservation of testReservations) {
      const reservationInsert = `
        INSERT INTO reservations (id, user_id, field_id, start_time, end_time, status, total_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING;
      `;
      
      await sequelize.query(reservationInsert, {
        bind: [
          reservation.id,
          reservation.user_id,
          reservation.field_id,
          reservation.start_time,
          reservation.end_time,
          reservation.status,
          reservation.total_amount
        ]
      });
    }
    
    console.log(`✅ ${testReservations.length} réservations de test créées`);
    
    // Créer des paiements de test
    console.log('Création de paiements de test...');
    const testPayments = [
      {
        id: 'test-payment-1',
        reservation_id: 'test-reservation-1',
        amount: 25000,
        payment_method: 'wave',
        payment_status: 'completed',
        transaction_id: 'TRX001234567',
        payment_date: new Date('2024-01-15T10:30:00Z'),
        receipt_url: 'https://example.com/receipt/001',
        payment_details: JSON.stringify({ phone: '+221771234567', reference: 'WAVE001' })
      },
      {
        id: 'test-payment-2',
        reservation_id: 'test-reservation-2',
        amount: 30000,
        payment_method: 'orange_money',
        payment_status: 'completed',
        transaction_id: 'TRX001234568',
        payment_date: new Date('2024-01-16T14:15:00Z'),
        receipt_url: 'https://example.com/receipt/002',
        payment_details: JSON.stringify({ phone: '+221771234568', reference: 'OM002' })
      },
      {
        id: 'test-payment-3',
        reservation_id: 'test-reservation-1',
        amount: 20000,
        payment_method: 'stripe',
        payment_status: 'pending',
        transaction_id: 'TRX001234569',
        payment_date: new Date('2024-01-17T16:45:00Z'),
        receipt_url: null,
        payment_details: JSON.stringify({ card_last4: '4242', brand: 'visa' })
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
    
    // Afficher quelques exemples
    const [examples] = await sequelize.query(`
      SELECT p.id, p.amount, p.payment_method, p.payment_status, p.payment_date, r.id as reservation_id
      FROM payments p
      JOIN reservations r ON p.reservation_id = r.id
      LIMIT 3;
    `);
    
    console.log('\n🔍 Exemples de paiements avec réservations:');
    examples.forEach((payment, index) => {
      console.log(`\nPaiement ${index + 1}:`);
      console.log(`  ID: ${payment.id}`);
      console.log(`  Réservation: ${payment.reservation_id}`);
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

createCompleteTestData();
