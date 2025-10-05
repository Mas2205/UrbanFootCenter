const { sequelize } = require('../config/database');

async function checkLatestReservationsDetailed() {
  try {
    console.log('🔄 Vérification détaillée des dernières réservations...');
    
    // Vérifier les réservations pour la date du 18 octobre 2025
    const [reservationsOct18] = await sequelize.query(`
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
        u.email,
        f.name as field_name
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN fields f ON r.field_id = f.id
      WHERE r.reservation_date = '2025-10-18'
      ORDER BY r.created_at DESC;
    `);
    
    console.log(`📅 Réservations pour le 18 octobre 2025: ${reservationsOct18.length}`);
    
    if (reservationsOct18.length > 0) {
      reservationsOct18.forEach((res, index) => {
        console.log(`\n${index + 1}. Réservation trouvée:`);
        console.log(`   ID: ${res.id}`);
        console.log(`   Email: ${res.email}`);
        console.log(`   Terrain: ${res.field_name}`);
        console.log(`   Heure: ${res.start_time} - ${res.end_time}`);
        console.log(`   Statut: ${res.status}`);
        console.log(`   Paiement: ${res.payment_status}`);
        console.log(`   Créée le: ${res.created_at}`);
      });
    } else {
      console.log('❌ Aucune réservation trouvée pour le 18 octobre 2025');
    }
    
    // Vérifier les dernières réservations en général
    const [latestReservations] = await sequelize.query(`
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
        u.email,
        f.name as field_name
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN fields f ON r.field_id = f.id
      WHERE r.created_at > NOW() - INTERVAL '1 hour'
      ORDER BY r.created_at DESC
      LIMIT 5;
    `);
    
    console.log(`\n📊 Réservations créées dans la dernière heure: ${latestReservations.length}`);
    
    if (latestReservations.length > 0) {
      latestReservations.forEach((res, index) => {
        console.log(`\n${index + 1}. Réservation récente:`);
        console.log(`   ID: ${res.id}`);
        console.log(`   Email: ${res.email}`);
        console.log(`   Date: ${res.reservation_date}`);
        console.log(`   Heure: ${res.start_time} - ${res.end_time}`);
        console.log(`   Statut: ${res.status}`);
        console.log(`   Paiement: ${res.payment_status}`);
        console.log(`   Créée le: ${res.created_at}`);
      });
    } else {
      console.log('❌ Aucune réservation créée dans la dernière heure');
    }
    
    // Vérifier les paiements récents
    console.log('\n💳 Vérification des paiements récents...');
    const [recentPayments] = await sequelize.query(`
      SELECT 
        p.id,
        p.reservation_id,
        p.amount,
        p.payment_method,
        p.payment_status,
        p.transaction_id,
        r.reservation_date,
        r.start_time
      FROM payments p
      LEFT JOIN reservations r ON p.reservation_id = r.id
      ORDER BY p.id DESC
      LIMIT 3;
    `);
    
    console.log(`📊 ${recentPayments.length} paiements récents:`);
    recentPayments.forEach((pay, index) => {
      console.log(`\n${index + 1}. Paiement:`);
      console.log(`   ID: ${pay.id}`);
      console.log(`   Réservation: ${pay.reservation_id}`);
      console.log(`   Montant: ${pay.amount} FCFA`);
      console.log(`   Méthode: ${pay.payment_method}`);
      console.log(`   Statut: ${pay.payment_status}`);
      console.log(`   Date réservation: ${pay.reservation_date} ${pay.start_time}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
checkLatestReservationsDetailed();
