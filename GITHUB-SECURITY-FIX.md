# 🔒 Correction Sécurité GitHub

## Problème
GitHub bloque le push à cause d'une clé API Stripe de test détectée.

## Solution Rapide
1. **Cliquez sur ce lien** pour autoriser le secret de test :
   https://github.com/Mas2205/UrbanFootCenter/security/secret-scanning/unblock-secret/33bu4VQV0ta1zQMRgI6nihKIZ6m

2. **Ou supprimez l'historique Git** :
   ```bash
   git reset --soft HEAD~2
   git commit -m "Add frontend and backend without secrets"
   git push --force origin main
   ```

## Recommandation
- Utilisez des variables d'environnement pour les vraies clés API
- Les clés de test peuvent être autorisées sur GitHub

## Après correction
Une fois le push réussi, le dossier `frontend` apparaîtra dans Vercel.
