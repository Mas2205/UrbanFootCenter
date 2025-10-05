#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Générateur de clés sécurisées pour Urban Foot Center
 */

// Fonction pour générer une clé aléatoire sécurisée
function generateSecureKey(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// Fonction pour générer un mot de passe fort
function generateStrongPassword(length = 32) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}

// Fonction pour générer un UUID v4
function generateUUID() {
  return crypto.randomUUID();
}

console.log('🔐 Générateur de clés sécurisées Urban Foot Center\n');

// Génération des clés
const keys = {
  JWT_SECRET: generateSecureKey(64),
  SESSION_SECRET: generateSecureKey(64),
  DB_PASSWORD: generateStrongPassword(24),
  ENCRYPTION_KEY: generateSecureKey(32),
  API_KEY: generateSecureKey(48),
  WEBHOOK_SECRET: generateSecureKey(32)
};

console.log('✅ Clés générées avec succès:\n');

// Affichage des clés générées
Object.entries(keys).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('\n📋 Instructions:');
console.log('1. Copiez ces clés dans votre fichier .env de production');
console.log('2. Ne partagez JAMAIS ces clés');
console.log('3. Utilisez des clés différentes pour chaque environnement');
console.log('4. Sauvegardez ces clés de manière sécurisée');

// Option pour sauvegarder dans un fichier
const saveToFile = process.argv.includes('--save');

if (saveToFile) {
  const envContent = `# Clés générées automatiquement - ${new Date().toISOString()}
# ATTENTION: Gardez ces clés secrètes et sécurisées

${Object.entries(keys).map(([key, value]) => `${key}=${value}`).join('\n')}

# Autres variables à configurer manuellement:
NODE_ENV=production
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=urban_foot_center
DB_USER=postgres
CORS_ORIGIN=https://votre-domaine.com
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=VOTRE_EMAIL@EXAMPLE.COM
MAIL_PASS=VOTRE_MOT_DE_PASSE_APP
MAIL_FROM=no-reply@votre-domaine.com
`;

  const filename = `secure-keys-${Date.now()}.env`;
  fs.writeFileSync(filename, envContent);
  console.log(`\n💾 Clés sauvegardées dans: ${filename}`);
  console.log('⚠️  Supprimez ce fichier après avoir copié les clés!');
}

console.log('\n🔒 Conseils de sécurité:');
console.log('• Utilisez HTTPS en production');
console.log('• Activez le rate limiting');
console.log('• Configurez CORS correctement');
console.log('• Surveillez les logs d\'accès');
console.log('• Effectuez des sauvegardes régulières');
console.log('• Mettez à jour les dépendances régulièrement');

// Vérification de la force des clés
console.log('\n🛡️  Analyse de sécurité:');
Object.entries(keys).forEach(([key, value]) => {
  const entropy = value.length * Math.log2(16); // Pour hex
  const strength = entropy > 256 ? 'Très forte' : entropy > 128 ? 'Forte' : 'Faible';
  console.log(`${key}: ${strength} (${Math.round(entropy)} bits d'entropie)`);
});

console.log('\n🎯 Prêt pour le déploiement sécurisé!');
