const { sequelize } = require('./src/config/database');
const { Tournoi, User, Field } = require('./src/models');

async function createTestTournoi() {
  try {
    console.log('🚀 Création d\'un tournoi de test...');
    
    // Vérifier la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');
    
    // Récupérer un terrain existant
    const terrain = await Field.findOne();
    if (!terrain) {
      console.log('❌ Aucun terrain trouvé');
      return;
    }
    console.log('✅ Terrain trouvé:', terrain.name);
    
    // Récupérer un utilisateur admin pour être créateur
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      console.log('❌ Aucun admin trouvé');
      return;
    }
    console.log('✅ Admin trouvé:', admin.first_name, admin.last_name);
    
    // Créer le tournoi de test
    const tournoi = await Tournoi.create({
      nom: 'Tournoi Test 2025',
      description: 'Tournoi créé pour tester l\'API',
      terrain_id: terrain.id,
      date_debut: new Date('2025-01-15'),
      date_fin: new Date('2025-01-16'),
      date_limite_inscription: new Date('2025-01-10'),
      frais_inscription: 50000,
      recompense: 'Trophée + 200 000 FCFA',
      prix_total: 200000,
      format: 'elimination_directe',
      nombre_max_equipes: 16,
      regles: 'Règles FIFA standard',
      created_by: admin.id,
      statut: 'ouvert'
    });
    
    console.log('✅ Tournoi créé avec succès:', tournoi.nom);
    console.log('📋 ID tournoi:', tournoi.id);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
  }
}

createTestTournoi();
