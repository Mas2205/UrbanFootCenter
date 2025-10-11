const { Sequelize } = require('sequelize');
const { Tournoi, Equipe, ParticipationTournoi, User } = require('../backend/src/models');

async function createTestParticipations() {
  try {
    console.log('🔍 Création de participations de test pour les tournois...');

    // 1. Récupérer les tournois existants
    const tournois = await Tournoi.findAll({
      include: [{
        model: ParticipationTournoi,
        as: 'participations'
      }]
    });
    
    console.log(`📊 ${tournois.length} tournois trouvés`);
    
    // 2. Récupérer les équipes existantes
    const equipes = await Equipe.findAll();
    console.log(`👥 ${equipes.length} équipes trouvées`);
    
    if (equipes.length === 0) {
      console.log('❌ Aucune équipe trouvée. Créons des équipes de test...');
      
      // Créer des équipes de test
      const users = await User.findAll({ where: { role: 'client' } });
      
      for (let i = 0; i < Math.min(5, users.length); i++) {
        const user = users[i];
        const equipe = await Equipe.create({
          nom: `Équipe Test ${i + 1}`,
          capitaine_id: user.id,
          terrain_id: tournois[0]?.terrain_id || 'a727274a-4068-414d-a2d6-0970697c2cdb',
          created_by: user.id,
          couleur_maillot: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'][i],
          description: `Équipe de test ${i + 1} pour les tournois`
        });
        
        console.log(`✅ Équipe créée: ${equipe.nom}`);
      }
      
      // Recharger les équipes
      const nouvellesEquipes = await Equipe.findAll();
      console.log(`👥 ${nouvellesEquipes.length} équipes disponibles maintenant`);
    }

    // 3. Pour chaque tournoi, créer des participations de test
    for (const tournoi of tournois) {
      console.log(`\n🏆 Tournoi: ${tournoi.nom}`);
      console.log(`📊 Participations existantes: ${tournoi.participations?.length || 0}`);
      
      if (!tournoi.participations || tournoi.participations.length === 0) {
        console.log('➕ Création de participations de test...');
        
        // Récupérer les équipes disponibles
        const equipesDisponibles = await Equipe.findAll({ limit: 4 });
        
        const statuts = ['en_attente', 'valide', 'en_attente', 'valide'];
        
        for (let i = 0; i < Math.min(4, equipesDisponibles.length); i++) {
          const equipe = equipesDisponibles[i];
          
          const participation = await ParticipationTournoi.create({
            tournoi_id: tournoi.id,
            equipe_id: equipe.id,
            user_id: equipe.capitaine_id,
            statut: statuts[i],
            date_inscription: new Date(),
            stats: {
              matchs_joues: 0,
              victoires: 0,
              defaites: 0,
              nuls: 0,
              buts_pour: 0,
              buts_contre: 0,
              points: 0
            }
          });
          
          console.log(`✅ Participation créée: ${equipe.nom} - ${statuts[i]}`);
        }
      } else {
        console.log('✅ Participations déjà existantes');
      }
    }

    console.log('\n🎉 Création des participations de test terminée !');
    
    // 4. Vérification finale
    const verification = await Tournoi.findAll({
      include: [{
        model: ParticipationTournoi,
        as: 'participations',
        include: [{
          model: Equipe,
          as: 'equipe'
        }]
      }]
    });
    
    console.log('\n📊 VÉRIFICATION FINALE:');
    verification.forEach(tournoi => {
      console.log(`🏆 ${tournoi.nom}: ${tournoi.participations?.length || 0} participations`);
      tournoi.participations?.forEach(p => {
        console.log(`  - ${p.equipe?.nom}: ${p.statut}`);
      });
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le script
if (require.main === module) {
  createTestParticipations()
    .then(() => {
      console.log('✅ Script terminé');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { createTestParticipations };
