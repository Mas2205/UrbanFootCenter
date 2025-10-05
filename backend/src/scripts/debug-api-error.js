const { sequelize, Reservation, Field, TimeSlot, User, Payment, PromoCode } = require('../models');
const { Op } = require('sequelize');

async function debugApiError() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔧 === SIMULATION COMPLÈTE DE L\'API ===');
    
    // Données exactes de la requête qui échoue
    const requestData = {
      field_id: 'a727274a-4068-414d-a2d6-0970697c2cdb',
      time_slot_id: 'd0c622f6-c57a-4ba3-83ae-58bf2bb66be4',
      reservation_date: '2025-10-06',
      start_time: '13:00-14:00',
      equipment_rental: false,
      payment_method: 'cash',
      promo_code: null
    };
    
    const user_id = 'd7a1b392-f061-48f6-bfc6-41879638fc60';
    
    console.log('📤 Données de la requête:', requestData);
    console.log('👤 User ID:', user_id);
    
    // Étape 1: Vérification du terrain
    console.log('\n🔍 Étape 1: Vérification du terrain...');
    const field = await Field.findByPk(requestData.field_id);
    if (!field || !field.is_active) {
      throw new Error('Terrain non trouvé ou inactif');
    }
    console.log('✅ Terrain trouvé:', field.name);
    
    // Étape 2: Vérification du créneau horaire
    console.log('\n🔍 Étape 2: Vérification du créneau horaire...');
    const timeSlot = await TimeSlot.findByPk(requestData.time_slot_id);
    if (!timeSlot || !timeSlot.is_available) {
      throw new Error('Créneau horaire non trouvé ou non disponible');
    }
    console.log('✅ Créneau horaire trouvé:', timeSlot.start_time, '-', timeSlot.end_time);
    
    // Étape 3: Vérification de correspondance terrain/créneau
    console.log('\n🔍 Étape 3: Vérification correspondance terrain/créneau...');
    if (timeSlot.field_id !== requestData.field_id) {
      throw new Error('Le créneau horaire ne correspond pas au terrain sélectionné');
    }
    console.log('✅ Terrain et créneau correspondent');
    
    // Étape 4: Calcul des heures
    console.log('\n🔍 Étape 4: Calcul des heures...');
    let calculatedStartTime, calculatedEndTime;
    if (requestData.start_time && requestData.start_time.includes('-')) {
      const [startPart, endPart] = requestData.start_time.split('-');
      calculatedStartTime = startPart + ':00';
      calculatedEndTime = endPart + ':00';
    } else {
      calculatedStartTime = timeSlot.start_time;
      calculatedEndTime = timeSlot.end_time;
    }
    console.log('✅ Heures calculées:', { calculatedStartTime, calculatedEndTime });
    
    // Étape 5: Vérification des conflits
    console.log('\n🔍 Étape 5: Vérification des conflits...');
    const existingReservation = await Reservation.findOne({
      where: {
        field_id: requestData.field_id,
        reservation_date: requestData.reservation_date,
        start_time: calculatedStartTime,
        status: {
          [Op.in]: ['confirmed', 'pending']
        }
      }
    });
    
    if (existingReservation) {
      throw new Error('Ce créneau est déjà réservé pour cette date');
    }
    console.log('✅ Aucun conflit détecté');
    
    // Étape 6: Calcul du prix
    console.log('\n🔍 Étape 6: Calcul du prix...');
    let totalPrice = field.price_per_hour;
    console.log('✅ Prix calculé:', totalPrice, 'FCFA');
    
    // Étape 7: Traitement du paiement
    console.log('\n🔍 Étape 7: Traitement du paiement...');
    let paymentResult;
    let reservationStatus;
    let paymentStatus;
    
    if (requestData.payment_method === 'cash' || requestData.payment_method === 'especes') {
      paymentResult = {
        success: true,
        transactionId: `CASH_${Date.now()}_${user_id}`,
        message: 'Paiement en espèces - À régler sur place au terrain',
        apiResponse: { method: 'especes', status: 'pending' }
      };
      reservationStatus = 'confirmed';
      paymentStatus = 'pending';
    }
    console.log('✅ Paiement traité:', paymentResult);
    
    // Étape 8: Création de la réservation
    console.log('\n🔍 Étape 8: Création de la réservation...');
    const reservationData = {
      user_id,
      field_id: requestData.field_id,
      reservation_date: requestData.reservation_date,
      start_time: calculatedStartTime,
      end_time: calculatedEndTime,
      total_price: totalPrice,
      status: reservationStatus,
      payment_status: paymentStatus
    };
    
    console.log('📝 Données de réservation:', reservationData);
    
    const reservation = await Reservation.create(reservationData, { transaction });
    console.log('✅ Réservation créée avec ID:', reservation.id);
    
    // Étape 9: Création du paiement
    console.log('\n🔍 Étape 9: Création du paiement...');
    const paymentData = {
      reservation_id: reservation.id,
      amount: totalPrice,
      payment_method: requestData.payment_method === 'cash' ? 'especes' : requestData.payment_method,
      payment_status: paymentStatus,
      transaction_id: paymentResult.transactionId,
      payment_date: paymentStatus === 'completed' ? new Date() : null,
      payment_details: paymentResult.apiResponse
    };
    
    console.log('💳 Données de paiement:', paymentData);
    
    const payment = await Payment.create(paymentData, { transaction });
    console.log('✅ Paiement créé avec ID:', payment.id);
    
    // Étape 10: Commit
    console.log('\n🔍 Étape 10: Commit de la transaction...');
    await transaction.commit();
    console.log('✅ Transaction commitée avec succès !');
    
    console.log('\n🎉 === SIMULATION RÉUSSIE ===');
    console.log('La logique complète fonctionne correctement !');
    
  } catch (error) {
    await transaction.rollback();
    console.error('\n🚨 === ERREUR DÉTECTÉE ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
  } finally {
    await sequelize.close();
  }
}

// Exécuter le debug
debugApiError();
