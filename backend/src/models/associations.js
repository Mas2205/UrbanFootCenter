const setupAssociations = (db) => {
  // Debug: vérifier quels modèles sont disponibles
  console.log('🔍 Modèles disponibles dans db:', Object.keys(db));
  
  // Récupération des modèles depuis l'objet db
  const { 
    User, 
    Field, 
    Equipe, 
    MembreEquipe, 
    DemandeEquipe,
    Tournoi, 
    ParticipationTournoi, 
    MatchTournoi, 
    Championnat, 
    MatchChampionnat, 
    ClassementChampionnat 
  } = db;
  
  // Vérifier si les modèles sportifs sont présents
  if (!Equipe) {
    console.log('❌ Modèle Equipe non trouvé dans db');
    return;
  }
  
  console.log('✅ Tous les modèles sportifs chargés, configuration des associations...');
  // ===== ASSOCIATIONS ÉQUIPES =====
  
  // Équipe appartient à un terrain
  Equipe.belongsTo(Field, { 
    foreignKey: 'terrain_id', 
    as: 'terrain' 
  });
  Field.hasMany(Equipe, { 
    foreignKey: 'terrain_id', 
    as: 'equipes' 
  });

  // Équipe a un capitaine
  Equipe.belongsTo(User, { 
    foreignKey: 'capitaine_id', 
    as: 'capitaine' 
  });
  User.hasMany(Equipe, { 
    foreignKey: 'capitaine_id', 
    as: 'equipes_capitaine' 
  });

  // Équipe créée par un admin
  Equipe.belongsTo(User, { 
    foreignKey: 'created_by', 
    as: 'createur' 
  });
  User.hasMany(Equipe, { 
    foreignKey: 'created_by', 
    as: 'equipes_creees' 
  });

  // ===== ASSOCIATIONS MEMBRES ÉQUIPES =====
  
  // Membre appartient à une équipe
  MembreEquipe.belongsTo(Equipe, { 
    foreignKey: 'equipe_id', 
    as: 'equipe' 
  });
  Equipe.hasMany(MembreEquipe, { 
    foreignKey: 'equipe_id', 
    as: 'membres' 
  });

  // Membre est un utilisateur
  MembreEquipe.belongsTo(User, { 
    foreignKey: 'user_id', 
    as: 'joueur' 
  });
  User.hasOne(MembreEquipe, { 
    foreignKey: 'user_id', 
    as: 'equipe_membre' 
  });

  // Membre ajouté par un admin
  MembreEquipe.belongsTo(User, { 
    foreignKey: 'added_by', 
    as: 'ajouteur' 
  });

  // ===== ASSOCIATIONS DEMANDES ÉQUIPES =====
  
  if (DemandeEquipe) {
    // Demande appartient à un utilisateur
    DemandeEquipe.belongsTo(User, { 
      foreignKey: 'user_id', 
      as: 'user' 
    });
    User.hasMany(DemandeEquipe, { 
      foreignKey: 'user_id', 
      as: 'demandes_equipes' 
    });

    // Demande appartient à un terrain
    DemandeEquipe.belongsTo(Field, { 
      foreignKey: 'terrain_id', 
      as: 'terrain' 
    });
    Field.hasMany(DemandeEquipe, { 
      foreignKey: 'terrain_id', 
      as: 'demandes_equipes' 
    });

    // Demande validée par un admin
    DemandeEquipe.belongsTo(User, { 
      foreignKey: 'validated_by', 
      as: 'validateur' 
    });
    User.hasMany(DemandeEquipe, { 
      foreignKey: 'validated_by', 
      as: 'demandes_validees' 
    });
  }

  // ===== ASSOCIATIONS TOURNOIS =====
  
  // Tournoi appartient à un terrain
  Tournoi.belongsTo(Field, { 
    foreignKey: 'terrain_id', 
    as: 'terrain' 
  });
  Field.hasMany(Tournoi, { 
    foreignKey: 'terrain_id', 
    as: 'tournois' 
  });

  // Tournoi créé par un admin
  Tournoi.belongsTo(User, { 
    foreignKey: 'created_by', 
    as: 'createur' 
  });
  User.hasMany(Tournoi, { 
    foreignKey: 'created_by', 
    as: 'tournois_crees' 
  });

  // ===== ASSOCIATIONS PARTICIPATIONS TOURNOIS =====
  
  // Participation appartient à un tournoi
  ParticipationTournoi.belongsTo(Tournoi, { 
    foreignKey: 'tournoi_id', 
    as: 'tournoi' 
  });
  Tournoi.hasMany(ParticipationTournoi, { 
    foreignKey: 'tournoi_id', 
    as: 'participations' 
  });

  // Participation appartient à une équipe
  ParticipationTournoi.belongsTo(Equipe, { 
    foreignKey: 'equipe_id', 
    as: 'equipe' 
  });
  Equipe.hasMany(ParticipationTournoi, { 
    foreignKey: 'equipe_id', 
    as: 'participations_tournois' 
  });

  // Participation demandée par un capitaine
  ParticipationTournoi.belongsTo(User, { 
    foreignKey: 'requested_by', 
    as: 'demandeur' 
  });

  // Participation validée par un admin
  ParticipationTournoi.belongsTo(User, { 
    foreignKey: 'validated_by', 
    as: 'validateur' 
  });

  // ===== ASSOCIATIONS MATCHS TOURNOIS =====
  
  // Match appartient à un tournoi
  MatchTournoi.belongsTo(Tournoi, { 
    foreignKey: 'tournoi_id', 
    as: 'tournoi' 
  });
  Tournoi.hasMany(MatchTournoi, { 
    foreignKey: 'tournoi_id', 
    as: 'matchs' 
  });

  // Match entre deux équipes
  MatchTournoi.belongsTo(Equipe, { 
    foreignKey: 'equipe1_id', 
    as: 'equipe1' 
  });
  MatchTournoi.belongsTo(Equipe, { 
    foreignKey: 'equipe2_id', 
    as: 'equipe2' 
  });
  MatchTournoi.belongsTo(Equipe, { 
    foreignKey: 'winner_id', 
    as: 'vainqueur' 
  });

  // Match sur un terrain
  MatchTournoi.belongsTo(Field, { 
    foreignKey: 'terrain_id', 
    as: 'terrain' 
  });

  // Match créé/modifié par un admin
  MatchTournoi.belongsTo(User, { 
    foreignKey: 'created_by', 
    as: 'createur' 
  });
  MatchTournoi.belongsTo(User, { 
    foreignKey: 'updated_by', 
    as: 'modificateur' 
  });

  // ===== ASSOCIATIONS CHAMPIONNATS =====
  
  // Championnat a des matchs
  Championnat.hasMany(MatchChampionnat, { 
    foreignKey: 'championnat_id', 
    as: 'matchs' 
  });
  MatchChampionnat.belongsTo(Championnat, { 
    foreignKey: 'championnat_id', 
    as: 'championnat' 
  });

  // Championnat a un classement
  Championnat.hasMany(ClassementChampionnat, { 
    foreignKey: 'championnat_id', 
    as: 'classement' 
  });
  ClassementChampionnat.belongsTo(Championnat, { 
    foreignKey: 'championnat_id', 
    as: 'championnat' 
  });

  // ===== ASSOCIATIONS MATCHS CHAMPIONNATS =====
  
  // Match entre deux équipes
  MatchChampionnat.belongsTo(Equipe, { 
    foreignKey: 'equipe1_id', 
    as: 'equipe1' 
  });
  MatchChampionnat.belongsTo(Equipe, { 
    foreignKey: 'equipe2_id', 
    as: 'equipe2' 
  });

  // Match sur un terrain
  MatchChampionnat.belongsTo(Field, { 
    foreignKey: 'terrain_id', 
    as: 'terrain' 
  });

  // Match créé/modifié par un admin
  MatchChampionnat.belongsTo(User, { 
    foreignKey: 'created_by', 
    as: 'createur' 
  });
  MatchChampionnat.belongsTo(User, { 
    foreignKey: 'updated_by', 
    as: 'modificateur' 
  });

  // ===== ASSOCIATIONS CLASSEMENT CHAMPIONNATS =====
  
  // Classement appartient à une équipe
  ClassementChampionnat.belongsTo(Equipe, { 
    foreignKey: 'equipe_id', 
    as: 'equipe' 
  });
  Equipe.hasMany(ClassementChampionnat, { 
    foreignKey: 'equipe_id', 
    as: 'classements' 
  });

  console.log('✅ Associations des modèles équipes/tournois/championnats configurées');
};

module.exports = setupAssociations;
