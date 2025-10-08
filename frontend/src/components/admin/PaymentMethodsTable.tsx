import React, { useState, useEffect } from 'react';
import { PaymentMethodForm } from './PaymentMethodForm';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

interface PaymentMethod {
  id: string;
  type: string;
  name: string;
  status: 'active' | 'inactive';
  mode: 'production' | 'sandbox';
  // Champs marketplace
  owner_payout_channel?: string;
  owner_mobile_e164?: string;
  commission_rate_bps?: number;
}

export const PaymentMethodsTable: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fieldId, setFieldId] = useState<string>('');

  useEffect(() => {
    loadPaymentMethods();
    loadFieldInfo();
  }, []);

  const loadFieldInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/fields`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setFieldId(data.data[0].id);
      }
    } catch (error) {
      console.error('Erreur chargement terrain:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Charger les moyens de paiement traditionnels
      const traditionalResponse = await fetch(`${API_BASE_URL}/payment-methods`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let methods: PaymentMethod[] = [];
      
      if (traditionalResponse.ok) {
        const traditionalData = await traditionalResponse.json();
        methods = traditionalData.data || [];
      }

      // Vérifier si le marketplace est configuré
      const marketplaceResponse = await fetch(`${API_BASE_URL}/marketplace/health`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (marketplaceResponse.ok) {
        const marketplaceData = await marketplaceResponse.json();
        const marketplaceConfig = marketplaceData.data;

        // Ajouter le marketplace comme méthode de paiement
        const marketplaceMethod: PaymentMethod = {
          id: 'marketplace-digital',
          type: 'marketplace',
          name: 'Marketplace Digital',
          status: marketplaceConfig.paydunya.configured && marketplaceConfig.wave.configured ? 'active' : 'inactive',
          mode: marketplaceConfig.paydunya.environment === 'production' ? 'production' : 'sandbox',
          owner_payout_channel: 'wave', // Par défaut
          commission_rate_bps: 1000 // 10%
        };

        methods.push(marketplaceMethod);
      }

      setPaymentMethods(methods);
    } catch (error) {
      console.error('Erreur chargement moyens de paiement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePaymentMethod = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      
      if (data.type === 'marketplace') {
        // Configuration marketplace via l'API dédiée
        await fetch(`${API_BASE_URL}/fields/${fieldId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
      } else {
        // Méthode traditionnelle
        await fetch(`${API_BASE_URL}/payment-methods`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
      }

      loadPaymentMethods();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          Actif
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
        Inactif
      </span>
    );
  };

  const getModeBadge = (mode: string) => {
    if (mode === 'production') {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          Production
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
        Sandbox
      </span>
    );
  };

  const getTypeDisplay = (method: PaymentMethod) => {
    if (method.type === 'marketplace') {
      return (
        <div className="flex items-center">
          <span className="font-medium">Marketplace Digital</span>
          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
            NOUVEAU
          </span>
        </div>
      );
    }
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
        Espèces
      </span>
    );
  };

  const getPaymentChannels = (method: PaymentMethod) => {
    if (method.type === 'marketplace') {
      return (
        <div className="flex flex-wrap gap-1">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Wave</span>
          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">Orange Money</span>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Cartes</span>
        </div>
      );
    }
    return (
      <span className="text-sm text-gray-600">cash_payment</span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Moyens de paiement</h2>
            <p className="text-sm text-gray-600">
              Gérez les APIs de paiement pour votre terrain
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un moyen de paiement
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Terrain
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Canaux
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paymentMethods.map((method) => (
              <tr key={method.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    URBAN FOOT CENTER
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getTypeDisplay(method)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getPaymentChannels(method)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(method.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getModeBadge(method.mode)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-green-600 hover:text-green-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paymentMethods.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun moyen de paiement</h3>
          <p className="mt-1 text-sm text-gray-500">
            Commencez par ajouter un moyen de paiement pour votre terrain.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un moyen de paiement
            </button>
          </div>
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <PaymentMethodForm
          fieldId={fieldId}
          onClose={() => setShowForm(false)}
          onSave={handleSavePaymentMethod}
        />
      )}
    </div>
  );
};
