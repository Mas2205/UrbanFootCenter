const { Field, TimeSlot, User } = require('../models');
const { Op } = require('sequelize');
const { uploadToCloudinary } = require('../config/storage');

// Récupérer les informations du terrain assigné à l'admin
exports.getMyField = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user || user.role !== 'admin' || !user.field_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous devez être administrateur d\'un terrain.'
      });
    }

    const field = await Field.findByPk(user.field_id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Terrain non trouvé.'
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

// Mettre à jour les informations du terrain assigné à l'admin
exports.updateMyField = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user || user.role !== 'admin' || !user.field_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous devez être administrateur d\'un terrain.'
      });
    }

    const field = await Field.findByPk(user.field_id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Terrain non trouvé.'
      });
    }

    // Préparer les données de mise à jour
    const updateData = {};
    
    // Mettre à jour tous les champs autorisés pour l'admin de terrain
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.size !== undefined) updateData.size = req.body.size;
    if (req.body.surface_type !== undefined) updateData.surface_type = req.body.surface_type;
    if (req.body.price_per_hour !== undefined) updateData.price_per_hour = parseFloat(req.body.price_per_hour);
    if (req.body.location !== undefined) updateData.location = req.body.location;
    if (req.body.equipment_fee !== undefined) updateData.equipment_fee = req.body.equipment_fee ? parseFloat(req.body.equipment_fee) : null;
    if (req.body.indoor !== undefined) updateData.indoor = req.body.indoor === 'true' || req.body.indoor === true;
    
    // Gérer l'image uploadée
    if (req.file) {
      try {
        // Upload vers Cloudinary si configuré, sinon stockage local
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          const cloudinaryResult = await uploadToCloudinary(req.file);
          updateData.image_url = cloudinaryResult.url;
        } else {
          // Fallback vers stockage local pour développement
          updateData.image_url = `/uploads/fields/${req.file.filename}`;
        }
      } catch (uploadError) {
        console.error('Erreur upload image:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de l\'upload de l\'image',
          error: uploadError.message
        });
      }
    }

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

// Récupérer les créneaux horaires du terrain assigné à l'admin
exports.getFieldAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user || user.role !== 'admin' || !user.field_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous devez être administrateur d\'un terrain.'
      });
    }

    const timeSlots = await TimeSlot.findAll({
      where: {
        field_id: user.field_id
      },
      order: [['datefrom', 'ASC'], ['start_time', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: timeSlots,
      field_id: user.field_id
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des disponibilités:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des disponibilités',
      error: error.message
    });
  }
};

// Créer un nouveau créneau horaire pour le terrain assigné
exports.createFieldAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_time, end_time, datefrom, dateto, is_available = true } = req.body;

    const user = await User.findByPk(userId);

    if (!user || user.role !== 'admin' || !user.field_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous devez être administrateur d\'un terrain.'
      });
    }

    // Validation des données
    if (!start_time || !end_time || !datefrom || !dateto) {
      return res.status(400).json({
        success: false,
        message: 'Les champs start_time, end_time, datefrom et dateto sont obligatoires'
      });
    }

    // Vérifier s'il n'y a pas déjà un créneau qui chevauche cette période
    const existingSlot = await TimeSlot.findOne({
      where: {
        field_id: user.field_id,
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

    // Création du créneau horaire pour le terrain assigné
    const newTimeSlot = await TimeSlot.create({
      field_id: user.field_id,
      start_time,
      end_time,
      datefrom,
      dateto,
      is_available
    });

    res.status(201).json({
      success: true,
      message: 'Créneau horaire créé avec succès',
      data: newTimeSlot
    });
  } catch (error) {
    console.error('Erreur lors de la création du créneau horaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du créneau horaire',
      error: error.message
    });
  }
};

// Mettre à jour un créneau horaire du terrain assigné
exports.updateFieldAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { start_time, end_time, datefrom, dateto, is_available } = req.body;

    const user = await User.findByPk(userId);

    if (!user || user.role !== 'admin' || !user.field_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous devez être administrateur d\'un terrain.'
      });
    }

    const timeSlot = await TimeSlot.findOne({
      where: {
        id,
        field_id: user.field_id // S'assurer que le créneau appartient au terrain de l'admin
      }
    });

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Créneau horaire non trouvé ou accès refusé'
      });
    }

    await timeSlot.update({
      start_time: start_time || timeSlot.start_time,
      end_time: end_time || timeSlot.end_time,
      datefrom: datefrom || timeSlot.datefrom,
      dateto: dateto || timeSlot.dateto,
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

// Supprimer un créneau horaire du terrain assigné
exports.deleteFieldAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const user = await User.findByPk(userId);

    if (!user || user.role !== 'admin' || !user.field_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous devez être administrateur d\'un terrain.'
      });
    }

    const timeSlot = await TimeSlot.findOne({
      where: {
        id,
        field_id: user.field_id // S'assurer que le créneau appartient au terrain de l'admin
      }
    });

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Créneau horaire non trouvé ou accès refusé'
      });
    }

    await timeSlot.destroy();

    res.status(200).json({
      success: true,
      message: 'Créneau horaire supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du créneau horaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du créneau horaire',
      error: error.message
    });
  }
};
