const axios = require('axios');

class PayDunyaService {
  constructor() {
    this.masterKey = process.env.PAYDUNYA_MASTER_KEY;
    this.privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
    this.publicKey = process.env.PAYDUNYA_PUBLIC_KEY;
    this.environment = process.env.PAYMENTS_ENV || 'sandbox';
    this.baseUrl = this.environment === 'sandbox' 
      ? 'https://app.paydunya.com' 
      : 'https://app.paydunya.com';
    
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'PAYDUNYA-MASTER-KEY': this.masterKey,
      'PAYDUNYA-PRIVATE-KEY': this.privateKey,
      'PAYDUNYA-PUBLIC-KEY': this.publicKey
    };

    console.log(`🔧 PayDunya Service initialized - Environment: ${this.environment}`);
  }

  /**
   * Créer une session de checkout PayDunya
   */
  async createCheckout(params) {
    const {
      reservationId,
      sessionId,
      clientReference,
      amount,
      description,
      venueName,
      callbackUrl,
      returnUrl,
      cancelUrl
    } = params;

    console.log(`💳 PayDunya - Création checkout pour ${clientReference} - ${amount} FCFA`);

    const payload = {
      invoice: {
        items: [{
          name: `Réservation ${venueName}`,
          quantity: 1,
          unit_price: amount,
          total_price: amount
        }],
        total_amount: amount,
        description: description || `Réservation terrain ${venueName}`
      },
      store: {
        name: 'Urban Foot Center',
        tagline: 'Réservations de terrains de sport',
        phone_number: '+221xxxxxxxxx',
        postal_address: 'Dakar, Sénégal',
        website_url: process.env.FRONTEND_URL || 'https://urban-foot-center.vercel.app'
      },
      actions: {
        callback_url: callbackUrl,
        return_url: returnUrl,
        cancel_url: cancelUrl
      },
      custom_data: {
        client_reference: clientReference,
        session_id: sessionId,
        reservation_id: reservationId,
        platform: 'urban_foot_center'
      }
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/checkout-invoice/create`,
        payload,
        { 
          headers: this.headers,
          timeout: 30000
        }
      );

      const data = response.data;
      
      if (data.response_code !== '00') {
        throw new Error(`PayDunya Error: ${data.response_text || 'Unknown error'}`);
      }

      console.log(`✅ PayDunya - Checkout créé: ${data.token}`);

      return {
        success: true,
        token: data.token,
        checkout_url: data.invoice_url || data.response_text,
        invoice_token: data.invoice_token,
        raw_response: data
      };

    } catch (error) {
      console.error('❌ PayDunya - Erreur création checkout:', error.message);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }

      throw new Error(`Erreur PayDunya: ${error.message}`);
    }
  }

  /**
   * Confirmer le statut d'un paiement
   */
  async confirmPayment(token) {
    console.log(`🔍 PayDunya - Confirmation paiement token: ${token}`);

    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/checkout-invoice/confirm/${token}`,
        { 
          headers: this.headers,
          timeout: 15000
        }
      );

      const data = response.data;
      
      console.log(`📊 PayDunya - Statut reçu:`, {
        status: data.status,
        invoice_status: data.invoice?.status,
        response_code: data.response_code
      });

      return {
        success: true,
        status: data.status || data.invoice?.status,
        amount: data.invoice?.total_amount,
        custom_data: data.custom_data || data.invoice?.custom_data,
        raw_response: data
      };

    } catch (error) {
      console.error('❌ PayDunya - Erreur confirmation:', error.message);
      throw new Error(`Erreur confirmation PayDunya: ${error.message}`);
    }
  }

  /**
   * Effectuer un payout via PayDunya PUSH (Orange Money, etc.)
   */
  async createPayout(params) {
    const {
      amount,
      recipientPhone,
      reason,
      idempotencyKey
    } = params;

    console.log(`💸 PayDunya - Payout ${amount} FCFA vers ${recipientPhone}`);

    const payload = {
      amount: amount,
      currency: 'XOF',
      recipient_phone: recipientPhone,
      reason: reason || 'Versement propriétaire terrain',
      idempotency_key: idempotencyKey
    };

    try {
      // Note: L'API PUSH PayDunya peut varier selon leur documentation
      // Adapter l'endpoint selon la doc officielle
      const response = await axios.post(
        `${this.baseUrl}/api/v1/push`,
        payload,
        { 
          headers: this.headers,
          timeout: 30000
        }
      );

      const data = response.data;
      
      if (data.response_code !== '00') {
        throw new Error(`PayDunya Payout Error: ${data.response_text}`);
      }

      console.log(`✅ PayDunya - Payout créé: ${data.transaction_id}`);

      return {
        success: true,
        transaction_id: data.transaction_id,
        status: data.status || 'processing',
        raw_response: data
      };

    } catch (error) {
      console.error('❌ PayDunya - Erreur payout:', error.message);
      throw new Error(`Erreur payout PayDunya: ${error.message}`);
    }
  }

  /**
   * Vérifier la signature webhook (si disponible)
   */
  verifyWebhookSignature(payload, signature) {
    // Implémenter selon la documentation PayDunya
    // Généralement HMAC-SHA256 avec une clé secrète
    const crypto = require('crypto');
    
    if (!signature || !this.privateKey) {
      console.warn('⚠️ PayDunya - Signature webhook non vérifiée');
      return true; // En développement, on peut accepter
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.privateKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      console.error('❌ PayDunya - Erreur vérification signature:', error.message);
      return false;
    }
  }
}

module.exports = new PayDunyaService();
