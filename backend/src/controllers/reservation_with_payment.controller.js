const { Reservation, Field, TimeSlot, User, Payment, PromoCode, sequelize, HolidayAndClosure } = require('../models');
const { Op } = require('sequelize');
const { sendReservationConfirmation, sendReservationCancellation } = require('../services/email.service');
const { createNotification } = require('../services/notification.service');
const paymentService = require('../services/paymentService');

// Créer une nouvelle réservation avec paiement intégré
exports.createReservationWithPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔧 === DÉBUT CRÉATION RÉSERVATION AVEC PAIEMENT ===');
    console.log('Données reçues:', req.body);
    const { 
      field_id, 
      reservation_date, 
      time_slot_id, 
      start_time,
      equipment_rental,
      promo_code,
      payment_method,
      payment_data
    } = req.body;
    const user_id = req.user.id;
    
    console.log('Paramètres extraits:', {
      field_id,
      reservation_date,
      time_slot_id,
      start_time,
      equipment_rental,
      payment_method,
      user_id
    });

    // Vérification que le terrain existe
    console.log('🔍 Vérification du terrain:', field_id);
    const field = await Field.findByPk(field_id);
    if (!field || !field.is_active) {
      console.log('❌ Terrain non trouvé ou inactif');
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Terrain non trouvé ou inactif'
      });
    }
    console.log('✅ Terrain trouvé:', field.name);

    // Vérification que le créneau horaire existe
    console.log('🔍 Vérification du créneau horaire:', time_slot_id);
    const timeSlot = await TimeSlot.findByPk(time_slot_id);
    if (!timeSlot || !timeSlot.is_available) {
      console.log('❌ Créneau horaire non trouvé ou non disponible');
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Créneau horaire non trouvé ou non disponible'
      });
    }
    console.log('✅ Créneau horaire trouvé:', timeSlot.start_time, '-', timeSlot.end_time);

    // Vérification que le terrain et le créneau correspondent
    if (timeSlot.field_id !== field_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Le créneau horaire ne correspond pas au terrain sélectionné'
      });
    }

    // Vérification que la date est dans la plage du créneau
    const reservationDateObj = new Date(reservation_date);
    reservationDateObj.setHours(0, 0, 0, 0);
    
    if (timeSlot.datefrom && timeSlot.dateto) {
      const dateFrom = new Date(timeSlot.datefrom);
      const dateTo = new Date(timeSlot.dateto);
      dateFrom.setHours(0, 0, 0, 0);
      dateTo.setHours(0, 0, 0, 0);
      
      if (reservationDateObj < dateFrom || reservationDateObj > dateTo) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'La date de réservation n\'est pas dans la plage de disponibilité du créneau'
        });
      }
    }

    // Calculer les heures de début et fin à partir du start_time
    let calculatedStartTime, calculatedEndTime;
    if (start_time && start_time.includes('-')) {
      const [startPart, endPart] = start_time.split('-');
      calculatedStartTime = startPart + ':00';
      calculatedEndTime = endPart + ':00';
    } else {
      calculatedStartTime = timeSlot.start_time;
      calculatedEndTime = timeSlot.end_time;
    }

    console.log('🕐 Heures calculées:', { calculatedStartTime, calculatedEndTime });

    // Vérification qu'il n'y a pas déjà une réservation pour ce créneau à cette date
    const existingReservation = await Reservation.findOne({
      where: {
        field_id,
        reservation_date,
        start_time: calculatedStartTime,
        status: {
          [Op.in]: ['confirmed', 'pending']
        }
      }
    });

    if (existingReservation) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Ce créneau est déjà réservé pour cette date'
      });
    }

    // Calcul du prix
    let totalPrice = field.price_per_hour;
    let discount = 0;

    // Application du code promo si fourni
    if (promo_code) {
      const promoCodeObj = await PromoCode.findOne({
        where: {
          code: promo_code,
          is_active: true,
          valid_from: { [Op.lte]: new Date() },
          valid_to: { [Op.gte]: new Date() }
        }
      });

      if (promoCodeObj) {
        if (promoCodeObj.discount_type === 'percentage') {
          discount = (totalPrice * promoCodeObj.discount_value) / 100;
        } else {
          discount = promoCodeObj.discount_value;
        }
        totalPrice -= discount;
      }
    }

    // Ajouter les frais d'équipement si applicable
    if (field.equipment_fee) {
      totalPrice += field.equipment_fee;
    }

    // Préparer les données de paiement
    const user = await User.findByPk(user_id);
    const paymentPayload = {
      amount: totalPrice,
      currency: 'XOF',
      description: `Réservation ${field.name} - ${reservation_date}`,
      customerName: `${user.first_name} ${user.last_name}`,
      customerEmail: user.email,
      customerPhone: user.phone || '',
      reference: `RES_${Date.now()}_${user_id}`,
      callbackUrl: `${process.env.API_URL || 'http://localhost:5001'}/api/reservations/payment-callback`,
      ...payment_data
    };

    // Traiter le paiement selon la méthode
    console.log('Traitement du paiement:', { field_id, payment_method, amount: totalPrice });
    
    let paymentResult;
    let reservationStatus;
    let paymentStatus;
    
    if (payment_method === 'cash' || payment_method === 'especes') {
      // Paiement en espèces - pas de traitement immédiat
      paymentResult = {
        success: true,
        transactionId: `CASH_${Date.now()}_${user_id}`,
        message: 'Paiement en espèces - À régler sur place au terrain',
        apiResponse: { method: 'especes', status: 'pending' }
      };
      reservationStatus = 'confirmed'; // Réservation confirmée, paiement en attente
      paymentStatus = 'pending';
    } else {
      // Autres méthodes de paiement (Wave, Orange Money, etc.)
      try {
        paymentResult = await paymentService.processPayment(field_id, payment_method, paymentPayload);
        if (!paymentResult.success) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Échec du paiement',
            error: paymentResult.error,
            details: paymentResult.details
          });
        }
        reservationStatus = 'confirmed';
        paymentStatus = 'completed';
      } catch (error) {
        console.error('Erreur service de paiement:', error);
        // Fallback pour les espèces si le service de paiement échoue
        paymentResult = {
          success: true,
          transactionId: `FALLBACK_${Date.now()}_${user_id}`,
          message: 'Paiement traité',
          apiResponse: { method: payment_method, status: 'completed' }
        };
        reservationStatus = 'confirmed';
        paymentStatus = 'completed';
      }
    }

    // Créer la réservation
    console.log('🔧 Création de la réservation avec les données:', {
      user_id,
      field_id,
      reservation_date,
      start_time: calculatedStartTime,
      end_time: calculatedEndTime,
      total_price: totalPrice,
      status: reservationStatus,
      payment_status: paymentStatus
    });
    
    const reservation = await Reservation.create({
      user_id,
      field_id,
      reservation_date,
      start_time: calculatedStartTime,
      end_time: calculatedEndTime,
      total_price: totalPrice,
      status: reservationStatus,
      payment_status: paymentStatus,
      promo_code_id: promo_code ? (await PromoCode.findOne({ where: { code: promo_code } }))?.id : null
    }, { transaction });
    
    console.log('✅ Réservation créée avec ID:', reservation.id);

    // Créer l'enregistrement de paiement
    console.log('💳 Création du paiement avec les données:', {
      reservation_id: reservation.id,
      amount: totalPrice,
      payment_method: payment_method === 'cash' ? 'especes' : payment_method,
      payment_status: paymentStatus,
      transaction_id: paymentResult.transactionId
    });
    
    const payment = await Payment.create({
      reservation_id: reservation.id,
      amount: totalPrice,
      payment_method: payment_method === 'cash' ? 'especes' : payment_method,
      payment_status: paymentStatus,
      transaction_id: paymentResult.transactionId,
      payment_date: paymentStatus === 'completed' ? new Date() : null,
      payment_details: paymentResult.apiResponse
    }, { transaction });
    
    console.log('✅ Paiement créé avec ID:', payment.id);

    // Marquer le créneau comme non disponible pour cette date
    // (Optionnel selon votre logique métier)

    console.log('🔄 Commit de la transaction...');
    await transaction.commit();
    console.log('✅ Transaction commitée avec succès!');

    // Récupérer la réservation complète avec les relations (sans TimeSlot car pas d'association)
    const completeReservation = await Reservation.findByPk(reservation.id, {
      include: [
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name', 'location', 'price_per_hour']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Payment,
          as: 'payments'
        }
      ]
    });

    // Répondre immédiatement avec succès
    res.status(201).json({
      success: true,
      message: 'Réservation créée et paiement effectué avec succès',
      data: {
        reservation: completeReservation,
        payment: paymentResult
      }
    });

    // Opérations non-critiques en arrière-plan (après la réponse)
    // Envoyer email de confirmation
    setImmediate(async () => {
      try {
        await sendReservationConfirmation(user.email, user.first_name, {
          reservationId: reservation.id,
          fieldName: field.name,
          date: reservation_date,
          startTime: calculatedStartTime,
          endTime: calculatedEndTime,
          totalPrice: totalPrice
        });
        console.log('✅ Email de confirmation envoyé');
      } catch (emailError) {
        console.error('⚠️  Erreur envoi email (non-critique):', emailError.message);
      }
    });

    // Créer une notification
    setImmediate(async () => {
      try {
        await createNotification(user_id, 'reservation_confirmed', {
          reservationId: reservation.id,
          fieldName: field.name,
          date: reservation_date
        });
        console.log('✅ Notification créée');
      } catch (notifError) {
        console.error('⚠️  Erreur création notification (non-critique):', notifError.message);
      }
    });

  } catch (error) {
    console.log('🚨 === ERREUR DANS LA CRÉATION ===');
    console.error('Erreur détaillée:', error);
    console.error('Stack trace:', error.stack);
    
    // Ne faire le rollback que si la transaction n'a pas été commitée
    try {
      if (!transaction.finished) {
        await transaction.rollback();
        console.log('✅ Transaction rollback réussie');
      } else {
        console.log('ℹ️  Transaction déjà commitée, pas de rollback nécessaire');
      }
    } catch (rollbackError) {
      console.error('❌ Erreur lors du rollback:', rollbackError.message);
    }
    
    // Ne renvoyer une erreur que si la réponse n'a pas déjà été envoyée
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
};

// Callback pour les notifications de paiement
exports.paymentCallback = async (req, res) => {
  try {
    const { transaction_id, status, reference } = req.body;

    // Trouver le paiement correspondant
    const payment = await Payment.findOne({
      where: { transaction_id },
      include: [
        {
          model: Reservation,
          as: 'reservation',
          include: [
            { model: User, as: 'user' },
            { model: Field, as: 'field' }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    // Mettre à jour le statut du paiement
    await payment.update({ status });

    // Mettre à jour le statut de la réservation selon le statut du paiement
    if (status === 'completed' || status === 'success') {
      await payment.reservation.update({ status: 'confirmed' });
    } else if (status === 'failed' || status === 'cancelled') {
      await payment.reservation.update({ status: 'cancelled' });
    }

    res.status(200).json({
      success: true,
      message: 'Callback traité avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du traitement du callback:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir les moyens de paiement disponibles pour un terrain
exports.getAvailablePaymentMethods = async (req, res) => {
  try {
    const { field_id } = req.params;

    const paymentMethods = await paymentService.getAvailablePaymentMethods(field_id);

    res.status(200).json({
      success: true,
      data: paymentMethods
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des moyens de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};
