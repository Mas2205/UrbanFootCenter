import React, { useState } from 'react';

interface EnhancedPaymentModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

export const EnhancedPaymentModal: React.FC<EnhancedPaymentModalProps> = ({ 
  onClose, 
  onSave 
}) => {
  const [selectedMode, setSelectedMode] = useState<'traditional' | 'marketplace'>('marketplace');
  const [formData, setFormData] = useState({
    // Mode traditionnel (votre système actuel)
    traditional: {
      type: 'Wave',
      secret_api: '',
      merchant_id: '',
      configuration: '{}'
    },
    // Mode marketplace (nouveau système)
    marketplace: {
      owner_payout_channel: 'wave',
      owner_mobile_e164: '',
      commission_rate_bps: 1000,
      auto_payout: true
    }
  });

  const handleSave = () => {
    if (selectedMode === 'marketplace') {
      onSave({
        payment_type: 'marketplace_digital',
        ...formData.marketplace
      });
    } else {
      const { type, ...traditionalData } = formData.traditional;
      onSave({
        payment_type: type.toLowerCase().replace(' ', '_'),
        ...traditionalData
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
            <h3 className="text-lg font-medium text-gray-800 mb-4">Mode de paiement</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Mode traditionnel */}
              <div
                onClick={() => setSelectedMode('traditional')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedMode === 'traditional'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    selectedMode === 'traditional'
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedMode === 'traditional' && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-800">Mode Traditionnel</h4>
                </div>
                <p className="text-sm text-gray-600 ml-7">
                  Configuration manuelle des APIs (votre système actuel)
                </p>
              </div>

              {/* Mode marketplace */}
              <div
                onClick={() => setSelectedMode('marketplace')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedMode === 'marketplace'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    selectedMode === 'marketplace'
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedMode === 'marketplace' && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-800">Marketplace Digital</h4>
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    RECOMMANDÉ
                  </span>
                </div>
                <p className="text-sm text-gray-600 ml-7">
                  Multi-canaux + commission + versement automatique
                </p>
              </div>
            </div>
          </div>

          {/* Configuration selon le mode */}
          {selectedMode === 'traditional' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Configuration Traditionnelle</h3>
              
              {/* Type de paiement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de paiement *
                </label>
                <select
                  value={formData.traditional.type}
                  onChange={(e) => setFormData({
                    ...formData,
                    traditional: { ...formData.traditional, type: e.target.value }
                  })}
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
                    value={formData.traditional.secret_api}
                    onChange={(e) => setFormData({
                      ...formData,
                      traditional: { ...formData.traditional, secret_api: e.target.value }
                    })}
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
                  value={formData.traditional.merchant_id}
                  onChange={(e) => setFormData({
                    ...formData,
                    traditional: { ...formData.traditional, merchant_id: e.target.value }
                  })}
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
                  value={formData.traditional.configuration}
                  onChange={(e) => setFormData({
                    ...formData,
                    traditional: { ...formData.traditional, configuration: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder='{"key": "value"}'
                />
              </div>
            </div>
          )}

          {selectedMode === 'marketplace' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800">Configuration Marketplace</h3>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Wave</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">Orange Money</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Cartes</span>
                </div>
              </div>

              {/* Canal de versement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Canal de versement automatique *
                </label>
                <select
                  value={formData.marketplace.owner_payout_channel}
                  onChange={(e) => setFormData({
                    ...formData,
                    marketplace: { ...formData.marketplace, owner_payout_channel: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="wave">Wave (recommandé - versement instantané)</option>
                  <option value="orange_money">Orange Money (24h)</option>
                  <option value="paydunya_push">PayDunya Push (24h)</option>
                </select>
              </div>

              {/* Numéro mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro mobile pour versements *
                </label>
                <input
                  type="tel"
                  value={formData.marketplace.owner_mobile_e164}
                  onChange={(e) => {
                    const formatted = formatMobile(e.target.value);
                    setFormData({
                      ...formData,
                      marketplace: { ...formData.marketplace, owner_mobile_e164: formatted }
                    });
                  }}
                  placeholder="+221 77 123 45 67"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formData.marketplace.owner_mobile_e164 && !validateMobile(formData.marketplace.owner_mobile_e164)
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                />
                {formData.marketplace.owner_mobile_e164 && !validateMobile(formData.marketplace.owner_mobile_e164) && (
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
                    value={formData.marketplace.commission_rate_bps}
                    onChange={(e) => setFormData({
                      ...formData,
                      marketplace: { ...formData.marketplace, commission_rate_bps: parseInt(e.target.value) }
                    })}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                    {(formData.marketplace.commission_rate_bps / 100).toFixed(1)}%
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
                    <span>Commission ({(formData.marketplace.commission_rate_bps / 100).toFixed(1)}%):</span>
                    <span>-{Math.floor(10000 * formData.marketplace.commission_rate_bps / 10000).toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-green-200 pt-1">
                    <span>Versement automatique:</span>
                    <span>{(10000 - Math.floor(10000 * formData.marketplace.commission_rate_bps / 10000)).toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>

              {/* Avantages */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">✨ Avantages Marketplace</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Paiement multi-canaux (Wave, Orange Money, cartes)</li>
                  <li>• QR code automatique pour mobile</li>
                  <li>• Versement automatique après paiement</li>
                  <li>• Commission prélevée automatiquement</li>
                  <li>• Webhook sécurisé pour confirmation</li>
                </ul>
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
                selectedMode === 'marketplace' && 
                !validateMobile(formData.marketplace.owner_mobile_e164)
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
