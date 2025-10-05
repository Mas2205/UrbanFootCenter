const { sequelize, Reservation, Field, TimeSlot, User } = require('../models');

async function testReservationCreation() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔄 Test de création de réservation...');
    
    // Données de test similaires à celles de l'erreur
    const testData = {
      user_id: 'd7a1b392-f061-48f6-bfc6-41879638fc60',
      field_id: 'a727274a-4068-414d-a2d6-0970697c2cdb',
      time_slot_id: 'd0c622f6-c57a-4ba3-83ae-58bf2bb66be4',
      reservation_date: '2025-10-07', // Date différente pour éviter les conflits
      start_time: '14:00-15:00',
      payment_method: 'especes'
    };
    
    console.log('📤 Données de test:', testData);
    
    // Vérifier que le terrain existe
    const field = await Field.findByPk(testData.field_id);
    if (!field) {
      throw new Error('Terrain non trouvé');
    }
    console.log('✅ Terrain trouvé:', field.name);
    
    // Vérifier que le créneau horaire existe
    const timeSlot = await TimeSlot.findByPk(testData.time_slot_id);
    if (!timeSlot) {
      throw new Error('Créneau horaire non trouvé');
    }
    console.log('✅ Créneau horaire trouvé:', timeSlot.start_time, '-', timeSlot.end_time);
    
    // Calculer les heures de début et fin
    let calculatedStartTime, calculatedEndTime;
    if (testData.start_time && testData.start_time.includes('-')) {
      const [startPart, endPart] = testData.start_time.split('-');
      calculatedStartTime = startPart + ':00';
      calculatedEndTime = endPart + ':00';
    } else {
      calculatedStartTime = timeSlot.start_time;
      calculatedEndTime = timeSlot.end_time;
    }
    
    console.log('🕐 Heures calculées:', { calculatedStartTime, calculatedEndTime });
    
    // Vérifier les conflits (sans time_slot_id)
    const existingReservation = await Reservation.findOne({
      where: {
        field_id: testData.field_id,
        reservation_date: testData.reservation_date,
        start_time: calculatedStartTime
      }
    });
    
    if (existingReservation) {
      console.log('⚠️  Réservation existante trouvée, utilisation d\'une autre heure...');
      calculatedStartTime = '15:00:00';
      calculatedEndTime = '16:00:00';
    }
    
    // Créer la réservation
    const reservationData = {
      user_id: testData.user_id,
      field_id: testData.field_id,
      reservation_date: testData.reservation_date,
      start_time: calculatedStartTime,
      end_time: calculatedEndTime,
      total_price: field.price_per_hour || 21000,
      status: 'confirmed',
      payment_status: 'pending_cash'
    };
    
    console.log('💾 Création de la réservation avec:', reservationData);
    
    const reservation = await Reservation.create(reservationData, { transaction });
    
    console.log('✅ Réservation créée avec succès !');
    console.log('   ID:', reservation.id);
    console.log('   Date:', reservation.reservation_date);
    console.log('   Heure:', reservation.start_time, '-', reservation.end_time);
    console.log('   Statut:', reservation.status);
    console.log('   Paiement:', reservation.payment_status);
    
    await transaction.commit();
    console.log('✅ Transaction commitée avec succès');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Détails:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le test
testReservationCreation();
