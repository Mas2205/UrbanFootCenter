const { sequelize } = require('../config/database');
const ChampionnatScheduler = require('../utils/championnatScheduler');

// Import des modèles
const User = require('../models/user.model');
const Field = require('../models/field.model');
const Equipe = require('../models/equipe.model');
const MembreEquipe = require('../models/membreEquipe.model');
const Tournoi = require('../models/tournoi.model');
const Championnat = require('../models/championnat.model');

async function testSportsSystem() {
  try {
    console.log('🚀 Test du système Équipes/Tournois/Championnats...\n');

    // 1. Test de connexion à la base de données
    console.log('1️⃣ Test de connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion réussie\n');

    // 2. Test de création automatique de championnat
    console.log('2️⃣ Test de création automatique de championnat...');
    const championnatInfo = await ChampionnatScheduler.getCurrentChampionnatInfo();
    console.log('📅 Info championnat actuel:', championnatInfo);
    
    const championnat = await ChampionnatScheduler.forceCreateChampionnat();
    console.log('✅ Championnat créé/vérifié:', championnat.nom, '\n');

    // 3. Test de création d'équipe
    console.log('3️⃣ Test de création d\'équipe...');
    
    // Récupérer un terrain existant
    const terrain = await Field.findOne();
    if (!terrain) {
      console.log('❌ Aucun terrain trouvé. Créez d\'abord des terrains.');
      return;
    }

    // Récupérer un utilisateur pour être capitaine
    const capitaine = await User.findOne({ where: { role: 'client' } });
    if (!capitaine) {
      console.log('❌ Aucun client trouvé pour être capitaine.');
      return;
    }

    // Créer une équipe de test
    const equipeTest = await Equipe.create({
      nom: 'Équipe Test FC',
      description: 'Équipe créée pour les tests du système',
      terrain_id: terrain.id,
      capitaine_id: capitaine.id,
      couleur_maillot: '#FF0000',
      created_by: capitaine.id
    });

    console.log('✅ Équipe créée:', equipeTest.nom);

    // Ajouter le capitaine comme membre
    await MembreEquipe.create({
      equipe_id: equipeTest.id,
      user_id: capitaine.id,
      role: 'capitaine'
    });

    console.log('✅ Capitaine ajouté à l\'équipe\n');

    // 4. Test de création de tournoi
    console.log('4️⃣ Test de création de tournoi...');
    
    const maintenant = new Date();
    const dateFin = new Date(maintenant);
    dateFin.setDate(dateFin.getDate() + 7);
    const dateLimite = new Date(maintenant);
    dateLimite.setDate(dateLimite.getDate() + 3);

    const tournoiTest = await Tournoi.create({
      nom: 'Tournoi Test 2024',
      description: 'Tournoi créé pour les tests du système',
      terrain_id: terrain.id,
      date_debut: maintenant.toISOString().split('T')[0],
      date_fin: dateFin.toISOString().split('T')[0],
      date_limite_inscription: dateLimite.toISOString().split('T')[0],
      frais_inscription: 5000,
      prix_total: 50000,
      format: 'elimination_directe',
      nombre_max_equipes: 8,
      statut: 'en_preparation',
      created_by: capitaine.id
    });

    console.log('✅ Tournoi créé:', tournoiTest.nom, '\n');

    // 5. Test des statistiques
    console.log('5️⃣ Test des statistiques...');
    
    const totalEquipes = await Equipe.count();
    const totalTournois = await Tournoi.count();
    const totalChampionnats = await Championnat.count();

    console.log('📊 Statistiques:');
    console.log(`   - Équipes: ${totalEquipes}`);
    console.log(`   - Tournois: ${totalTournois}`);
    console.log(`   - Championnats: ${totalChampionnats}\n`);

    // 6. Test de nettoyage (optionnel)
    console.log('6️⃣ Nettoyage des données de test...');
    
    await MembreEquipe.destroy({ where: { equipe_id: equipeTest.id } });
    await equipeTest.destroy();
    await tournoiTest.destroy();
    
    console.log('✅ Données de test supprimées\n');

    console.log('🎉 Tous les tests sont passés avec succès !');
    console.log('✨ Le système Équipes/Tournois/Championnats est opérationnel.');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    console.error('Stack:', error.stack);
  } finally {
    // Fermer la connexion
    await sequelize.close();
    console.log('\n🔌 Connexion fermée.');
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testSportsSystem();
}

module.exports = { testSportsSystem };
