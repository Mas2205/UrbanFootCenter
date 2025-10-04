const fs = require('fs');
const path = require('path');

// Chemin vers le fichier API du frontend
const apiPath = path.resolve(__dirname, '../../../frontend/src/services/api/paymentAPI.ts');

// Lire le contenu du fichier
fs.readFile(apiPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier API:', err);
    return;
  }

  console.log('=== CORRECTION DE LA ROUTE API DES PAIEMENTS ADMIN ===');

  // Vérifier la ligne actuelle
  const originalLine = "const response = await axios.get(`${API_BASE_URL}/payments`, { params });";
  const correctedLine = "const response = await axios.get(`${API_BASE_URL}/payments/admin/all`, { params });";
  
  if (data.includes(originalLine)) {
    // Remplacer la ligne erronée par la ligne corrigée
    const updatedContent = data.replace(originalLine, correctedLine);
    
    // Écrire le fichier mis à jour
    fs.writeFile(apiPath, updatedContent, 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Erreur lors de l\'écriture du fichier API:', writeErr);
        return;
      }
      console.log('✅ Route API des paiements admin corrigée avec succès!');
      console.log('Avant: GET /payments');
      console.log('Après: GET /payments/admin/all');
      console.log('');
      console.log('❗ Important: Redémarrez le serveur frontend pour appliquer les modifications');
    });
  } else {
    console.log('⚠️ La ligne à remplacer n\'a pas été trouvée dans le fichier.');
    console.log('Veuillez vérifier manuellement la fonction getAllPayments dans:');
    console.log(apiPath);
  }
});
