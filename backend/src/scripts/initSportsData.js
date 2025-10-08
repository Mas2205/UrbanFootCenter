const { sequelize } = require('../config/database');
const ChampionnatScheduler = require('../utils/championnatScheduler');

// Import des modèles
const User = require('../models/user.model');
const Field = require('../models/field.model');
const Equipe = require('../models/equipe.model');
const MembreEquipe = require('../models/membreEquipe.model');
const Tournoi = require('../models/tournoi.model');
const ParticipationTournoi = require('../models/participationTournoi.model');
const Championnat = require('../models/championnat.model');
const MatchChampionnat = require('../models/matchChampionnat.model');
const ClassementChampionnat = require('../models/classementChampionnat.model');

async function initSportsData() {
  try {
    console.log('🏈 Initialisation des données sportives...\n');

    // 1. Créer le championnat actuel
    console.log('1️⃣ Création du championnat actuel...');
    const championnat = await ChampionnatScheduler.forceCreateChampionnat();
    console.log('✅ Championnat créé:', championnat.nom, '\n');

    // 2. Récupérer les terrains existants
    console.log('2️⃣ Récupération des terrains...');
    const terrains = await Field.findAll({ limit: 3 });
    if (terrains.length === 0) {
      console.log('❌ Aucun terrain trouvé. Créez d\'abord des terrains.');
      return;
    }
    console.log(`✅ ${terrains.length} terrains trouvés\n`);

    // 3. Récupérer des utilisateurs clients
    console.log('3️⃣ Récupération des utilisateurs clients...');
    const clients = await User.findAll({ 
      where: { role: 'client' },
      limit: 12 
    });
    
    if (clients.length < 6) {
      console.log('❌ Pas assez de clients (minimum 6 requis).');
      return;
    }
    console.log(`✅ ${clients.length} clients trouvés\n`);

    // 4. Créer des équipes
    console.log('4️⃣ Création des équipes...');
    const equipesData = [
      { nom: 'FC Lions', couleur: '#FFD700', description: 'Les rois de la savane' },
      { nom: 'Eagles United', couleur: '#8B4513', description: 'Volent vers la victoire' },
      { nom: 'Sharks FC', couleur: '#4169E1', description: 'Prédateurs des terrains' },
      { nom: 'Tigers Team', couleur: '#FF4500', description: 'Férocité et technique' },
      { nom: 'Panthers Club', couleur: '#000000', description: 'Agilité et puissance' },
      { nom: 'Wolves Pack', couleur: '#696969', description: 'L\'esprit de meute' }
    ];

    const equipes = [];
    for (let i = 0; i < equipesData.length && i < clients.length; i++) {
      const equipeData = equipesData[i];
      const capitaine = clients[i];
      const terrain = terrains[i % terrains.length];

      const equipe = await Equipe.create({
        nom: equipeData.nom,
        description: equipeData.description,
        terrain_id: terrain.id,
        capitaine_id: capitaine.id,
        couleur_maillot: equipeData.couleur,
        created_by: capitaine.id
      });

      // Ajouter le capitaine comme membre
      await MembreEquipe.create({
        equipe_id: equipe.id,
        user_id: capitaine.id,
        role: 'capitaine'
      });

      // Ajouter 2-3 membres supplémentaires si disponibles
      const membresSupplementaires = clients.slice(equipesData.length + i * 2, equipesData.length + i * 2 + 2);
      for (const membre of membresSupplementaires) {
        if (membre && membre.id !== capitaine.id) {
          await MembreEquipe.create({
            equipe_id: equipe.id,
            user_id: membre.id,
            role: 'joueur'
          });
        }
      }

      equipes.push(equipe);
      console.log(`✅ Équipe créée: ${equipe.nom} (Capitaine: ${capitaine.first_name} ${capitaine.last_name})`);
    }
    console.log(`\n✅ ${equipes.length} équipes créées\n`);

    // 5. Créer des entrées de classement pour le championnat
    console.log('5️⃣ Initialisation du classement...');
    for (const equipe of equipes) {
      await ClassementChampionnat.create({
        championnat_id: championnat.id,
        equipe_id: equipe.id,
        points: Math.floor(Math.random() * 15), // Points aléatoires pour la démo
        matchs_joues: Math.floor(Math.random() * 5),
        victoires: Math.floor(Math.random() * 3),
        nuls: Math.floor(Math.random() * 2),
        defaites: Math.floor(Math.random() * 2),
        buts_marques: Math.floor(Math.random() * 10),
        buts_encaisses: Math.floor(Math.random() * 8),
        forme_recente: ['V', 'N', 'D', 'V', 'N'][Math.floor(Math.random() * 5)].repeat(Math.floor(Math.random() * 3) + 1)
      });
    }
    console.log('✅ Classement initialisé\n');

    // 6. Créer un tournoi de démonstration
    console.log('6️⃣ Création d\'un tournoi de démonstration...');
    const maintenant = new Date();
    const dateFin = new Date(maintenant);
    dateFin.setDate(dateFin.getDate() + 14);
    const dateLimite = new Date(maintenant);
    dateLimite.setDate(dateLimite.getDate() + 7);

    const tournoi = await Tournoi.create({
      nom: 'Coupe d\'Été 2024',
      description: 'Tournoi estival pour toutes les équipes de la région',
      terrain_id: terrains[0].id,
      date_debut: maintenant.toISOString().split('T')[0],
      date_fin: dateFin.toISOString().split('T')[0],
      date_limite_inscription: dateLimite.toISOString().split('T')[0],
      frais_inscription: 10000,
      recompense: 'Trophée + 100,000 FCFA',
      prix_total: 100000,
      format: 'poules_elimination',
      nombre_max_equipes: 16,
      statut: 'inscriptions_ouvertes',
      created_by: clients[0].id
    });

    // Inscrire quelques équipes au tournoi
    for (let i = 0; i < Math.min(4, equipes.length); i++) {
      await ParticipationTournoi.create({
        tournoi_id: tournoi.id,
        equipe_id: equipes[i].id,
        statut: i < 2 ? 'valide' : 'en_attente'
      });
    }

    console.log(`✅ Tournoi créé: ${tournoi.nom}`);
    console.log(`   - ${Math.min(4, equipes.length)} équipes inscrites\n`);

    // 7. Créer quelques matchs de championnat
    console.log('7️⃣ Création de matchs de championnat...');
    if (equipes.length >= 4) {
      const matchsData = [
        { equipe1: equipes[0], equipe2: equipes[1], score1: 2, score2: 1, statut: 'termine' },
        { equipe1: equipes[2], equipe2: equipes[3], score1: 0, score2: 3, statut: 'termine' },
        { equipe1: equipes[0], equipe2: equipes[2], score1: null, score2: null, statut: 'a_venir' }
      ];

      for (let i = 0; i < matchsData.length; i++) {
        const matchData = matchsData[i];
        const dateMatch = new Date(maintenant);
        dateMatch.setDate(dateMatch.getDate() + i - 1);

        await MatchChampionnat.create({
          championnat_id: championnat.id,
          terrain_id: terrains[i % terrains.length].id,
          equipe1_id: matchData.equipe1.id,
          equipe2_id: matchData.equipe2.id,
          score1: matchData.score1 || 0,
          score2: matchData.score2 || 0,
          statut: matchData.statut,
          date_match: dateMatch,
          journee: i + 1,
          created_by: clients[0].id
        });
      }

      console.log(`✅ ${matchsData.length} matchs de championnat créés\n`);
    }

    // 8. Statistiques finales
    console.log('8️⃣ Statistiques finales...');
    const stats = {
      equipes: await Equipe.count(),
      membres: await MembreEquipe.count(),
      tournois: await Tournoi.count(),
      participations: await ParticipationTournoi.count(),
      championnats: await Championnat.count(),
      matchs: await MatchChampionnat.count(),
      classements: await ClassementChampionnat.count()
    };

    console.log('📊 Données créées:');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });

    console.log('\n🎉 Initialisation terminée avec succès !');
    console.log('✨ Le système est prêt avec des données de démonstration.');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Connexion fermée.');
  }
}

// Exécuter l'initialisation si le script est appelé directement
if (require.main === module) {
  initSportsData();
}

module.exports = { initSportsData };
