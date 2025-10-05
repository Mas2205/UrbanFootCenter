# 🚀 Guide de déploiement en production - Système de paiement en espèces

## 📋 **Processus complet : GitHub → Railway**

### **Étape 1 : Préparation et commit sur GitHub**

```bash
# 1. Aller dans le répertoire du projet
cd "/Users/seck/Desktop/URBAN FOOT CENTER"

# 2. Vérifier le statut Git
git status

# 3. Ajouter tous les changements
git add .

# 4. Créer un commit descriptif
git commit -m "feat: Système de paiement en espèces complet

✅ Fonctionnalités :
- Paiement espèces pour réservations
- Validation par admin terrain
- API /api/reservations/with-payment
- Interface admin complète

🔧 Corrections :
- Routes corrigées
- Modèles Payment mis à jour
- Gestion d'erreurs robuste
- Logs détaillés

📋 Migrations requises :
- ALTER TYPE payment_methods_payment_type ADD VALUE 'especes'
- ALTER TYPE enum_reservations_payment_status ADD VALUE 'pending_cash'"

# 5. Pousser vers GitHub
git push origin main
```

### **Étape 2 : Déploiement automatique Railway**

Railway détectera automatiquement les changements sur GitHub et déploiera :

1. **⏳ Attendre 2-5 minutes** pour le déploiement automatique
2. **🔍 Vérifier les logs** dans le dashboard Railway
3. **✅ Confirmer** que le déploiement est réussi

### **Étape 3 : Exécuter les migrations en production**

Dans la **console Railway** de votre service backend :

```javascript
const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connexion établie');
    
    // Ajouter "especes" 
    await client.query(`ALTER TYPE payment_methods_payment_type ADD VALUE IF NOT EXISTS 'especes';`);
    console.log('✅ Type especes ajouté');
    
    // Ajouter "pending_cash"
    await client.query(`ALTER TYPE enum_reservations_payment_status ADD VALUE IF NOT EXISTS 'pending_cash';`);
    console.log('✅ Statut pending_cash ajouté');
    
    console.log('🎉 Migrations terminées !');
  } catch (e) {
    console.log('ℹ️', e.message);
  } finally {
    await client.end();
  }
})();
```

## 🛠️ **Utilisation des scripts automatisés**

### **Option A : Script automatique complet**
```bash
chmod +x deploy-to-github-then-railway.sh
./deploy-to-github-then-railway.sh
```

### **Option B : Étapes manuelles**
1. Commit et push GitHub (voir Étape 1 ci-dessus)
2. Attendre déploiement Railway
3. Exécuter migrations (voir Étape 3 ci-dessus)

## ✅ **Vérification post-déploiement**

### **Tests à effectuer :**

1. **🌐 Accès aux URLs de production :**
   - Backend : https://urbanfootcenter-production.up.railway.app
   - Frontend : https://urban-foot-center.vercel.app

2. **🧪 Tests fonctionnels :**
   - Créer une réservation avec paiement "Espèces"
   - Vérifier que la réservation apparaît avec statut `confirmed`
   - Connecter un admin terrain et valider le paiement
   - Confirmer que le statut passe à `paid`

3. **📊 Vérifier les logs :**
   - Pas d'erreurs 500 dans Railway
   - Transactions base de données réussies
   - Emails/notifications fonctionnels

## 🚨 **En cas de problème**

### **Rollback rapide :**
```bash
# Revenir au commit précédent
git revert HEAD
git push origin main
```

### **Vérifier les logs Railway :**
1. Aller sur railway.app
2. Sélectionner votre projet
3. Onglet "Deployments" → Voir les logs

### **Tester les migrations :**
```bash
# Dans la console Railway
node -e "console.log('Test connexion DB:', !!process.env.DATABASE_URL)"
```

## 🎯 **Résultat attendu**

Après déploiement réussi :

✅ **Clients** peuvent réserver avec paiement "Espèces"
✅ **Admins terrain** peuvent valider les paiements
✅ **Workflow complet** de réservation → validation → confirmation
✅ **Interface admin** fonctionnelle pour gestion terrain
✅ **APIs** toutes opérationnelles en production

---

## 📞 **Support**

- **Logs Railway** : Dashboard → Deployments → Logs
- **Base de données** : Railway → PostgreSQL → Query
- **Frontend** : Vercel dashboard pour les logs frontend

**🎉 Une fois ces étapes terminées, le système de paiement en espèces sera 100% opérationnel en production !**
