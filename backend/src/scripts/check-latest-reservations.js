const { sequelize } = require('../config/database');

async function checkLatestReservations() {
  try {
    console.log('🔄 Vérification des dernières réservations...');
    
    // Récupérer les 10 dernières réservations
    const [reservations] = await sequelize.query(`
      SELECT 
        r.id,
        r.user_id,
        r.field_id,
        r.reservation_date,
        r.start_time,
        r.end_time,
        r.status,
        r.payment_status,
        r.total_price,
        r.created_at,
        f.name as field_name,
        u.first_name,
        u.last_name,
        u.email
      FROM reservations r
      LEFT JOIN fields f ON r.field_id = f.id
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 10;
    `);
    
    console.log(`📊 ${reservations.length} réservations trouvées:`);
    
    reservations.forEach((res, index) => {
      console.log(`\n${index + 1}. Réservation ID: ${res.id}`);
      console.log(`   👤 Client: ${res.first_name} ${res.last_name} (${res.email})`);
      console.log(`   🏟️  Terrain: ${res.field_name}`);
      console.log(`   📅 Date: ${res.reservation_date}`);
      console.log(`   ⏰ Heure: ${res.start_time} - ${res.end_time}`);
      console.log(`   💰 Prix: ${res.total_price} FCFA`);
      console.log(`   📋 Statut: ${res.status}`);
      console.log(`   💳 Paiement: ${res.payment_status}`);
      console.log(`   🕐 Créée le: ${res.created_at}`);
    });
    
    // Vérifier les paiements associés
    console.log('\n💳 Vérification des paiements...');
    const [payments] = await sequelize.query(`
      SELECT 
        p.id,
        p.reservation_id,
        p.amount,
        p.payment_method,
        p.payment_status,
        p.transaction_id,
        p.created_at,
        r.reservation_date
      FROM payments p
      LEFT JOIN reservations r ON p.reservation_id = r.id
      ORDER BY p.created_at DESC
      LIMIT 5;
    `);
    
    console.log(`📊 ${payments.length} paiements trouvés:`);
    payments.forEach((pay, index) => {
      console.log(`\n${index + 1}. Paiement ID: ${pay.id}`);
      console.log(`   🔗 Réservation: ${pay.reservation_id}`);
      console.log(`   💰 Montant: ${pay.amount} FCFA`);
      console.log(`   💳 Méthode: ${pay.payment_method}`);
      console.log(`   📋 Statut: ${pay.payment_status}`);
      console.log(`   🔢 Transaction: ${pay.transaction_id}`);
      console.log(`   📅 Date réservation: ${pay.reservation_date}`);
      console.log(`   🕐 Créé le: ${pay.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
checkLatestReservations();
