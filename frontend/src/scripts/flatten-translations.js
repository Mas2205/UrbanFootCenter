const fs = require('fs');
const path = require('path');

// Chemin vers le fichier de traduction
const translationFilePath = path.resolve(__dirname, '../locales/fr/translation.json');

// Fonction pour aplatir un objet avec des clés imbriquées
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? `${prefix}.` : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], `${pre}${k}`));
    } else {
      acc[`${pre}${k}`] = obj[k];
    }
    return acc;
  }, {});
}

// Lire le fichier de traduction actuel
fs.readFile(translationFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier de traduction:', err);
    return;
  }

  try {
    // Parser le JSON
    const translationData = JSON.parse(data);

    // Extraire l'objet admin.reservations
    const adminReservations = translationData.admin.reservations;
    
    // S'assurer qu'il s'agit bien d'un objet
    if (typeof adminReservations !== 'object' || adminReservations === null || Array.isArray(adminReservations)) {
      console.error('admin.reservations n\'est pas un objet valide');
      return;
    }
    
    // Supprimer l'objet admin.reservations original
    translationData.admin.reservations = "Réservations";
    
    // Aplatir l'objet admin.reservations
    const flattenedReservations = flattenObject(adminReservations, 'admin.reservations');
    
    // Ajouter les clés aplaties au niveau racine
    Object.keys(flattenedReservations).forEach(key => {
      translationData[key] = flattenedReservations[key];
    });
    
    // Écrire le fichier mis à jour
    fs.writeFile(
      translationFilePath,
      JSON.stringify(translationData, null, 2),
      'utf8',
      (writeErr) => {
        if (writeErr) {
          console.error('Erreur lors de l\'écriture du fichier de traduction:', writeErr);
          return;
        }
        console.log('Fichier de traduction mis à jour avec succès avec des clés aplaties!');
        console.log('Clés ajoutées:');
        Object.keys(flattenedReservations).forEach(key => {
          console.log(`- ${key}: "${flattenedReservations[key]}"`);
        });
      }
    );
  } catch (parseError) {
    console.error('Erreur lors du parsing du fichier JSON:', parseError);
  }
});
