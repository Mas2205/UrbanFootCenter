import React, { useState } from 'react';
import { MarketplaceSettings } from './MarketplaceSettings';

interface PaymentMethodFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
  fieldId: string;
}

export const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ 
  onClose, 
  onSave, 
  fieldId 
}) => {
  const [selectedType, setSelectedType] = useState<'traditional' | 'marketplace'>('traditional');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Ajouter un moyen de paiement
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Sélecteur de type */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Type de paiement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Paiement traditionnel */}
              <div
                onClick={() => setSelectedType('traditional')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedType === 'traditional'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    selectedType === 'traditional'
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedType === 'traditional' && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-800">Paiement Espèces</h4>
                </div>
                <p className="text-sm text-gray-600 ml-7">
                  Paiement en espèces sur place. Gestion manuelle des transactions.
                </p>
                <div className="mt-2 ml-7">
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    Traditionnel
                  </span>
                </div>
              </div>

              {/* Paiement marketplace */}
              <div
                onClick={() => setSelectedType('marketplace')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedType === 'marketplace'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    selectedType === 'marketplace'
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedType === 'marketplace' && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-800">Marketplace Digital</h4>
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    NOUVEAU
                  </span>
                </div>
                <p className="text-sm text-gray-600 ml-7">
                  Paiement multi-canaux (Wave, Orange Money, cartes) avec versement automatique.
                </p>
                <div className="mt-2 ml-7 space-x-1">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    Wave
                  </span>
                  <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                    Orange Money
                  </span>
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    Cartes
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration selon le type */}
          {selectedType === 'traditional' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">
                Configuration Paiement Espèces
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du moyen de paiement
                </label>
                <input
                  type="text"
                  defaultValue="Espèces"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  defaultValue="Paiement en espèces sur place"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    onSave({
                      type: 'cash_payment',
                      name: 'Espèces',
                      description: 'Paiement en espèces sur place'
                    });
                    onClose();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          )}

          {selectedType === 'marketplace' && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Configuration Marketplace Digital
              </h3>
              <MarketplaceSettings fieldId={fieldId} />
              <div className="mt-6 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
