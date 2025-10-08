const { Op } = require('sequelize');
const { 
  Championnat, 
  MatchChampionnat, 
  ClassementChampionnat, 
  Equipe, 
  User, 
  Field 
} = require('../models');

class ChampionnatController {
  // Créer automatiquement un championnat trimestriel
  static async creerChampionnatAutomatique() {
    try {
      const maintenant = new Date();
      const annee = maintenant.getFullYear();
      const mois = maintenant.getMonth() + 1; // 0-11 -> 1-12

      // Déterminer le trimestre
      let trimestre, periode_debut, periode_fin;
      
      if (mois >= 1 && mois <= 3) {
        trimestre = 'T1';
        periode_debut = new Date(annee, 0, 1); // 1er janvier
        periode_fin = new Date(annee, 2, 31); // 31 mars
      } else if (mois >= 4 && mois <= 6) {
        trimestre = 'T2';
        periode_debut = new Date(annee, 3, 1); // 1er avril
        periode_fin = new Date(annee, 5, 30); // 30 juin
      } else if (mois >= 7 && mois <= 9) {
        trimestre = 'T3';
        periode_debut = new Date(annee, 6, 1); // 1er juillet
        periode_fin = new Date(annee, 8, 30); // 30 septembre
      } else {
        trimestre = 'T4';
        periode_debut = new Date(annee, 9, 1); // 1er octobre
        periode_fin = new Date(annee, 11, 31); // 31 décembre
      }

      const saison = `${annee}-${annee + 1}`;
      const nom = `Championnat National ${trimestre} ${annee}`;

      // Vérifier si le championnat existe déjà
      const championnatExistant = await Championnat.findOne({
        where: { saison, trimestre }
      });

      if (championnatExistant) {
        return championnatExistant;
      }

      // Désactiver les anciens championnats
      await Championnat.update(
        { actif: false, statut: 'archive' },
        { where: { actif: true } }
      );

      // Créer le nouveau championnat
      const championnat = await Championnat.create({
        nom,
        saison,
        trimestre,
        periode_debut,
        periode_fin,
        actif: true,
        statut: 'en_cours'
      });

      console.log(`✅ Championnat ${nom} créé automatiquement`);
      return championnat;

    } catch (error) {
      console.error('Erreur création championnat automatique:', error);
      throw error;
    }
  }

  // Récupérer le championnat actuel
  async getChampionnatActuel(req, res) {
    try {
      let championnat = await Championnat.findOne({
        where: { actif: true },
        include: [
          {
            model: ClassementChampionnat,
            as: 'classement',
            include: [{
              model: Equipe,
              as: 'equipe',
              include: [
                {
                  model: Field,
                  as: 'terrain',
                  attributes: ['id', 'name', 'location']
                },
                {
                  model: User,
                  as: 'capitaine',
                  attributes: ['id', 'first_name', 'last_name']
                }
              ]
            }],
            order: [
              ['points', 'DESC'],
              ['difference_buts', 'DESC'],
              ['buts_marques', 'DESC']
            ]
          }
        ]
      });

      // Si aucun championnat actuel, en créer un
      if (!championnat) {
        championnat = await ChampionnatController.creerChampionnatAutomatique();
        
        // Recharger avec les relations
        championnat = await Championnat.findByPk(championnat.id, {
          include: [
            {
              model: ClassementChampionnat,
              as: 'classement',
              include: [{
                model: Equipe,
                as: 'equipe',
                include: [
                  {
                    model: Field,
                    as: 'terrain',
                    attributes: ['id', 'name', 'location']
                  },
                  {
                    model: User,
                    as: 'capitaine',
                    attributes: ['id', 'first_name', 'last_name']
                  }
                ]
              }],
              order: [
                ['points', 'DESC'],
                ['difference_buts', 'DESC'],
                ['buts_marques', 'DESC']
              ]
            }
          ]
        });
      }

      // Mettre à jour les positions dans le classement
      if (championnat.classement && championnat.classement.length > 0) {
        for (let i = 0; i < championnat.classement.length; i++) {
          const equipeClassement = championnat.classement[i];
          if (equipeClassement.position !== i + 1) {
            await equipeClassement.update({
              position_precedente: equipeClassement.position,
              position: i + 1
            });
          }
        }
      }

      res.json({
        success: true,
        data: championnat
      });

    } catch (error) {
      console.error('Erreur récupération championnat actuel:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du championnat actuel',
        error: error.message
      });
    }
  }

  // Lister tous les championnats (historique)
  async getChampionnats(req, res) {
    try {
      const { page = 1, limit = 10, annee, trimestre } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};

      if (annee) {
        whereClause.saison = { [Op.like]: `${annee}%` };
      }

      if (trimestre) {
        whereClause.trimestre = trimestre;
      }

      const { count, rows: championnats } = await Championnat.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: ClassementChampionnat,
            as: 'classement',
            include: [{
              model: Equipe,
              as: 'equipe',
              attributes: ['id', 'nom', 'logo_url']
            }],
            limit: 3, // Top 3 pour l'aperçu
            order: [['position', 'ASC']]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['periode_debut', 'DESC']]
      });

      res.json({
        success: true,
        data: championnats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Erreur récupération championnats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des championnats',
        error: error.message
      });
    }
  }

  // Créer un match de championnat
  async createMatch(req, res) {
    try {
      const {
        equipe1_id,
        equipe2_id,
        terrain_id,
        date_match,
        journee,
        arbitre,
        notes
      } = req.body;

      const created_by = req.user.id;

      // Vérifications de base
      if (!equipe1_id || !equipe2_id || !terrain_id || !date_match) {
        return res.status(400).json({
          success: false,
          message: 'Équipes, terrain et date du match sont requis'
        });
      }

      if (equipe1_id === equipe2_id) {
        return res.status(400).json({
          success: false,
          message: 'Une équipe ne peut pas jouer contre elle-même'
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

      // Vérifier que les équipes existent
      const equipe1 = await Equipe.findByPk(equipe1_id);
      const equipe2 = await Equipe.findByPk(equipe2_id);

      if (!equipe1 || !equipe2) {
        return res.status(404).json({
          success: false,
          message: 'Une ou plusieurs équipes introuvables'
        });
      }

      // Récupérer le championnat actuel
      let championnat = await Championnat.findOne({
        where: { actif: true }
      });

      if (!championnat) {
        championnat = await ChampionnatController.creerChampionnatAutomatique();
      }

      // Créer le match
      const match = await MatchChampionnat.create({
        championnat_id: championnat.id,
        terrain_id,
        equipe1_id,
        equipe2_id,
        date_match,
        journee,
        arbitre,
        notes,
        created_by
      });

      // S'assurer que les équipes sont dans le classement
      await this.ajouterEquipeAuClassement(championnat.id, equipe1_id);
      await this.ajouterEquipeAuClassement(championnat.id, equipe2_id);

      // Récupérer le match avec ses relations
      const matchComplet = await MatchChampionnat.findByPk(match.id, {
        include: [
          {
            model: Championnat,
            as: 'championnat',
            attributes: ['id', 'nom']
          },
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
            model: Field,
            as: 'terrain',
            attributes: ['id', 'name', 'location']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Match créé avec succès',
        data: matchComplet
      });

    } catch (error) {
      console.error('Erreur création match:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du match',
        error: error.message
      });
    }
  }

  // Saisir le résultat d'un match
  async saisirResultat(req, res) {
    try {
      const { match_id } = req.params;
      const { 
        score1, 
        score2, 
        buteurs_equipe1 = [], 
        buteurs_equipe2 = [],
        cartons_equipe1 = [],
        cartons_equipe2 = [],
        notes 
      } = req.body;

      const updated_by = req.user.id;

      // Vérifications
      if (score1 === undefined || score2 === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Les scores des deux équipes sont requis'
        });
      }

      if (score1 < 0 || score2 < 0) {
        return res.status(400).json({
          success: false,
          message: 'Les scores ne peuvent pas être négatifs'
        });
      }

      const match = await MatchChampionnat.findByPk(match_id, {
        include: [
          {
            model: Championnat,
            as: 'championnat'
          },
          {
            model: Equipe,
            as: 'equipe1'
          },
          {
            model: Equipe,
            as: 'equipe2'
          }
        ]
      });

      if (!match) {
        return res.status(404).json({
          success: false,
          message: 'Match introuvable'
        });
      }

      // Vérifier les permissions
      if (req.user.role === 'admin') {
        const hasAccess = await Field.findOne({
          where: {
            id: match.terrain_id,
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

      // Vérifier que le match n'est pas déjà terminé
      if (match.statut === 'termine') {
        return res.status(400).json({
          success: false,
          message: 'Ce match est déjà terminé'
        });
      }

      // Mettre à jour le match
      await match.update({
        score1: parseInt(score1),
        score2: parseInt(score2),
        buteurs_equipe1,
        buteurs_equipe2,
        cartons_equipe1,
        cartons_equipe2,
        notes,
        statut: 'termine',
        updated_by
      });

      // Mettre à jour le classement
      await this.mettreAJourClassement(match);

      // Récupérer le match mis à jour
      const matchMisAJour = await MatchChampionnat.findByPk(match_id, {
        include: [
          {
            model: Championnat,
            as: 'championnat',
            attributes: ['id', 'nom']
          },
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
            model: Field,
            as: 'terrain',
            attributes: ['id', 'name', 'location']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Résultat saisi avec succès',
        data: matchMisAJour
      });

    } catch (error) {
      console.error('Erreur saisie résultat:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la saisie du résultat',
        error: error.message
      });
    }
  }

  // Lister les matchs du championnat
  async getMatchs(req, res) {
    try {
      const { page = 1, limit = 10, championnat_id, statut, equipe_id } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};

      // Championnat spécifique ou actuel
      if (championnat_id) {
        whereClause.championnat_id = championnat_id;
      } else {
        const championnatActuel = await Championnat.findOne({
          where: { actif: true }
        });
        if (championnatActuel) {
          whereClause.championnat_id = championnatActuel.id;
        }
      }

      // Filtrage par statut
      if (statut) {
        whereClause.statut = statut;
      }

      // Filtrage par équipe
      if (equipe_id) {
        whereClause[Op.or] = [
          { equipe1_id: equipe_id },
          { equipe2_id: equipe_id }
        ];
      }

      const { count, rows: matchs } = await MatchChampionnat.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Championnat,
            as: 'championnat',
            attributes: ['id', 'nom']
          },
          {
            model: Equipe,
            as: 'equipe1',
            attributes: ['id', 'nom', 'logo_url', 'couleur_maillot']
          },
          {
            model: Equipe,
            as: 'equipe2',
            attributes: ['id', 'nom', 'logo_url', 'couleur_maillot']
          },
          {
            model: Field,
            as: 'terrain',
            attributes: ['id', 'name', 'location']
          },
          {
            model: User,
            as: 'createur',
            attributes: ['id', 'first_name', 'last_name']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['date_match', 'DESC']]
      });

      res.json({
        success: true,
        data: matchs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Erreur récupération matchs:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des matchs',
        error: error.message
      });
    }
  }

  // Méthode privée pour ajouter une équipe au classement
  async ajouterEquipeAuClassement(championnat_id, equipe_id) {
    try {
      const classementExistant = await ClassementChampionnat.findOne({
        where: { championnat_id, equipe_id }
      });

      if (!classementExistant) {
        await ClassementChampionnat.create({
          championnat_id,
          equipe_id
        });
      }
    } catch (error) {
      console.error('Erreur ajout équipe classement:', error);
    }
  }

  // Méthode privée pour mettre à jour le classement après un match
  async mettreAJourClassement(match) {
    try {
      const { championnat_id, equipe1_id, equipe2_id, score1, score2 } = match;

      // Récupérer les classements des deux équipes
      const classement1 = await ClassementChampionnat.findOne({
        where: { championnat_id, equipe_id: equipe1_id }
      });
      
      const classement2 = await ClassementChampionnat.findOne({
        where: { championnat_id, equipe_id: equipe2_id }
      });

      if (!classement1 || !classement2) {
        throw new Error('Classements introuvables');
      }

      // Calculer les nouveaux points et statistiques
      let points1 = 0, points2 = 0;
      let victoires1 = 0, victoires2 = 0;
      let nuls1 = 0, nuls2 = 0;
      let defaites1 = 0, defaites2 = 0;

      if (score1 > score2) {
        // Victoire équipe 1
        points1 = 3;
        points2 = 0;
        victoires1 = 1;
        defaites2 = 1;
      } else if (score1 < score2) {
        // Victoire équipe 2
        points1 = 0;
        points2 = 3;
        defaites1 = 1;
        victoires2 = 1;
      } else {
        // Match nul
        points1 = 1;
        points2 = 1;
        nuls1 = 1;
        nuls2 = 1;
      }

      // Mettre à jour le classement équipe 1
      await classement1.update({
        points: classement1.points + points1,
        matchs_joues: classement1.matchs_joues + 1,
        victoires: classement1.victoires + victoires1,
        nuls: classement1.nuls + nuls1,
        defaites: classement1.defaites + defaites1,
        buts_marques: classement1.buts_marques + score1,
        buts_encaisses: classement1.buts_encaisses + score2
      });

      // Mettre à jour le classement équipe 2
      await classement2.update({
        points: classement2.points + points2,
        matchs_joues: classement2.matchs_joues + 1,
        victoires: classement2.victoires + victoires2,
        nuls: classement2.nuls + nuls2,
        defaites: classement2.defaites + defaites2,
        buts_marques: classement2.buts_marques + score2,
        buts_encaisses: classement2.buts_encaisses + score1
      });

      // Mettre à jour la forme récente (5 derniers matchs)
      await this.mettreAJourFormeRecente(championnat_id, equipe1_id);
      await this.mettreAJourFormeRecente(championnat_id, equipe2_id);

      console.log(`✅ Classement mis à jour pour le match ${equipe1_id} vs ${equipe2_id}`);

    } catch (error) {
      console.error('Erreur mise à jour classement:', error);
      throw error;
    }
  }

  // Méthode privée pour mettre à jour la forme récente
  async mettreAJourFormeRecente(championnat_id, equipe_id) {
    try {
      // Récupérer les 5 derniers matchs de l'équipe
      const matchsRecents = await MatchChampionnat.findAll({
        where: {
          championnat_id,
          [Op.or]: [
            { equipe1_id: equipe_id },
            { equipe2_id: equipe_id }
          ],
          statut: 'termine'
        },
        order: [['date_match', 'DESC']],
        limit: 5
      });

      let forme = '';
      matchsRecents.forEach(match => {
        const estEquipe1 = match.equipe1_id === equipe_id;
        const scoreEquipe = estEquipe1 ? match.score1 : match.score2;
        const scoreAdversaire = estEquipe1 ? match.score2 : match.score1;

        if (scoreEquipe > scoreAdversaire) {
          forme = 'V' + forme; // Victoire
        } else if (scoreEquipe < scoreAdversaire) {
          forme = 'D' + forme; // Défaite
        } else {
          forme = 'N' + forme; // Nul
        }
      });

      // Mettre à jour la forme dans le classement
      await ClassementChampionnat.update(
        { forme_recente: forme },
        { where: { championnat_id, equipe_id } }
      );

    } catch (error) {
      console.error('Erreur mise à jour forme récente:', error);
    }
  }

  // Obtenir les statistiques du championnat
  async getStatistiques(req, res) {
    try {
      const { championnat_id } = req.params;

      let whereClause = {};
      if (championnat_id) {
        whereClause.championnat_id = championnat_id;
      } else {
        const championnatActuel = await Championnat.findOne({
          where: { actif: true }
        });
        if (championnatActuel) {
          whereClause.championnat_id = championnatActuel.id;
        }
      }

      // Statistiques générales
      const totalMatchs = await MatchChampionnat.count({
        where: { ...whereClause, statut: 'termine' }
      });

      const totalEquipes = await ClassementChampionnat.count({
        where: whereClause
      });

      // Meilleur buteur (approximatif basé sur les JSON buteurs)
      const matchsAvecButs = await MatchChampionnat.findAll({
        where: { ...whereClause, statut: 'termine' },
        attributes: ['buteurs_equipe1', 'buteurs_equipe2']
      });

      let buteurs = {};
      matchsAvecButs.forEach(match => {
        [...(match.buteurs_equipe1 || []), ...(match.buteurs_equipe2 || [])].forEach(but => {
          if (but.user_id) {
            buteurs[but.user_id] = (buteurs[but.user_id] || 0) + 1;
          }
        });
      });

      const meilleurButeurId = Object.keys(buteurs).reduce((a, b) => 
        buteurs[a] > buteurs[b] ? a : b, null
      );

      let meilleurButeur = null;
      if (meilleurButeurId) {
        const user = await User.findByPk(meilleurButeurId, {
          attributes: ['id', 'first_name', 'last_name']
        });
        meilleurButeur = {
          ...user?.toJSON(),
          buts: buteurs[meilleurButeurId]
        };
      }

      // Équipe avec le plus de victoires
      const equipeVictoires = await ClassementChampionnat.findOne({
        where: whereClause,
        include: [{
          model: Equipe,
          as: 'equipe',
          attributes: ['id', 'nom', 'logo_url']
        }],
        order: [['victoires', 'DESC']],
        limit: 1
      });

      res.json({
        success: true,
        data: {
          total_matchs: totalMatchs,
          total_equipes: totalEquipes,
          meilleur_buteur: meilleurButeur,
          equipe_plus_victoires: equipeVictoires?.equipe || null,
          victoires_record: equipeVictoires?.victoires || 0
        }
      });

    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }
}

module.exports = new ChampionnatController();
