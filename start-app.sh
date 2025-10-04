#!/bin/bash

# Couleurs pour le terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Affichage du titre
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════╗"
echo "║                                                    ║"
echo "║              URBAN FOOT CENTER                     ║"
echo "║              Démarrage des services                ║"
echo "║                                                    ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Vérifier si les dossiers existent
if [ ! -d "./backend" ] || [ ! -d "./frontend" ]; then
  echo -e "${RED}Erreur: Les dossiers backend et/ou frontend sont introuvables.${NC}"
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

# Fonction pour arrêter tous les services lors d'un Ctrl+C
trap_ctrlc() {
  echo -e "\n${YELLOW}Arrêt des services...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

# Configurer le trap pour Ctrl+C
trap trap_ctrlc INT

# Vérifier les dépendances
check_dependencies

# Vérifier si le fichier .env existe pour le backend
if [ ! -f "./backend/.env" ]; then
  echo -e "${YELLOW}⚠️ Fichier .env non trouvé dans le backend, création d'un fichier .env par défaut...${NC}"
  cp ./backend/.env.example ./backend/.env 2>/dev/null || echo -e "# Configuration de base" > ./backend/.env
  echo -e "${GREEN}✓ Fichier .env créé. Pensez à le configurer selon vos besoins.${NC}"
fi

# Démarrer le backend et le frontend dans des terminaux séparés
echo -e "\n${BLUE}Démarrage du backend et du frontend dans des terminaux séparés...${NC}"

# Récupérer le chemin absolu du projet
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Créer le script temporaire pour le backend
BACKEND_SCRIPT="/tmp/urban_foot_backend_$$.sh"
cat > "$BACKEND_SCRIPT" << EOF
#!/bin/bash
cd "$PROJECT_DIR/backend"
echo "Démarrage du backend sur http://localhost:5001"
echo "Appuyez sur Ctrl+C pour arrêter le serveur backend"
node src/server.js
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

# Ouvrir les terminaux séparés pour backend et frontend
echo -e "\n${BLUE}Ouverture du terminal pour le backend...${NC}"
osascript -e 'tell app "Terminal" to do script "'"$BACKEND_SCRIPT"'"'

sleep 2

echo -e "\n${BLUE}Ouverture du terminal pour le frontend...${NC}"
osascript -e 'tell app "Terminal" to do script "'"$FRONTEND_SCRIPT"'"'

# Afficher les informations d'accès
echo -e "\n${GREEN}╔═════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               SERVICES DÉMARRÉS                    ║${NC}"
echo -e "${GREEN}╠═════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}║  ${BLUE}Backend:${NC} http://localhost:5001                  ${GREEN}║${NC}"
echo -e "${GREEN}║  ${BLUE}Frontend:${NC} http://localhost:3000                 ${GREEN}║${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}║  ${YELLOW}Les services sont lancés dans des terminaux séparés ${GREEN}║${NC}"
echo -e "${GREEN}║  ${YELLOW}Pour les arrêter, fermez les fenêtres de terminal ${GREEN}║${NC}"
echo -e "${GREEN}║  ${YELLOW}ou appuyez sur Ctrl+C dans chaque terminal        ${GREEN}║${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}╚═════════════════════════════════════════════════════╝${NC}"

# Informer l'utilisateur des identifiants super admin
echo -e "\n${BLUE}Informations de connexion super admin :${NC}"
echo -e "Email: ${YELLOW}superadmin@urbanfootcenter.com${NC}"
echo -e "Mot de passe: ${YELLOW}Admin123!${NC}\n"

# Puisque les processus sont lancés dans des terminaux séparés, nous n'avons pas besoin d'attendre
echo -e "${GREEN}Script terminé. Les terminaux séparés restent actifs.${NC}"
