# 🏈 Système Équipes/Tournois/Championnats

## 📋 Vue d'ensemble

Le système sportif d'Urban Foot Center permet la gestion complète des équipes, tournois et championnats avec un système de permissions granulaire.

## 🎯 Fonctionnalités

### ⚽ Équipes
- **Création et gestion** d'équipes par terrain
- **Système de capitaines** et membres
- **Contrainte unique** : 1 client = 1 équipe maximum
- **Couleurs personnalisées** et logos d'équipe

### 🏆 Tournois
- **Tournois locaux** par terrain
- **Formats multiples** : Poules + Élimination, Élimination directe, Championnat
- **Système d'inscription** avec validation admin
- **Gestion des frais** et récompenses

### 🥇 Championnats
- **Championnats nationaux** trimestriels automatiques
- **Calcul automatique** des classements
- **Système de points** : 3 victoire, 1 nul, 0 défaite
- **Classement** : points > différence buts > victoires > buts marqués

## 🔐 Permissions

| Rôle | Équipes | Tournois | Championnats |
|------|---------|----------|--------------|
| **Super Admin** | ✅ Gestion complète | ✅ Gestion complète | ✅ Gestion complète |
| **Admin Terrain** | ✅ Son terrain uniquement | ✅ Son terrain uniquement | 📖 Consultation + Saisie résultats |
| **Capitaine/Client** | 📖 Consultation + Participation | 📖 Consultation + Inscription | 📖 Consultation |
| **Employé** | 📖 Consultation | 📖 Consultation | 📖 Consultation |

## 🗄️ Structure de la base de données

### Tables principales
- `equipes` - Informations des équipes
- `membres_equipes` - Membres avec rôles (capitaine/joueur)
- `tournois` - Tournois locaux
- `participations_tournois` - Inscriptions aux tournois
- `matchs_tournois` - Matchs de tournois
- `championnats` - Championnats nationaux
- `matchs_championnats` - Matchs de championnats
- `classement_championnat` - Classements avec statistiques

### Relations clés
- Une équipe appartient à un terrain
- Un client ne peut être que dans une équipe
- Les tournois sont liés à un terrain spécifique
- Les championnats sont globaux (tous terrains)

## 🚀 Installation et configuration

### 1. Installation des dépendances
```bash
cd backend
npm install
```

### 2. Configuration de la base de données
Les modèles sont automatiquement synchronisés au démarrage du serveur.

### 3. Initialisation du planificateur
Le planificateur de championnats se lance automatiquement avec le serveur :
- Vérification quotidienne à minuit
- Création automatique des championnats trimestriels

### 4. Scripts utiles
```bash
# Tester le système
npm run test:sports

# Initialiser des données de démonstration
npm run init:sports
```

## 📡 API Endpoints

### Équipes (`/api/equipes`)
- `GET /` - Lister les équipes (avec filtres)
- `GET /:id` - Détails d'une équipe
- `POST /` - Créer une équipe (Admin+)
- `PUT /:id` - Modifier une équipe (Admin+)
- `DELETE /:id` - Supprimer une équipe (Admin+)
- `POST /:equipe_id/membres` - Ajouter un membre (Admin+)
- `DELETE /:equipe_id/membres/:membre_id` - Retirer un membre (Admin+)

### Tournois (`/api/tournois`)
- `GET /` - Lister les tournois
- `GET /:id` - Détails d'un tournoi
- `POST /` - Créer un tournoi (Admin+)
- `PUT /:id/statut` - Changer le statut (Admin+)
- `DELETE /:id` - Supprimer un tournoi (Admin+)
- `POST /:tournoi_id/participer` - S'inscrire (Capitaine)
- `PUT /participations/:id/valider` - Valider inscription (Admin+)

### Championnats (`/api/championnats`)
- `GET /actuel` - Championnat actuel avec classement
- `GET /` - Historique des championnats
- `GET /matchs` - Matchs du championnat
- `GET /statistiques` - Statistiques globales
- `POST /matchs` - Créer un match (Admin+)
- `PUT /matchs/:id/resultat` - Saisir résultat (Admin+)

## 🎨 Interface utilisateur

### Pages admin créées
1. **EquipesPage.tsx** - Gestion des équipes
2. **TournoisPage.tsx** - Gestion des tournois  
3. **ChampionnatsPage.tsx** - Gestion des championnats

### Fonctionnalités UI
- **Filtres avancés** par terrain, statut, etc.
- **Modales interactives** pour création/modification
- **Cartes visuelles** avec statistiques
- **Pagination** et recherche
- **Gestion des permissions** selon le rôle

## ⚙️ Logique métier

### Championnats automatiques
- **Cycles trimestriels** : T1 (Jan-Mar), T2 (Avr-Jun), T3 (Jul-Sep), T4 (Oct-Déc)
- **Création automatique** via cron jobs
- **Calcul temps réel** des classements après chaque match

### Système de points
- **Victoire** : 3 points
- **Match nul** : 1 point  
- **Défaite** : 0 point

### Critères de classement
1. Points totaux
2. Différence de buts
3. Nombre de victoires
4. Buts marqués

### Contraintes métier
- **Un client = une équipe** maximum
- **Validation admin** requise pour les participations tournois
- **Terrains isolés** pour les admins terrain
- **Historique complet** des matchs et statistiques

## 🔧 Maintenance

### Planificateur automatique
Le système vérifie automatiquement :
- Création des nouveaux championnats
- Mise à jour des classements
- Archivage des anciens championnats

### Monitoring
- Logs détaillés des opérations
- Gestion d'erreurs robuste
- Scripts de test intégrés

## 🚨 Dépannage

### Problèmes courants
1. **Championnat non créé** : Vérifier les logs du planificateur
2. **Permissions refusées** : Vérifier le rôle utilisateur et le terrain
3. **Équipe non trouvée** : Vérifier les associations terrain/utilisateur

### Scripts de diagnostic
```bash
# Test complet du système
npm run test:sports

# Forcer la création d'un championnat
node -e "require('./src/utils/championnatScheduler').forceCreateChampionnat()"
```

## 📈 Évolutions futures

### Fonctionnalités prévues
- **Système de notifications** pour les matchs
- **Calendrier intégré** avec les réservations
- **Statistiques avancées** par joueur
- **Système de classement** individuel
- **Integration mobile** pour les capitaines

### Optimisations techniques
- **Cache Redis** pour les classements
- **WebSockets** pour les mises à jour temps réel
- **API GraphQL** pour les requêtes complexes
- **Tests automatisés** complets

---

**Développé pour Urban Foot Center** 🏟️  
*Système complet de gestion sportive*
