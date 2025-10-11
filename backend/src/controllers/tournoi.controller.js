const { Op } = require('sequelize');
const { 
  Tournoi, 
  ParticipationTournoi, 
  MatchTournoi, 
  Equipe, 
  User, 
  Field 
} = require('../models');

class TournoiController {
  // Créer un nouveau tournoi
  async createTournoi(req, res) {
    try {
      console.log('🔍 Début création tournoi');
      console.log('🔍 Body reçu:', req.body);
      console.log('🔍 User:', req.user?.id, req.user?.role);
      
      const {
        nom,
        description,
        terrain_id,
        date_debut,
        date_fin,
        date_limite_inscription,
        frais_inscription,
        recompense,
        prix_total,
        format,
        nombre_max_equipes,
        regles
      } = req.body;

      const created_by = req.user.id;

      // Vérifications de base
      if (!nom || !terrain_id || !date_debut || !date_fin || !date_limite_inscription) {
        return res.status(400).json({
          success: false,
          message: 'Nom, terrain, dates de début, fin et limite d\'inscription sont requis'
        });
      }

      // Vérifier les permissions sur le terrain (version simplifiée)
      if (req.user.role === 'admin') {
        console.log('🔍 Vérification des droits admin sur le terrain:', terrain_id);
        const terrain = await Field.findByPk(terrain_id);
        
        if (!terrain) {
          return res.status(404).json({
            success: false,
            message: 'Terrain introuvable'
          });
        }
        
        console.log('✅ Terrain trouvé:', terrain.name);
        // Pour l'instant, on autorise tous les admins à créer des tournois
        // TODO: Implémenter la vérification des droits spécifiques plus tard
      }

      // Créer le tournoi
      console.log('🔍 Création du tournoi avec les données:', {
        nom,
        description,
        terrain_id,
        date_debut,
        date_fin,
        date_limite_inscription,
        frais_inscription: frais_inscription || 0,
        recompense,
        prix_total: prix_total || 0,
        format: format || 'poules_elimination',
        nombre_max_equipes: nombre_max_equipes || 16,
        regles,
        created_by,
        statut: 'en_preparation'
      });
      
      const tournoi = await Tournoi.create({
        nom,
        description,
        terrain_id,
        date_debut,
        date_fin,
        date_limite_inscription,
        frais_inscription: frais_inscription || 0,
        recompense,
        prix_total: prix_total || 0,
        format: format || 'poules_elimination',
        nombre_max_equipes: nombre_max_equipes || 16,
        regles,
        created_by,
        statut: 'en_preparation'
      });

      console.log('✅ Tournoi créé avec ID:', tournoi.id);

      // Retourner le tournoi créé (sans associations pour éviter les erreurs)
      res.status(201).json({
        success: true,
        message: 'Tournoi créé avec succès',
        data: tournoi
      });

    } catch (error) {
      console.error('Erreur création tournoi:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du tournoi',
        error: error.message
      });
    }
  }

  // Lister les tournois
  async getTournois(req, res) {
    try {
      console.log('🔍 Début getTournois - User role:', req.user?.role);
      const { page = 1, limit = 10, terrain_id, statut, search, ville } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};

      // Filtrage par terrain pour les admins
      if (req.user.role === 'admin' && req.user.field_id) {
        whereClause.terrain_id = req.user.field_id;
        console.log('🔍 Admin terrain - Filtrage par terrain:', req.user.field_id);
      }

      // Filtrage par statut si fourni
      if (statut) {
        whereClause.statut = statut;
        console.log('🔍 Filtrage par statut:', statut);
      }

      // Filtrage par terrain spécifique si fourni (pour les clients)
      if (terrain_id && req.user.role !== 'admin') {
        whereClause.terrain_id = terrain_id;
        console.log('🔍 Filtrage par terrain (client):', terrain_id);
      }

      // Recherche par nom si fourni
      if (search) {
        whereClause.nom = { [Op.iLike]: `%${search}%` };
      }

      console.log('🔍 Clause WHERE pour tournois:', whereClause);

      // Si filtrage par ville, inclure les terrains dans la requête
      let includeOptions = [];
      if (ville) {
        includeOptions.push({
          model: Field,
          as: 'terrain',
          where: { location: { [Op.iLike]: `%${ville}%` } },
          attributes: ['id', 'name', 'location', 'image_url']
        });
      }

      // Récupérer les tournois (sans participations pour éviter les erreurs)
      const { count, rows: tournois } = await Tournoi.findAndCountAll({
        where: whereClause,
        include: includeOptions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      console.log('✅ Tournois trouvés:', count);

      // Si pas de filtrage par ville, récupérer les terrains séparément
      let terrains = [];
      if (!ville) {
        const terrainIds = [...new Set(tournois.map(t => t.terrain_id))];
        terrains = await Field.findAll({
          where: { id: terrainIds },
          attributes: ['id', 'name', 'location', 'image_url']
        });
      }

      // Créer un map des terrains pour un accès rapide
      const terrainsMap = {};
      terrains.forEach(terrain => {
        terrainsMap[terrain.id] = terrain;
      });

      // Ajouter les informations terrain et statistiques à chaque tournoi
      const tournoisAvecStats = await Promise.all(tournois.map(async tournoi => {
        let terrain;
        
        // Si filtrage par ville, le terrain est déjà inclus
        if (ville && tournoi.terrain) {
          terrain = tournoi.terrain;
        } else {
          // Sinon, utiliser le map des terrains
          terrain = terrainsMap[tournoi.terrain_id] || {
            id: tournoi.terrain_id,
            name: 'Terrain non trouvé',
            location: 'Non spécifié',
            image_url: null
          };
        }

        // Calculer les statistiques (récupération séparée pour éviter les erreurs)
        let equipesValidees = 0;
        let equipesEnAttente = 0;
        
        try {
          const participationsCount = await ParticipationTournoi.findAll({
            where: { tournoi_id: tournoi.id },
            attributes: ['statut'],
            raw: true
          });
          
          equipesValidees = participationsCount.filter(p => p.statut === 'valide').length;
          equipesEnAttente = participationsCount.filter(p => p.statut === 'en_attente').length;
        } catch (error) {
          console.log('Erreur calcul stats:', error.message);
        }

        return {
          ...tournoi.toJSON(),
          terrain,
          stats: {
            equipes_inscrites: equipesValidees,
            equipes_en_attente: equipesEnAttente,
            places_restantes: (tournoi.nombre_max_equipes || 16) - equipesValidees
          }
        };
      }));

      res.json({
        success: true,
        data: tournoisAvecStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération tournois:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des tournois',
        error: error.message
      });
    }
  }

  // Récupérer un tournoi par ID
  async getTournoiById(req, res) {
    try {
      const { id } = req.params;

      const tournoi = await Tournoi.findByPk(id, {
        include: [
          {
            model: Field,
            as: 'terrain',
            attributes: ['id', 'name', 'location', 'image_url']
          },
          {
            model: User,
            as: 'createur',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: ParticipationTournoi,
            as: 'participations',
            include: [
              {
                model: Equipe,
                as: 'equipe',
                attributes: ['id', 'nom', 'logo_url', 'couleur_maillot'],
                include: [{
                  model: User,
                  as: 'capitaine',
                  attributes: ['id', 'first_name', 'last_name', 'email']
                }]
              },
              {
                model: User,
                as: 'demandeur',
                attributes: ['id', 'first_name', 'last_name']
              }
            ],
            order: [['created_at', 'ASC']]
          },
          {
            model: MatchTournoi,
            as: 'matchs',
            include: [
              {
                model: Equipe,
                as: 'equipe1',
                attributes: ['id', 'nom', 'logo_url']
              },
              {
                model: Equipe,
                as: 'equipe2',
                attributes: ['id', 'nom', 'logo_url']
              },
              {
                model: Equipe,
                as: 'vainqueur',
                attributes: ['id', 'nom', 'logo_url']
              }
            ],
            order: [['date_match', 'ASC']]
          }
        ]
      });

      if (!tournoi) {
        return res.status(404).json({
          success: false,
          message: 'Tournoi introuvable'
        });
      }

      // Vérifier les permissions pour les admins
      if (req.user.role === 'admin') {
        // Vérifier si l'admin a accès à ce terrain via son field_id
        if (req.user.field_id !== tournoi.terrain_id) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à ce tournoi'
          });
        }
      }

      // Calculer les statistiques
      const participationsValides = tournoi.participations.filter(p => p.statut === 'valide');
      const participationsEnAttente = tournoi.participations.filter(p => p.statut === 'en_attente');
      const matchsTermines = tournoi.matchs.filter(m => m.statut === 'termine');

      const stats = {
        equipes_inscrites: participationsValides.length,
        equipes_en_attente: participationsEnAttente.length,
        places_restantes: tournoi.nombre_max_equipes - participationsValides.length,
        matchs_joues: matchsTermines.length,
        matchs_total: tournoi.matchs.length
      };

      res.json({
        success: true,
        data: {
          ...tournoi.toJSON(),
          stats
        }
      });

    } catch (error) {
      console.error('Erreur récupération tournoi:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du tournoi',
        error: error.message
      });
    }
  }

  // Demander participation à un tournoi (pour les capitaines)
  async demanderParticipation(req, res) {
    try {
      const { tournoi_id } = req.params;
      const requested_by = req.user.id;

      console.log('🔍 Demande participation - Tournoi:', tournoi_id, 'User:', requested_by);

      // Vérifier que le tournoi existe
      const tournoi = await Tournoi.findByPk(tournoi_id);
      if (!tournoi) {
        return res.status(404).json({
          success: false,
          message: 'Tournoi introuvable'
        });
      }

      // Vérifier que les inscriptions sont ouvertes
      if (tournoi.statut !== 'inscriptions_ouvertes') {
        return res.status(400).json({
          success: false,
          message: 'Les inscriptions ne sont pas ouvertes pour ce tournoi'
        });
      }

      // Vérifier la date limite
      if (new Date() > new Date(tournoi.date_limite_inscription)) {
        return res.status(400).json({
          success: false,
          message: 'La date limite d\'inscription est dépassée'
        });
      }

      // Trouver l'équipe dont l'utilisateur est capitaine
      const equipe = await Equipe.findOne({
        where: {
          capitaine_id: requested_by
        }
      });

      console.log('🔍 Équipe trouvée:', equipe?.id, equipe?.nom);

      if (!equipe) {
        return res.status(403).json({
          success: false,
          message: 'Vous devez d\'abord créer une équipe et en être le capitaine pour vous inscrire à un tournoi'
        });
      }

      // Vérifier que l'équipe n'est pas déjà inscrite
      const participationExistante = await ParticipationTournoi.findOne({
        where: {
          tournoi_id,
          equipe_id: equipe.id
        }
      });

      if (participationExistante) {
        return res.status(400).json({
          success: false,
          message: 'Cette équipe est déjà inscrite à ce tournoi'
        });
      }

      // Vérifier le nombre maximum d'équipes
      const participationsValides = await ParticipationTournoi.count({
        where: {
          tournoi_id,
          statut: 'valide'
        }
      });

      if (participationsValides >= tournoi.nombre_max_equipes) {
        return res.status(400).json({
          success: false,
          message: 'Le nombre maximum d\'équipes est atteint'
        });
      }

      // Créer la demande de participation
      const participation = await ParticipationTournoi.create({
        tournoi_id,
        equipe_id: equipe.id,
        requested_by,
        statut: 'en_attente',
        date_inscription: new Date()
      });

      console.log('✅ Participation créée:', participation.id);

      // Récupérer la participation avec ses relations
      const participationComplete = await ParticipationTournoi.findByPk(participation.id, {
        include: [
          {
            model: Tournoi,
            as: 'tournoi',
            attributes: ['id', 'nom', 'frais_inscription']
          },
          {
            model: Equipe,
            as: 'equipe',
            attributes: ['id', 'nom', 'logo_url']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Demande de participation envoyée avec succès',
        data: participationComplete
      });

    } catch (error) {
      console.error('Erreur demande participation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la demande de participation',
        error: error.message
      });
    }
  }

  // Valider/Refuser une participation (pour les admins)
  async validerParticipation(req, res) {
    try {
      const { participation_id } = req.params;
      const { statut, motif_refus } = req.body;
      const validated_by = req.user.id;

      if (!['valide', 'refuse'].includes(statut)) {
        return res.status(400).json({
          success: false,
          message: 'Statut invalide. Utilisez "valide" ou "refuse"'
        });
      }

      const participation = await ParticipationTournoi.findByPk(participation_id, {
        include: [
          {
            model: Tournoi,
            as: 'tournoi'
          }
        ]
      });

      if (!participation) {
        return res.status(404).json({
          success: false,
          message: 'Participation introuvable'
        });
      }

      // Vérifier les permissions (admin ne peut valider que les participations de son terrain)
      if (req.user.role === 'admin') {
        console.log('🔍 Vérification permissions admin pour participation:', participation_id);
        console.log('🔍 Terrain du tournoi:', participation.tournoi.terrain_id);
        console.log('🔍 Terrain de l\'admin:', req.user.field_id);
        
        if (req.user.field_id !== participation.tournoi.terrain_id) {
          return res.status(403).json({
            success: false,
            message: 'Vous ne pouvez valider que les participations des tournois de votre terrain'
          });
        }
      }

      // Vérifier que la participation est en attente
      if (participation.statut !== 'en_attente') {
        return res.status(400).json({
          success: false,
          message: 'Cette participation a déjà été traitée'
        });
      }

      // Si validation, vérifier le nombre maximum d'équipes
      if (statut === 'valide') {
        const participationsValides = await ParticipationTournoi.count({
          where: {
            tournoi_id: participation.tournoi_id,
            statut: 'valide'
          }
        });

        if (participationsValides >= participation.tournoi.nombre_max_equipes) {
          return res.status(400).json({
            success: false,
            message: 'Le nombre maximum d\'équipes est atteint'
          });
        }
      }

      // Mettre à jour la participation
      await participation.update({
        statut,
        validated_by,
        validated_at: new Date(),
        motif_refus: statut === 'refuse' ? motif_refus : null
      });

      // Vérifier si le tournoi est maintenant complet
      if (statut === 'valide') {
        const participationsValides = await ParticipationTournoi.count({
          where: {
            tournoi_id: participation.tournoi_id,
            statut: 'valide'
          }
        });

        console.log('🔍 Participations validées:', participationsValides, '/', participation.tournoi.nombre_max_equipes);

        // Si le tournoi est complet, fermer automatiquement les inscriptions
        if (participationsValides >= participation.tournoi.nombre_max_equipes) {
          await participation.tournoi.update({ statut: 'inscriptions_fermees' });
          console.log('✅ Tournoi complet - Inscriptions fermées automatiquement');
        }
      }

      // Récupérer la participation mise à jour
      const participationComplete = await ParticipationTournoi.findByPk(participation_id, {
        include: [
          {
            model: Tournoi,
            as: 'tournoi',
            attributes: ['id', 'nom']
          },
          {
            model: Equipe,
            as: 'equipe',
            attributes: ['id', 'nom', 'logo_url']
          },
          {
            model: User,
            as: 'validateur',
            attributes: ['id', 'first_name', 'last_name']
          }
        ]
      });

      res.json({
        success: true,
        message: `Participation ${statut === 'valide' ? 'validée' : 'refusée'} avec succès`,
        data: participationComplete
      });

    } catch (error) {
      console.error('Erreur validation participation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation',
        error: error.message
      });
    }
  }

  // Effectuer le tirage au sort (pour les admins)
  async effectuerTirageAuSort(req, res) {
    try {
      const { tournoi_id } = req.params;

      console.log('🎲 Début tirage au sort pour tournoi:', tournoi_id);

      // Vérifier que le tournoi existe et est complet
      const tournoi = await Tournoi.findByPk(tournoi_id, {
        include: [{
          model: ParticipationTournoi,
          as: 'participations',
          where: { statut: 'valide' },
          include: [{
            model: Equipe,
            as: 'equipe',
            attributes: ['id', 'nom', 'logo_url']
          }]
        }]
      });

      if (!tournoi) {
        return res.status(404).json({
          success: false,
          message: 'Tournoi introuvable'
        });
      }

      // Vérifier les permissions
      if (req.user.role === 'admin' && req.user.field_id !== tournoi.terrain_id) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez gérer que les tournois de votre terrain'
        });
      }

      // Vérifier que le tournoi est prêt pour le tirage
      if (!['inscriptions_fermees', 'en_cours'].includes(tournoi.statut)) {
        return res.status(400).json({
          success: false,
          message: 'Le tirage au sort n\'est possible que quand les inscriptions sont fermées ou le tournoi en cours'
        });
      }

      const participationsValides = tournoi.participations || [];
      if (participationsValides.length !== tournoi.nombre_max_equipes) {
        return res.status(400).json({
          success: false,
          message: 'Le tournoi n\'est pas complet pour effectuer le tirage au sort'
        });
      }

      // Supprimer les matchs existants et réinitialiser les stats (si re-tirage)
      await MatchTournoi.destroy({
        where: { tournoi_id }
      });
      
      // Réinitialiser les statistiques des participations
      await ParticipationTournoi.update({
        points_poule: 0,
        victoires_poule: 0,
        nuls_poule: 0,
        defaites_poule: 0,
        buts_marques_poule: 0,
        buts_encaisses_poule: 0,
        groupe_poule: null
      }, {
        where: { tournoi_id }
      });
      
      console.log('🗑️ Matchs supprimés et statistiques réinitialisées');

      // Mélanger aléatoirement les équipes
      const equipesAleatoires = [...participationsValides].sort(() => Math.random() - 0.5);

      // Assigner les groupes selon le format du tournoi
      let groupes = {};
      
      if (tournoi.format === 'poules_elimination') {
        // 🏆 FORMAT POULES + ÉLIMINATION
        // Créer des poules (groupes de 4 équipes max)
        const nombrePoules = Math.ceil(equipesAleatoires.length / 4);
        const lettresPoules = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        
        console.log(`🎲 Création de ${nombrePoules} poule(s) pour ${equipesAleatoires.length} équipes`);
        
        for (let i = 0; i < equipesAleatoires.length; i++) {
          const poule = lettresPoules[i % nombrePoules];
          if (!groupes[poule]) groupes[poule] = [];
          groupes[poule].push(equipesAleatoires[i]);
        }
        
      } else if (tournoi.format === 'elimination_directe') {
        // ⚡ FORMAT ÉLIMINATION DIRECTE
        // Pas de poules, juste ordre aléatoire pour les matchs
        console.log(`⚡ Tirage élimination directe pour ${equipesAleatoires.length} équipes`);
        groupes['ELIMINATION'] = equipesAleatoires;
        
      } else if (tournoi.format === 'championnat') {
        // 🏅 FORMAT CHAMPIONNAT
        // Tous contre tous - une seule "ligue"
        console.log(`🏅 Tirage championnat (tous contre tous) pour ${equipesAleatoires.length} équipes`);
        groupes['CHAMPIONNAT'] = equipesAleatoires;
        
      } else {
        // Format non reconnu - défaut élimination directe
        console.log(`⚠️ Format non reconnu: ${tournoi.format}, utilisation élimination directe`);
        groupes['ELIMINATION'] = equipesAleatoires;
      }

      // Mettre à jour les participations avec les groupes
      for (const [poule, equipes] of Object.entries(groupes)) {
        for (let i = 0; i < equipes.length; i++) {
          let groupePoule = null;
          
          if (poule !== 'ELIMINATION' && poule !== 'CHAMPIONNAT') {
            // Pour les poules (A, B, C, D...)
            groupePoule = poule;
          }
          // Pour ELIMINATION et CHAMPIONNAT, groupe_poule reste null
          
          await ParticipationTournoi.update(
            { groupe_poule: groupePoule },
            { where: { id: equipes[i].id } }
          );
        }
      }

      // Générer automatiquement les matchs selon le format
      const matchsGeneres = [];

      if (tournoi.format === 'elimination_directe') {
        // 🏆 ÉLIMINATION DIRECTE
        const equipes = groupes['ELIMINATION'] || [];
        const nombreEquipes = equipes.length;

        console.log(`⚡ Génération matchs élimination directe pour ${nombreEquipes} équipes`);

        if (nombreEquipes === 4) {
          // Demi-finales
          const match1 = await MatchTournoi.create({
            tournoi_id: tournoi.id,
            phase: 'demi',
            equipe1_id: equipes[0].equipe.id,
            equipe2_id: equipes[1].equipe.id,
            date_match: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
            terrain_id: tournoi.terrain_id,
            created_by: req.user.id
          });

          const match2 = await MatchTournoi.create({
            tournoi_id: tournoi.id,
            phase: 'demi',
            equipe1_id: equipes[2].equipe.id,
            equipe2_id: equipes[3].equipe.id,
            date_match: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
            terrain_id: tournoi.terrain_id,
            created_by: req.user.id
          });

          // Finale (équipes TBD - To Be Determined)
          const finale = await MatchTournoi.create({
            tournoi_id: tournoi.id,
            phase: 'finale',
            equipe1_id: equipes[0].equipe.id, // Temporaire - sera mis à jour
            equipe2_id: equipes[1].equipe.id, // Temporaire - sera mis à jour
            date_match: new Date(Date.now() + 48 * 60 * 60 * 1000), // Après-demain
            terrain_id: tournoi.terrain_id,
            created_by: req.user.id,
            notes: 'Finale - Équipes à déterminer selon résultats demi-finales'
          });

          matchsGeneres.push(match1, match2, finale);
        }
      }

      // Changer le statut du tournoi
      await tournoi.update({ statut: 'en_cours' });

      console.log('✅ Tirage au sort effectué:', groupes);
      console.log('⚽ Matchs générés:', matchsGeneres.length);

      res.json({
        success: true,
        message: `Tirage au sort effectué avec succès ! ${matchsGeneres.length} match(s) généré(s)`,
        data: {
          tournoi: tournoi.nom,
          format: tournoi.format,
          groupes: Object.keys(groupes).map(poule => ({
            nom: poule,
            equipes: groupes[poule].map(p => ({
              id: p.equipe.id,
              nom: p.equipe.nom,
              logo_url: p.equipe.logo_url
            }))
          })),
          matchs: matchsGeneres
        }
      });

    } catch (error) {
      console.error('Erreur tirage au sort:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du tirage au sort',
        error: error.message
      });
    }
  }

  // Récupérer les détails complets d'un tournoi
  async getTournoiDetails(req, res) {
    try {
      const { tournoi_id } = req.params;

      console.log('🔍 Récupération détails tournoi:', tournoi_id);

      const tournoi = await Tournoi.findByPk(tournoi_id, {
        include: [
          {
            model: Field,
            as: 'terrain',
            attributes: ['id', 'name', 'location']
          },
          {
            model: ParticipationTournoi,
            as: 'participations',
            where: { statut: 'valide' },
            required: false,
            include: [{
              model: Equipe,
              as: 'equipe',
              attributes: ['id', 'nom', 'logo_url']
            }]
          }
        ]
      });

      if (!tournoi) {
        return res.status(404).json({
          success: false,
          message: 'Tournoi introuvable'
        });
      }

      // Vérifier les permissions
      if (req.user.role === 'admin' && req.user.field_id !== tournoi.terrain_id) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez consulter que les tournois de votre terrain'
        });
      }

      // Organiser les participations par groupes
      const participations = tournoi.participations || [];
      const groupes = {};

      if (tournoi.format === 'poules_elimination') {
        // Organiser par poules
        participations.forEach(p => {
          const poule = p.groupe_poule || 'SANS_GROUPE';
          if (!groupes[poule]) groupes[poule] = [];
          groupes[poule].push({
            id: p.id,
            equipe: p.equipe,
            points: p.points_poule || 0,
            victoires: p.victoires_poule || 0,
            nuls: p.nuls_poule || 0,
            defaites: p.defaites_poule || 0,
            buts_marques: p.buts_marques_poule || 0,
            buts_encaisses: p.buts_encaisses_poule || 0
          });
        });

        // Trier chaque poule par points
        Object.keys(groupes).forEach(poule => {
          groupes[poule].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const diffA = a.buts_marques - a.buts_encaisses;
            const diffB = b.buts_marques - b.buts_encaisses;
            if (diffB !== diffA) return diffB - diffA;
            return b.buts_marques - a.buts_marques;
          });
        });

      } else {
        // Pour élimination directe et championnat
        groupes['GENERAL'] = participations.map(p => ({
          id: p.id,
          equipe: p.equipe,
          points: p.points_poule || 0,
          victoires: p.victoires_poule || 0,
          nuls: p.nuls_poule || 0,
          defaites: p.defaites_poule || 0,
          buts_marques: p.buts_marques_poule || 0,
          buts_encaisses: p.buts_encaisses_poule || 0
        }));

        // Trier par points pour le championnat
        if (tournoi.format === 'championnat') {
          groupes['GENERAL'].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const diffA = a.buts_marques - a.buts_encaisses;
            const diffB = b.buts_marques - b.buts_encaisses;
            if (diffB !== diffA) return diffB - diffA;
            return b.buts_marques - a.buts_marques;
          });
        }
      }

      res.json({
        success: true,
        data: {
          tournoi: {
            id: tournoi.id,
            nom: tournoi.nom,
            format: tournoi.format,
            statut: tournoi.statut,
            terrain: tournoi.terrain
          },
          groupes,
          matchs: [] // TODO: Implémenter récupération matchs
        }
      });

    } catch (error) {
      console.error('Erreur récupération détails tournoi:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des détails',
        error: error.message
      });
    }
  }


  async updateStatutTournoi(req, res) {
    try {
      const { id } = req.params;
      const { statut } = req.body;

      // Vérifier que le statut est valide
      const statutsValides = ['en_preparation', 'inscriptions_ouvertes', 'inscriptions_fermees', 'en_cours', 'termine', 'annule'];
      if (!statutsValides.includes(statut)) {
        return res.status(400).json({
          success: false,
          message: 'Statut invalide'
        });
      }

      const tournoi = await Tournoi.findByPk(id);
      if (!tournoi) {
        return res.status(404).json({
          success: false,
          message: 'Tournoi introuvable'
        });
      }

      // Vérifier les permissions (version simplifiée)
      if (req.user.role === 'admin') {
        console.log('🔍 Vérification permissions admin pour tournoi:', id);
        console.log('🔍 Terrain du tournoi:', tournoi.terrain_id);
        console.log('🔍 Terrain de l\'admin:', req.user.field_id);
        
        // Vérifier que l'admin gère ce terrain
        if (req.user.field_id !== tournoi.terrain_id) {
          return res.status(403).json({
            success: false,
            message: 'Vous ne pouvez gérer que les éléments de votre terrain.'
          });
        }
      }

      await tournoi.update({ statut });

      res.json({
        success: true,
        message: 'Statut du tournoi mis à jour avec succès',
        data: { id: tournoi.id, statut }
      });

    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
        error: error.message
      });
    }
  }

  // Supprimer un tournoi
  async deleteTournoi(req, res) {
    try {
      const { id } = req.params;

      const tournoi = await Tournoi.findByPk(id);
      if (!tournoi) {
        return res.status(404).json({
          success: false,
          message: 'Tournoi introuvable'
        });
      }

      // Vérifier les permissions
      if (req.user.role === 'admin') {
        const hasAccess = await Field.findOne({
          where: {
            id: tournoi.terrain_id,
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

      // Empêcher la suppression si le tournoi a commencé
      if (['en_cours', 'termine'].includes(tournoi.statut)) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de supprimer un tournoi en cours ou terminé'
        });
      }

      // Supprimer les participations et matchs associés
      await ParticipationTournoi.destroy({ where: { tournoi_id: id } });
      await MatchTournoi.destroy({ where: { tournoi_id: id } });
      
      // Supprimer le tournoi
      await tournoi.destroy();

      res.json({
        success: true,
        message: 'Tournoi supprimé avec succès'
      });

    } catch (error) {
      console.error('Erreur suppression tournoi:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du tournoi',
        error: error.message
      });
    }
  }

  // Route temporaire pour corriger le schéma en production
  async fixSchema(req, res) {
    try {
      console.log('🔧 CORRECTION SCHÉMA URGENTE - matchs_tournois');
      
      // Vérifier que l'utilisateur est super_admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Seuls les super_admin peuvent exécuter cette action.'
        });
      }

      const results = [];
      
      // Liste des colonnes à ajouter
      const alterations = [
        'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS groupe_poule VARCHAR(1);',
        'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS numero_match INTEGER DEFAULT 1;',
        'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS created_by UUID;',
        'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS updated_by UUID;',
        'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS score1_prolongation INTEGER;',
        'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS score2_prolongation INTEGER;',
        'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS tirs_au_but_equipe1 INTEGER;',
        'ALTER TABLE matchs_tournois ADD COLUMN IF NOT EXISTS tirs_au_but_equipe2 INTEGER;'
      ];

      console.log('🔧 Ajout des colonnes manquantes...');
      
      for (let i = 0; i < alterations.length; i++) {
        try {
          await sequelize.query(alterations[i]);
          results.push(`✅ Colonne ${i + 1} ajoutée avec succès`);
          console.log(`✅ Colonne ${i + 1} - OK`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            results.push(`⚠️ Colonne ${i + 1} déjà existante`);
            console.log(`⚠️ Colonne ${i + 1} - Déjà existante`);
          } else {
            results.push(`❌ Colonne ${i + 1} - Erreur: ${error.message}`);
            console.log(`❌ Colonne ${i + 1} - Erreur: ${error.message}`);
          }
        }
      }

      console.log('🎉 Correction terminée');

      res.json({
        success: true,
        message: 'Correction du schéma terminée avec succès',
        results: results,
        timestamp: new Date().toISOString(),
        executed_by: req.user.email
      });

    } catch (error) {
      console.error('❌ Erreur lors de la correction du schéma:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la correction du schéma',
        error: error.message
      });
    }
  }
}

module.exports = new TournoiController();
