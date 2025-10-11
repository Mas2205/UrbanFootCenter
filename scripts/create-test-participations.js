const { Tournoi, Equipe, ParticipationTournoi, User } = require('../backend/src/models');

async function createTestParticipations() {
  try {
    console.log('🚀 Création de participations de test...');

    // Récupérer les tournois existants
    const tournois = await Tournoi.findAll({
      limit: 3,
      order: [['created_at', 'DESC']]
    });

    if (tournois.length === 0) {
      console.log('❌ Aucun tournoi trouvé. Créez d\'abord des tournois.');
      return;
    }

    // Récupérer les équipes existantes
    const equipes = await Equipe.findAll({
      limit: 10
    });

    if (equipes.length === 0) {
      console.log('❌ Aucune équipe trouvée. Créez d\'abord des équipes.');
      return;
    }

    // Récupérer un utilisateur pour les demandes
    const user = await User.findOne({
      where: { role: 'client' }
    });

    if (!user) {
      console.log('❌ Aucun utilisateur client trouvé.');
      return;
    }

    console.log(`📊 Trouvé ${tournois.length} tournois et ${equipes.length} équipes`);

    let participationsCreated = 0;

    // Pour chaque tournoi, créer quelques participations
    for (const tournoi of tournois) {
      console.log(`\n🏆 Tournoi: ${tournoi.nom}`);
      
      // Prendre les 4 premières équipes pour ce tournoi
      const equipesTournoi = equipes.slice(0, Math.min(4, equipes.length));
      
      for (let i = 0; i < equipesTournoi.length; i++) {
        const equipe = equipesTournoi[i];
        
        // Vérifier si la participation existe déjà
        const existingParticipation = await ParticipationTournoi.findOne({
          where: {
            tournoi_id: tournoi.id,
            equipe_id: equipe.id
          }
        });

        if (existingParticipation) {
          console.log(`   ⚠️  Participation déjà existante pour ${equipe.nom}`);
          continue;
        }

        // Créer la participation
        // Les 2 premières sont validées, les autres en attente
        const statut = i < 2 ? 'valide' : 'en_attente';
        
        const participation = await ParticipationTournoi.create({
          tournoi_id: tournoi.id,
          equipe_id: equipe.id,
          requested_by: user.id,
          statut: statut,
          date_inscription: new Date(),
          points_poule: 0,
          victoires_poule: 0,
          nuls_poule: 0,
          defaites_poule: 0,
          buts_pour_poule: 0,
          buts_contre_poule: 0
        });

        console.log(`   ✅ ${equipe.nom} - ${statut}`);
        participationsCreated++;
      }
    }

    console.log(`\n🎉 ${participationsCreated} participations créées avec succès !`);
    
    // Afficher un résumé
    const totalParticipations = await ParticipationTournoi.count();
    const participationsEnAttente = await ParticipationTournoi.count({
      where: { statut: 'en_attente' }
    });
    const participationsValidees = await ParticipationTournoi.count({
      where: { statut: 'valide' }
    });

    console.log('\n📈 Résumé des participations:');
    console.log(`   Total: ${totalParticipations}`);
    console.log(`   Validées: ${participationsValidees}`);
    console.log(`   En attente: ${participationsEnAttente}`);

  } catch (error) {
    console.error('❌ Erreur lors de la création des participations:', error);
  }
}

// Exécuter le script
createTestParticipations()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
