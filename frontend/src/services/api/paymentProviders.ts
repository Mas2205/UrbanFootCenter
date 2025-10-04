import axios from 'axios';

// Types pour les réponses des APIs de paiement
export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  status: 'pending' | 'success' | 'failed';
  message?: string;
  redirectUrl?: string;
}

export interface WavePaymentRequest {
  amount: number;
  currency: string;
  description: string;
  customerPhone: string;
  merchantTransactionId: string;
  successUrl?: string;
  errorUrl?: string;
}

export interface OrangeMoneyPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  customerPhone: string;
  merchantTransactionId: string;
  notifyUrl?: string;
}

// Configuration des APIs
const WAVE_API_BASE_URL = process.env.REACT_APP_WAVE_API_URL || 'https://api.wave.com/v1';
const ORANGE_MONEY_API_BASE_URL = process.env.REACT_APP_ORANGE_MONEY_API_URL || 'https://api.orange.com/orange-money-webpay/dev/v1';

// Service Wave API
export class WavePaymentService {
  private apiKey: string;
  private merchantId: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_WAVE_API_KEY || '';
    this.merchantId = process.env.REACT_APP_WAVE_MERCHANT_ID || '';
  }

  async initiatePayment(request: WavePaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await axios.post(
        `${WAVE_API_BASE_URL}/checkout/sessions`,
        {
          amount: request.amount,
          currency: request.currency || 'XOF',
          error_url: request.errorUrl,
          success_url: request.successUrl,
          checkout_intent: 'WAVE_LAUNCH_CHECKOUT',
          client_reference: request.merchantTransactionId,
          description: request.description,
          customer_phone_number: request.customerPhone,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200 && response.data) {
        return {
          success: true,
          transactionId: response.data.id,
          status: 'pending',
          redirectUrl: response.data.wave_launch_url,
          message: 'Paiement Wave initié avec succès'
        };
      }

      return {
        success: false,
        status: 'failed',
        message: 'Erreur lors de l\'initialisation du paiement Wave'
      };
    } catch (error: any) {
      console.error('Erreur Wave Payment:', error);
      return {
        success: false,
        status: 'failed',
        message: error.response?.data?.message || 'Erreur de connexion à Wave'
      };
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    try {
      const response = await axios.get(
        `${WAVE_API_BASE_URL}/checkout/sessions/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        const status = response.data.payment_status;
        return {
          success: status === 'succeeded',
          transactionId,
          status: status === 'succeeded' ? 'success' : status === 'pending' ? 'pending' : 'failed',
          message: `Statut du paiement: ${status}`
        };
      }

      return {
        success: false,
        status: 'failed',
        message: 'Impossible de vérifier le statut du paiement'
      };
    } catch (error: any) {
      console.error('Erreur vérification statut Wave:', error);
      return {
        success: false,
        status: 'failed',
        message: 'Erreur lors de la vérification du statut'
      };
    }
  }
}

// Service Orange Money API
export class OrangeMoneyPaymentService {
  private apiKey: string;
  private merchantId: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_ORANGE_MONEY_API_KEY || '';
    this.merchantId = process.env.REACT_APP_ORANGE_MONEY_MERCHANT_ID || '';
  }

  async initiatePayment(request: OrangeMoneyPaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await axios.post(
        `${ORANGE_MONEY_API_BASE_URL}/webpayment`,
        {
          merchant_key: this.merchantId,
          currency: request.currency || 'XOF',
          order_id: request.merchantTransactionId,
          amount: request.amount,
          return_url: request.notifyUrl,
          cancel_url: request.notifyUrl,
          notif_url: request.notifyUrl,
          lang: 'fr',
          reference: request.description,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      if (response.status === 200 && response.data) {
        return {
          success: true,
          transactionId: response.data.pay_token,
          status: 'pending',
          redirectUrl: response.data.payment_url,
          message: 'Paiement Orange Money initié avec succès'
        };
      }

      return {
        success: false,
        status: 'failed',
        message: 'Erreur lors de l\'initialisation du paiement Orange Money'
      };
    } catch (error: any) {
      console.error('Erreur Orange Money Payment:', error);
      return {
        success: false,
        status: 'failed',
        message: error.response?.data?.message || 'Erreur de connexion à Orange Money'
      };
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    try {
      const response = await axios.post(
        `${ORANGE_MONEY_API_BASE_URL}/transactionstatus`,
        {
          order_id: transactionId,
          amount: 0, // Sera fourni par le contexte
          pay_token: transactionId,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        const status = response.data.status;
        return {
          success: status === 'SUCCESS',
          transactionId,
          status: status === 'SUCCESS' ? 'success' : status === 'PENDING' ? 'pending' : 'failed',
          message: `Statut du paiement: ${status}`
        };
      }

      return {
        success: false,
        status: 'failed',
        message: 'Impossible de vérifier le statut du paiement'
      };
    } catch (error: any) {
      console.error('Erreur vérification statut Orange Money:', error);
      return {
        success: false,
        status: 'failed',
        message: 'Erreur lors de la vérification du statut'
      };
    }
  }
}

// Service principal de gestion des paiements
export class PaymentProviderService {
  private waveService: WavePaymentService;
  private orangeMoneyService: OrangeMoneyPaymentService;

  constructor() {
    this.waveService = new WavePaymentService();
    this.orangeMoneyService = new OrangeMoneyPaymentService();
  }

  async processPayment(
    method: 'wave' | 'orange_money' | 'card' | 'cash',
    amount: number,
    reservationId: string,
    customerPhone?: string
  ): Promise<PaymentResponse> {
    const merchantTransactionId = `RES_${reservationId}_${Date.now()}`;

    switch (method) {
      case 'wave':
        if (!customerPhone) {
          return {
            success: false,
            status: 'failed',
            message: 'Numéro de téléphone requis pour Wave'
          };
        }
        return this.waveService.initiatePayment({
          amount,
          currency: 'XOF',
          description: `Réservation terrain - ${reservationId}`,
          customerPhone,
          merchantTransactionId,
          successUrl: `${window.location.origin}/booking/success`,
          errorUrl: `${window.location.origin}/booking/error`,
        });

      case 'orange_money':
        if (!customerPhone) {
          return {
            success: false,
            status: 'failed',
            message: 'Numéro de téléphone requis pour Orange Money'
          };
        }
        return this.orangeMoneyService.initiatePayment({
          amount,
          currency: 'XOF',
          description: `Réservation terrain - ${reservationId}`,
          customerPhone,
          merchantTransactionId,
          notifyUrl: `${window.location.origin}/booking/callback`,
        });

      case 'card':
        // Simulation pour carte bancaire - à remplacer par une vraie intégration
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              transactionId: `CARD_${merchantTransactionId}`,
              status: 'success',
              message: 'Paiement par carte simulé avec succès'
            });
          }, 2000);
        });

      case 'cash':
        // Paiement en espèces - confirmation immédiate
        return Promise.resolve({
          success: true,
          transactionId: `CASH_${merchantTransactionId}`,
          status: 'success',
          message: 'Paiement en espèces confirmé'
        });

      default:
        return Promise.resolve({
          success: false,
          status: 'failed',
          message: 'Méthode de paiement non supportée'
        });
    }
  }

  async checkPaymentStatus(method: string, transactionId: string): Promise<PaymentResponse> {
    switch (method) {
      case 'wave':
        return this.waveService.checkPaymentStatus(transactionId);
      case 'orange_money':
        return this.orangeMoneyService.checkPaymentStatus(transactionId);
      case 'card':
      case 'cash':
        // Pour les paiements simulés, retourner succès
        return Promise.resolve({
          success: true,
          transactionId,
          status: 'success',
          message: 'Paiement confirmé'
        });
      default:
        return Promise.resolve({
          success: false,
          status: 'failed',
          message: 'Méthode de paiement non supportée'
        });
    }
  }
}

// Instance singleton
export const paymentProviderService = new PaymentProviderService();
