const { Payment, Reservation, User, Field, Sequelize } = require('../models');
const { Op } = Sequelize;
const PaymentService = require('../services/payment.service');
const { sendPaymentReceipt } = require('../services/email.service');
const { createNotification } = require('../services/notification.service');
const { createError } = require('../middlewares/error.middleware');

// Initialiser un paiement pour une réservation
exports.initiatePayment = async (req, res) => {
  try {
    const { reservation_id, payment_method } = req.body;
    const user_id = req.user.id;

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const reservation = await Reservation.findOne({
      where: { id: reservation_id, user_id },
      include: [{ model: Field, as: 'field' }]
    });

    if (!reservation) {
      throw createError('NotFoundError', 'Réservation non trouvée', 404);
    }

    // Vérifier que la réservation est en attente de paiement
    if (reservation.payment_status !== 'pending') {
      throw createError('ValidationError', `Cette réservation a déjà un statut de paiement: ${reservation.payment_status}`, 400);
    }

    // Préparer les données de réservation pour le paiement
    const reservationData = {
      reservation_id,
      amount: reservation.total_price,
      field_name: reservation.field.name
    };

    let paymentResult;

    // Traiter le paiement selon la méthode choisie
    switch (payment_method) {
      case 'stripe':
      case 'card':
        paymentResult = await PaymentService.createStripeCheckoutSession(reservationData, req.user);
        break;
      case 'wave':
        paymentResult = await PaymentService.initiateWavePayment(reservationData, req.user);
        break;
      case 'orange_money':
        paymentResult = await PaymentService.initiateOrangeMoneyPayment(reservationData, req.user);
        break;
      case 'cash':
      case 'especes':
        // Paiement en espèces - créer directement l'entrée de paiement
        paymentResult = {
          payment_id: require('uuid').v4(),
          status: 'pending',
          message: 'Paiement en espèces confirmé - À régler sur place au terrain',
          payment_method: 'especes',
          instructions: 'Présentez-vous au terrain avec cette réservation pour effectuer le paiement en espèces'
        };
        
        // Créer l'entrée de paiement dans la base de données
        await Payment.create({
          id: paymentResult.payment_id,
          reservation_id,
          user_id,
          amount: reservation.total_price,
          payment_method: 'especes',
          payment_status: 'pending',
          transaction_id: paymentResult.payment_id,
          created_at: new Date(),
          updated_at: new Date()
        });

        // Mettre à jour le statut de la réservation
        await reservation.update({
          payment_status: 'pending_cash'
        });

        // Créer une notification pour l'utilisateur
        await createNotification({
          user_id,
          title: 'Réservation confirmée - Paiement en espèces',
          message: `Votre réservation pour ${reservation.field.name} le ${reservation.reservation_date} est confirmée. Payez ${reservation.total_price} FCFA en espèces sur place.`,
          type: 'reservation_confirmed_cash',
          related_entity_id: reservation_id,
          related_entity_type: 'reservation'
        });
        break;
      default:
        throw createError('ValidationError', 'Méthode de paiement non supportée', 400);
    }

    // Retourner les informations nécessaires au client
    res.status(200).json({
      success: true,
      message: `Paiement ${payment_method} initié avec succès`,
      payment: paymentResult,
      reservation_id
    });
  } catch (error) {
    console.error('Erreur lors de l\'initiation du paiement:', error);
    
    if (error.name === 'ValidationError' || error.name === 'NotFoundError') {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'initiation du paiement',
      error: error.message
    });
  }
};

// Confirmer un paiement après redirection (pour les méthodes autres que les webhooks)
exports.confirmPayment = async (req, res) => {
  try {
    const { payment_id, session_id } = req.query;
    const user_id = req.user.id;

    // Selon le type de paiement, vérifier le statut
    if (session_id) {
      // Cas Stripe
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(session_id);
      
      if (session.payment_status === 'paid') {
        const payment = await Payment.findOne({
          where: { transaction_id: session.payment_intent },
          include: [
            { 
              model: Reservation,
              as: 'reservation',
              include: [{ model: Field, as: 'field' }]
            }
          ]
        });

        if (!payment) {
          throw createError('NotFoundError', 'Paiement non trouvé', 404);
        }

        // Vérifier que la réservation appartient à l'utilisateur
        if (payment.reservation.user_id !== user_id) {
          throw createError('AuthorizationError', 'Vous n\'êtes pas autorisé à accéder à ce paiement', 403);
        }

        return res.status(200).json({
          success: true,
          message: 'Paiement confirmé avec succès',
          reservation: payment.reservation,
          payment: {
            id: payment.id,
            amount: payment.amount,
            payment_method: payment.payment_method,
            payment_status: payment.payment_status,
            payment_date: payment.paid_at
          }
        });
      }
    } else if (payment_id) {
      // Cas général
      const payment = await Payment.findOne({
        where: { id: payment_id },
        include: [
          { 
            model: Reservation, 
            as: 'reservation',
            include: [{ model: Field, as: 'field' }]
          }
        ]
      });

      if (!payment) {
        throw createError('NotFoundError', 'Paiement non trouvé', 404);
      }

      // Vérifier que la réservation appartient à l'utilisateur
      if (payment.reservation.user_id !== user_id) {
        throw createError('AuthorizationError', 'Vous n\'êtes pas autorisé à accéder à ce paiement', 403);
      }

      return res.status(200).json({
        success: true,
        message: 'Statut du paiement',
        payment: {
          id: payment.id,
          amount: payment.amount,
          payment_method: payment.payment_method,
          payment_status: payment.payment_status,
          payment_date: payment.paid_at
        },
        reservation: payment.reservation
      });
    }

    res.status(400).json({
      success: false,
      message: 'Informations de paiement invalides'
    });
  } catch (error) {
    console.error('Erreur lors de la confirmation du paiement:', error);
    
    if (error.name === 'ValidationError' || error.name === 'NotFoundError' || error.name === 'AuthorizationError') {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation du paiement',
      error: error.message
    });
  }
};

// Webhook pour Stripe
exports.stripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret);

    // Traiter l'événement
    const result = await PaymentService.handleStripeWebhook(event);

    // Si le paiement est réussi, envoyer un reçu et créer une notification
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { reservation_id } = session.metadata;

      // Récupérer les informations nécessaires
      const reservation = await Reservation.findByPk(reservation_id, {
        include: [
          { model: User, as: 'user' },
          { model: Field, as: 'field' }
        ]
      });

      if (reservation) {
        // Envoyer un reçu par email
        await sendPaymentReceipt(reservation.user.email, reservation.user.first_name, {
          reservationId: reservation.id,
          fieldName: reservation.field.name,
          date: reservation.reservation_date,
          amount: session.amount_total / 100,
          paymentMethod: 'Carte bancaire (Stripe)',
          receiptUrl: `${process.env.FRONTEND_URL}/reservations/${reservation.id}/receipt`
        });

        // Créer une notification
        await createNotification({
          user_id: reservation.user_id,
          title: 'Paiement confirmé',
          message: `Votre paiement de ${session.amount_total / 100} FCFA pour la réservation du ${reservation.reservation_date} a été confirmé.`,
          type: 'payment_confirmed',
          related_entity_id: reservation.id,
          related_entity_type: 'reservation'
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erreur lors du traitement du webhook Stripe:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

// Webhook pour Wave
exports.waveWebhook = async (req, res) => {
  try {
    // Vérifier la signature du webhook
    // Cette vérification dépend de la documentation spécifique de WAVE
    
    const result = await PaymentService.handleWaveWebhook(req.body);

    // Si le paiement est réussi
    if (req.body.status === 'successful') {
      const { client_reference } = req.body; // ID de la réservation
      
      // Récupérer les informations nécessaires
      const reservation = await Reservation.findByPk(client_reference, {
        include: [
          { model: User, as: 'user' },
          { model: Field, as: 'field' },
          { model: Payment, as: 'payments', where: { payment_method: 'wave' }, limit: 1 }
        ]
      });

      if (reservation && reservation.payments.length > 0) {
        // Envoyer un reçu par email
        await sendPaymentReceipt(reservation.user.email, reservation.user.first_name, {
          reservationId: reservation.id,
          fieldName: reservation.field.name,
          date: reservation.reservation_date,
          amount: reservation.payments[0].amount,
          paymentMethod: 'WAVE',
          receiptUrl: `${process.env.FRONTEND_URL}/reservations/${reservation.id}/receipt`
        });

        // Créer une notification
        await createNotification({
          user_id: reservation.user_id,
          title: 'Paiement confirmé',
          message: `Votre paiement de ${reservation.payments[0].amount} FCFA via WAVE pour la réservation du ${reservation.reservation_date} a été confirmé.`,
          type: 'payment_confirmed',
          related_entity_id: reservation.id,
          related_entity_type: 'reservation'
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erreur lors du traitement du webhook WAVE:', error);
    res.status(500).json({ error: error.message });
  }
};

// Webhook pour Orange Money
exports.orangeMoneyWebhook = async (req, res) => {
  try {
    // Vérifier la signature du webhook
    // Cette vérification dépend de la documentation spécifique d'Orange Money
    
    const result = await PaymentService.handleOrangeMoneyWebhook(req.body);

    // Si le paiement est réussi
    if (req.body.status === 'SUCCESSFUL') {
      // Extraire l'ID de réservation de la référence
      const reservationId = req.body.reference.replace('R-', '');
      
      // Récupérer les informations nécessaires
      const reservation = await Reservation.findByPk(reservationId, {
        include: [
          { model: User, as: 'user' },
          { model: Field, as: 'field' },
          { model: Payment, as: 'payments', where: { payment_method: 'orange_money' }, limit: 1 }
        ]
      });

      if (reservation && reservation.payments.length > 0) {
        // Envoyer un reçu par email
        await sendPaymentReceipt(reservation.user.email, reservation.user.first_name, {
          reservationId: reservation.id,
          fieldName: reservation.field.name,
          date: reservation.reservation_date,
          amount: reservation.payments[0].amount,
          paymentMethod: 'Orange Money',
          receiptUrl: `${process.env.FRONTEND_URL}/reservations/${reservation.id}/receipt`
        });

        // Créer une notification
        await createNotification({
          user_id: reservation.user_id,
          title: 'Paiement confirmé',
          message: `Votre paiement de ${reservation.payments[0].amount} FCFA via Orange Money pour la réservation du ${reservation.reservation_date} a été confirmé.`,
          type: 'payment_confirmed',
          related_entity_id: reservation.id,
          related_entity_type: 'reservation'
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erreur lors du traitement du webhook Orange Money:', error);
    res.status(500).json({ error: error.message });
  }
};

// Récupérer l'historique des paiements d'un utilisateur
exports.getUserPayments = async (req, res) => {
  try {
    const user_id = req.user.id;

    const payments = await Payment.findAll({
      include: [
        {
          model: Reservation,
          as: 'reservation',
          where: { user_id },
          include: [{ model: Field, as: 'field', attributes: ['id', 'name'] }]
        }
      ],
      order: [['payment_date', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paiements',
      error: error.message
    });
  }
};

// Récupérer les détails d'un paiement
exports.getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const payment = await Payment.findOne({
      where: { id },
      include: [
        {
          model: Reservation,
          as: 'reservation',
          include: [{ model: Field, as: 'field' }]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    // Vérifier que l'utilisateur est autorisé à voir ce paiement
    if (payment.reservation.user_id !== user_id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à accéder à ce paiement'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails du paiement',
      error: error.message
    });
  }
};

// Admin: Valider un paiement
exports.validatePayment = async (req, res) => {
  try {
    const { reservationId } = req.params;
    console.log('🔍 validatePayment - Reservation ID:', reservationId);
    console.log('🔍 validatePayment - User:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      field_id: req.user.field_id
    });
    
    // Vérifier que la réservation existe
    const reservation = await Reservation.findByPk(reservationId, {
      include: [
        { model: Payment, as: 'payments' },
        { model: User, as: 'user' },
        { model: Field, as: 'field' }
      ]
    });
    
    console.log('🔍 validatePayment - Reservation trouvée:', {
      id: reservation?.id,
      field_id: reservation?.field_id,
      payment_status: reservation?.payment_status,
      payments_count: reservation?.payments?.length || 0
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier que l'admin peut valider ce paiement (pour son terrain)
    if (req.user.role === 'admin' && req.user.field_id !== reservation.field_id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez valider que les paiements de votre terrain'
      });
    }

    // Mettre à jour le statut de paiement de la réservation
    await reservation.update({
      payment_status: 'paid'
    });

    // Mettre à jour tous les paiements associés à cette réservation
    if (reservation.payments && reservation.payments.length > 0) {
      console.log('🔄 validatePayment - Mise à jour des paiements...');
      await Payment.update(
        { 
          payment_status: 'completed',
          payment_date: new Date() // Utiliser payment_date au lieu de paid_at
        },
        { where: { reservation_id: reservationId } }
      );
      console.log('✅ validatePayment - Paiements mis à jour');
    } else {
      console.log('⚠️  validatePayment - Aucun paiement trouvé pour cette réservation');
    }

    // Créer une notification pour l'utilisateur
    try {
      console.log('🔄 validatePayment - Création de la notification...');
      await createNotification(reservation.user_id, 'payment_confirmed', {
        reservationId: reservation.id,
        fieldName: reservation.field.name,
        amount: reservation.total_price,
        date: reservation.reservation_date
      });
      console.log('✅ validatePayment - Notification créée');
    } catch (notifError) {
      console.error('⚠️  validatePayment - Erreur notification (non-critique):', notifError.message);
    }

    // Envoyer un reçu par email si c'était un paiement en espèces
    try {
      console.log('🔄 validatePayment - Envoi du reçu par email...');
      const cashPayment = reservation.payments.find(p => p.payment_method === 'especes');
      if (cashPayment && reservation.user.email) {
        await sendPaymentReceipt(reservation.user.email, reservation.user.first_name, {
          reservationId: reservation.id,
          fieldName: reservation.field.name,
          date: reservation.reservation_date,
          amount: cashPayment.amount,
          paymentMethod: 'Espèces',
          receiptUrl: `${process.env.FRONTEND_URL}/reservations/${reservation.id}/receipt`
        });
        console.log('✅ validatePayment - Reçu envoyé par email');
      } else {
        console.log('⚠️  validatePayment - Pas d\'email à envoyer (pas de paiement espèces ou pas d\'email)');
      }
    } catch (emailError) {
      console.error('⚠️  validatePayment - Erreur email (non-critique):', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Paiement validé avec succès'
    });
  } catch (error) {
    console.log('🚨 === ERREUR VALIDATION PAIEMENT ===');
    console.error('Erreur détaillée:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du paiement',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Admin: Récupérer tous les paiements
exports.getAllPayments = async (req, res) => {
  try {
    // Filtres optionnels
    const { payment_method, payment_status, start_date, end_date } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    // Construction de la clause where
    const whereClause = {};
    if (payment_method) whereClause.payment_method = payment_method;
    if (payment_status) whereClause.payment_status = payment_status;
    
    const dateWhereClause = {};
    if (start_date && end_date) {
      dateWhereClause.payment_date = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    } else if (start_date) {
      dateWhereClause.payment_date = {
        [Op.gte]: new Date(start_date)
      };
    } else if (end_date) {
      dateWhereClause.payment_date = {
        [Op.lte]: new Date(end_date)
      };
    }

    // Construction de la clause where pour les réservations (filtrage par terrain pour les admins de terrain)
    const reservationWhereClause = {};
    if (req.user.role === 'admin' && req.user.field_id) {
      reservationWhereClause.field_id = req.user.field_id;
    }

    // Exécution de la requête
    const { count, rows: payments } = await Payment.findAndCountAll({
      where: { ...whereClause, ...dateWhereClause },
      include: [
        {
          model: Reservation,
          as: 'reservation',
          where: reservationWhereClause,
          include: [
            { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] },
            { model: Field, as: 'field', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: [['payment_date', 'DESC']],
      limit,
      offset
    });

    // Calcul des métriques (si disponible)
    let totalAmount = 0;
    for (const payment of payments) {
      if (payment.payment_status === 'completed' && payment.amount > 0) {
        totalAmount += payment.amount;
      }
    }

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      payments: payments, // Changé "data" en "payments" pour correspondre à l'attente du frontend
      total: count, // Ajouté "total" pour correspondre à l'attente du frontend
      metrics: {
        totalAmount,
        currency: 'FCFA'
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paiements',
      error: error.message
    });
  }
};
