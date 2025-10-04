const bcrypt = require('bcryptjs');

// Hash fourni
const storedHash = '$2a$10$nXoZ1xx1Slt7pR6tTW/n0eNZ9AW8Ys.t7hrUG1Jv/0ymGD20n/whm';

// Liste de mots de passe potentiels à tester
const possiblePasswords = [
  'mas',           // Mot de passe essayé
  'Mas',           // Avec une majuscule
  'MAS',           // Tout en majuscules
  'mas123',        // Avec des chiffres
  'mas@123',       // Avec des caractères spéciaux
  'Mas@123',       // Combinaison
  'admin',         // Mot de passe commun
  'Admin',         // Variante
  'admin123',      // Variante
  'password',      // Mot de passe commun
  'Password123',   // Variante
  'urbain',        // En rapport avec le projet
  'urbain123',     // Variante
  'urbanfoot',     // En rapport avec le projet
  'urbanfoot123',  // Variante
  '123456',        // Mot de passe commun
  'master',        // Variante de mas
  'Masse',         // Variante
  'Massa',         // Variante
  'football',      // En rapport avec le projet
  'seck',          // Possible nom d'utilisateur
  'foot',          // En rapport avec le projet
  '1234',          // Mot de passe simple
];

// Test chaque mot de passe
async function testPasswords() {
  console.log('=== TEST DE MOTS DE PASSE ===');
  console.log(`Hash cible: ${storedHash}`);
  console.log('Vérification des correspondances...\n');
  
  for (const password of possiblePasswords) {
    try {
      const isMatch = await bcrypt.compare(password, storedHash);
      console.log(`Mot de passe testé: "${password}" - Résultat: ${isMatch ? '✅ CORRESPOND' : '❌ Ne correspond pas'}`);
      
      if (isMatch) {
        console.log(`\n🔑 MOT DE PASSE TROUVÉ: "${password}"\n`);
      }
    } catch (error) {
      console.error(`Erreur lors de la vérification du mot de passe "${password}":`, error);
    }
  }
  console.log('\nTest terminé.');
}

testPasswords();
