'use strict';

const demoData = require('../utils/demo-data');

/**
 * Middleware pour fournir des données de démonstration quand PostgreSQL n'est pas disponible
 * Maintient l'utilisation d'identifiants sécurisés (UUID v4) comme spécifié par le client
 */
const demoMode = (req, res, next) => {
  // Vérifier si nous sommes en mode démo (base de données non disponible)
  if (global.DB_MODE === 'demo') {
    // Selon le chemin et la méthode, renvoyer les données de démonstration appropriées
    
    // Liste des terrains
    if (req.path === '/api/fields' && req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Liste des terrains (MODE DÉMO)',
        data: demoData.fields
      });
    }
    
    // Liste des créneaux horaires
    else if (req.path === '/api/reservations/timeslots' && req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Liste des créneaux horaires (MODE DÉMO)',
        data: demoData.timeSlots
      });
    }
    
    // Authentification (connexion)
    else if (req.path === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = req.body;
      
      // En mode démo, accepter n'importe quel mot de passe pour demo@example.com ou admin@example.com
      if (email === 'demo@example.com' || email === 'admin@urbanfootcenter.com') {
        const user = email.includes('admin') ? demoData.users[0] : demoData.users[1];
        return res.status(200).json({
          success: true,
          message: 'Connexion réussie (MODE DÉMO)',
          token: 'demo-jwt-token',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Identifiants incorrects. En mode démo, utilisez demo@example.com ou admin@urbanfootcenter.com'
        });
      }
    }
    
    // Réservations d'un utilisateur
    else if (req.path === '/api/reservations/user' && req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Réservations de l\'utilisateur (MODE DÉMO)',
        data: demoData.reservations
      });
    }
    
    // Réservations admin
    else if (req.path === '/api/reservations/admin/all/details' && req.method === 'GET') {
      // Enrichir les données pour simuler le format attendu par le front
      const detailedReservations = demoData.reservations.map(reservation => {
        const field = demoData.fields.find(f => f.id === reservation.field_id);
        const user = demoData.users.find(u => u.id === reservation.user_id);
        const payment = demoData.payments.find(p => p.reservation_id === reservation.id);
        
        return {
          ...reservation,
          field: field,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone_number: user.phone_number
          },
          payment: payment
        };
      });
      
      return res.status(200).json({
        success: true,
        message: 'Détails des réservations (MODE DÉMO)',
        data: detailedReservations
      });
    }
    
    // Paramètres administrateur
    else if (req.path === '/api/admin/settings' && req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Paramètres administrateur (MODE DÉMO)',
        data: {
          business_name: 'Urban Foot Center',
          address: 'Avenue Cheikh Anta Diop, Dakar, Sénégal',
          phone: '+221 33 123 45 67',
          email: 'contact@urbanfootcenter.com',
          website: 'https://urbanfootcenter.com',
          opening_hours: '8h00 - 23h00',
          social_media: {
            facebook: 'https://facebook.com/urbanfootcenter',
            instagram: 'https://instagram.com/urbanfootcenter',
            twitter: 'https://twitter.com/urbanfootcenter'
          },
          payment_methods: ['Cash', 'Carte', 'Wave', 'Orange Money'],
          cancellation_policy: '24 heures avant la réservation',
          refund_policy: '100% si annulation 24h avant, 50% si moins de 24h',
          maintenance_mode: false
        }
      });
    }
    
    // Par défaut, si la route n'est pas gérée en mode démo
    else {
      return res.status(200).json({
        success: true,
        message: 'Mode démo actif - Cette fonctionnalité nécessite une base de données PostgreSQL',
        demo: true
      });
    }
  } 
  
  // Si nous ne sommes pas en mode démo, passer au middleware suivant
  next();
};

module.exports = { demoMode };
