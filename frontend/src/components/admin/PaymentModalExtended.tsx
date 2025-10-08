import React, { useState } from 'react';

interface PaymentModalExtendedProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

export const PaymentModalExtended: React.FC<PaymentModalExtendedProps> = ({ 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    terrain: '',
    type: 'Wave',
    secret_api: '',
    merchant_id: '',
    configuration: '{}',
    // Champs marketplace (conditionnels)
    owner_mobile_e164: '',
    commission_rate_bps: 1000
  });

  const isMarketplace = formData.type === 'Marketplace Digital';

  const handleSave = () => {
    if (isMarketplace) {
      onSave({
        payment_type: 'marketplace_digital',
        terrain: formData.terrain,
        owner_payout_channel: 'wave',
        owner_mobile_e164: formData.owner_mobile_e164,
        commission_rate_bps: formData.commission_rate_bps
      });
    } else {
      onSave({
        payment_type: formData.type.toLowerCase().replace(' ', '_'),
        terrain: formData.terrain,
        secret_api: formData.secret_api,
        merchant_id: formData.merchant_id,
        configuration: formData.configuration
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
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
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

        <div className="p-6 space-y-4">
          {/* Terrain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Terrain *
            </label>
            <select
              value={formData.terrain}
              onChange={(e) => setFormData({ ...formData, terrain: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Sélectionner un terrain</option>
              <option value="urban_foot_center">URBAN FOOT CENTER</option>
            </select>
          </div>

          {/* Type de paiement (votre dropdown + marketplace) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de paiement *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="Wave">Wave</option>
              <option value="Orange Money">Orange Money</option>
              <option value="Carte Bancaire">Carte Bancaire</option>
              <option value="Espèces">Espèces</option>
              <option value="Marketplace Digital">
                🚀 Marketplace Digital (Multi-canaux + Commission auto)
              </option>
            </select>
            
            {isMarketplace && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">Marketplace Digital Sélectionné</p>
                    <p className="text-xs text-green-600">Wave + Orange Money + Cartes + Commission automatique</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Champs conditionnels selon le type */}
          {!isMarketplace ? (
            <>
              {/* Champs traditionnels (votre système actuel) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secret API (optionnel)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={formData.secret_api}
                    onChange={(e) => setFormData({ ...formData, secret_api: e.target.value })}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Votre clé API secrète"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant ID (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.merchant_id}
                  onChange={(e) => setFormData({ ...formData, merchant_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Identifiant marchand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuration (JSON)
                </label>
                <textarea
                  value={formData.configuration}
                  onChange={(e) => setFormData({ ...formData, configuration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                  placeholder='{"key": "value"}'
                />
              </div>
            </>
          ) : (
            <>
              {/* Champs marketplace */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro mobile pour versements automatiques *
                </label>
                <input
                  type="tel"
                  value={formData.owner_mobile_e164}
                  onChange={(e) => {
                    const formatted = formatMobile(e.target.value);
                    setFormData({ ...formData, owner_mobile_e164: formatted });
                  }}
                  placeholder="+221 77 123 45 67"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formData.owner_mobile_e164 && !validateMobile(formData.owner_mobile_e164)
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                />
                {formData.owner_mobile_e164 && !validateMobile(formData.owner_mobile_e164) && (
                  <p className="text-xs text-red-600 mt-1">
                    Format invalide. Utilisez +221 suivi de 9 chiffres
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Numéro Wave où vous recevrez 90% du montant automatiquement
                </p>
              </div>

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
                    value={formData.commission_rate_bps}
                    onChange={(e) => setFormData({
                      ...formData,
                      commission_rate_bps: parseInt(e.target.value)
                    })}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                    {(formData.commission_rate_bps / 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5%</span>
                  <span>20%</span>
                </div>
              </div>

              {/* Simulation */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">💰 Simulation</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Réservation 10 000 FCFA:</span>
                    <span>10 000 FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission ({(formData.commission_rate_bps / 100).toFixed(1)}%):</span>
                    <span>-{Math.floor(10000 * formData.commission_rate_bps / 10000).toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-green-200 pt-1">
                    <span>Vous recevez:</span>
                    <span>{(10000 - Math.floor(10000 * formData.commission_rate_bps / 10000)).toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>

              {/* Avantages */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">✨ Avantages Marketplace</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 🌊 Wave + 🍊 Orange Money + 💳 Cartes en même temps</li>
                  <li>• 📱 QR code automatique pour paiement mobile</li>
                  <li>• 💸 Versement automatique après chaque paiement</li>
                  <li>• 🔒 Webhook sécurisé pour confirmation</li>
                </ul>
              </div>
            </>
          )}

          {/* Boutons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={
                !formData.terrain || 
                (isMarketplace && !validateMobile(formData.owner_mobile_e164))
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
