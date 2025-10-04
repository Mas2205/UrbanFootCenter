#!/bin/bash

# Couleurs pour le terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Affichage du titre
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════╗"
echo "║                                                    ║"
echo "║              URBAN FOOT CENTER                     ║"
echo "║         Démarrage complet (Web + Mobile)           ║"
echo "║                                                    ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Vérifier si les dossiers existent
if [ ! -d "./backend" ] || [ ! -d "./frontend" ] || [ ! -d "./UrbanFootCenterMobile" ]; then
  echo -e "${RED}Erreur: Les dossiers backend, frontend et/ou UrbanFootCenterMobile sont introuvables.${NC}"
  echo "Ce script doit être exécuté depuis le répertoire racine du projet URBAN FOOT CENTER."
  exit 1
fi

# Fonction pour vérifier la présence des dépendances
check_dependencies() {
  echo -e "${YELLOW}Vérification des dépendances...${NC}"
  
  if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}Node.js n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
  fi
  
  if ! command -v npm >/dev/null 2>&1; then
    echo -e "${RED}npm n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
  fi
  
  if ! command -v pg_isready >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ PostgreSQL CLI n'est pas disponible. Impossible de vérifier l'état de PostgreSQL.${NC}"
  else
    echo -e "${YELLOW}Vérification de PostgreSQL...${NC}"
    if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
      echo -e "${RED}⚠️ PostgreSQL n'est pas démarré. Le backend pourrait ne pas fonctionner correctement.${NC}"
      echo -e "${YELLOW}Tentative de démarrage de PostgreSQL...${NC}"
      
      if command -v brew >/dev/null 2>&1; then
        brew services start postgresql 2>/dev/null || echo -e "${RED}Échec du démarrage via Homebrew${NC}"
      else
        pg_ctl -D /usr/local/var/postgres start 2>/dev/null || echo -e "${RED}Échec du démarrage via pg_ctl${NC}"
      fi
      
      # Vérifier à nouveau
      sleep 2
      if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL démarré avec succès.${NC}"
      else
        echo -e "${RED}⚠️ Impossible de démarrer PostgreSQL. Le backend pourrait ne pas fonctionner correctement.${NC}"
        echo -e "${YELLOW}Vous pouvez continuer ou annuler avec Ctrl+C et démarrer PostgreSQL manuellement.${NC}"
        sleep 3
      fi
    else
      echo -e "${GREEN}✓ PostgreSQL est en cours d'exécution.${NC}"
    fi
  fi
  
  echo -e "${GREEN}✓ Toutes les dépendances requises sont installées.${NC}"
}

# Vérifier les dépendances
check_dependencies

# Vérifier si le fichier .env existe pour le backend
if [ ! -f "./backend/.env" ]; then
  echo -e "${YELLOW}⚠️ Fichier .env non trouvé dans le backend, création d'un fichier .env par défaut...${NC}"
  cp ./backend/.env.example ./backend/.env 2>/dev/null || echo -e "# Configuration de base" > ./backend/.env
  echo -e "${GREEN}✓ Fichier .env créé. Pensez à le configurer selon vos besoins.${NC}"
  echo -e "${RED}🔐 IMPORTANT: Pour la production, générez des clés sécurisées avec:${NC}"
  echo -e "${YELLOW}   node scripts/generate-secure-keys.js --save${NC}"
fi

# Vérifier la sécurité du fichier .env
if [ -f "./backend/.env" ]; then
  if grep -q "JWT_SECRET=urban-foot-center-jwt-secret-key" ./backend/.env 2>/dev/null; then
    echo -e "${RED}⚠️ SÉCURITÉ: JWT_SECRET utilise la valeur par défaut!${NC}"
    echo -e "${YELLOW}   Générez des clés sécurisées avant le déploiement.${NC}"
  fi
  
  if grep -q "NODE_ENV=development" ./backend/.env 2>/dev/null; then
    echo -e "${GREEN}✓ Mode développement détecté.${NC}"
  fi
fi

# Démarrer les services dans des terminaux séparés
echo -e "\n${BLUE}Démarrage des services dans des terminaux séparés...${NC}"

# Récupérer le chemin absolu du projet
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Créer le script temporaire pour le backend
BACKEND_SCRIPT="/tmp/urban_foot_backend_$$.sh"
cat > "$BACKEND_SCRIPT" << EOF
#!/bin/bash
cd "$PROJECT_DIR/backend"
echo "Démarrage du backend sécurisé sur http://localhost:5001"
echo "Middlewares de sécurité activés:"
echo "  • Rate limiting: 100 req/15min (général), 5 req/15min (auth)"
echo "  • CORS configuré pour développement"
echo "  • Headers de sécurité Helmet"
echo "  • Sanitisation des entrées"
echo "Appuyez sur Ctrl+C pour arrêter le serveur backend"
npm start
EOF
chmod +x "$BACKEND_SCRIPT"

# Créer le script temporaire pour le frontend
FRONTEND_SCRIPT="/tmp/urban_foot_frontend_$$.sh"
cat > "$FRONTEND_SCRIPT" << EOF
#!/bin/bash
cd "$PROJECT_DIR/frontend"
echo "Démarrage du frontend sur http://localhost:3000"
echo "Appuyez sur Ctrl+C pour arrêter le serveur frontend"
npm start
EOF
chmod +x "$FRONTEND_SCRIPT"

# Créer le script temporaire pour l'application mobile
MOBILE_SCRIPT="/tmp/urban_foot_mobile_$$.sh"
cat > "$MOBILE_SCRIPT" << EOF
#!/bin/bash
cd "$PROJECT_DIR/UrbanFootCenterMobile"
echo "Démarrage de l'application mobile Expo (mode offline)"
echo "Scannez le QR code avec Expo Go sur votre téléphone"
echo "Appuyez sur Ctrl+C pour arrêter le serveur mobile"
npx expo start --offline
EOF
chmod +x "$MOBILE_SCRIPT"

# Ouvrir les terminaux séparés
echo -e "\n${BLUE}Ouverture du terminal pour le backend...${NC}"
osascript -e 'tell app "Terminal" to do script "'"$BACKEND_SCRIPT"'"'

sleep 2

echo -e "\n${BLUE}Ouverture du terminal pour le frontend...${NC}"
osascript -e 'tell app "Terminal" to do script "'"$FRONTEND_SCRIPT"'"'

sleep 2

echo -e "\n${PURPLE}Ouverture du terminal pour l'application mobile...${NC}"
osascript -e 'tell app "Terminal" to do script "'"$MOBILE_SCRIPT"'"'

# Afficher les informations d'accès
echo -e "\n${GREEN}╔═════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               SERVICES DÉMARRÉS                    ║${NC}"
echo -e "${GREEN}╠═════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}║  ${BLUE}Backend:${NC} http://localhost:5001 🔒 SÉCURISÉ      ${GREEN}║${NC}"
echo -e "${GREEN}║  ${BLUE}Frontend:${NC} http://localhost:3000                 ${GREEN}║${NC}"
echo -e "${GREEN}║  ${PURPLE}Mobile:${NC} Scannez le QR code Expo               ${GREEN}║${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}║  ${YELLOW}🛡️  Sécurité activée:                            ${GREEN}║${NC}"
echo -e "${GREEN}║  ${YELLOW}   • Rate limiting par endpoint                  ${GREEN}║${NC}"
echo -e "${GREEN}║  ${YELLOW}   • CORS configuré                             ${GREEN}║${NC}"
echo -e "${GREEN}║  ${YELLOW}   • Headers de sécurité                        ${GREEN}║${NC}"
echo -e "${GREEN}║  ${YELLOW}   • Sanitisation des entrées                   ${GREEN}║${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}║  ${YELLOW}Pour arrêter: fermez les terminaux ou Ctrl+C    ${GREEN}║${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}╚═════════════════════════════════════════════════════╝${NC}"

# Informer l'utilisateur des identifiants super admin
echo -e "\n${BLUE}Informations de connexion super admin :${NC}"
echo -e "Email: ${YELLOW}superadmin@urbanfootcenter.com${NC}"
echo -e "Mot de passe: ${YELLOW}Admin123!${NC}"

echo -e "\n${PURPLE}📱 Pour tester l'application mobile :${NC}"
echo -e "1. Installez ${YELLOW}Expo Go${NC} sur votre téléphone"
echo -e "2. Scannez le QR code affiché dans le terminal mobile"
echo -e "3. L'application se chargera automatiquement"

echo -e "\n${GREEN}Script terminé. Les terminaux séparés restent actifs.${NC}"
