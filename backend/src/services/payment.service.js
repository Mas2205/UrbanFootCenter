const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const crypto = require('crypto');
const { Payment, Reservation } = require('../models');
const { createError } = require('../middlewares/error.middleware');

/**
 * Service de paiement pour gérer toutes les transactions
 */
class PaymentService {
  /**
   * Initialise une session de paiement Stripe
   * @param {Object} reservationData - Données de la réservation
   * @param {Object} user - Utilisateur effectuant le paiement
   */
  static async createStripeCheckoutSession(reservationData, user) {
    try {
      const { reservation_id, amount, field_name } = reservationData;
      
      // Convertir le montant en centimes (Stripe utilise la plus petite unité monétaire)
      const amountInCents = Math.round(amount * 100);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'xof', // Franc CFA (XOF)
              product_data: {
                name: `Réservation - ${field_name}`,
                description: `Réservation #${reservation_id}`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          reservation_id,
          user_id: user.id,
        },
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/reservations/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/reservations/payment-cancel?reservation_id=${reservation_id}`,
        customer_email: user.email,
      });

      return { success: true, sessionId: session.id, url: session.url };
    } catch (error) {
      console.error('Erreur lors de la création de la session Stripe:', error);
      throw createError('PaymentError', 'Erreur lors de l\'initialisation du paiement Stripe', 500, error.message);
    }
  }

  /**
   * Vérifie et traite un webhook Stripe
   * @param {Object} event - Événement webhook Stripe
   */
  static async handleStripeWebhook(event) {
    try {
      // Vérifier le type d'événement
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Récupérer les métadonnées
        const { reservation_id, user_id } = session.metadata;
        
        // Créer l'entrée de paiement
        await Payment.create({
          reservation_id,
          amount: session.amount_total / 100, // Convertir les centimes en unité monétaire
          payment_method: 'stripe',
          payment_status: 'completed',
          transaction_id: session.payment_intent,
          transaction_details: JSON.stringify(session),
          paid_at: new Date(),
        });
        
        // Mettre à jour le statut de la réservation
        await Reservation.update(
          { payment_status: 'paid', status: 'confirmed' },
          { where: { id: reservation_id } }
        );
        
        return { success: true };
      }
      
      return { success: true, message: 'Événement non traité' };
    } catch (error) {
      console.error('Erreur lors du traitement du webhook Stripe:', error);
      throw createError('PaymentError', 'Erreur lors du traitement du paiement Stripe', 500, error.message);
    }
  }

  /**
   * Initialise un paiement via WAVE
   * @param {Object} reservationData - Données de la réservation
   * @param {Object} user - Utilisateur effectuant le paiement
   */
  static async initiateWavePayment(reservationData, user) {
    try {
      const { reservation_id, amount, field_name } = reservationData;
      
      // Configuration de la requête vers l'API WAVE
      const waveApiEndpoint = process.env.WAVE_API_ENDPOINT;
      const waveApiKey = process.env.WAVE_API_KEY;
      const waveSecretKey = process.env.WAVE_SECRET_KEY;
      
      // Générer un identifiant de transaction unique
      const idempotencyKey = crypto.randomUUID();
      
      // Construire la requête pour l'API WAVE
      const payload = {
        amount,
        currency: 'XOF',
        phone_number: user.phone, // Numéro de téléphone de l'utilisateur
        description: `Réservation ${field_name} - #${reservation_id}`,
        callback_url: `${process.env.API_BASE_URL}/api/payments/webhook/wave`,
        client_reference: reservation_id,
      };
      
      // En-têtes de la requête
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${waveApiKey}`,
        'X-Idempotency-Key': idempotencyKey,
      };
      
      // Appel à l'API WAVE
      const response = await axios.post(waveApiEndpoint, payload, { headers });
      
      if (response.data && response.data.success) {
        // Enregistrer l'initialisation du paiement
        await Payment.create({
          reservation_id,
          amount,
          payment_method: 'wave',
          payment_status: 'pending',
          transaction_id: response.data.wave_transaction_id || idempotencyKey,
          transaction_details: JSON.stringify(response.data),
          initiated_at: new Date(),
        });
        
        return {
          success: true,
          paymentId: response.data.wave_transaction_id,
          paymentUrl: response.data.wave_launch_url || null,
          paymentInstructions: response.data.instructions || 'Suivez les instructions sur votre téléphone pour compléter le paiement WAVE.'
        };
      } else {
        throw new Error(response.data?.error?.message || 'Erreur lors de l\'initialisation du paiement WAVE');
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du paiement WAVE:', error);
      throw createError('PaymentError', 'Erreur lors de l\'initialisation du paiement WAVE', 500, error.response?.data || error.message);
    }
  }

  /**
   * Traite les webhooks de l'API WAVE
   * @param {Object} webhookData - Données du webhook WAVE
   */
  static async handleWaveWebhook(webhookData) {
    try {
      // Vérifier l'authenticité du webhook avec la signature
      const waveSignature = webhookData.signature;
      // Implémentation de vérification de signature à définir selon documentation WAVE
      
      const { status, transaction_id, client_reference } = webhookData;
      
      if (status === 'successful') {
        // Trouver le paiement par transaction_id
        const payment = await Payment.findOne({
          where: { transaction_id, payment_method: 'wave' }
        });
        
        if (!payment) {
          throw new Error('Paiement non trouvé');
        }
        
        // Mettre à jour le paiement
        await payment.update({
          payment_status: 'completed',
          paid_at: new Date(),
          transaction_details: JSON.stringify({
            ...JSON.parse(payment.transaction_details),
            webhook_data: webhookData
          }),
        });
        
        // Mettre à jour la réservation
        await Reservation.update(
          { payment_status: 'paid', status: 'confirmed' },
          { where: { id: payment.reservation_id } }
        );
        
        return { success: true };
      } else if (status === 'failed') {
        // Mettre à jour le paiement avec le statut d'échec
        await Payment.update(
          {
            payment_status: 'failed',
            transaction_details: JSON.stringify(webhookData),
          },
          { where: { transaction_id } }
        );
        
        return { success: true, status: 'failed' };
      }
      
      return { success: true, message: 'Événement non traité' };
    } catch (error) {
      console.error('Erreur lors du traitement du webhook WAVE:', error);
      throw createError('PaymentError', 'Erreur lors du traitement du paiement WAVE', 500, error.message);
    }
  }

  /**
   * Initialise un paiement via Orange Money
   * @param {Object} reservationData - Données de la réservation
   * @param {Object} user - Utilisateur effectuant le paiement
   */
  static async initiateOrangeMoneyPayment(reservationData, user) {
    try {
      const { reservation_id, amount, field_name } = reservationData;
      
      // Configuration de la requête vers l'API Orange Money
      const omApiEndpoint = process.env.OM_API_ENDPOINT;
      const omMerchantId = process.env.OM_MERCHANT_ID;
      const omApiKey = process.env.OM_API_KEY;
      
      // Générer un identifiant de transaction unique
      const transactionId = crypto.randomUUID();
      
      // Construire la requête pour l'API Orange Money
      const payload = {
        merchant_key: omMerchantId,
        currency: 'XOF',
        order_id: transactionId,
        amount: amount.toString(),
        return_url: `${process.env.FRONTEND_URL}/reservations/payment-result`,
        cancel_url: `${process.env.FRONTEND_URL}/reservations/payment-cancel?reservation_id=${reservation_id}`,
        notif_url: `${process.env.API_BASE_URL}/api/payments/webhook/orange-money`,
        lang: 'fr',
        reference: `R-${reservation_id}`,
        customer_name: `${user.first_name} ${user.last_name}`,
        customer_phone_number: user.phone,
        customer_email: user.email,
        customer_address: user.address || 'Non spécifiée',
        description: `Réservation ${field_name} - #${reservation_id}`,
      };
      
      // Signature de la requête selon la spécification Orange Money
      // La méthode exacte dépend de la documentation de l'API Orange Money
      const signature = crypto
        .createHmac('sha256', omApiKey)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      const headers = {
        'Content-Type': 'application/json',
        'X-API-KEY': omApiKey,
        'X-SIGNATURE': signature,
      };
      
      // Appel à l'API Orange Money
      const response = await axios.post(omApiEndpoint, payload, { headers });
      
      if (response.data && response.data.status === 'success') {
        // Enregistrer l'initialisation du paiement
        await Payment.create({
          reservation_id,
          amount,
          payment_method: 'orange_money',
          payment_status: 'pending',
          transaction_id: transactionId,
          transaction_details: JSON.stringify(response.data),
          initiated_at: new Date(),
        });
        
        return {
          success: true,
          paymentId: transactionId,
          paymentUrl: response.data.payment_url,
          paymentInstructions: response.data.instructions || 'Suivez les instructions pour compléter le paiement Orange Money.'
        };
      } else {
        throw new Error(response.data?.message || 'Erreur lors de l\'initialisation du paiement Orange Money');
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du paiement Orange Money:', error);
      throw createError('PaymentError', 'Erreur lors de l\'initialisation du paiement Orange Money', 500, error.response?.data || error.message);
    }
  }

  /**
   * Traite les webhooks de l'API Orange Money
   * @param {Object} webhookData - Données du webhook Orange Money
   */
  static async handleOrangeMoneyWebhook(webhookData) {
    try {
      // Vérifier l'authenticité du webhook
      const omSignature = webhookData.signature;
      // Vérification à implémenter selon la documentation Orange Money
      
      const { status, transaction_id, order_id, reference } = webhookData;
      
      // Extraire l'ID de réservation de la référence
      const reservationId = reference.replace('R-', '');
      
      if (status === 'SUCCESSFUL') {
        // Trouver le paiement par transaction_id
        const payment = await Payment.findOne({
          where: { transaction_id: order_id, payment_method: 'orange_money' }
        });
        
        if (!payment) {
          throw new Error('Paiement non trouvé');
        }
        
        // Mettre à jour le paiement
        await payment.update({
          payment_status: 'completed',
          paid_at: new Date(),
          transaction_details: JSON.stringify({
            ...JSON.parse(payment.transaction_details),
            webhook_data: webhookData
          }),
        });
        
        // Mettre à jour la réservation
        await Reservation.update(
          { payment_status: 'paid', status: 'confirmed' },
          { where: { id: payment.reservation_id } }
        );
        
        return { success: true };
      } else if (status === 'FAILED') {
        // Mettre à jour le paiement avec le statut d'échec
        await Payment.update(
          {
            payment_status: 'failed',
            transaction_details: JSON.stringify(webhookData),
          },
          { where: { transaction_id: order_id } }
        );
        
        return { success: true, status: 'failed' };
      }
      
      return { success: true, message: 'Événement non traité' };
    } catch (error) {
      console.error('Erreur lors du traitement du webhook Orange Money:', error);
      throw createError('PaymentError', 'Erreur lors du traitement du paiement Orange Money', 500, error.message);
    }
  }

  /**
   * Calcule le remboursement en cas d'annulation
   * @param {Object} reservation - Objet réservation
   * @param {Date} cancellationDate - Date d'annulation
   * @returns {number} - Montant du remboursement
   */
  static calculateRefund(reservation, cancellationDate) {
    // Récupérer le montant payé
    const amountPaid = reservation.total_price;
    
    // Si la réservation n'est pas payée, pas de remboursement
    if (reservation.payment_status !== 'paid') {
      return 0;
    }
    
    // Calculer la différence en heures entre l'annulation et la réservation
    const reservationDate = new Date(reservation.reservation_date + 'T' + reservation.start_time);
    const hoursDifference = (reservationDate - cancellationDate) / (1000 * 60 * 60);
    
    // Politique de remboursement
    if (hoursDifference >= 48) {
      // Plus de 48h avant - remboursement intégral
      return amountPaid;
    } else if (hoursDifference >= 24) {
      // Entre 24h et 48h - 75% du montant
      return amountPaid * 0.75;
    } else if (hoursDifference >= 12) {
      // Entre 12h et 24h - 50% du montant
      return amountPaid * 0.5;
    } else if (hoursDifference >= 6) {
      // Entre 6h et 12h - 25% du montant
      return amountPaid * 0.25;
    } else {
      // Moins de 6h - pas de remboursement
      return 0;
    }
  }

  /**
   * Traite un remboursement
   * @param {string} paymentId - ID du paiement à rembourser
   * @param {number} amount - Montant à rembourser
   * @param {string} reason - Raison du remboursement
   */
  static async processRefund(paymentId, amount, reason) {
    try {
      // Récupérer le paiement
      const payment = await Payment.findByPk(paymentId);
      
      if (!payment) {
        throw new Error('Paiement non trouvé');
      }
      
      // Vérifier que le paiement est complété
      if (payment.payment_status !== 'completed') {
        throw new Error('Le paiement n\'est pas dans un état permettant le remboursement');
      }
      
      // Traiter le remboursement en fonction de la méthode de paiement
      if (payment.payment_method === 'stripe') {
        // Récupérer le transaction_id qui est le payment_intent dans Stripe
        const stripePaymentIntent = payment.transaction_id;
        
        // Créer le remboursement
        const refund = await stripe.refunds.create({
          payment_intent: stripePaymentIntent,
          amount: Math.round(amount * 100), // Convertir en centimes
          reason: 'requested_by_customer',
          metadata: {
            reservation_id: payment.reservation_id,
            reason,
          },
        });
        
        // Mettre à jour le paiement
        await payment.update({
          refund_status: 'refunded',
          refund_amount: amount,
          transaction_details: JSON.stringify({
            ...JSON.parse(payment.transaction_details),
            refund,
          }),
        });
        
        return { success: true, refundId: refund.id };
      } else if (payment.payment_method === 'wave' || payment.payment_method === 'orange_money') {
        // Pour WAVE et Orange Money, les remboursements pourraient nécessiter un processus manuel
        // ou une intégration spécifique selon leur API
        
        // Marquer comme remboursé manuellement en attendant l'intégration spécifique
        await payment.update({
          refund_status: 'pending_manual_refund',
          refund_amount: amount,
          transaction_details: JSON.stringify({
            ...JSON.parse(payment.transaction_details),
            manual_refund: {
              amount,
              reason,
              requested_at: new Date(),
            },
          }),
        });
        
        return {
          success: true,
          status: 'pending_manual_refund',
          message: 'Le remboursement a été enregistré et sera traité manuellement.'
        };
      } else {
        throw new Error('Méthode de paiement non prise en charge pour les remboursements automatiques');
      }
    } catch (error) {
      console.error('Erreur lors du traitement du remboursement:', error);
      throw createError('PaymentError', 'Erreur lors du traitement du remboursement', 500, error.message);
    }
  }

  /**
   * Traite un paiement en espèces
   * @param {Object} reservationData - Données de la réservation
   * @param {Object} user - Utilisateur effectuant le paiement
   */
  static async initiateCashPayment(reservationData, user) {
    try {
      const { reservation_id, amount, field_name } = reservationData;
      
      // Générer un ID unique pour le paiement en espèces
      const paymentId = require('uuid').v4();
      
      // Créer l'entrée de paiement avec statut pending
      await Payment.create({
        id: paymentId,
        reservation_id,
        user_id: user.id,
        amount,
        payment_method: 'especes',
        payment_status: 'pending',
        transaction_id: `CASH_${paymentId}`,
        transaction_details: JSON.stringify({
          field_name,
          user_email: user.email,
          user_name: `${user.first_name} ${user.last_name}`,
          payment_type: 'cash_on_site'
        }),
        created_at: new Date(),
        updated_at: new Date()
      });

      // Mettre à jour le statut de la réservation
      await Reservation.update(
        { 
          payment_status: 'pending_cash',
          status: 'confirmed' // La réservation est confirmée mais en attente de paiement
        },
        { where: { id: reservation_id } }
      );

      return {
        success: true,
        payment_id: paymentId,
        status: 'pending',
        message: 'Réservation confirmée - Paiement en espèces à effectuer sur place',
        instructions: [
          'Présentez-vous au terrain à l\'heure de votre réservation',
          `Apportez ${amount} FCFA en espèces`,
          'Montrez cette confirmation à l\'administrateur du terrain',
          'Le paiement sera confirmé après réception des espèces'
        ]
      };
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du paiement en espèces:', error);
      throw createError('PaymentError', 'Erreur lors de l\'initialisation du paiement en espèces', 500, error.message);
    }
  }

  /**
   * Confirme un paiement en espèces (appelé par l'admin du terrain)
   * @param {string} paymentId - ID du paiement
   * @param {Object} adminUser - Utilisateur admin confirmant le paiement
   */
  static async confirmCashPayment(paymentId, adminUser) {
    try {
      // Récupérer le paiement
      const payment = await Payment.findByPk(paymentId, {
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

      if (payment.payment_method !== 'especes') {
        throw createError('ValidationError', 'Ce paiement n\'est pas un paiement en espèces', 400);
      }

      if (payment.payment_status === 'completed') {
        throw createError('ValidationError', 'Ce paiement a déjà été confirmé', 400);
      }

      // Vérifier que l'admin peut confirmer ce paiement (pour son terrain)
      if (adminUser.role === 'admin' && adminUser.field_id !== payment.reservation.field_id) {
        throw createError('AuthorizationError', 'Vous ne pouvez confirmer que les paiements de votre terrain', 403);
      }

      // Mettre à jour le paiement
      await payment.update({
        payment_status: 'completed',
        paid_at: new Date(),
        transaction_details: JSON.stringify({
          ...JSON.parse(payment.transaction_details || '{}'),
          confirmed_by: adminUser.id,
          confirmed_at: new Date(),
          confirmation_method: 'admin_manual'
        })
      });

      // Mettre à jour la réservation
      await Reservation.update(
        { payment_status: 'paid' },
        { where: { id: payment.reservation_id } }
      );

      return {
        success: true,
        message: 'Paiement en espèces confirmé avec succès',
        payment_id: paymentId
      };
    } catch (error) {
      console.error('Erreur lors de la confirmation du paiement en espèces:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;
