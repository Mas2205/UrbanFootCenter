const { sequelize, Payment, Reservation } = require('../models');

async function testCashPayment() {
  try {
    console.log('🔄 Test de création d\'un paiement en espèces...');
    
    // Récupérer une réservation existante sans paiement
    const reservation = await Reservation.findOne({
      where: {
        payment_status: 'pending'
      },
      order: [['created_at', 'DESC']]
    });
    
    if (!reservation) {
      console.log('❌ Aucune réservation en attente trouvée');
      return;
    }
    
    console.log(`✅ Réservation trouvée: ${reservation.id}`);
    console.log(`   📅 Date: ${reservation.reservation_date}`);
    console.log(`   💰 Prix: ${reservation.total_price} FCFA`);
    
    // Créer un paiement en espèces pour cette réservation
    const paymentData = {
      reservation_id: reservation.id,
      amount: reservation.total_price,
      payment_method: 'especes',
      payment_status: 'pending',
      transaction_id: `CASH_${Date.now()}_TEST`,
      payment_date: null, // Pas encore payé
      payment_details: {
        method: 'especes',
        status: 'pending',
        instructions: 'Paiement à effectuer sur place'
      }
    };
    
    console.log('💳 Création du paiement avec les données:', paymentData);
    
    const payment = await Payment.create(paymentData);
    
    console.log('✅ Paiement créé avec succès!');
    console.log(`   ID: ${payment.id}`);
    console.log(`   Méthode: ${payment.payment_method}`);
    console.log(`   Statut: ${payment.payment_status}`);
    console.log(`   Transaction ID: ${payment.transaction_id}`);
    
    // Vérifier que le paiement est bien en base
    const createdPayment = await Payment.findByPk(payment.id);
    if (createdPayment) {
      console.log('✅ Paiement vérifié en base de données');
    } else {
      console.log('❌ Paiement non trouvé en base de données');
    }
    
    // Mettre à jour le statut de paiement de la réservation
    await reservation.update({
      payment_status: 'pending_cash'
    });
    
    console.log('✅ Statut de la réservation mis à jour vers "pending_cash"');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Détails:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le test
testCashPayment();
