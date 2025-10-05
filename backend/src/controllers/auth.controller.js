const { User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.error('❌ JWT_SECRET non défini ! Utilisez une clé sécurisée en production.');
  return 'INSECURE_DEFAULT_KEY_CHANGE_ME';
})();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

exports.register = async (req, res) => {
  try {
    console.log('=== INSCRIPTION - DONNÉES REÇUES ===');
    console.log('req.body:', JSON.stringify(req.body, null, 2));
    
    const { email, phone_number, password, first_name, last_name } = req.body;
    
    console.log('Données extraites:');
    console.log('- email:', email);
    console.log('- phone_number:', phone_number);
    console.log('- first_name:', first_name);
    console.log('- last_name:', last_name);
    console.log('- password:', password ? '***' : 'undefined');

    // Validation des champs obligatoires
    if (!email || !phone_number || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont obligatoires',
        missing_fields: {
          email: !email,
          phone_number: !phone_number,
          password: !password,
          first_name: !first_name,
          last_name: !last_name
        }
      });
    }

    // Vérifier si l'utilisateur existe déjà (seulement si phone_number est défini)
    const existingUser = await User.findOne({ 
      where: {
        [Op.or]: [
          { email },
          { phone_number }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Un compte avec cet email ou ce numéro de téléphone existe déjà' 
      });
    }

    // Génération du token de vérification
    const verificationToken = uuidv4();

    // Création du nouvel utilisateur avec UUID comme clé primaire
    const newUser = await User.create({
      email,
      phone_number,
      password_hash: password, // Le hook beforeCreate s'occupera du hachage
      first_name,
      last_name,
      role: 'client', // Par défaut, les utilisateurs sont des clients
      verification_token: verificationToken,
      is_verified: true
    });

    // Envoi de l'email de vérification
    await sendVerificationEmail(email, first_name, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès. Veuillez vérifier votre email pour activer votre compte.',
      user: {
        id: newUser.id,
        email: newUser.email,
        phone_number: newUser.phone_number,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'inscription', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    console.log('=== TENTATIVE DE CONNEXION ===');
    console.log('Requête reçue:', JSON.stringify(req.body));
    
    const { email, password } = req.body;
    console.log(`Email fourni: ${email}`);
    console.log(`Mot de passe fourni: ${password ? '******' : 'non fourni'}`);

    // Recherche de l'utilisateur par email
    const user = await User.findOne({ where: { email } });
    console.log(`Utilisateur trouvé: ${user ? 'OUI' : 'NON'}`);

    // Vérifier si l'utilisateur existe
    if (!user) {
      console.log('Échec: utilisateur non trouvé avec cet email');
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }
    
    console.log(`Détails de l'utilisateur: ID=${user.id}, Role=${user.role}, Verified=${user.is_verified}`);

    // Vérifier si le compte est vérifié
    if (!user.is_verified) {
      console.log('Échec: compte non vérifié');
      return res.status(403).json({ 
        success: false, 
        message: 'Veuillez vérifier votre compte avant de vous connecter' 
      });
    }

    // Vérifier le mot de passe
    console.log('🔐 === VÉRIFICATION MOT DE PASSE DÉTAILLÉE ===');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Mot de passe fourni: ${password}`);
    console.log(`🗃️  Hash en base: ${user.password_hash}`);
    console.log(`📅 Utilisateur créé le: ${user.created_at}`);
    console.log(`✅ Compte vérifié: ${user.is_verified}`);
    console.log(`🏢 Rôle: ${user.role}`);
    
    const isPasswordValid = await user.verifyPassword(password);
    console.log(`🎯 Résultat vérification: ${isPasswordValid ? 'SUCCÈS' : 'ÉCHEC'}`);
    
    if (!isPasswordValid) {
      console.log('❌ ÉCHEC CONNEXION: Mot de passe incorrect');
      console.log('🔍 Vérifiez que le mot de passe utilisé lors de la création est correct');
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    // Mise à jour de la date de dernière connexion
    console.log('Mise à jour de la date de dernière connexion...');
    await user.update({ last_login: new Date() });

    // Génération du token JWT
    console.log('Génération du token JWT...');
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    console.log(`Token généré: ${token.substring(0, 20)}...`);

    console.log('=== CONNEXION RÉUSSIE ===');
    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone_number: user.phone_number,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        profile_picture_url: user.profile_picture_url
      }
    });
  } catch (error) {
    console.error('=== ERREUR LORS DE LA CONNEXION ===');
    console.error('Détail de l\'erreur:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ success: false, message: 'Erreur lors de la connexion', error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Recherche de l'utilisateur par token de vérification
    const user = await User.findOne({ where: { verification_token: token } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Token de vérification invalide' });
    }

    // Activation du compte
    await user.update({
      is_verified: true,
      verification_token: null
    });

    res.status(200).json({
      success: true,
      message: 'Compte vérifié avec succès. Vous pouvez maintenant vous connecter.'
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la vérification de l\'email', 
      error: error.message 
    });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Recherche de l'utilisateur par email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Pour des raisons de sécurité, ne pas révéler si l'email existe ou non
      return res.status(200).json({
        success: true,
        message: 'Si votre email est associé à un compte, vous recevrez un lien de réinitialisation.'
      });
    }

    // Génération du token de réinitialisation
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Envoi de l'email de réinitialisation
    await sendPasswordResetEmail(email, user.first_name, resetToken);

    res.status(200).json({
      success: true,
      message: 'Si votre email est associé à un compte, vous recevrez un lien de réinitialisation.'
    });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation de mot de passe:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la demande de réinitialisation', 
      error: error.message 
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Recherche de l'utilisateur par token de réinitialisation
    const user = await User.findOne({ 
      where: { 
        reset_password_token: token,
        reset_token_expires_at: { [sequelize.Op.gt]: new Date() } // Token non expiré
      }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token invalide ou expiré' 
      });
    }

    // Mise à jour du mot de passe
    user.password_hash = password; // Le hook beforeUpdate s'occupera du hachage
    user.reset_password_token = null;
    user.reset_token_expires_at = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la réinitialisation du mot de passe', 
      error: error.message 
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Extrait du middleware d'authentification

    // Récupération du profil utilisateur
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash', 'verification_token', 'reset_password_token', 'reset_token_expires_at'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération du profil', 
      error: error.message 
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Extrait du middleware d'authentification
    const { first_name, last_name, phone_number } = req.body;

    // Vérification que l'utilisateur existe
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Mise à jour des informations du profil
    await user.update({
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      phone_number: phone_number || user.phone_number
    });

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        id: user.id,
        email: user.email,
        phone_number: user.phone_number,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        profile_picture_url: user.profile_picture_url
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour du profil', 
      error: error.message 
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // Extrait du middleware d'authentification
    const { current_password, new_password } = req.body;

    // Vérification que l'utilisateur existe
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Vérification du mot de passe actuel
    const isPasswordValid = await user.verifyPassword(current_password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Mot de passe actuel incorrect' });
    }

    // Mise à jour du mot de passe
    user.password_hash = new_password; // Le hook beforeUpdate s'occupera du hachage
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du changement de mot de passe', 
      error: error.message 
    });
  }
};
