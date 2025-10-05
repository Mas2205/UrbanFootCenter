const axios = require('axios');

class WaveService {
  constructor() {
    this.apiKey = process.env.WAVE_API_KEY;
    this.environment = process.env.PAYMENTS_ENV || 'sandbox';
    this.baseUrl = this.environment === 'sandbox'
      ? 'https://api.wave.com'  // Adapter selon Wave sandbox
      : 'https://api.wave.com';

    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    console.log(`🌊 Wave Service initialized - Environment: ${this.environment}`);
  }

  /**
   * Effectuer un payout Wave
   */
  async createPayout(params) {
    const {
      amount,
      recipientMobile,
      recipientName,
      reason,
      idempotencyKey
    } = params;

    console.log(`💸 Wave - Payout ${amount} FCFA vers ${recipientMobile}`);

    // Validation format E.164
    if (!recipientMobile.startsWith('+221')) {
      throw new Error('Numéro Wave doit être au format E.164 (+221xxxxxxxxx)');
    }

    const payload = {
      currency: 'XOF',
      receive_amount: amount.toString(),
      name: recipientName || 'Propriétaire terrain',
      mobile: recipientMobile,
      reason: reason || 'Versement commission terrain'
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/payout`,
        payload,
        { 
          headers: {
            ...this.headers,
            'Idempotency-Key': idempotencyKey
          },
          timeout: 30000
        }
      );

      const data = response.data;
      
      console.log(`✅ Wave - Payout créé:`, {
        id: data.id,
        status: data.status,
        amount: data.receive_amount
      });

      return {
        success: true,
        payout_id: data.id,
        status: data.status, // 'pending', 'completed', 'failed'
        amount: parseInt(data.receive_amount),
        recipient: data.mobile,
        raw_response: data
      };

    } catch (error) {
      console.error('❌ Wave - Erreur payout:', error.message);
      
      if (error.response) {
        console.error('Wave Response:', error.response.data);
        
        // Gestion erreurs spécifiques Wave
        const errorData = error.response.data;
        if (errorData.payout_error) {
          throw new Error(`Wave Payout Error: ${errorData.payout_error}`);
        }
      }

      throw new Error(`Erreur payout Wave: ${error.message}`);
    }
  }

  /**
   * Vérifier le statut d'un payout
   */
  async getPayoutStatus(payoutId) {
    console.log(`🔍 Wave - Vérification statut payout: ${payoutId}`);

    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/payout/${payoutId}`,
        { 
          headers: this.headers,
          timeout: 15000
        }
      );

      const data = response.data;
      
      console.log(`📊 Wave - Statut payout ${payoutId}:`, data.status);

      return {
        success: true,
        status: data.status,
        amount: parseInt(data.receive_amount),
        completed_at: data.completed_at,
        raw_response: data
      };

    } catch (error) {
      console.error('❌ Wave - Erreur vérification statut:', error.message);
      throw new Error(`Erreur statut Wave: ${error.message}`);
    }
  }

  /**
   * Lister les payouts avec pagination
   */
  async listPayouts(params = {}) {
    const {
      limit = 50,
      offset = 0,
      status = null
    } = params;

    console.log(`📋 Wave - Liste payouts (limit: ${limit}, offset: ${offset})`);

    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      if (status) {
        queryParams.append('status', status);
      }

      const response = await axios.get(
        `${this.baseUrl}/v1/payouts?${queryParams}`,
        { 
          headers: this.headers,
          timeout: 15000
        }
      );

      const data = response.data;
      
      console.log(`📊 Wave - ${data.payouts?.length || 0} payouts récupérés`);

      return {
        success: true,
        payouts: data.payouts || [],
        total: data.total || 0,
        raw_response: data
      };

    } catch (error) {
      console.error('❌ Wave - Erreur liste payouts:', error.message);
      throw new Error(`Erreur liste Wave: ${error.message}`);
    }
  }

  /**
   * Valider un numéro Wave
   */
  validateWaveNumber(mobile) {
    // Format Wave Sénégal: +221 7X XXX XX XX
    const waveRegex = /^\+221[67]\d{8}$/;
    return waveRegex.test(mobile);
  }

  /**
   * Formater un numéro au format E.164
   */
  formatMobileE164(mobile) {
    // Nettoyer le numéro
    let cleaned = mobile.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Si commence par 7 ou 6, ajouter +221
    if (/^[67]\d{8}$/.test(cleaned)) {
      cleaned = `+221${cleaned}`;
    }
    
    // Si commence par 221, ajouter +
    if (/^221[67]\d{8}$/.test(cleaned)) {
      cleaned = `+${cleaned}`;
    }

    return cleaned;
  }
}

module.exports = new WaveService();
