# 🚀 GUIDE COMPLET - METTRE LE PROJET SUR GITHUB

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Créer le dépôt GitHub](#créer-le-dépôt-github)
3. [Initialiser Git localement](#initialiser-git-localement)
4. [Pusher le code](#pusher-le-code)
5. [Configuration avancée](#configuration-avancée)
6. [Bonnes pratiques](#bonnes-pratiques)

---

## ✅ Prérequis

### 1. Installer Git
```bash
# Vérifier si Git est installé
git --version

# Si pas installé:
# Mac: brew install git
# Windows: https://git-scm.com/download/win
# Linux: sudo apt-get install git
```

### 2. Configurer Git (première fois seulement)
```bash
git config --global user.name "Ton Nom"
git config --global user.email "ton-email@example.com"
```

### 3. Avoir un compte GitHub
- Aller sur https://github.com
- Créer un compte si tu n'en as pas
- Se connecter

---

## 📦 Créer le dépôt GitHub

### Option A: Via l'interface GitHub (Recommandé)

1. **Aller sur GitHub.com et se connecter**

2. **Cliquer sur le "+" en haut à droite → "New repository"**

3. **Remplir les informations:**
   - **Repository name:** `transport-adapte-dashboard`
   - **Description:** `Dashboard IA pour gestion financière - Transport adapté Québec`
   - **Visibilité:** 
     - ✅ **Private** (Recommandé - code privé)
     - ⚠️ Public (visible par tout le monde)
   
4. **NE PAS cocher:**
   - ❌ Add a README file (on a déjà le nôtre)
   - ❌ Add .gitignore (on a déjà le nôtre)
   - ❌ Choose a license (on a déjà le nôtre)

5. **Cliquer "Create repository"**

6. **GitHub va te montrer des commandes** → Les ignorer pour l'instant

---

## 🔧 Initialiser Git localement

### 1. Ouvrir le terminal dans le dossier du projet

```bash
# Aller dans le dossier du projet
cd chemin/vers/transport-adapte-dashboard

# Vérifier qu'on est au bon endroit (doit afficher les fichiers du projet)
ls
```

### 2. Initialiser Git

```bash
# Initialiser le dépôt Git
git init

# Vérifier que .git a été créé
ls -la
```

### 3. Ajouter tous les fichiers

```bash
# Ajouter tous les fichiers au staging
git add .

# Vérifier les fichiers ajoutés
git status
```

Tu devrais voir tous tes fichiers en vert (prêts à être commités).

### 4. Faire le premier commit

```bash
git commit -m "Initial commit: Dashboard IA Transport Adapté complet"
```

---

## 🚀 Pusher le code sur GitHub

### 1. Lier ton dépôt local à GitHub

Remplace `TON-USERNAME` par ton nom d'utilisateur GitHub:

```bash
git remote add origin https://github.com/TON-USERNAME/transport-adapte-dashboard.git

# Vérifier que c'est bien configuré
git remote -v
```

### 2. Renommer la branche principale (si nécessaire)

```bash
# GitHub utilise "main" maintenant au lieu de "master"
git branch -M main
```

### 3. Pusher le code

```bash
# Première fois (avec -u pour définir l'upstream)
git push -u origin main
```

**GitHub va te demander de t'authentifier:**
- Entre ton username GitHub
- Pour le mot de passe, utilise un **Personal Access Token** (PAT)

### 4. Créer un Personal Access Token (si demandé)

Si GitHub refuse ton mot de passe:

1. Aller sur GitHub.com → Settings (en haut à droite)
2. Developer settings (en bas à gauche)
3. Personal access tokens → Tokens (classic)
4. Generate new token (classic)
5. Donner un nom: "Transport Dashboard"
6. Cocher: `repo` (Full control of private repositories)
7. Generate token
8. **COPIER LE TOKEN** (tu ne le reverras plus!)
9. Utiliser ce token comme mot de passe dans le terminal

---

## ✅ Vérification

### Vérifier que ça a marché

1. **Aller sur GitHub.com**
2. **Rafraîchir la page de ton dépôt**
3. **Tu devrais voir tous tes fichiers!**

---

## 🔐 Sécurité - IMPORTANT!

### Vérifier que les fichiers sensibles ne sont PAS sur GitHub

```bash
# Vérifier que .env.local n'est PAS inclus
git ls-files | grep .env
```

Si ça retourne quelque chose → **DANGER!**

### Si tu as accidentellement commité .env.local:

```bash
# Retirer du tracking
git rm --cached .env.local

# Commit le changement
git commit -m "Remove .env.local from tracking"

# Push
git push
```

---

## 📝 Workflow Git quotidien

### Après avoir fait des modifications:

```bash
# 1. Vérifier les changements
git status

# 2. Ajouter les fichiers modifiés
git add .

# 3. Commit avec un message descriptif
git commit -m "Ajout feature scan factures automatique"

# 4. Push sur GitHub
git push
```

### Messages de commit recommandés:

```bash
git commit -m "feat: Ajout dashboard avec graphiques"
git commit -m "fix: Correction bug classification factures"
git commit -m "docs: Mise à jour README installation"
git commit -m "refactor: Optimisation service Claude API"
git commit -m "style: Amélioration design mobile"
```

---

## 🌿 Branches (optionnel mais recommandé)

### Créer une branche pour développer une feature:

```bash
# Créer et basculer sur nouvelle branche
git checkout -b feature/chatbot-whatsapp

# Faire tes modifications...

# Commit
git add .
git commit -m "feat: Ajout chatbot WhatsApp"

# Push la branche
git push -u origin feature/chatbot-whatsapp
```

### Merger dans main:

```bash
# Retour sur main
git checkout main

# Merger la feature
git merge feature/chatbot-whatsapp

# Push
git push
```

---

## 🤝 Collaborer avec d'autres développeurs

### Inviter des collaborateurs:

1. Sur GitHub → Settings (du repo)
2. Collaborators → Add people
3. Entrer leur username GitHub
4. Ils recevront une invitation

### Cloner le projet (pour un collaborateur):

```bash
git clone https://github.com/TON-USERNAME/transport-adapte-dashboard.git
cd transport-adapte-dashboard
npm install
```

---

## 🔄 Garder ton code à jour

### Récupérer les derniers changements:

```bash
# Récupérer les changements sans merger
git fetch

# Récupérer ET merger
git pull
```

---

## 📊 Organiser ton dépôt GitHub

### 1. Ajouter des Topics (tags)

Sur GitHub → About (roue dentée) → Topics:
- `nextjs`
- `typescript`
- `ai`
- `claude`
- `supabase`
- `transport`
- `quebec`
- `saas`
- `fintech`

### 2. Activer GitHub Issues

Settings → Features → Issues ✅

### 3. Créer un README.md attractif

Le README.md actuel est déjà excellent! GitHub va l'afficher automatiquement.

### 4. Ajouter des badges (optionnel)

Ajouter en haut du README.md:

```markdown
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-MIT-green)
```

---

## 🚨 Troubleshooting

### Problème: "Permission denied"
**Solution:** Vérifier ton Personal Access Token

### Problème: "Repository not found"
**Solution:** Vérifier l'URL du remote
```bash
git remote -v
git remote set-url origin https://github.com/TON-USERNAME/transport-adapte-dashboard.git
```

### Problème: "Merge conflict"
**Solution:**
```bash
git status  # Voir les fichiers en conflit
# Éditer les fichiers et résoudre manuellement
git add .
git commit -m "Résolution conflits"
git push
```

### Problème: "Large files" (>100MB)
**Solution:** Utiliser Git LFS
```bash
git lfs install
git lfs track "*.large-file"
```

---

## 📱 GitHub Desktop (Alternative GUI)

Si tu préfères une interface graphique:

1. **Télécharger GitHub Desktop:** https://desktop.github.com
2. **Se connecter avec son compte GitHub**
3. **File → Add Local Repository**
4. **Sélectionner le dossier du projet**
5. **Publish repository**

C'est plus visuel et plus simple pour débuter!

---

## 🎯 Checklist finale

Avant de considérer que c'est terminé:

- [ ] Dépôt créé sur GitHub
- [ ] Code poussé sur GitHub
- [ ] README.md s'affiche correctement
- [ ] .env.local n'est PAS visible (dans .gitignore)
- [ ] LICENSE présent
- [ ] Topics ajoutés
- [ ] Description du repo remplie

---

## 🔗 Liens utiles

- **Documentation Git:** https://git-scm.com/doc
- **GitHub Guides:** https://guides.github.com
- **GitHub Desktop:** https://desktop.github.com
- **Git Cheat Sheet:** https://education.github.com/git-cheat-sheet-education.pdf

---

## 💡 Commandes Git essentielles

```bash
# État du repo
git status

# Voir l'historique
git log --oneline

# Voir les différences
git diff

# Annuler modifications non commitées
git checkout -- fichier.ts

# Revenir au commit précédent
git reset --soft HEAD~1

# Voir les branches
git branch

# Supprimer une branche
git branch -d nom-branche

# Changer de branche
git checkout nom-branche

# Créer et changer de branche
git checkout -b nouvelle-branche
```

---

## 🎉 Félicitations!

Ton projet est maintenant sur GitHub! Tu peux:
- ✅ Partager le lien avec des collaborateurs
- ✅ Cloner sur différents ordinateurs
- ✅ Garder un historique de tous les changements
- ✅ Revenir à une version précédente si besoin
- ✅ Montrer ton travail à des investisseurs potentiels

---

**Prochaine étape:** Déployer sur Vercel (qui se connecte directement à GitHub!)

Besoin d'aide? Ouvre un Issue sur ton dépôt GitHub! 😊
