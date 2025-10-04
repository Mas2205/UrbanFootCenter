const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function resetPassword() {
  try {
    const email = 'abdoulaye_uraban@ex.com';
    const newPassword = 'password123'; // Mot de passe temporaire
    
    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log(`❌ Utilisateur avec l'email ${email} non trouvé`);
      return;
    }
    
    console.log(`✅ Utilisateur trouvé: ${user.first_name} ${user.last_name}`);
    
    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Mettre à jour directement sans passer par les hooks
    await User.update(
      { password_hash: hashedPassword },
      { 
        where: { email },
        hooks: false // Éviter le double hachage
      }
    );
    
    console.log(`✅ Mot de passe réinitialisé avec succès pour ${email}`);
    console.log(`🔑 Nouveau mot de passe temporaire: ${newPassword}`);
    console.log('⚠️  Veuillez changer ce mot de passe après connexion');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
    process.exit(1);
  }
}

resetPassword();
