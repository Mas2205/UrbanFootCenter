import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

interface MarketplaceSettingsProps {
  fieldId: string;
}

interface FieldMarketplaceData {
  id: string;
  name: string;
  owner_payout_channel: 'wave' | 'orange_money' | 'paydunya_push' | 'bank_transfer';
  owner_mobile_e164: string;
  commission_rate_bps: number;
  owner_bank_info?: any;
}

export const MarketplaceSettings: React.FC<MarketplaceSettingsProps> = ({ fieldId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldData, setFieldData] = useState<FieldMarketplaceData | null>(null);
  const [formData, setFormData] = useState({
    owner_payout_channel: 'wave' as const,
    owner_mobile_e164: '',
    commission_rate_bps: 1000
  });

  // Charger les données du terrain
  useEffect(() => {
    loadFieldData();
  }, [fieldId]);

  const loadFieldData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/availability/field`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setFieldData(data.data);
        setFormData({
          owner_payout_channel: data.data.owner_payout_channel || 'wave',
          owner_mobile_e164: data.data.owner_mobile_e164 || '',
          commission_rate_bps: data.data.commission_rate_bps || 1000
        });
      }
    } catch (error) {
      console.error('Erreur chargement données terrain:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/availability/field`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Configuration marketplace sauvegardée');
        loadFieldData();
      } else {
        alert(`❌ Erreur: ${data.message}`);
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const formatMobileNumber = (value: string) => {
    // Nettoyer et formater au format E.164
    let cleaned = value.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('7') || cleaned.startsWith('6')) {
      cleaned = `+221${cleaned}`;
    } else if (cleaned.startsWith('221')) {
      cleaned = `+${cleaned}`;
    }
    
    return cleaned;
  };

  const validateMobileNumber = (mobile: string) => {
    const waveRegex = /^\+221[67]\d{8}$/;
    return waveRegex.test(mobile);
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Configuration Marketplace
        </h3>
        <p className="text-sm text-gray-600">
          Configurez les paramètres de paiement et de versement pour votre terrain
        </p>
      </div>

      {/* Informations terrain */}
      {fieldData && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Terrain</h4>
          <p className="text-sm text-gray-600">{fieldData.name}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Canal de versement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Canal de versement préféré *
          </label>
          <select
            value={formData.owner_payout_channel}
            onChange={(e) => setFormData({
              ...formData,
              owner_payout_channel: e.target.value as any
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="wave">Wave (recommandé)</option>
            <option value="orange_money">Orange Money</option>
            <option value="paydunya_push">PayDunya Push</option>
            <option value="bank_transfer">Virement bancaire</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Wave offre les versements les plus rapides et fiables
          </p>
        </div>

        {/* Numéro mobile */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numéro mobile (format international) *
          </label>
          <input
            type="tel"
            value={formData.owner_mobile_e164}
            onChange={(e) => {
              const formatted = formatMobileNumber(e.target.value);
              setFormData({
                ...formData,
                owner_mobile_e164: formatted
              });
            }}
            placeholder="+221 77 123 45 67"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              formData.owner_mobile_e164 && !validateMobileNumber(formData.owner_mobile_e164)
                ? 'border-red-300'
                : 'border-gray-300'
            }`}
          />
          {formData.owner_mobile_e164 && !validateMobileNumber(formData.owner_mobile_e164) && (
            <p className="text-xs text-red-600 mt-1">
              Format invalide. Utilisez +221 suivi de 9 chiffres (ex: +221771234567)
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Numéro où vous recevrez les versements automatiques
          </p>
        </div>

        {/* Taux de commission */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Taux de commission plateforme
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
          <p className="text-xs text-gray-500 mt-2">
            Commission prélevée sur chaque réservation. Vous recevez le reste automatiquement.
          </p>
        </div>

        {/* Simulation */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Simulation</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div className="flex justify-between">
              <span>Réservation 10 000 FCFA:</span>
              <span>10 000 FCFA</span>
            </div>
            <div className="flex justify-between">
              <span>Commission plateforme ({(formData.commission_rate_bps / 100).toFixed(1)}%):</span>
              <span>-{Math.floor(10000 * formData.commission_rate_bps / 10000).toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between font-medium border-t border-blue-200 pt-1">
              <span>Vous recevez:</span>
              <span>{(10000 - Math.floor(10000 * formData.commission_rate_bps / 10000)).toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>

        {/* Informations importantes */}
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">ℹ️ Informations importantes</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Les versements sont automatiques après confirmation de paiement</li>
            <li>• Délai de versement : instantané (Wave) à 24h (autres)</li>
            <li>• Vérifiez que votre numéro mobile est actif et correct</li>
            <li>• La commission est prélevée automatiquement</li>
          </ul>
        </div>

        {/* Boutons d'action */}
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            disabled={saving || !validateMobileNumber(formData.owner_mobile_e164)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <button
            onClick={loadFieldData}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};
