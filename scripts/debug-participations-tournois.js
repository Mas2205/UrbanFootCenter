const { Tournoi, ParticipationTournoi, Equipe, User } = require('../backend/src/models');

async function debugParticipations() {
  try {
    console.log('🔍 DEBUG PARTICIPATIONS TOURNOIS\n');

    // 1. Récupérer tous les tournois avec leurs participations
    const tournois = await Tournoi.findAll({
      include: [{
        model: ParticipationTournoi,
        as: 'participations',
        include: [{
          model: Equipe,
          as: 'equipe',
          attributes: ['id', 'nom']
        }]
      }],
      order: [['created_at', 'DESC']]
    });

    console.log(`📊 ${tournois.length} tournois trouvés\n`);

    for (const tournoi of tournois) {
      console.log(`🏆 TOURNOI: ${tournoi.nom}`);
      console.log(`   - ID: ${tournoi.id}`);
      console.log(`   - Statut: ${tournoi.statut}`);
      console.log(`   - Format: ${tournoi.format}`);
      console.log(`   - Participations: ${tournoi.participations?.length || 0}`);
      
      if (tournoi.participations && tournoi.participations.length > 0) {
        console.log('   📋 DÉTAIL PARTICIPATIONS:');
        tournoi.participations.forEach((p, index) => {
          console.log(`      ${index + 1}. ${p.equipe?.nom || 'Équipe inconnue'} - ${p.statut}`);
        });
        
        // Compter par statut
        const valides = tournoi.participations.filter(p => p.statut === 'valide').length;
        const enAttente = tournoi.participations.filter(p => p.statut === 'en_attente').length;
        const refuses = tournoi.participations.filter(p => p.statut === 'refuse').length;
        
        console.log(`   📊 RÉSUMÉ: ${valides} validées, ${enAttente} en attente, ${refuses} refusées`);
      } else {
        console.log('   ❌ Aucune participation');
      }
      console.log('');
    }

    // 2. Vérifier s'il y a des équipes dans la base
    const equipes = await Equipe.findAll({
      include: [{
        model: User,
        as: 'capitaine',
        attributes: ['first_name', 'last_name']
      }]
    });

    console.log(`👥 ${equipes.length} équipes dans la base:`);
    equipes.forEach((equipe, index) => {
      console.log(`   ${index + 1}. ${equipe.nom} (Capitaine: ${equipe.capitaine?.first_name} ${equipe.capitaine?.last_name})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le script
if (require.main === module) {
  debugParticipations()
    .then(() => {
      console.log('\n✅ Debug terminé');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { debugParticipations };
