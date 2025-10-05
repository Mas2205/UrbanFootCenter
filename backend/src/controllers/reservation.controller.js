const { Reservation, Field, TimeSlot, User, Payment, PromoCode, sequelize, HolidayAndClosure } = require('../models');
const { Op } = require('sequelize');
const { sendReservationConfirmation, sendReservationCancellation } = require('../services/email.service');
const { createNotification } = require('../services/notification.service');
const { processPayment } = require('../services/payment.service');
const paymentService = require('../services/paymentService');

// Créer une nouvelle réservation
exports.createReservation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { field_id, reservation_date, time_slot_id, promo_code } = req.body;
    const user_id = req.user.id; // Extrait du middleware d'authentification

    // Vérification que le terrain existe
    const field = await Field.findByPk(field_id);
    if (!field || !field.is_active) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Terrain non trouvé ou inactif'
      });
    }

    // Vérification que le créneau horaire existe
    const timeSlot = await TimeSlot.findByPk(time_slot_id);
    if (!timeSlot || !timeSlot.is_available) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Créneau horaire non trouvé ou non disponible'
      });
    }

    // Vérification que le terrain et le créneau correspondent
    if (timeSlot.field_id !== field_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Le créneau horaire ne correspond pas au terrain sélectionné'
      });
    }

    // Vérification que la date est dans la plage du créneau (datefrom - dateto)
    const reservationDateObj = new Date(reservation_date);
    reservationDateObj.setHours(0, 0, 0, 0); // Sans les heures pour comparer uniquement les dates
    
    // Vérifier si on a les nouvelles propriétés datefrom/dateto
    if (timeSlot.datefrom && timeSlot.dateto) {
      const dateFrom = new Date(timeSlot.datefrom);
      const dateTo = new Date(timeSlot.dateto);
      dateFrom.setHours(0, 0, 0, 0);
      dateTo.setHours(0, 0, 0, 0);
      
      // Vérifier si la date de réservation est dans la plage de dates du créneau
      if (reservationDateObj < dateFrom || reservationDateObj > dateTo) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'La date ne correspond pas à la plage de dates du créneau horaire'
        });
      }
    } else {
      // Fallback pour la compatibilité avec l'ancien modèle (day_of_week)
      // Cette partie peut être supprimée lorsque tous les créneaux auront été mis à jour
      const dayOfWeek = reservationDateObj.getDay(); // 0 pour dimanche, 1 pour lundi, etc.
      
      if (timeSlot.day_of_week !== undefined && dayOfWeek !== timeSlot.day_of_week) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'La date ne correspond pas au jour de la semaine du créneau horaire'
        });
      }
    }

    // Vérification qu'il n'y a pas déjà une réservation pour ce terrain, cette date et ce créneau
    const existingReservation = await Reservation.findOne({
      where: {
        field_id,
        reservation_date,
        start_time: timeSlot.start_time,
        status: {
          [Op.notIn]: ['cancelled']
        }
      },
      transaction
    });

    if (existingReservation) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Ce créneau est déjà réservé pour ce terrain et cette date'
      });
    }

    // Vérification qu'il n'y a pas de fermeture à cette date
    const closure = await HolidayAndClosure.findOne({
      where: {
        date: reservation_date,
        [Op.or]: [
          { affects_all_fields: true },
          { field_id }
        ]
      },
      transaction
    });

    if (closure) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Le complexe ou ce terrain est fermé à cette date pour la raison suivante: ${closure.reason || 'Fermeture programmée'}`
      });
    }

    // Calcul du prix total (avec application du code promo si présent)
    // Vérification de code promotionnel si fourni
    let promoCodeObj = null;
    
    // Calcul du prix total de la réservation
    // On utilise le prix du terrain comme base
    let total_price = field.price_per_hour || 0;
    
    // Si le créneau a un prix spécifique, on l'utilise
    if (timeSlot.price !== undefined && timeSlot.price !== null) {
      total_price = timeSlot.price;
    }
    
    // Log du calcul du prix total
    console.log(`Calcul du prix total - Base: ${total_price} FCFA`);

    if (promo_code) {
      promoCodeObj = await PromoCode.findOne({
        where: { code: promo_code, is_active: true },
        transaction
      });

      if (promoCodeObj) {
        // Vérification de la validité du code promo
        const validationResult = promoCodeObj.isValid();
        
        if (validationResult.valid) {
          // Application de la réduction
          total_price = promoCodeObj.applyDiscount(total_price);
          
          // Incrémentation du compteur d'utilisation
          await promoCodeObj.update(
            { usage_count: promoCodeObj.usage_count + 1 },
            { transaction }
          );
        } else {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: validationResult.reason
          });
        }
      } else {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Code promotionnel invalide'
        });
      }
    }

    // Vérification finale que total_price n'est pas null
    if (total_price === null || total_price === undefined) {
      console.log('ATTENTION: Prix total non défini, utilisation du prix par défaut');
      total_price = 10000; // Prix par défaut de 10000 FCFA
    }
    
    console.log(`Prix final pour la réservation: ${total_price} FCFA`);
    
    // Récupérer l'heure sélectionnée par l'utilisateur ou utiliser celle du créneau
    let start_time = req.body.start_time || req.body.time || timeSlot.start_time;
    
    // Calculer l'heure de fin (heure de début + 1h)
    let end_time;
    try {
      // Gérer le format "HH:MM-HH:MM" du frontend
      if (start_time.includes('-')) {
        const [startPart, endPart] = start_time.split('-');
        start_time = startPart;
        end_time = endPart + ':00';
      } else {
        // Format attendu: "HH:MM" ou "HH:MM:SS"
        const timeParts = start_time.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10) || 0;
        
        if (isNaN(hours) || isNaN(minutes)) {
          throw new Error('Format d\'heure invalide');
        }
        
        const endHours = hours + 1;
        const endTimeStr = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        end_time = endTimeStr;
      }
      
      // S'assurer que start_time a le bon format
      if (!start_time.includes(':')) {
        throw new Error('Format start_time invalide');
      }
      
      // Ajouter les secondes si elles manquent
      if (start_time.split(':').length === 2) {
        start_time = start_time + ':00';
      }
      
      console.log(`Heures de réservation calculées: ${start_time} à ${end_time}`);
    } catch (error) {
      console.error('Erreur lors du calcul de l\'heure de fin:', error);
      console.error('start_time reçu:', start_time);
      // Fallback: utiliser l'heure de fin du créneau en cas d'erreur
      start_time = timeSlot.start_time;
      end_time = timeSlot.end_time;
    }
    
    // Déterminer le statut selon le rôle de l'utilisateur
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'employee';
    const reservationStatus = isAdmin ? 'confirmed' : 'pending';
    const paymentStatus = isAdmin ? 'paid' : 'pending';
    
    // Création de la réservation
    const newReservation = await Reservation.create({
      user_id,
      field_id,
      reservation_date,
      start_time: start_time,
      end_time: end_time,
      status: reservationStatus,
      total_price: total_price, // S'assurer que total_price est bien défini
      payment_status: paymentStatus,
      promo_code_id: promoCodeObj ? promoCodeObj.id : null,
      notes: req.body.notes || null // Ajout des notes de la réservation si présentes
    }, { transaction });

    await transaction.commit();

    // Envoi de la confirmation par email
    const user = await User.findByPk(user_id);
    await sendReservationConfirmation(user.email, user.first_name, {
      reservationId: newReservation.id,
      fieldName: field.name,
      date: reservation_date,
      startTime: timeSlot.start_time,
      endTime: timeSlot.end_time,
      totalPrice: total_price
    });

    // Création d'une notification
    await createNotification({
      user_id,
      title: 'Nouvelle réservation',
      message: `Votre réservation pour le terrain ${field.name} le ${reservation_date} à ${timeSlot.start_time} a été créée. Statut: En attente de paiement.`,
      type: 'reservation_created',
      related_entity_id: newReservation.id,
      related_entity_type: 'reservation'
    });

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      data: newReservation
    });
  } catch (error) {
    // Vérifier si la transaction est toujours active avant de faire un rollback
    try {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
    } catch (rollbackError) {
      console.error('Erreur lors du rollback:', rollbackError);
    }

    console.error('Erreur lors de la création de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la réservation',
      error: error.message
    });
  }
};

// Récupérer les réservations d'un terrain pour une date spécifique
exports.getReservationsByFieldAndDate = async (req, res) => {
  try {
    const { fieldId, date } = req.params;

    // Vérifier que le terrain existe
    const field = await Field.findByPk(fieldId);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Terrain non trouvé'
      });
    }

    // Récupérer les réservations pour ce terrain et cette date
    const reservations = await Reservation.findAll({
      where: {
        field_id: fieldId,
        reservation_date: date,
        status: {
          [Op.notIn]: ['cancelled'] // Exclure les réservations annulées
        }
      },
      attributes: ['id', 'field_id', 'reservation_date', 'start_time', 'end_time', 'status', 'payment_status'],
      order: [['start_time', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: reservations.length,
      field: {
        id: field.id,
        name: field.name
      },
      date: date,
      data: reservations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réservations',
      error: error.message
    });
  }
};

// Obtenir toutes les réservations d'un utilisateur avec filtrage et pagination
exports.getUserReservations = async (req, res) => {
  try {
    const user_id = req.user.id; // Extrait du middleware d'authentification
    const { status = 'all', page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('🚨🚨🚨 REQUÊTE REÇUE 🚨🚨🚨');
    console.log('🚨 URL complète:', req.url);
    console.log('🚨 Query params:', req.query);
    console.log(`Récupération des réservations pour l'utilisateur ${user_id} avec filtres: status=${status}, page=${page}, limit=${limit}`);
    
    // Préparer la clause where avec l'ID utilisateur
    const whereClause = { user_id };
    
    console.log('🔍 Status reçu:', status, 'Type:', typeof status);
    
    // Ajouter le filtre de statut si nécessaire
    if (status && status !== 'all') {
      console.log('🔍 Entrée dans le filtrage de statut');
      // Pour les réservations à venir
      if (status === 'upcoming') {
        console.log('🔍 Filtrage upcoming');
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Début de la journée
        console.log('🔍 Date today:', today);
        whereClause.reservation_date = {
          [Op.gte]: today // Date >= aujourd'hui (début de journée)
        };
        whereClause.status = {
          [Op.notIn]: ['cancelled'] // Non annulées
        };
        console.log('🔍 WhereClause après upcoming:', JSON.stringify(whereClause));
      }
      // Pour les réservations passées
      else if (status === 'past') {
        console.log('🔍 Filtrage past - DÉBUT');
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Début de la journée
        console.log('🔍 Date today pour past:', today);
        whereClause.reservation_date = {
          [Op.lt]: today // Date < aujourd'hui (début de journée)
        };
        whereClause.status = {
          [Op.notIn]: ['cancelled'] // Non annulées
        };
        console.log('🔍 WhereClause après past:', JSON.stringify(whereClause));
      }
      // Pour les réservations annulées
      else if (status === 'cancelled') {
        console.log('🔍 Filtrage cancelled');
        whereClause.status = 'cancelled';
      }
      // Pour tout autre statut spécifique
      else {
        console.log('🚨 Status non reconnu:', status);
        console.log('🚨 Comparaison status === past:', status === 'past');
        console.log('🚨 Type de status:', typeof status);
        whereClause.status = status;
      }
    }
    
    console.log('Where clause:', JSON.stringify(whereClause));

    // Exécuter la requête
    const { count, rows: reservations } = await Reservation.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name', 'image_url']
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'payment_method', 'payment_status', 'payment_date']
        }
      ],
      order: [['reservation_date', 'DESC'], ['start_time', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });

    console.log(`📊 Résultat final: ${count} réservations trouvées`);
    reservations.forEach((res, i) => {
      console.log(`${i+1}. ${res.reservation_date} ${res.start_time} - ${res.status}`);
    });
    
    console.log('🚀 Envoi de la réponse HTTP...');
    const response = {
      success: true,
      count: count,
      total: count, // Ajout pour compatibilité frontend
      perPage: parseInt(limit), // Ajout pour compatibilité frontend
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: reservations,
      debug: { status, whereClause } // Debug temporaire
    };
    
    console.log('🚀 Réponse à envoyer:', JSON.stringify(response, null, 2));
    res.status(200).json(response);
    console.log('✅ Réponse HTTP envoyée !');
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réservations',
      error: error.message
    });
  }
};

// Obtenir le détail d'une réservation
exports.getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id; // Extrait du middleware d'authentification

    const reservation = await Reservation.findOne({
      where: { 
        id,
        user_id // Assurer que l'utilisateur ne peut voir que ses propres réservations
      },
      include: [
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name', 'size', 'surface_type', 'image_url']
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'payment_method', 'payment_status', 'payment_date', 'receipt_url']
        },
        {
          model: PromoCode,
          as: 'promoCode',
          attributes: ['id', 'code', 'discount_type', 'discount_value']
        }
      ]
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la réservation',
      error: error.message
    });
  }
};

// Annuler une réservation
exports.cancelReservation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const user_id = req.user.id; // Extrait du middleware d'authentification

    const reservation = await Reservation.findOne({
      where: { 
        id,
        user_id // Assurer que l'utilisateur ne peut annuler que ses propres réservations
      },
      transaction
    });

    if (!reservation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier si la réservation peut être annulée (pas déjà annulée ou terminée)
    if (['cancelled', 'completed'].includes(reservation.status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `La réservation ne peut pas être annulée car elle est déjà ${reservation.status === 'cancelled' ? 'annulée' : 'terminée'}`
      });
    }

    // Vérifier la politique d'annulation (par exemple, 24h avant)
    const reservationDate = new Date(`${reservation.reservation_date}T${reservation.start_time}`);
    const now = new Date();
    const hoursDifference = (reservationDate - now) / (1000 * 60 * 60);

    // Si moins de 24h avant la réservation, appliquer une pénalité ou refuser l'annulation
    let refundAmount = reservation.total_price;
    if (hoursDifference < 24) {
      // Exemple : pas de remboursement si moins de 24h
      refundAmount = 0;
    } else if (hoursDifference < 48) {
      // Exemple : remboursement de 50% si entre 24h et 48h
      refundAmount = reservation.total_price * 0.5;
    }

    // Mettre à jour le statut de la réservation
    await reservation.update({
      status: 'cancelled',
      payment_status: reservation.payment_status === 'paid' ? 'refunded' : 'cancelled'
    }, { transaction });

    // Si la réservation était payée, créer un remboursement
    if (reservation.payment_status === 'paid' && refundAmount > 0) {
      const payment = await Payment.findOne({
        where: {
          reservation_id: id,
          payment_status: 'completed'
        },
        transaction
      });

      if (payment) {
        // Créer un enregistrement de remboursement
        await Payment.create({
          reservation_id: id,
          amount: -refundAmount, // Montant négatif pour indiquer un remboursement
          payment_method: payment.payment_method,
          payment_status: 'completed',
          transaction_id: `refund_${payment.transaction_id}`,
          payment_date: new Date(),
          payment_details: { refund_reason: 'Annulation de réservation', original_payment_id: payment.id }
        }, { transaction });
      }
    }

    await transaction.commit();

    // Envoyer la confirmation d'annulation par email
    const user = await User.findByPk(user_id);
    const field = await Field.findByPk(reservation.field_id);
    
    await sendReservationCancellation(user.email, user.first_name, {
      reservationId: reservation.id,
      fieldName: field.name,
      date: reservation.reservation_date,
      startTime: reservation.start_time,
      refundAmount
    });

    // Créer une notification
    await createNotification({
      user_id,
      title: 'Réservation annulée',
      message: `Votre réservation pour le terrain ${field.name} le ${reservation.reservation_date} à ${reservation.start_time} a été annulée.${refundAmount > 0 ? ` Un remboursement de ${refundAmount}€ a été initié.` : ''}`,
      type: 'reservation_cancelled',
      related_entity_id: reservation.id,
      related_entity_type: 'reservation'
    });

    res.status(200).json({
      success: true,
      message: 'Réservation annulée avec succès',
      data: {
        refundAmount,
        refundPolicy: hoursDifference < 24 ? 'No refund within 24 hours' : hoursDifference < 48 ? '50% refund between 24 and 48 hours' : 'Full refund'
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur lors de l\'annulation de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la réservation',
      error: error.message
    });
  }
};

// Effectuer le paiement d'une réservation
exports.payReservation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { payment_method, payment_details } = req.body;
    const user_id = req.user.id; // Extrait du middleware d'authentification

    const reservation = await Reservation.findOne({
      where: { 
        id,
        user_id // Assurer que l'utilisateur ne peut payer que ses propres réservations
      },
      transaction
    });

    if (!reservation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier si la réservation peut être payée
    if (reservation.payment_status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Le paiement ne peut pas être effectué car le statut de paiement est déjà ${reservation.payment_status}`
      });
    }

    // Traiter le paiement via le service de paiement approprié
    const paymentResult = await processPayment({
      amount: reservation.total_price,
      payment_method,
      payment_details,
      reservation_id: reservation.id,
      user_id
    });

    if (!paymentResult.success) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Le paiement a échoué',
        error: paymentResult.error
      });
    }

    // Créer l'enregistrement de paiement
    const payment = await Payment.create({
      reservation_id: reservation.id,
      amount: reservation.total_price,
      payment_method,
      payment_status: 'completed',
      transaction_id: paymentResult.transaction_id,
      payment_date: new Date(),
      receipt_url: paymentResult.receipt_url,
      payment_details: payment_details
    }, { transaction });

    // Mettre à jour le statut de la réservation
    await reservation.update({
      status: 'confirmed',
      payment_status: 'paid'
    }, { transaction });

    await transaction.commit();

    // Créer une notification
    await createNotification({
      user_id,
      title: 'Paiement confirmé',
      message: `Votre paiement de ${reservation.total_price}€ pour la réservation du terrain a été confirmé.`,
      type: 'payment_confirmed',
      related_entity_id: payment.id,
      related_entity_type: 'payment'
    });

    res.status(200).json({
      success: true,
      message: 'Paiement effectué avec succès',
      data: {
        reservation_id: reservation.id,
        payment_id: payment.id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        payment_date: payment.payment_date,
        receipt_url: payment.receipt_url
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur lors du paiement de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du paiement de la réservation',
      error: error.message
    });
  }
};

// Admin: Obtenir toutes les réservations
exports.getAllReservations = async (req, res) => {
  try {
    const { status, date, user_id, field_id } = req.query;
    
    // Construction du filtre de recherche
    const whereClause = {};
    
    if (status) whereClause.status = status;
    if (date) whereClause.reservation_date = date;
    if (user_id) whereClause.user_id = user_id;
    if (field_id) whereClause.field_id = field_id;
    
    // Filtrage par terrain pour les administrateurs de terrain et employés
    if ((req.user.role === 'admin' || req.user.role === 'employee') && req.user.field_id) {
      whereClause.field_id = req.user.field_id;
    }

    const reservations = await Reservation.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number']
        },
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name']
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'payment_method', 'payment_status', 'payment_date']
        }
      ],
      order: [['reservation_date', 'DESC'], ['start_time', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réservations',
      error: error.message
    });
  }
};

// Admin: Mettre à jour le statut d'une réservation
exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    // Vérifier que le statut est valide
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    const reservation = await Reservation.findByPk(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Mise à jour du statut
    await reservation.update({
      status,
      notes: admin_notes ? (reservation.notes ? `${reservation.notes}\n\nAdmin: ${admin_notes}` : `Admin: ${admin_notes}`) : reservation.notes
    });

    // Si la réservation est marquée comme annulée ou complétée, informer l'utilisateur
    if (['cancelled', 'completed'].includes(status)) {
      const user = await User.findByPk(reservation.user_id);
      const field = await Field.findByPk(reservation.field_id);

      // Créer une notification
      await createNotification({
        user_id: reservation.user_id,
        title: status === 'cancelled' ? 'Réservation annulée' : 'Réservation terminée',
        message: status === 'cancelled' 
          ? `Votre réservation pour le terrain ${field.name} le ${reservation.reservation_date} à ${reservation.start_time} a été annulée par l'administrateur.${admin_notes ? ` Raison: ${admin_notes}` : ''}`
          : `Votre réservation pour le terrain ${field.name} le ${reservation.reservation_date} à ${reservation.start_time} a été marquée comme terminée.`,
        type: status === 'cancelled' ? 'reservation_cancelled_admin' : 'reservation_completed',
        related_entity_id: reservation.id,
        related_entity_type: 'reservation'
      });
    }

    res.status(200).json({
      success: true,
      message: `Statut de la réservation mis à jour avec succès: ${status}`,
      data: reservation
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut de la réservation',
      error: error.message
    });
  }
};
