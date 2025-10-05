import React, { useState, useEffect, useRef } from 'react';

// Note: Installer avec: npm install qrcode @types/qrcode react-toastify
// @ts-ignore - QRCode sera installé via le script setup
const QRCode = require('qrcode');

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

// Toast simple (remplacer par react-toastify après installation)
const toast = {
  success: (message: string) => alert(`✅ ${message}`),
  error: (message: string) => alert(`❌ ${message}`)
};

interface MarketplacePaymentProps {
  reservationId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

interface CheckoutResponse {
  payment_id: string;
  session_id: string;
  checkout_url: string;
  client_reference: string;
  amount: number;
  platform_fee: number;
  net_to_owner: number;
}

interface PaymentStatus {
  payment_id: string;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';
  amount: number;
  client_reference: string;
}

export const MarketplacePayment: React.FC<MarketplacePaymentProps> = ({
  reservationId,
  amount,
  onSuccess,
  onCancel,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Créer la session de checkout
  const createCheckout = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/marketplace/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reservation_id: reservationId
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erreur création checkout');
      }

      setCheckoutData(data.data);
      await generateQRCode(data.data.checkout_url);
      startPolling(data.data.payment_id);

    } catch (error) {
      console.error('Erreur checkout:', error);
      onError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Générer le QR code
  const generateQRCode = async (url: string) => {
    try {
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, url, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeGenerated(true);
      }
    } catch (error) {
      console.error('Erreur génération QR code:', error);
    }
  };

  // Polling du statut de paiement
  const startPolling = (paymentId: string) => {
    pollingRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/marketplace/payment/${paymentId}/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          const status = data.data.status;
          setPaymentStatus(status);

          if (status === 'paid') {
            stopPolling();
            toast.success('Paiement confirmé !');
            onSuccess();
          } else if (['failed', 'expired', 'cancelled'].includes(status)) {
            stopPolling();
            toast.error('Paiement échoué ou annulé');
            onError('Paiement échoué');
          }
        }
      } catch (error) {
        console.error('Erreur polling:', error);
      }
    }, 2000); // Vérifier toutes les 2 secondes
  };

  // Arrêter le polling
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Ouvrir la page de paiement dans un nouvel onglet
  const openPaymentPage = () => {
    if (checkoutData?.checkout_url) {
      window.open(checkoutData.checkout_url, '_blank');
    }
  };

  // Initialiser au montage
  useEffect(() => {
    createCheckout();
    
    return () => {
      stopPolling();
    };
  }, [reservationId]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Préparation du paiement...</span>
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Erreur lors de la préparation du paiement</p>
        <button 
          onClick={createCheckout}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Paiement Sécurisé
        </h3>
        <div className="text-2xl font-bold text-green-600">
          {amount.toLocaleString()} FCFA
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Commission plateforme: {checkoutData.platform_fee.toLocaleString()} FCFA
        </div>
      </div>

      {/* Statut */}
      <div className="mb-4">
        <div className="flex items-center justify-center">
          {paymentStatus === 'pending' && (
            <div className="flex items-center text-orange-600">
              <div className="animate-pulse w-3 h-3 bg-orange-600 rounded-full mr-2"></div>
              En attente de paiement...
            </div>
          )}
          {paymentStatus === 'paid' && (
            <div className="flex items-center text-green-600">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Paiement confirmé !
            </div>
          )}
          {paymentStatus === 'failed' && (
            <div className="flex items-center text-red-600">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Paiement échoué
            </div>
          )}
        </div>
      </div>

      {/* QR Code */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600 mb-3">
          Scannez le QR code avec votre téléphone pour payer avec:
        </p>
        <div className="flex justify-center space-x-4 mb-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Wave</span>
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">Orange Money</span>
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Carte bancaire</span>
        </div>
        
        <div className="flex justify-center mb-4">
          <canvas 
            ref={canvasRef} 
            className="border border-gray-200 rounded-lg"
            width={256} 
            height={256}
          />
        </div>

        {qrCodeGenerated && (
          <button
            onClick={openPaymentPage}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Ouvrir la page de paiement
          </button>
        )}
      </div>

      {/* Informations */}
      <div className="border-t pt-4">
        <div className="text-xs text-gray-500 space-y-1">
          <div>Référence: {checkoutData.client_reference}</div>
          <div>Paiement sécurisé par PayDunya</div>
          <div>Versement automatique au propriétaire</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3 mt-6">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Annuler
        </button>
        {paymentStatus === 'failed' && (
          <button
            onClick={createCheckout}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
};
