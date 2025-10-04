const { Reservation, Field, TimeSlot, User, Payment, PromoCode, sequelize, HolidayAndClosure } = require('../models');
const { Op } = require('sequelize');
const { sendReservationConfirmation, sendReservationCancellation } = require('../services/email.service');
const { createNotification } = require('../services/notification.service');
const paymentService = require('../services/paymentService');

// Créer une nouvelle réservation avec paiement intégré
exports.createReservationWithPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
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
    const field = await Field.findByPk(field_id);
    if (!field || !field.is_active) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Terrain non trouvé ou inactif'
      });
    }

    // Vérification que le créneau horaire existe
    const timeSlot = await TimeSlot.findByPk(time_slot_id);
    if (!timeSlot || !timeSlot.is_available) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Créneau horaire non trouvé ou non disponible'
      });
    }

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

    // Vérification qu'il n'y a pas déjà une réservation pour ce créneau à cette date
    const existingReservation = await Reservation.findOne({
      where: {
        field_id,
        time_slot_id,
        reservation_date,
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

    // Traiter le paiement
    console.log('Traitement du paiement:', { field_id, payment_method, amount: totalPrice });
    const paymentResult = await paymentService.processPayment(field_id, payment_method, paymentPayload);

    if (!paymentResult.success) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Échec du paiement',
        error: paymentResult.error,
        details: paymentResult.details
      });
    }

    // Créer la réservation
    const reservation = await Reservation.create({
      user_id,
      field_id,
      time_slot_id,
      reservation_date,
      total_price: totalPrice,
      status: 'confirmed', // Confirmée car le paiement a réussi
      promo_code_id: promo_code ? (await PromoCode.findOne({ where: { code: promo_code } }))?.id : null
    }, { transaction });

    // Créer l'enregistrement de paiement
    await Payment.create({
      reservation_id: reservation.id,
      amount: totalPrice,
      payment_method: payment_method,
      status: 'completed',
      transaction_id: paymentResult.transactionId,
      payment_date: new Date(),
      gateway_response: paymentResult.apiResponse
    }, { transaction });

    // Marquer le créneau comme non disponible pour cette date
    // (Optionnel selon votre logique métier)

    await transaction.commit();

    // Envoyer email de confirmation
    try {
      await sendReservationConfirmation(user.email, {
        reservation,
        field,
        timeSlot,
        user,
        paymentDetails: paymentResult
      });
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
    }

    // Créer une notification
    try {
      await createNotification(user_id, 'reservation_confirmed', {
        reservationId: reservation.id,
        fieldName: field.name,
        date: reservation_date
      });
    } catch (notifError) {
      console.error('Erreur création notification:', notifError);
    }

    // Récupérer la réservation complète avec les relations
    const completeReservation = await Reservation.findByPk(reservation.id, {
      include: [
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name', 'location', 'price_per_hour']
        },
        {
          model: TimeSlot,
          attributes: ['id', 'start_time', 'end_time', 'datefrom', 'dateto']
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

    res.status(201).json({
      success: true,
      message: 'Réservation créée et paiement effectué avec succès',
      data: {
        reservation: completeReservation,
        payment: paymentResult
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur lors de la création de la réservation avec paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
