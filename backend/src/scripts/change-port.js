/**
 * Script pour modifier le fichier .env et changer le port du serveur backend
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Chemin vers le fichier .env
const envPath = path.resolve(__dirname, '../../.env');

// Charger les variables d'environnement actuelles
dotenv.config({ path: envPath });

// Nouveau port à utiliser
const newPort = 5001;

async function changePort() {
  try {
    // Lire le contenu du fichier .env
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Remplacer le port existant ou ajouter le nouveau port
    let newContent;
    if (envContent.includes('PORT=')) {
      // Si PORT existe, le remplacer
      newContent = envContent.replace(/PORT=\d+/g, `PORT=${newPort}`);
    } else {
      // Sinon, l'ajouter
      newContent = envContent + `\nPORT=${newPort}\n`;
    }
    
    // Écrire les modifications dans le fichier .env
    fs.writeFileSync(envPath, newContent);
    
    console.log(`Port modifié avec succès. Le serveur backend utilisera maintenant le port ${newPort}.`);
    console.log('Veuillez redémarrer le serveur backend pour appliquer les changements.');
    
  } catch (error) {
    console.error('Erreur lors de la modification du port:', error);
  }
}

// Exécuter la fonction
changePort();
