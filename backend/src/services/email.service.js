const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Configuration du transporteur d'emails
let transporter;

/**
 * Initialise le service d'email
 */
const initializeEmailService = () => {
  // En production, utilisez des variables d'environnement
  if (process.env.NODE_ENV === 'production') {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // En développement, utilisez un service de test comme Ethereal ou Mailtrap
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal_password'
      }
    });
  }
};

/**
 * Envoie un email
 * @param {string} to - Adresse email destinataire
 * @param {string} subject - Sujet de l'email
 * @param {string} html - Contenu HTML de l'email
 * @param {string} text - Version texte de l'email (optionnel)
 */
const sendEmail = async (to, subject, html, text = '') => {
  if (!transporter) {
    initializeEmailService();
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Urban Foot Center" <contact@urbanfootcenter.sn>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return { success: false, error };
  }
};

/**
 * Charge un template d'email et remplace les variables
 * @param {string} templateName - Nom du fichier template
 * @param {Object} variables - Variables à remplacer dans le template
 */
const loadEmailTemplate = (templateName, variables = {}) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
    let template = fs.readFileSync(templatePath, 'utf-8');
    
    // Remplacer toutes les variables du template
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, variables[key]);
    });

    return template;
  } catch (error) {
    console.error('Erreur lors du chargement du template d\'email:', error);
    // Template de secours en cas d'erreur
    return `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Urban Foot Center</h2>
        <p>Cette notification a été générée automatiquement.</p>
        <p>Pour plus d'informations, connectez-vous à votre compte.</p>
      </div>
    `;
  }
};

/**
 * Envoie un email de vérification d'inscription
 * @param {string} to - Email du destinataire
 * @param {string} name - Prénom du destinataire
 * @param {string} token - Token de vérification
 */
const sendVerificationEmail = async (to, name, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;
  
  const htmlContent = loadEmailTemplate('verification', {
    name,
    verificationUrl,
    currentYear: new Date().getFullYear()
  });
  
  return await sendEmail(
    to,
    'Vérification de votre compte Urban Foot Center',
    htmlContent
  );
};

/**
 * Envoie un email de réinitialisation de mot de passe
 * @param {string} to - Email du destinataire
 * @param {string} name - Prénom du destinataire
 * @param {string} token - Token de réinitialisation
 */
const sendPasswordResetEmail = async (to, name, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
  
  const htmlContent = loadEmailTemplate('reset-password', {
    name,
    resetUrl,
    currentYear: new Date().getFullYear()
  });
  
  return await sendEmail(
    to,
    'Réinitialisation de votre mot de passe Urban Foot Center',
    htmlContent
  );
};

/**
 * Envoie une confirmation de réservation
 * @param {string} to - Email du destinataire
 * @param {string} name - Prénom du destinataire
 * @param {Object} reservationDetails - Détails de la réservation
 */
const sendReservationConfirmation = async (to, name, reservationDetails) => {
  const { reservationId, fieldName, date, startTime, endTime, totalPrice } = reservationDetails;
  
  // Formater la date pour l'affichage
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const htmlContent = loadEmailTemplate('reservation-confirmation', {
    name,
    reservationId,
    fieldName,
    date: formattedDate,
    startTime,
    endTime,
    totalPrice: typeof totalPrice === 'number' ? totalPrice.toFixed(2) : totalPrice,
    currency: 'FCFA',
    dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reservations`,
    currentYear: new Date().getFullYear()
  });
  
  return await sendEmail(
    to,
    'Confirmation de votre réservation - Urban Foot Center',
    htmlContent
  );
};

/**
 * Envoie une notification d'annulation de réservation
 * @param {string} to - Email du destinataire
 * @param {string} name - Prénom du destinataire
 * @param {Object} cancellationDetails - Détails de l'annulation
 */
const sendReservationCancellation = async (to, name, cancellationDetails) => {
  const { reservationId, fieldName, date, startTime, refundAmount = 0 } = cancellationDetails;
  
  // Formater la date pour l'affichage
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const htmlContent = loadEmailTemplate('reservation-cancellation', {
    name,
    reservationId,
    fieldName,
    date: formattedDate,
    startTime,
    refundAmount: refundAmount.toFixed(2),
    hasRefund: refundAmount > 0,
    currency: 'FCFA',
    dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reservations`,
    currentYear: new Date().getFullYear()
  });
  
  return await sendEmail(
    to,
    'Annulation de votre réservation - Urban Foot Center',
    htmlContent
  );
};

/**
 * Envoie un reçu de paiement
 * @param {string} to - Email du destinataire
 * @param {string} name - Prénom du destinataire
 * @param {Object} paymentDetails - Détails du paiement
 */
const sendPaymentReceipt = async (to, name, paymentDetails) => {
  const { reservationId, fieldName, date, amount, paymentMethod, receiptUrl } = paymentDetails;
  
  // Formater la date pour l'affichage
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const htmlContent = loadEmailTemplate('payment-receipt', {
    name,
    reservationId,
    fieldName,
    date: formattedDate,
    amount: amount.toFixed(2),
    currency: 'FCFA',
    paymentMethod,
    receiptUrl,
    dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reservations`,
    currentYear: new Date().getFullYear()
  });
  
  return await sendEmail(
    to,
    'Reçu de paiement - Urban Foot Center',
    htmlContent
  );
};

module.exports = {
  initializeEmailService,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendReservationConfirmation,
  sendReservationCancellation,
  sendPaymentReceipt
};
