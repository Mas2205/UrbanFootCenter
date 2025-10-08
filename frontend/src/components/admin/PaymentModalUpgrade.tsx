import React, { useState } from 'react';

interface PaymentModalUpgradeProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

export const PaymentModalUpgrade: React.FC<PaymentModalUpgradeProps> = ({ 
  onClose, 
  onSave 
}) => {
  const [selectedMode, setSelectedMode] = useState<'current' | 'marketplace'>('current');
  
  // Données pour le mode actuel (votre système)
  const [currentData, setCurrentData] = useState({
    terrain: '',
    type: 'Wave',
    secret_api: '',
    merchant_id: '',
    configuration: '{}'
  });

  // Données pour le mode marketplace
  const [marketplaceData, setMarketplaceData] = useState({
    owner_payout_channel: 'wave',
    owner_mobile_e164: '',
    commission_rate_bps: 1000
  });

  const handleSave = () => {
    if (selectedMode === 'marketplace') {
      onSave({
        mode: 'marketplace',
        payment_type: 'marketplace_digital',
        ...marketplaceData
      });
    } else {
      onSave({
        mode: 'traditional',
        payment_type: currentData.type.toLowerCase().replace(' ', '_'),
        terrain: currentData.terrain,
        secret_api: currentData.secret_api,
        merchant_id: currentData.merchant_id,
        configuration: currentData.configuration
      });
    }
  };

  const formatMobile = (value: string) => {
    let cleaned = value.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    if (cleaned.startsWith('7') || cleaned.startsWith('6')) {
      cleaned = `+221${cleaned}`;
    }
    return cleaned;
  };

  const validateMobile = (mobile: string) => {
    return /^\+221[67]\d{8}$/.test(mobile);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
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
          {/* Sélecteur de mode */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setSelectedMode('current')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  selectedMode === 'current'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 Mode Actuel
              </button>
              <button
                onClick={() => setSelectedMode('marketplace')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  selectedMode === 'marketplace'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🚀 Marketplace Digital
                <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                  NOUVEAU
                </span>
              </button>
            </div>
          </div>

          {/* Mode actuel (votre interface existante) */}
          {selectedMode === 'current' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <p className="text-sm text-blue-700">
                  💡 <strong>Mode actuel :</strong> Configuration manuelle comme votre système existant
                </p>
              </div>

              {/* Terrain */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terrain *
                </label>
                <select
                  value={currentData.terrain}
                  onChange={(e) => setCurrentData({ ...currentData, terrain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un terrain</option>
                  <option value="urban_foot_center">URBAN FOOT CENTER</option>
                </select>
              </div>

              {/* Type de paiement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de paiement *
                </label>
                <select
                  value={currentData.type}
                  onChange={(e) => setCurrentData({ ...currentData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Wave">Wave</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="Carte Bancaire">Carte Bancaire</option>
                  <option value="Espèces">Espèces</option>
                </select>
              </div>

              {/* Secret API */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secret API (optionnel)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={currentData.secret_api}
                    onChange={(e) => setCurrentData({ ...currentData, secret_api: e.target.value })}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Votre clé API secrète"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              {/* Merchant ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant ID (optionnel)
                </label>
                <input
                  type="text"
                  value={currentData.merchant_id}
                  onChange={(e) => setCurrentData({ ...currentData, merchant_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Identifiant marchand"
                />
              </div>

              {/* Configuration JSON */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuration (JSON)
                </label>
                <textarea
                  value={currentData.configuration}
                  onChange={(e) => setCurrentData({ ...currentData, configuration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder='{"key": "value"}'
                />
              </div>
            </div>
          )}

          {/* Mode marketplace */}
          {selectedMode === 'marketplace' && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 rounded-lg mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Marketplace Digital Activé
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>✨ Paiement multi-canaux automatique</p>
                      <div className="flex space-x-2 mt-1">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Wave</span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">Orange Money</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Cartes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Canal de versement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Canal de versement automatique *
                </label>
                <select
                  value={marketplaceData.owner_payout_channel}
                  onChange={(e) => setMarketplaceData({
                    ...marketplaceData,
                    owner_payout_channel: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="wave">🌊 Wave (recommandé - versement instantané)</option>
                  <option value="orange_money">🍊 Orange Money (24h)</option>
                  <option value="paydunya_push">💳 PayDunya Push (24h)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Où vous recevrez automatiquement 90% du montant après chaque paiement
                </p>
              </div>

              {/* Numéro mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro mobile pour versements *
                </label>
                <input
                  type="tel"
                  value={marketplaceData.owner_mobile_e164}
                  onChange={(e) => {
                    const formatted = formatMobile(e.target.value);
                    setMarketplaceData({
                      ...marketplaceData,
                      owner_mobile_e164: formatted
                    });
                  }}
                  placeholder="+221 77 123 45 67"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    marketplaceData.owner_mobile_e164 && !validateMobile(marketplaceData.owner_mobile_e164)
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                />
                {marketplaceData.owner_mobile_e164 && !validateMobile(marketplaceData.owner_mobile_e164) && (
                  <p className="text-xs text-red-600 mt-1">
                    Format invalide. Utilisez +221 suivi de 9 chiffres
                  </p>
                )}
              </div>

              {/* Commission */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission plateforme
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="500"
                    max="2000"
                    step="100"
                    value={marketplaceData.commission_rate_bps}
                    onChange={(e) => setMarketplaceData({
                      ...marketplaceData,
                      commission_rate_bps: parseInt(e.target.value)
                    })}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                    {(marketplaceData.commission_rate_bps / 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5%</span>
                  <span>20%</span>
                </div>
              </div>

              {/* Simulation */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">💰 Simulation pour 10 000 FCFA</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Montant réservation:</span>
                    <span>10 000 FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission ({(marketplaceData.commission_rate_bps / 100).toFixed(1)}%):</span>
                    <span>-{Math.floor(10000 * marketplaceData.commission_rate_bps / 10000).toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-green-200 pt-1">
                    <span>Vous recevez automatiquement:</span>
                    <span>{(10000 - Math.floor(10000 * marketplaceData.commission_rate_bps / 10000)).toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={
                (selectedMode === 'marketplace' && !validateMobile(marketplaceData.owner_mobile_e164)) ||
                (selectedMode === 'current' && !currentData.terrain)
              }
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
