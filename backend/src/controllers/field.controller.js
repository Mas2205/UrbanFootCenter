const { Field, TimeSlot, Reservation, sequelize, HolidayAndClosure } = require('../models');
const { Op } = require('sequelize');

// Récupérer la liste des villes uniques
exports.getCities = async (req, res) => {
  try {
    const cities = await Field.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('city')), 'city']],
      where: {
        city: {
          [Op.ne]: null
        },
        is_active: true
      },
      order: [['city', 'ASC']]
    });

    const cityList = cities.map(field => field.city).filter(city => city && city.trim() !== '');

    res.status(200).json({
      success: true,
      count: cityList.length,
      data: cityList
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des villes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des villes',
      error: error.message
    });
  }
};

// Rechercher des terrains pour l'autocomplétion
exports.searchFields = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const searchTerm = q.trim();
    
    const fields = await Field.findAll({
      where: {
        [Op.and]: [
          {
            is_active: true
          },
          {
            [Op.or]: [
              {
                name: {
                  [Op.iLike]: `%${searchTerm}%`
                }
              },
              {
                city: {
                  [Op.iLike]: `%${searchTerm}%`
                }
              },
              {
                location: {
                  [Op.iLike]: `%${searchTerm}%`
                }
              }
            ]
          }
        ]
      },
      attributes: ['id', 'name', 'city', 'location', 'price_per_hour'],
      limit: parseInt(limit),
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: fields
    });
  } catch (error) {
    console.error('Erreur lors de la recherche des terrains:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche des terrains',
      error: error.message
    });
  }
};

// Récupérer tous les terrains
exports.getAllFields = async (req, res) => {
  try {
    console.log('🔍 getAllFields - User role:', req.user?.role, 'User ID:', req.user?.id);
    
    let whereClause = {};
    
    // Si c'est un admin de terrain, ne montrer que son terrain
    if (req.user?.role === 'admin' && req.user?.field_id) {
      whereClause.id = req.user.field_id;
      console.log('🔍 Admin terrain - Filtrage par field_id:', req.user.field_id);
    }
    
    const fields = await Field.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'description', 'size', 'surface_type', 'price_per_hour', 'image_url', 'is_active', 'location', 'city']
    });

    console.log('✅ Terrains trouvés:', fields.length);

    res.status(200).json({
      success: true,
      count: fields.length,
      data: fields
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des terrains:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des terrains',
      error: error.message
    });
  }
};

// Récupérer un terrain spécifique avec ses créneaux horaires
exports.getFieldById = async (req, res) => {
  try {
    const { id } = req.params;

    const field = await Field.findByPk(id, {
      include: [{
        model: TimeSlot,
        as: 'timeSlots',
        attributes: ['id', 'field_id', 'is_available', 'datefrom', 'dateto', 'start_time', 'end_time', 'created_at', 'updated_at']
      }],
      attributes: ['id', 'name', 'description', 'size', 'surface_type', 'price_per_hour', 'image_url', 'is_active', 'location']
    });

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Terrain non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: field
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du terrain:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du terrain',
      error: error.message
    });
  }
};

// Ajouter un nouveau terrain (Admin uniquement)
exports.createField = async (req, res) => {
  try {
    console.log('Données reçues dans le contrôleur:', req.body);
    console.log('Fichier image reçu:', req.file);
    
    const { name, description, size, surface_type, price_per_hour, location, city, indoor, equipment_fee, is_active, id } = req.body;
    
    console.log('Valeur du champ location reçue:', location);

    // Préparer les données du terrain
    const fieldData = {
      id: id || undefined, // Utiliser l'ID fourni ou laisser la DB générer
      name,
      description,
      size,
      surface_type,
      price_per_hour: parseFloat(price_per_hour),
      equipment_fee: equipment_fee ? parseFloat(equipment_fee) : null,
      indoor: indoor === 'true',
      is_active: is_active === 'true',
      location,
      city
    };

    // Ajouter l'URL de l'image si un fichier a été uploadé
    if (req.file) {
      fieldData.image_url = `/uploads/fields/${req.file.filename}`;
      console.log('Image uploadée:', fieldData.image_url);
    }
    
    console.log('Objet qui va être créé dans la base de données:', fieldData);
    
    const newField = await Field.create(fieldData);
    
    console.log('Terrain créé dans la base de données:', newField.toJSON());

    res.status(201).json({
      success: true,
      message: 'Terrain créé avec succès',
      data: newField
    });
  } catch (error) {
    console.error('Erreur lors de la création du terrain:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du terrain',
      error: error.message
    });
  }
};

// Mettre à jour un terrain (Admin uniquement)
exports.updateField = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Mise à jour du terrain ID:', id);
    console.log('Données reçues:', req.body);
    console.log('Fichier image reçu:', req.file);

    const field = await Field.findByPk(id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Terrain non trouvé'
      });
    }

    // Préparer les données de mise à jour
    const updateData = {};
    
    // Mettre à jour les champs texte
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.size) updateData.size = req.body.size;
    if (req.body.location !== undefined) updateData.location = req.body.location;
    if (req.body.city !== undefined) updateData.city = req.body.city;
    if (req.body.surface_type) updateData.surface_type = req.body.surface_type;
    if (req.body.price_per_hour) updateData.price_per_hour = req.body.price_per_hour;
    if (req.body.equipment_fee !== undefined) updateData.equipment_fee = req.body.equipment_fee;
    if (req.body.indoor !== undefined) {
      // Gérer les différents types de valeurs pour indoor
      if (typeof req.body.indoor === 'boolean') {
        updateData.indoor = req.body.indoor;
      } else if (typeof req.body.indoor === 'string') {
        updateData.indoor = req.body.indoor === 'true';
      } else {
        updateData.indoor = Boolean(req.body.indoor);
      }
    }
    if (req.body.is_active !== undefined) {
      // Gérer les différents types de valeurs pour is_active
      if (typeof req.body.is_active === 'boolean') {
        updateData.is_active = req.body.is_active;
      } else if (typeof req.body.is_active === 'string') {
        updateData.is_active = req.body.is_active === 'true';
      } else {
        updateData.is_active = Boolean(req.body.is_active);
      }
    }

    // Gérer l'image uploadée
    if (req.file) {
      // Si un fichier est uploadé, générer une URL relative
      updateData.image_url = `/uploads/fields/${req.file.filename}`;
      console.log('Nouvelle image_url:', updateData.image_url);
    }

    console.log('Données de mise à jour:', updateData);

    await field.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Terrain mis à jour avec succès',
      data: field
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du terrain:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du terrain',
      error: error.message
    });
  }
};

// Supprimer un terrain (Admin uniquement)
exports.deleteField = async (req, res) => {
  try {
    const { id } = req.params;

    const field = await Field.findByPk(id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Terrain non trouvé'
      });
    }

    // Supprimer réellement le terrain de la base de données
    await field.destroy();

    res.status(200).json({
      success: true,
      message: 'Terrain supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du terrain:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du terrain',
      error: error.message
    });
  }
};

// Ajouter des créneaux horaires à un terrain (Admin uniquement)
exports.addTimeSlot = async (req, res) => {
  try {
    const { field_id } = req.params;
    const { start_time, end_time, datefrom, dateto, is_available = true } = req.body;
    
    console.log('Données reçues pour création de créneau horaire:', { 
      field_id, start_time, end_time, datefrom, dateto, is_available 
    });

    // Vérifier que le terrain existe
    const field = await Field.findByPk(field_id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Terrain non trouvé'
      });
    }

    // Vérifier que les données nécessaires sont présentes
    if (!start_time || !end_time || !datefrom || !dateto) {
      return res.status(400).json({
        success: false,
        message: 'Les champs start_time, end_time, datefrom et dateto sont obligatoires'
      });
    }

    // Vérifier s'il n'y a pas déjà un créneau qui chevauche cette période
    const existingSlot = await TimeSlot.findOne({
      where: {
        field_id,
        datefrom,
        start_time
      }
    });

    if (existingSlot) {
      return res.status(400).json({
        success: false,
        message: 'Un créneau horaire existe déjà pour cette période et cette heure'
      });
    }

    // Création du créneau horaire avec les nouveaux champs
    const newTimeSlot = await TimeSlot.create({
      field_id,
      start_time,
      end_time,
      datefrom,
      dateto,
      is_available
    });

    res.status(201).json({
      success: true,
      message: 'Créneau horaire ajouté avec succès',
      data: newTimeSlot
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du créneau horaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du créneau horaire',
      error: error.message
    });
  }
};

// Mettre à jour un créneau horaire (Admin uniquement)
exports.updateTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, base_price, is_available } = req.body;

    const timeSlot = await TimeSlot.findByPk(id);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Créneau horaire non trouvé'
      });
    }

    await timeSlot.update({
      start_time: start_time || timeSlot.start_time,
      end_time: end_time || timeSlot.end_time,
      base_price: base_price || timeSlot.base_price,
      is_available: is_available !== undefined ? is_available : timeSlot.is_available
    });

    res.status(200).json({
      success: true,
      message: 'Créneau horaire mis à jour avec succès',
      data: timeSlot
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du créneau horaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du créneau horaire',
      error: error.message
    });
  }
};

// Rechercher des créneaux disponibles
exports.searchAvailableSlots = async (req, res) => {
  try {
    const { date, start_time, end_time, field_size } = req.query;
    
    // Validation de base
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'La date est requise'
      });
    }

    const searchDate = new Date(date);
    const dayOfWeek = searchDate.getDay(); // 0 pour dimanche, 1 pour lundi, etc.

    // Construction de la requête de recherche
    const whereClause = {
      is_active: true
    };

    if (field_size) {
      whereClause.size = field_size;
    }

    // Trouver tous les terrains correspondant aux critères
    const fields = await Field.findAll({
      where: whereClause,
      include: [{
        model: TimeSlot,
        as: 'timeSlots',
        where: {
          day_of_week: dayOfWeek,
          is_available: true,
          ...(start_time && { start_time: { [Op.gte]: start_time } }),
          ...(end_time && { end_time: { [Op.lte]: end_time } })
        }
      }]
    });

    // Vérifier les réservations existantes pour la date spécifiée
    const availableSlots = [];

    for (const field of fields) {
      for (const slot of field.timeSlots) {
        // Vérifier s'il y a une réservation pour ce créneau
        const reservationExists = await sequelize.models.Reservation.findOne({
          where: {
            field_id: field.id,
            reservation_date: searchDate,
            start_time: slot.start_time,
            status: {
              [Op.notIn]: ['cancelled']
            }
          }
        });

        // Vérifier s'il y a une fermeture pour cette date
        const closureExists = await HolidayAndClosure.findOne({
          where: {
            date: searchDate,
            [Op.or]: [
              { affects_all_fields: true },
              { field_id: field.id }
            ]
          }
        });

        if (!reservationExists && !closureExists) {
          availableSlots.push({
            field_id: field.id,
            field_name: field.name,
            field_size: field.size,
            field_surface: field.surface_type,
            field_image: field.image_url,
            time_slot_id: slot.id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            price: slot.base_price
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      count: availableSlots.length,
      data: availableSlots
    });
  } catch (error) {
    console.error('Erreur lors de la recherche de créneaux disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de créneaux disponibles',
      error: error.message
    });
  }
};

// Fonction utilitaire pour convertir snake_case en camelCase
const toCamelCase = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  const camelCaseObj = {};
  
  Object.keys(obj).forEach(key => {
    // Convertir la clé en camelCase
    const camelKey = key.replace(/(_\w)/g, match => match[1].toUpperCase());
    // Convertir récursivement les valeurs si nécessaire
    camelCaseObj[camelKey] = toCamelCase(obj[key]);
  });
  
  return camelCaseObj;
};

// Récupérer les terrains mis en avant (Featured fields)
exports.getFeaturedFields = async (req, res) => {
  try {
    // Récupérer le paramètre limit ou utiliser une valeur par défaut de 3
    const limit = parseInt(req.query.limit) || 3;
    
    // Récupérer les terrains actifs avec un ordre aléatoire et une limite
    const fields = await Field.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'description', 'size', 'surface_type', 'price_per_hour', 'image_url', 'location'],
      order: sequelize.random(),
      limit: limit
    });

    // Convertir les objets de snake_case à camelCase pour le frontend
    const camelCaseFields = fields.map(field => {
      const plainField = field.get({ plain: true });
      return toCamelCase(plainField);
    });

    res.status(200).json({
      success: true,
      count: camelCaseFields.length,
      data: camelCaseFields
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des terrains mis en avant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des terrains mis en avant',
      error: error.message
    });
  }
};

// Ajouter une fermeture ou un jour férié (Admin uniquement)
exports.addClosure = async (req, res) => {
  try {
    const { date, reason, affects_all_fields, field_id } = req.body;

    // Validation de base
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'La date est requise'
      });
    }

    // Si affects_all_fields est false, field_id est obligatoire
    if (affects_all_fields === false && !field_id) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID du terrain est requis lorsque affects_all_fields est false'
      });
    }

    // Vérifier que le terrain existe si field_id est fourni
    if (field_id) {
      const fieldExists = await Field.findByPk(field_id);
      if (!fieldExists) {
        return res.status(404).json({
          success: false,
          message: 'Terrain non trouvé'
        });
      }
    }

    const newClosure = await HolidayAndClosure.create({
      date,
      reason,
      affects_all_fields: affects_all_fields !== undefined ? affects_all_fields : true,
      field_id: affects_all_fields === false ? field_id : null
    });

    res.status(201).json({
      success: true,
      message: 'Fermeture/jour férié ajouté avec succès',
      data: newClosure
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la fermeture/jour férié:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la fermeture/jour férié',
      error: error.message
    });
  }
};

// Récupérer les créneaux disponibles d'un terrain (accès public)
exports.getFieldAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // Date spécifique pour filtrer les créneaux

    // Récupérer les informations du terrain
    const field = await Field.findByPk(id, {
      attributes: ['id', 'name', 'price_per_hour']
    });

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Terrain non trouvé'
      });
    }

    // Récupérer tous les créneaux du terrain
    const timeSlots = await TimeSlot.findAll({
      where: {
        field_id: id,
        is_available: true
      },
      attributes: ['id', 'field_id', 'is_available', 'datefrom', 'dateto', 'start_time', 'end_time', 'created_at', 'updated_at'],
      order: [['datefrom', 'ASC'], ['start_time', 'ASC']]
    });

    // Récupérer toutes les réservations pour ce terrain
    let reservationWhere = {
      field_id: id,
      status: {
        [Op.notIn]: ['cancelled'] // Exclure seulement les réservations annulées
      }
    };

    // Si une date spécifique est demandée, filtrer par cette date
    if (date) {
      reservationWhere.reservation_date = date;
    }

    const reservations = await Reservation.findAll({
      where: reservationWhere,
      attributes: ['reservation_date', 'start_time', 'end_time']
    });

    // Créer un Set des créneaux réservés pour une recherche rapide
    const reservedSlots = new Set();
    reservations.forEach(reservation => {
      const dateStr = new Date(reservation.reservation_date).toISOString().split('T')[0];
      const key = `${dateStr}_${reservation.start_time}`;
      reservedSlots.add(key);
    });

    // Si une date spécifique est demandée, retourner les créneaux avec leur statut de disponibilité
    if (date) {
      const availableTimeSlots = timeSlots.map(slot => {
        // Vérifier si la date demandée est dans la plage du créneau
        const requestedDate = new Date(date);
        const startDate = new Date(slot.datefrom);
        const endDate = new Date(slot.dateto);
        
        if (requestedDate >= startDate && requestedDate <= endDate) {
          const key = `${date}_${slot.start_time}`;
          const isReserved = reservedSlots.has(key);
          
          return {
            ...slot.toJSON(),
            isReserved: isReserved,
            availableForDate: !isReserved
          };
        }
        return null;
      }).filter(slot => slot !== null);

      return res.status(200).json({
        success: true,
        count: availableTimeSlots.length,
        field: {
          id: field.id,
          name: field.name,
          price_per_hour: field.price_per_hour
        },
        date: date,
        data: availableTimeSlots
      });
    }

    // Logique existante pour tous les créneaux
    const availableTimeSlots = [];
    
    for (const slot of timeSlots) {
      // Générer toutes les dates dans la plage du créneau
      const startDate = new Date(slot.datefrom);
      const endDate = new Date(slot.dateto);
      
      let currentDate = new Date(startDate);
      let hasAvailableDate = false;
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const key = `${dateStr}_${slot.start_time}`;
        
        // Si ce créneau n'est pas réservé à cette date, le créneau est disponible
        if (!reservedSlots.has(key)) {
          hasAvailableDate = true;
          break;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Ajouter le créneau seulement s'il a au moins une date disponible
      if (hasAvailableDate) {
        availableTimeSlots.push(slot);
      }
    }

    res.status(200).json({
      success: true,
      count: availableTimeSlots.length,
      field: {
        id: field.id,
        name: field.name,
        price_per_hour: field.price_per_hour
      },
      data: availableTimeSlots
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des créneaux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des créneaux',
      error: error.message
    });
  }
};
