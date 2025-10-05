console.log('🎯 Test final de l\'API de réservation avec paiement en espèces');
console.log('');
console.log('Pour tester, créez une nouvelle réservation via le frontend avec :');
console.log('- Date: 2025-10-08');
console.log('- Heure: 17:00-18:00');
console.log('- Méthode de paiement: Espèces');
console.log('');
console.log('Résultat attendu:');
console.log('✅ Statut 201 (Created)');
console.log('✅ Réservation créée avec statut "confirmed"');
console.log('✅ Paiement créé avec statut "pending"');
console.log('✅ Pas d\'erreur de rollback');
console.log('✅ Emails/notifications traités en arrière-plan');
console.log('');
console.log('🔍 Surveillez les logs du serveur pour confirmer le bon fonctionnement !');

// Vérifier rapidement les dernières réservations
const { sequelize } = require('../config/database');

async function checkLatestReservations() {
  try {
    const [reservations] = await sequelize.query(`
      SELECT 
        r.id,
        r.reservation_date,
        r.start_time,
        r.end_time,
        r.status,
        r.payment_status,
        r.created_at,
        u.email,
        p.payment_method,
        p.payment_status as payment_actual_status
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN payments p ON r.id = p.reservation_id
      WHERE r.created_at > NOW() - INTERVAL '2 hours'
      ORDER BY r.created_at DESC
      LIMIT 3;
    `);
    
    console.log('📊 Dernières réservations (2 dernières heures):');
    reservations.forEach((res, index) => {
      console.log(`${index + 1}. ${res.reservation_date} ${res.start_time}-${res.end_time}`);
      console.log(`   👤 ${res.email}`);
      console.log(`   📋 Réservation: ${res.status} | Paiement: ${res.payment_status}`);
      console.log(`   💳 Méthode: ${res.payment_method} | Statut: ${res.payment_actual_status}`);
      console.log(`   🕐 Créée: ${res.created_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkLatestReservations();
