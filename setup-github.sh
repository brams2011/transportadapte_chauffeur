#!/bin/bash

# Script d'initialisation GitHub pour Transport Adapté Dashboard
# Usage: ./setup-github.sh

echo "🚀 Setup GitHub - Transport Adapté Dashboard"
echo "============================================="
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si Git est installé
if ! command -v git &> /dev/null
then
    echo -e "${RED}❌ Git n'est pas installé!${NC}"
    echo "Installer Git: https://git-scm.com/downloads"
    exit 1
fi

echo -e "${GREEN}✅ Git est installé ($(git --version))${NC}"
echo ""

# Demander le username GitHub
echo -e "${YELLOW}📝 Configuration GitHub${NC}"
read -p "Ton username GitHub: " github_username

if [ -z "$github_username" ]
then
    echo -e "${RED}❌ Username GitHub requis!${NC}"
    exit 1
fi

# Vérifier si Git est déjà initialisé
if [ -d .git ]; then
    echo -e "${YELLOW}⚠️  Git déjà initialisé dans ce dossier${NC}"
    read -p "Veux-tu continuer quand même? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        echo "Annulé."
        exit 0
    fi
else
    echo -e "${GREEN}✅ Initialisation Git...${NC}"
    git init
fi

# Configurer Git si pas déjà fait
git_name=$(git config --global user.name)
git_email=$(git config --global user.email)

if [ -z "$git_name" ]; then
    read -p "Ton nom complet: " user_name
    git config --global user.name "$user_name"
fi

if [ -z "$git_email" ]; then
    read -p "Ton email: " user_email
    git config --global user.email "$user_email"
fi

echo -e "${GREEN}✅ Configuration Git complète${NC}"
echo ""

# Vérifier que .env.local n'existe pas dans le repo
if [ -f .env.local ]; then
    echo -e "${YELLOW}⚠️  Attention: .env.local détecté${NC}"
    echo "Ce fichier ne sera PAS committé (déjà dans .gitignore)"
fi

# Ajouter tous les fichiers
echo -e "${GREEN}📦 Ajout des fichiers...${NC}"
git add .

# Vérifier qu'il y a des fichiers à commiter
if git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  Aucun changement à commiter${NC}"
    exit 0
fi

# Afficher les fichiers qui seront commitées
echo ""
echo -e "${YELLOW}📋 Fichiers qui seront commitées:${NC}"
git status --short
echo ""

read -p "Continuer? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Annulé."
    exit 0
fi

# Premier commit
echo -e "${GREEN}💾 Création du commit initial...${NC}"
git commit -m "Initial commit: Dashboard IA Transport Adapté complet

- Frontend Next.js 14 avec TypeScript
- Backend API Routes complètes
- Intégration Claude AI pour classification factures
- Dashboard avec graphiques Recharts
- Service OCR avec Tesseract.js
- Workflows Make.com automatisation
- Documentation complète (README, guides, questionnaire)
- Configuration Supabase incluse"

# Renommer branche en main
echo -e "${GREEN}🌿 Configuration branche main...${NC}"
git branch -M main

# Ajouter le remote
repo_url="https://github.com/$github_username/transport-adapte-dashboard.git"
echo -e "${GREEN}🔗 Ajout du remote GitHub...${NC}"
echo "URL: $repo_url"

# Vérifier si remote existe déjà
if git remote | grep -q "^origin$"; then
    echo -e "${YELLOW}⚠️  Remote 'origin' existe déjà${NC}"
    git remote set-url origin "$repo_url"
else
    git remote add origin "$repo_url"
fi

echo ""
echo -e "${GREEN}✅ Configuration terminée!${NC}"
echo ""
echo "================================================"
echo -e "${YELLOW}📋 PROCHAINES ÉTAPES:${NC}"
echo "================================================"
echo ""
echo "1. Va sur GitHub.com et crée un nouveau dépôt:"
echo "   Nom: transport-adapte-dashboard"
echo "   Type: Private (recommandé)"
echo "   NE PAS ajouter README, .gitignore ou LICENSE"
echo ""
echo "2. Une fois le dépôt créé, exécute:"
echo -e "   ${GREEN}git push -u origin main${NC}"
echo ""
echo "3. GitHub va demander authentification:"
echo "   - Username: $github_username"
echo "   - Password: Utilise un Personal Access Token"
echo "     (Créer sur: github.com/settings/tokens)"
echo ""
echo "4. Vérifie sur GitHub que tout est bien uploadé!"
echo ""
echo "================================================"
echo ""
echo -e "${GREEN}🎉 Prêt à pusher!${NC}"
echo ""

# Demander si on veut pusher maintenant
read -p "Veux-tu pusher maintenant? (y/n): " push_now

if [ "$push_now" == "y" ]; then
    echo ""
    echo -e "${GREEN}🚀 Push vers GitHub...${NC}"
    echo ""
    
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Success! Ton code est sur GitHub!${NC}"
        echo ""
        echo "Lien du dépôt: https://github.com/$github_username/transport-adapte-dashboard"
        echo ""
    else
        echo ""
        echo -e "${RED}❌ Erreur lors du push${NC}"
        echo ""
        echo "Vérifie que:"
        echo "1. Le dépôt existe sur GitHub"
        echo "2. Tu as les bonnes permissions"
        echo "3. Ton Personal Access Token est valide"
        echo ""
        echo "Puis réessaye: git push -u origin main"
    fi
else
    echo ""
    echo "D'accord! Lance manuellement quand prêt:"
    echo -e "${GREEN}git push -u origin main${NC}"
fi

echo ""
echo -e "${GREEN}🎊 Script terminé!${NC}"
