const cron = require('node-cron');

class ChampionnatScheduler {
  static init() {
    // Vérifier et créer un championnat au démarrage du serveur
    this.checkAndCreateChampionnat();

    // Programmer la vérification tous les jours à minuit
    cron.schedule('0 0 * * *', () => {
      console.log('🔄 Vérification automatique des championnats...');
      this.checkAndCreateChampionnat();
    });

    // Programmer la vérification le 1er de chaque mois à 00:01
    cron.schedule('1 0 1 * *', () => {
      console.log('📅 Vérification mensuelle des championnats...');
      this.checkAndCreateChampionnat();
    });

    console.log('⏰ Planificateur de championnats initialisé');
  }

  static async checkAndCreateChampionnat() {
    try {
      // Import dynamique pour éviter les problèmes de dépendances circulaires
      const championnatController = require('../controllers/championnat.controller');
      const championnat = await championnatController.constructor.creerChampionnatAutomatique();
      
      if (championnat) {
        console.log(`✅ Championnat vérifié/créé: ${championnat.nom}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du championnat:', error);
    }
  }

  // Méthode pour forcer la création d'un championnat (utile pour les tests)
  static async forceCreateChampionnat() {
    try {
      const championnatController = require('../controllers/championnat.controller');
      const championnat = await championnatController.constructor.creerChampionnatAutomatique();
      console.log(`🔧 Championnat forcé: ${championnat.nom}`);
      return championnat;
    } catch (error) {
      console.error('❌ Erreur lors de la création forcée:', error);
      throw error;
    }
  }

  // Méthode pour obtenir les informations du championnat actuel
  static async getCurrentChampionnatInfo() {
    try {
      const maintenant = new Date();
      const annee = maintenant.getFullYear();
      const mois = maintenant.getMonth() + 1;

      let trimestre;
      if (mois >= 1 && mois <= 3) trimestre = 'T1';
      else if (mois >= 4 && mois <= 6) trimestre = 'T2';
      else if (mois >= 7 && mois <= 9) trimestre = 'T3';
      else trimestre = 'T4';

      return {
        annee,
        trimestre,
        saison: `${annee}-${annee + 1}`,
        nom: `Championnat National ${trimestre} ${annee}`
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des infos:', error);
      throw error;
    }
  }
}

module.exports = ChampionnatScheduler;
