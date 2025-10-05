const { MarketplacePayment, Payout, Reservation, Field, User } = require('../models');
const paydunyaService = require('../services/paydunya.service');
const waveService = require('../services/wave.service');
const { v4: uuidv4 } = require('uuid');

class MarketplaceController {
  
  /**
   * Créer une session de checkout marketplace
   */
  async createCheckout(req, res) {
    try {
      const { reservation_id } = req.body;
      const userId = req.user.id;

      console.log(`🛒 Marketplace - Création checkout pour réservation: ${reservation_id}`);

      // Vérifier la réservation
      const reservation = await Reservation.findOne({
        where: { 
          id: reservation_id,
          user_id: userId 
        },
        include: [{
          model: Field,
          as: 'field',
          attributes: ['id', 'name', 'price_per_hour', 'owner_payout_channel', 'owner_mobile_e164', 'commission_rate_bps']
        }]
      });

      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Réservation non trouvée'
        });
      }

      if (reservation.payment_status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Réservation déjà payée'
        });
      }

      // Calculer les montants
      const totalAmount = reservation.total_price || reservation.field.price_per_hour;
      const commissionBps = reservation.field.commission_rate_bps || 1000; // 10% par défaut
      const platformFee = Math.floor(totalAmount * commissionBps / 10000);
      const netToOwner = totalAmount - platformFee;

      // Générer identifiants uniques
      const sessionId = uuidv4();
      const clientReference = MarketplacePayment.generateClientReference(reservation_id, sessionId);

      console.log(`💰 Montants calculés:`, {
        total: totalAmount,
        commission: platformFee,
        netToOwner: netToOwner,
        commissionRate: `${commissionBps/100}%`
      });

      // URLs de callback
      const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
      const callbackUrl = `${baseUrl}/api/marketplace/webhook/paydunya`;
      const returnUrl = `${process.env.FRONTEND_URL}/reservations/${reservation_id}/success`;
      const cancelUrl = `${process.env.FRONTEND_URL}/reservations/${reservation_id}/cancel`;

      // Créer le checkout PayDunya
      const checkoutResult = await paydunyaService.createCheckout({
        reservationId: reservation_id,
        sessionId: sessionId,
        clientReference: clientReference,
        amount: totalAmount,
        description: `Réservation ${reservation.field.name} - ${reservation.reservation_date}`,
        venueName: reservation.field.name,
        callbackUrl: callbackUrl,
        returnUrl: returnUrl,
        cancelUrl: cancelUrl
      });

      if (!checkoutResult.success) {
        throw new Error('Erreur création checkout PayDunya');
      }

      // Sauvegarder le paiement en DB
      const marketplacePayment = await MarketplacePayment.create({
        reservation_id: reservation_id,
        client_reference: clientReference,
        session_id: sessionId,
        provider: 'paydunya',
        checkout_url: checkoutResult.checkout_url,
        provider_token: checkoutResult.token,
        status: 'pending',
        amount_cfa: totalAmount,
        fee_platform_cfa: platformFee,
        net_to_owner_cfa: netToOwner,
        provider_data: checkoutResult.raw_response
      });

      console.log(`✅ Marketplace - Checkout créé: ${marketplacePayment.id}`);

      res.status(201).json({
        success: true,
        data: {
          payment_id: marketplacePayment.id,
          session_id: sessionId,
          checkout_url: checkoutResult.checkout_url,
          client_reference: clientReference,
          amount: totalAmount,
          platform_fee: platformFee,
          net_to_owner: netToOwner
        }
      });

    } catch (error) {
      console.error('❌ Marketplace - Erreur création checkout:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du checkout',
        error: error.message
      });
    }
  }

  /**
   * Vérifier le statut d'un paiement
   */
  async getPaymentStatus(req, res) {
    try {
      const { payment_id } = req.params;
      const userId = req.user.id;

      const payment = await MarketplacePayment.findOne({
        where: { id: payment_id },
        include: [{
          model: Reservation,
          as: 'reservation',
          where: { user_id: userId },
          attributes: ['id', 'user_id']
        }]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      res.json({
        success: true,
        data: {
          payment_id: payment.id,
          status: payment.status,
          amount: payment.amount_cfa,
          client_reference: payment.client_reference,
          created_at: payment.created_at,
          updated_at: payment.updated_at
        }
      });

    } catch (error) {
      console.error('❌ Marketplace - Erreur statut paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du statut',
        error: error.message
      });
    }
  }

  /**
   * Webhook PayDunya
   */
  async webhookPaydunya(req, res) {
    try {
      console.log('🔔 Marketplace - Webhook PayDunya reçu:', req.body);

      const webhookData = req.body;
      const token = webhookData.token || webhookData.invoice?.token;

      if (!token) {
        console.error('❌ Webhook PayDunya - Token manquant');
        return res.status(400).json({ error: 'Token manquant' });
      }

      // Vérifier la signature si disponible
      const signature = req.headers['x-paydunya-signature'];
      if (!paydunyaService.verifyWebhookSignature(webhookData, signature)) {
        console.error('❌ Webhook PayDunya - Signature invalide');
        return res.status(401).json({ error: 'Signature invalide' });
      }

      // Confirmer le statut côté PayDunya
      const confirmResult = await paydunyaService.confirmPayment(token);
      
      if (!confirmResult.success) {
        console.error('❌ Webhook PayDunya - Échec confirmation');
        return res.status(400).json({ error: 'Échec confirmation' });
      }

      const paymentStatus = confirmResult.status?.toLowerCase();
      console.log(`📊 Statut PayDunya confirmé: ${paymentStatus}`);

      // Trouver le paiement en DB
      const payment = await MarketplacePayment.findOne({
        where: { provider_token: token },
        include: [{
          model: Reservation,
          as: 'reservation',
          include: [{
            model: Field,
            as: 'field'
          }]
        }]
      });

      if (!payment) {
        console.error('❌ Webhook PayDunya - Paiement non trouvé pour token:', token);
        return res.status(404).json({ error: 'Paiement non trouvé' });
      }

      // Traiter selon le statut
      if (['completed', 'success', 'paid'].includes(paymentStatus)) {
        await this.handleSuccessfulPayment(payment, confirmResult);
      } else if (['cancelled', 'failed', 'timeout', 'expired'].includes(paymentStatus)) {
        await this.handleFailedPayment(payment, paymentStatus);
      }

      res.json({ success: true, message: 'Webhook traité' });

    } catch (error) {
      console.error('❌ Marketplace - Erreur webhook PayDunya:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur traitement webhook' 
      });
    }
  }

  /**
   * Traiter un paiement réussi
   */
  async handleSuccessfulPayment(payment, confirmResult) {
    console.log(`✅ Traitement paiement réussi: ${payment.client_reference}`);

    // Mettre à jour le paiement
    await payment.update({
      status: 'paid',
      webhook_received_at: new Date(),
      provider_data: {
        ...payment.provider_data,
        confirmation: confirmResult.raw_response
      }
    });

    // Mettre à jour la réservation
    await payment.reservation.update({
      payment_status: 'paid',
      status: 'confirmed'
    });

    // Déclencher le payout propriétaire
    try {
      await this.triggerOwnerPayout(payment);
    } catch (payoutError) {
      console.error('⚠️ Erreur payout (sera retenté):', payoutError.message);
      // Le payout sera retenté par un job cron
    }

    console.log(`🎉 Paiement ${payment.client_reference} traité avec succès`);
  }

  /**
   * Traiter un paiement échoué
   */
  async handleFailedPayment(payment, status) {
    console.log(`❌ Traitement paiement échoué: ${payment.client_reference} - ${status}`);

    await payment.update({
      status: 'failed',
      webhook_received_at: new Date()
    });

    // Optionnel: notifier l'utilisateur de l'échec
  }

  /**
   * Déclencher le payout propriétaire
   */
  async triggerOwnerPayout(payment) {
    const field = payment.reservation.field;
    const amount = payment.net_to_owner_cfa;

    if (amount <= 0) {
      console.log('💸 Payout ignoré - Montant nul');
      return;
    }

    console.log(`💸 Déclenchement payout: ${amount} FCFA vers ${field.owner_payout_channel}`);

    const idempotencyKey = Payout.generateIdempotencyKey(payment.id, field.id);

    try {
      let payoutResult;

      if (field.owner_payout_channel === 'wave') {
        payoutResult = await waveService.createPayout({
          amount: amount,
          recipientMobile: field.owner_mobile_e164,
          recipientName: field.name,
          reason: `Versement réservation ${payment.client_reference}`,
          idempotencyKey: idempotencyKey
        });
      } else if (field.owner_payout_channel === 'paydunya_push') {
        payoutResult = await paydunyaService.createPayout({
          amount: amount,
          recipientPhone: field.owner_mobile_e164,
          reason: `Versement réservation ${payment.client_reference}`,
          idempotencyKey: idempotencyKey
        });
      } else {
        throw new Error(`Canal payout non supporté: ${field.owner_payout_channel}`);
      }

      // Sauvegarder le payout
      await Payout.create({
        marketplace_payment_id: payment.id,
        field_id: field.id,
        channel: field.owner_payout_channel,
        amount_cfa: amount,
        status: payoutResult.status || 'processing',
        provider_id: payoutResult.payout_id || payoutResult.transaction_id,
        idempotency_key: idempotencyKey,
        provider_error: null
      });

      console.log(`✅ Payout créé avec succès: ${payoutResult.payout_id || payoutResult.transaction_id}`);

    } catch (error) {
      console.error('❌ Erreur création payout:', error);

      // Sauvegarder l'erreur pour retry
      await Payout.create({
        marketplace_payment_id: payment.id,
        field_id: field.id,
        channel: field.owner_payout_channel,
        amount_cfa: amount,
        status: 'failed',
        provider_error: { message: error.message, stack: error.stack },
        idempotency_key: idempotencyKey,
        retry_count: 0,
        next_retry_at: new Date(Date.now() + 5 * 60 * 1000) // Retry dans 5 min
      });

      throw error;
    }
  }

  /**
   * Lister les paiements marketplace (admin)
   */
  async listPayments(req, res) {
    try {
      const { page = 1, limit = 20, status, field_id } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (status) whereClause.status = status;

      const payments = await MarketplacePayment.findAndCountAll({
        where: whereClause,
        include: [{
          model: Reservation,
          as: 'reservation',
          include: [{
            model: Field,
            as: 'field',
            where: field_id ? { id: field_id } : {},
            attributes: ['id', 'name']
          }, {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }]
        }, {
          model: Payout,
          as: 'payouts'
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        success: true,
        data: {
          payments: payments.rows,
          pagination: {
            total: payments.count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(payments.count / limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ Marketplace - Erreur liste paiements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paiements',
        error: error.message
      });
    }
  }
}

module.exports = new MarketplaceController();
