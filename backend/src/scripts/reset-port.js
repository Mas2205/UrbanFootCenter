/**
 * Script pour remettre le port du serveur backend à 5000
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Chemin vers le fichier .env
const envPath = path.resolve(__dirname, '../../.env');

// Charger les variables d'environnement actuelles
dotenv.config({ path: envPath });

// Port d'origine
const originalPort = 5000;

async function resetPort() {
  try {
    // Lire le contenu du fichier .env
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Remplacer le port existant par 5000
    const newContent = envContent.replace(/PORT=\d+/g, `PORT=${originalPort}`);
    
    // Écrire les modifications dans le fichier .env
    fs.writeFileSync(envPath, newContent);
    
    console.log(`Port remis à ${originalPort} avec succès.`);
    console.log('Veuillez redémarrer le serveur backend pour appliquer les changements.');
    
  } catch (error) {
    console.error('Erreur lors de la modification du port:', error);
  }
}

// Exécuter la fonction
resetPort();
