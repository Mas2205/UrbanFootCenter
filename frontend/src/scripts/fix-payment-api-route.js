const fs = require('fs');
const path = require('path');

// Chemin vers le fichier de service API admin
const apiPath = path.resolve(__dirname, '../services/api/adminAPI.ts');

// Lire le contenu du fichier
fs.readFile(apiPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier API:', err);
    return;
  }

  // Corriger l'URL de l'API pour correspondre à la route du backend
  const updatedContent = data.replace(
    "const response = await axios.get(`${API_BASE_URL}/admin/payments`",
    "const response = await axios.get(`${API_BASE_URL}/payments/admin/all`"
  );

  // Écrire le fichier mis à jour
  fs.writeFile(apiPath, updatedContent, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Erreur lors de l\'écriture du fichier API:', writeErr);
      return;
    }
    console.log('Route API des paiements corrigée avec succès!');
    console.log('Le frontend appelle maintenant /api/payments/admin/all au lieu de /api/admin/payments');
  });
});
