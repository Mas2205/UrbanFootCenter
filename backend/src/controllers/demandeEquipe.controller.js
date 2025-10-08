const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { 
  DemandeEquipe,
  Equipe,
  MembreEquipe,
  User,
  Field
} = require('../models');

class DemandeEquipeController {
  // Créer une demande d'équipe (client)
  async createDemande(req, res) {
    try {
      const { nom_equipe, description, terrain_id, couleur_maillot } = req.body;
      const user_id = req.user.id;

      // Vérifications
      if (!nom_equipe || !terrain_id) {
        return res.status(400).json({
          success: false,
          message: 'Nom d\'équipe et terrain sont requis'
        });
      }

      // Vérifier que l'utilisateur n'a pas déjà une demande en cours ou validée
      const demandeExistante = await DemandeEquipe.findOne({
        where: {
          user_id,
          statut: ['en_attente', 'validee']
        }
      });

      if (demandeExistante) {
        return res.status(400).json({
          success: false,
          message: 'Vous avez déjà une demande d\'équipe en cours ou une équipe validée'
        });
      }

      // Créer la demande
      const demande = await DemandeEquipe.create({
        user_id,
        terrain_id,
        nom_equipe,
        description,
        couleur_maillot: couleur_maillot || '#FF6B35',
        statut: 'en_attente'
      });

      // Récupérer la demande avec les relations
      const demandeComplete = await DemandeEquipe.findByPk(demande.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Field,
            as: 'terrain',
            attributes: ['id', 'name', 'location']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Demande d\'équipe créée avec succès',
        data: demandeComplete
      });

    } catch (error) {
      console.error('Erreur création demande équipe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la demande',
        error: error.message
      });
    }
  }

  // Récupérer la demande du client connecté
  async getMaDemande(req, res) {
    try {
      const user_id = req.user.id;

      const demande = await DemandeEquipe.findOne({
        where: { user_id },
        include: [
          {
            model: Field,
            as: 'terrain',
            attributes: ['id', 'name', 'location']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: demande
      });

    } catch (error) {
      console.error('Erreur récupération demande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la demande',
        error: error.message
      });
    }
  }

  // Lister les demandes (admin)
  async getDemandes(req, res) {
    try {
      const { page = 1, limit = 10, statut = 'en_attente', terrain_id } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = { statut };

      // Filtrage par terrain pour les admins terrain
      if (req.user.role === 'admin' && terrain_id) {
        whereClause.terrain_id = terrain_id;
      }

      const { count, rows: demandes } = await DemandeEquipe.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Field,
            as: 'terrain',
            attributes: ['id', 'name', 'location']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: demandes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Erreur récupération demandes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des demandes',
        error: error.message
      });
    }
  }

  // Valider une demande (admin)
  async validerDemande(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      console.log('🔍 Début validation demande, ID:', req.params.id);
      const { id } = req.params;
      const validated_by = req.user.id;

      // Récupérer la demande
      console.log('🔍 Recherche de la demande...');
      const demande = await DemandeEquipe.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Field,
            as: 'terrain',
            attributes: ['id', 'name', 'location']
          }
        ]
      });

      console.log('🔍 Demande trouvée:', demande ? 'OUI' : 'NON');

      if (!demande) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Demande introuvable'
        });
      }

      if (demande.statut !== 'en_attente') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Cette demande a déjà été traitée'
        });
      }

      // Créer l'équipe
      console.log('🔍 Création de l\'équipe...');
      const equipe = await Equipe.create({
        nom: demande.nom_equipe,
        description: demande.description,
        terrain_id: demande.terrain_id,
        capitaine_id: demande.user_id,
        created_by: validated_by,
        couleur_maillot: demande.couleur_maillot,
        statut: 'active'
      }, { transaction });

      console.log('✅ Équipe créée avec ID:', equipe.id);

      // Ajouter le capitaine comme membre de l'équipe
      console.log('🔍 Ajout du capitaine comme membre...');
      await MembreEquipe.create({
        equipe_id: equipe.id,
        user_id: demande.user_id,
        role: 'capitaine',
        added_by: validated_by
      }, { transaction });

      console.log('✅ Membre ajouté');

      // Mettre à jour la demande
      await demande.update({
        statut: 'validee',
        validated_by,
        validated_at: new Date()
      }, { transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: 'Demande validée et équipe créée avec succès',
        data: {
          demande,
          equipe
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Erreur validation demande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation de la demande',
        error: error.message
      });
    }
  }

  // Refuser une demande (admin)
  async refuserDemande(req, res) {
    try {
      const { id } = req.params;
      const { motif_refus } = req.body;
      const validated_by = req.user.id;

      const demande = await DemandeEquipe.findByPk(id);

      if (!demande) {
        return res.status(404).json({
          success: false,
          message: 'Demande introuvable'
        });
      }

      if (demande.statut !== 'en_attente') {
        return res.status(400).json({
          success: false,
          message: 'Cette demande a déjà été traitée'
        });
      }

      await demande.update({
        statut: 'refusee',
        motif_refus,
        validated_by,
        validated_at: new Date()
      });

      res.json({
        success: true,
        message: 'Demande refusée avec succès',
        data: demande
      });

    } catch (error) {
      console.error('Erreur refus demande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du refus de la demande',
        error: error.message
      });
    }
  }
}

module.exports = new DemandeEquipeController();
