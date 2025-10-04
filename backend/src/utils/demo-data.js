'use strict';

const { v4: uuidv4 } = require('uuid');

// Données de démonstration avec UUID v4 pour garantir la sécurité des identifiants
// Ces données respectent l'exigence du client d'utiliser des identifiants sécurisés non séquentiels

const users = [
  {
    id: uuidv4(),
    username: 'admin',
    email: 'admin@urbanfootcenter.com',
    password: '$2a$10$XR7raMLADz3eeA1KR3D2EuVM7UHV9au0TRnGMTd5WrIrLm5jYY9hy', // bcrypt hash for "password123"
    first_name: 'Admin',
    last_name: 'User',
    phone_number: '+221770000000',
    role: 'admin',
    is_verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
    username: 'client',
    email: 'client@example.com',
    password: '$2a$10$XR7raMLADz3eeA1KR3D2EuVM7UHV9au0TRnGMTd5WrIrLm5jYY9hy', // bcrypt hash for "password123"
    first_name: 'Client',
    last_name: 'Test',
    phone_number: '+221771111111',
    role: 'user',
    is_verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const fields = [
  {
    id: uuidv4(),
    name: 'Terrain 5v5 Indoor',
    description: 'Terrain de foot à 5 couvert, surface synthétique de haute qualité',
    size: '5v5',
    surface_type: 'Synthétique',
    indoor: true,
    hourly_rate: 25000, // 25,000 FCFA
    image_url: '/images/fields/terrain-5v5-indoor.jpg',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
    name: 'Terrain 7v7 Outdoor',
    description: 'Grand terrain extérieur pour matchs à 7, éclairage LED',
    size: '7v7',
    surface_type: 'Synthétique',
    indoor: false,
    hourly_rate: 35000, // 35,000 FCFA
    image_url: '/images/fields/terrain-7v7-outdoor.jpg',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
    name: 'Terrain 3v3 Cage',
    description: 'Terrain cage pour foot à 3, idéal pour techniques et jeu rapide',
    size: '3v3',
    surface_type: 'Synthétique',
    indoor: true,
    hourly_rate: 15000, // 15,000 FCFA
    image_url: '/images/fields/terrain-3v3-cage.jpg',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Génération de créneaux horaires pour aujourd'hui et les 7 prochains jours
const generateTimeSlots = () => {
  const slots = [];
  const currentDate = new Date();
  currentDate.setHours(8, 0, 0, 0); // Commencer à 8h du matin
  
  // Pour chaque jour sur 7 jours
  for (let day = 0; day < 7; day++) {
    const dayDate = new Date(currentDate);
    dayDate.setDate(dayDate.getDate() + day);
    
    // Pour chaque heure de 8h à 22h
    for (let hour = 8; hour <= 22; hour++) {
      fields.forEach(field => {
        const startTime = new Date(dayDate);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(hour + 1, 0, 0, 0);
        
        slots.push({
          id: uuidv4(),
          field_id: field.id,
          start_time: startTime,
          end_time: endTime,
          is_available: Math.random() > 0.3, // 70% des créneaux sont disponibles
          price: field.hourly_rate,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    }
  }
  
  return slots;
};

const timeSlots = generateTimeSlots();

// Quelques réservations pour la démonstration
const reservations = [
  {
    id: uuidv4(),
    user_id: users[1].id,
    field_id: fields[0].id,
    time_slot_id: timeSlots[5].id,
    reservation_date: timeSlots[5].start_time,
    duration: 60, // En minutes
    total_price: fields[0].hourly_rate,
    status: 'confirmed',
    payment_status: 'paid',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
    user_id: users[1].id,
    field_id: fields[1].id,
    time_slot_id: timeSlots[15].id,
    reservation_date: timeSlots[15].start_time,
    duration: 120, // En minutes
    total_price: fields[1].hourly_rate * 2,
    status: 'confirmed',
    payment_status: 'paid',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Paiements associés aux réservations
const payments = [
  {
    id: uuidv4(),
    reservation_id: reservations[0].id,
    amount: reservations[0].total_price,
    payment_method: 'Wave',
    payment_date: new Date(),
    transaction_id: 'WAVE-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
    reservation_id: reservations[1].id,
    amount: reservations[1].total_price,
    payment_method: 'Orange Money',
    payment_date: new Date(),
    transaction_id: 'OM-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Codes promo
const promoCodes = [
  {
    id: uuidv4(),
    code: 'WELCOME20',
    discount_type: 'percentage',
    discount_value: 20,
    start_date: new Date(),
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    min_purchase: 0,
    max_discount: 10000,
    usage_limit: 1,
    is_active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Équipes
const teams = [
  {
    id: uuidv4(),
    name: 'Les Invaincus',
    logo_url: '/images/teams/invaincus.jpg',
    created_by: users[1].id,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Membres d'équipe
const teamMembers = [
  {
    id: uuidv4(),
    team_id: teams[0].id,
    user_id: users[1].id,
    role: 'captain',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Notifications
const notifications = [
  {
    id: uuidv4(),
    user_id: users[1].id,
    title: 'Réservation confirmée',
    message: 'Votre réservation du terrain 5v5 Indoor a été confirmée.',
    type: 'reservation',
    read: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

module.exports = {
  users,
  fields,
  timeSlots,
  reservations,
  payments,
  promoCodes,
  teams,
  teamMembers,
  notifications,
  
  // Fonction pour générer un nouvel UUID v4 (utile pour les nouvelles entités)
  generateId: uuidv4
};
