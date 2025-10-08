const { Op } = require('sequelize');
const { 
  Equipe, 
  MembreEquipe, 
  User, 
  Field 
} = require('../models');

class EquipeController {
  // Créer une nouvelle équipe
  async createEquipe(req, res) {
    try {
      const { nom, description, terrain_id, capitaine_id, couleur_maillot } = req.body;
      const created_by = req.user.id;

      // Vérifications
      if (!nom || !terrain_id || !capitaine_id) {
        return res.status(400).json({
          success: false,
          message: 'Nom, terrain et capitaine sont requis'
        });
      }

      // Vérifier que le capitaine existe et n'est pas déjà dans une équipe
      const capitaine = await User.findByPk(capitaine_id);
      if (!capitaine) {
        return res.status(404).json({
          success: false,
          message: 'Capitaine introuvable'
        });
      }

      const membreExistant = await MembreEquipe.findOne({
        where: { user_id: capitaine_id }
      });
      if (membreExistant) {
        return res.status(400).json({
          success: false,
          message: 'Ce joueur fait déjà partie d\'une équipe'
        });
      }

      // Vérifier les permissions sur le terrain
      if (req.user.role === 'admin') {
        const terrain = await Field.findOne({
          where: { 
            id: terrain_id,
            [Op.or]: [
              { admin_id: req.user.id },
              { '$employees.user_id$': req.user.id }
            ]
          },
          include: [{
            model: User,
            as: 'employees',
            required: false
          }]
        });
        
        if (!terrain) {
          return res.status(403).json({
            success: false,
            message: 'Vous n\'avez pas les droits sur ce terrain'
          });
        }
      }

      // Vérifier l'unicité du nom par terrain
      const equipeExistante = await Equipe.findOne({
        where: { nom, terrain_id }
      });
      if (equipeExistante) {
        return res.status(400).json({
          success: false,
          message: 'Une équipe avec ce nom existe déjà sur ce terrain'
        });
      }

      // Créer l'équipe
      const equipe = await Equipe.create({
        nom,
        description,
        terrain_id,
        capitaine_id,
        couleur_maillot: couleur_maillot || '#1B5E20',
        created_by
      });

      // Ajouter automatiquement le capitaine comme membre
      await MembreEquipe.create({
        equipe_id: equipe.id,
        user_id: capitaine_id,
        role: 'capitaine',
        added_by: created_by
      });

      // Récupérer l'équipe avec ses relations
      const equipeComplete = await Equipe.findByPk(equipe.id, {
        include: [
          {
            model: Field,
            as: 'terrain',
            attributes: ['id', 'name', 'location']
          },
          {
            model: User,
            as: 'capitaine',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: MembreEquipe,
            as: 'membres',
            include: [{
              model: User,
              as: 'joueur',
              attributes: ['id', 'first_name', 'last_name', 'email']
            }]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Équipe créée avec succès',
        data: equipeComplete
      });

    } catch (error) {
      console.error('Erreur création équipe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'équipe',
        error: error.message
      });
    }
  }

  // Lister les équipes
  async getEquipes(req, res) {
    try {
      console.log('🔍 Début getEquipes - User role:', req.user?.role);
      const { page = 1, limit = 10, terrain_id, search } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};

      // Version simplifiée pour débugger
      console.log('🔍 Recherche équipes sans filtrage complexe...');

      // Recherche par nom si fourni
      if (search) {
        whereClause.nom = { [Op.iLike]: `%${search}%` };
      }

      // Récupérer les équipes avec leurs associations
      const { count, rows: equipes } = await Equipe.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Field,
            as: 'terrain',
            attributes: ['id', 'name', 'location']
          },
          {
            model: User,
            as: 'capitaine',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: MembreEquipe,
            as: 'membres',
            required: false,
            include: [{
              model: User,
              as: 'joueur',
              attributes: ['id', 'first_name', 'last_name', 'email']
            }]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      console.log('✅ Équipes trouvées:', count);

      res.json({
        success: true,
        data: equipes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération équipes:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des équipes',
        error: error.message
      });
    }
  }

  // Récupérer une équipe par ID
  async getEquipeById(req, res) {
    try {
      const { id } = req.params;

      const equipe = await Equipe.findByPk(id, {
        include: [
          {
            model: Field,
            as: 'terrain',
            attributes: ['id', 'name', 'location', 'image_url']
          },
          {
            model: User,
            as: 'capitaine',
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number']
          },
          {
            model: MembreEquipe,
            as: 'membres',
            include: [{
              model: User,
              as: 'joueur',
              attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number']
            }],
            order: [['role', 'ASC'], ['created_at', 'ASC']]
          }
        ]
      });

      if (!equipe) {
        return res.status(404).json({
          success: false,
          message: 'Équipe introuvable'
        });
      }

      // Vérifier les permissions
      if (req.user.role === 'admin') {
        const hasAccess = await Field.findOne({
          where: {
            id: equipe.terrain_id,
            [Op.or]: [
              { admin_id: req.user.id },
              { '$employees.user_id$': req.user.id }
            ]
          },
          include: [{
            model: User,
            as: 'employees',
            required: false
          }]
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à cette équipe'
          });
        }
      }

      res.json({
        success: true,
        data: equipe
      });

    } catch (error) {
      console.error('Erreur récupération équipe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'équipe',
        error: error.message
      });
    }
  }

  // Ajouter un membre à une équipe
  async ajouterMembre(req, res) {
    try {
      const { equipe_id } = req.params;
      const { user_id, role = 'joueur', numero_maillot, poste } = req.body;

      // Vérifier que l'équipe existe
      const equipe = await Equipe.findByPk(equipe_id);
      if (!equipe) {
        return res.status(404).json({
          success: false,
          message: 'Équipe introuvable'
        });
      }

      // Vérifier les permissions
      if (req.user.role === 'admin') {
        const hasAccess = await Field.findOne({
          where: {
            id: equipe.terrain_id,
            [Op.or]: [
              { admin_id: req.user.id },
              { '$employees.user_id$': req.user.id }
            ]
          },
          include: [{
            model: User,
            as: 'employees',
            required: false
          }]
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé'
          });
        }
      }

      // Vérifier que l'utilisateur existe
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur introuvable'
        });
      }

      // Vérifier que l'utilisateur n'est pas déjà dans une équipe
      const membreExistant = await MembreEquipe.findOne({
        where: { user_id }
      });
      if (membreExistant) {
        return res.status(400).json({
          success: false,
          message: 'Ce joueur fait déjà partie d\'une équipe'
        });
      }

      // Vérifier l'unicité du numéro de maillot
      if (numero_maillot) {
        const numeroExistant = await MembreEquipe.findOne({
          where: { 
            equipe_id,
            numero_maillot 
          }
        });
        if (numeroExistant) {
          return res.status(400).json({
            success: false,
            message: 'Ce numéro de maillot est déjà pris'
          });
        }
      }

      // Ajouter le membre
      const membre = await MembreEquipe.create({
        equipe_id,
        user_id,
        role,
        numero_maillot,
        poste,
        added_by: req.user.id
      });

      // Récupérer le membre avec ses informations
      const membreComplet = await MembreEquipe.findByPk(membre.id, {
        include: [{
          model: User,
          as: 'joueur',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }]
      });

      res.status(201).json({
        success: true,
        message: 'Membre ajouté avec succès',
        data: membreComplet
      });

    } catch (error) {
      console.error('Erreur ajout membre:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout du membre',
        error: error.message
      });
    }
  }

  // Supprimer un membre d'une équipe
  async supprimerMembre(req, res) {
    try {
      const { equipe_id, membre_id } = req.params;

      const membre = await MembreEquipe.findOne({
        where: { 
          id: membre_id,
          equipe_id 
        },
        include: [{
          model: Equipe,
          as: 'equipe'
        }]
      });

      if (!membre) {
        return res.status(404).json({
          success: false,
          message: 'Membre introuvable'
        });
      }

      // Vérifier les permissions
      if (req.user.role === 'admin') {
        const hasAccess = await Field.findOne({
          where: {
            id: membre.equipe.terrain_id,
            [Op.or]: [
              { admin_id: req.user.id },
              { '$employees.user_id$': req.user.id }
            ]
          },
          include: [{
            model: User,
            as: 'employees',
            required: false
          }]
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé'
          });
        }
      }

      // Empêcher la suppression du capitaine
      if (membre.role === 'capitaine') {
        return res.status(400).json({
          success: false,
          message: 'Impossible de supprimer le capitaine. Transférez d\'abord le capitanat.'
        });
      }

      await membre.destroy();

      res.json({
        success: true,
        message: 'Membre supprimé avec succès'
      });

    } catch (error) {
      console.error('Erreur suppression membre:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du membre',
        error: error.message
      });
    }
  }

  // Mettre à jour une équipe
  async updateEquipe(req, res) {
    try {
      const { id } = req.params;
      const { nom, description, couleur_maillot, capitaine_id } = req.body;

      const equipe = await Equipe.findByPk(id);
      if (!equipe) {
        return res.status(404).json({
          success: false,
          message: 'Équipe introuvable'
        });
      }

      // Vérifier les permissions
      if (req.user.role === 'admin') {
        const hasAccess = await Field.findOne({
          where: {
            id: equipe.terrain_id,
            [Op.or]: [
              { admin_id: req.user.id },
              { '$employees.user_id$': req.user.id }
            ]
          },
          include: [{
            model: User,
            as: 'employees',
            required: false
          }]
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé'
          });
        }
      }

      // Si changement de capitaine
      if (capitaine_id && capitaine_id !== equipe.capitaine_id) {
        // Vérifier que le nouveau capitaine est membre de l'équipe
        const nouveauCapitaine = await MembreEquipe.findOne({
          where: { 
            equipe_id: id,
            user_id: capitaine_id 
          }
        });

        if (!nouveauCapitaine) {
          return res.status(400).json({
            success: false,
            message: 'Le nouveau capitaine doit être membre de l\'équipe'
          });
        }

        // Mettre à jour les rôles
        await MembreEquipe.update(
          { role: 'joueur' },
          { where: { equipe_id: id, user_id: equipe.capitaine_id } }
        );
        
        await MembreEquipe.update(
          { role: 'capitaine' },
          { where: { equipe_id: id, user_id: capitaine_id } }
        );
      }

      // Mettre à jour l'équipe
      await equipe.update({
        nom: nom || equipe.nom,
        description: description !== undefined ? description : equipe.description,
        couleur_maillot: couleur_maillot || equipe.couleur_maillot,
        capitaine_id: capitaine_id || equipe.capitaine_id
      });

      // Récupérer l'équipe mise à jour
      const equipeComplete = await Equipe.findByPk(id, {
        include: [
          {
            model: Field,
            as: 'terrain',
            attributes: ['id', 'name', 'location']
          },
          {
            model: User,
            as: 'capitaine',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: MembreEquipe,
            as: 'membres',
            include: [{
              model: User,
              as: 'joueur',
              attributes: ['id', 'first_name', 'last_name', 'email']
            }]
          }
        ]
      });

      res.json({
        success: true,
        message: 'Équipe mise à jour avec succès',
        data: equipeComplete
      });

    } catch (error) {
      console.error('Erreur mise à jour équipe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'équipe',
        error: error.message
      });
    }
  }

  // Supprimer une équipe
  async deleteEquipe(req, res) {
    try {
      const { id } = req.params;

      const equipe = await Equipe.findByPk(id);
      if (!equipe) {
        return res.status(404).json({
          success: false,
          message: 'Équipe introuvable'
        });
      }

      // Vérifier les permissions
      if (req.user.role === 'admin') {
        const hasAccess = await Field.findOne({
          where: {
            id: equipe.terrain_id,
            [Op.or]: [
              { admin_id: req.user.id },
              { '$employees.user_id$': req.user.id }
            ]
          },
          include: [{
            model: User,
            as: 'employees',
            required: false
          }]
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé'
          });
        }
      }

      // Supprimer tous les membres d'abord
      await MembreEquipe.destroy({
        where: { equipe_id: id }
      });

      // Supprimer l'équipe
      await equipe.destroy();

      res.json({
        success: true,
        message: 'Équipe supprimée avec succès'
      });

    } catch (error) {
      console.error('Erreur suppression équipe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'équipe',
        error: error.message
      });
    }
  }
}

module.exports = new EquipeController();
