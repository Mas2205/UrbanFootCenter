const axios = require('axios');
const { PaymentMethod } = require('../models');

class PaymentService {
  /**
   * Traiter un paiement via l'API configurée pour le terrain
   * @param {string} fieldId - ID du terrain
   * @param {string} paymentType - Type de paiement (wave, orange_money, carte_bancaire)
   * @param {Object} paymentData - Données du paiement
   * @returns {Promise<Object>} - Résultat du paiement
   */
  async processPayment(fieldId, paymentType, paymentData) {
    try {
      // Récupérer la configuration du moyen de paiement pour ce terrain
      const paymentMethod = await PaymentMethod.findOne({
        where: {
          field_id: fieldId,
          payment_type: paymentType,
          is_active: true
        }
      });

      if (!paymentMethod) {
        throw new Error(`Moyen de paiement ${paymentType} non configuré ou inactif pour ce terrain`);
      }

      // Mode simulation - simuler le paiement si ignore_validation est activé ou en mode développement
      const shouldSimulate = paymentMethod.ignore_validation || 
                             process.env.NODE_ENV === 'development' || 
                             paymentMethod.api_url.includes('google') || 
                             paymentMethod.api_url.includes('test');

      if (shouldSimulate) {
        console.log('Mode simulation - Paiement simulé:', {
          fieldId,
          paymentType,
          amount: paymentData.amount,
          ignoreValidation: paymentMethod.ignore_validation
        });

        // Simuler une réponse de paiement réussie
        return {
          success: true,
          transactionId: `DEV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'completed',
          amount: paymentData.amount,
          currency: paymentData.currency || 'XOF',
          paymentMethod: paymentType,
          apiResponse: {
            status: 'success',
            message: 'Paiement simulé en mode développement',
            transaction_id: `DEV_${Date.now()}`,
            amount: paymentData.amount,
            currency: paymentData.currency || 'XOF'
          }
        };
      }

      // Mode production - appel réel à l'API
      const apiPayload = this.preparePaymentPayload(paymentMethod, paymentData);

      // Préparer les headers
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${paymentMethod.api_key}`
      };

      // Ajouter le secret API si disponible
      if (paymentMethod.api_secret) {
        headers['X-API-Secret'] = paymentMethod.api_secret;
      }

      // Effectuer l'appel à l'API de paiement
      const response = await axios.post(paymentMethod.api_url, apiPayload, {
        headers,
        timeout: paymentMethod.configuration?.timeout || 30000
      });

      // Vérifier le succès du paiement
      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          transactionId: response.data.transaction_id || response.data.id,
          status: response.data.status || 'completed',
          amount: paymentData.amount,
          currency: paymentData.currency || 'XOF',
          paymentMethod: paymentType,
          apiResponse: response.data
        };
      } else {
        throw new Error(`Erreur API: ${response.status} - ${response.statusText}`);
      }

    } catch (error) {
      console.error('Erreur lors du traitement du paiement:', error);
      
      return {
        success: false,
        error: error.message,
        code: error.response?.status || 'PAYMENT_ERROR',
        details: error.response?.data || null
      };
    }
  }

  /**
   * Préparer le payload pour l'API de paiement selon le type
   * @param {Object} paymentMethod - Configuration du moyen de paiement
   * @param {Object} paymentData - Données du paiement
   * @returns {Object} - Payload formaté pour l'API
   */
  preparePaymentPayload(paymentMethod, paymentData) {
    const basePayload = {
      amount: paymentData.amount,
      currency: paymentData.currency || 'XOF',
      description: paymentData.description || 'Réservation terrain de sport',
      customer: {
        name: paymentData.customerName,
        email: paymentData.customerEmail,
        phone: paymentData.customerPhone
      },
      reference: paymentData.reference,
      callback_url: paymentData.callbackUrl
    };

    // Ajouter le merchant_id si configuré
    if (paymentMethod.merchant_id) {
      basePayload.merchant_id = paymentMethod.merchant_id;
    }

    // Personnaliser selon le type de paiement
    switch (paymentMethod.payment_type) {
      case 'wave':
        return {
          ...basePayload,
          payment_method: 'wave',
          ...paymentMethod.configuration
        };

      case 'orange_money':
        return {
          ...basePayload,
          payment_method: 'orange_money',
          msisdn: paymentData.customerPhone,
          ...paymentMethod.configuration
        };

      case 'carte_bancaire':
        return {
          ...basePayload,
          payment_method: 'card',
          card: {
            number: paymentData.cardNumber,
            expiry_month: paymentData.expiryMonth,
            expiry_year: paymentData.expiryYear,
            cvv: paymentData.cvv
          },
          ...paymentMethod.configuration
        };

      default:
        return basePayload;
    }
  }

  /**
   * Vérifier le statut d'un paiement
   * @param {string} fieldId - ID du terrain
   * @param {string} paymentType - Type de paiement
   * @param {string} transactionId - ID de la transaction
   * @returns {Promise<Object>} - Statut du paiement
   */
  async checkPaymentStatus(fieldId, paymentType, transactionId) {
    try {
      const paymentMethod = await PaymentMethod.findOne({
        where: {
          field_id: fieldId,
          payment_type: paymentType,
          is_active: true
        }
      });

      if (!paymentMethod) {
        throw new Error(`Moyen de paiement ${paymentType} non configuré`);
      }

      const statusUrl = `${paymentMethod.api_url}/status/${transactionId}`;
      const headers = {
        'Authorization': `Bearer ${paymentMethod.api_key}`
      };

      if (paymentMethod.api_secret) {
        headers['X-API-Secret'] = paymentMethod.api_secret;
      }

      const response = await axios.get(statusUrl, { headers });

      return {
        success: true,
        status: response.data.status,
        transactionId: transactionId,
        details: response.data
      };

    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtenir les moyens de paiement disponibles pour un terrain
   * @param {string} fieldId - ID du terrain
   * @returns {Promise<Array>} - Liste des moyens de paiement actifs
   */
  async getAvailablePaymentMethods(fieldId) {
    try {
      const paymentMethods = await PaymentMethod.findAll({
        where: {
          field_id: fieldId,
          is_active: true
        },
        attributes: ['payment_type', 'configuration']
      });

      return paymentMethods.map(method => ({
        type: method.payment_type,
        name: this.getPaymentMethodName(method.payment_type),
        configuration: method.configuration
      }));

    } catch (error) {
      console.error('Erreur lors de la récupération des moyens de paiement:', error);
      return [];
    }
  }

  /**
   * Obtenir le nom d'affichage d'un moyen de paiement
   * @param {string} type - Type de paiement
   * @returns {string} - Nom d'affichage
   */
  getPaymentMethodName(type) {
    const names = {
      'wave': 'Wave',
      'orange_money': 'Orange Money',
      'carte_bancaire': 'Carte Bancaire'
    };
    return names[type] || type;
  }
}

module.exports = new PaymentService();
