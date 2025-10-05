const { sequelize } = require('../config/database');

async function checkPayments() {
  try {
    console.log('🔄 Vérification des paiements...');
    
    // Vérifier la structure de la table payments
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Structure de la table payments:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Compter les paiements
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total FROM payments;
    `);
    
    console.log(`\n📊 Nombre total de paiements: ${countResult[0].total}`);
    
    if (countResult[0].total > 0) {
      // Récupérer les derniers paiements
      const [payments] = await sequelize.query(`
        SELECT 
          p.id,
          p.reservation_id,
          p.amount,
          p.payment_method,
          p.payment_status,
          p.transaction_id,
          r.reservation_date
        FROM payments p
        LEFT JOIN reservations r ON p.reservation_id = r.id
        ORDER BY p.id DESC
        LIMIT 5;
      `);
      
      console.log(`\n💳 Derniers paiements:`);
      payments.forEach((pay, index) => {
        console.log(`\n${index + 1}. Paiement ID: ${pay.id}`);
        console.log(`   🔗 Réservation: ${pay.reservation_id}`);
        console.log(`   💰 Montant: ${pay.amount} FCFA`);
        console.log(`   💳 Méthode: ${pay.payment_method}`);
        console.log(`   📋 Statut: ${pay.payment_status}`);
        console.log(`   🔢 Transaction: ${pay.transaction_id}`);
        console.log(`   📅 Date réservation: ${pay.reservation_date}`);
      });
    }
    
    // Vérifier s'il y a des réservations récentes sans paiement
    console.log('\n🔍 Réservations récentes sans paiement...');
    const [reservationsWithoutPayment] = await sequelize.query(`
      SELECT 
        r.id,
        r.reservation_date,
        r.payment_status,
        r.total_price,
        u.email
      FROM reservations r
      LEFT JOIN payments p ON r.id = p.reservation_id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE p.id IS NULL 
        AND r.created_at > NOW() - INTERVAL '1 day'
      ORDER BY r.created_at DESC;
    `);
    
    if (reservationsWithoutPayment.length > 0) {
      console.log(`📊 ${reservationsWithoutPayment.length} réservations sans paiement trouvées:`);
      reservationsWithoutPayment.forEach((res, index) => {
        console.log(`${index + 1}. ${res.id} - ${res.email} - ${res.reservation_date} - ${res.payment_status}`);
      });
    } else {
      console.log('✅ Aucune réservation récente sans paiement');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
checkPayments();
