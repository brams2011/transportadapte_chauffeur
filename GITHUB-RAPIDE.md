# ⚡ GUIDE ULTRA-RAPIDE GITHUB

Pour ceux qui veulent aller vite!

---

## 🚀 Méthode Automatique (5 minutes)

### 1. Créer le dépôt sur GitHub

1. Va sur https://github.com/new
2. Nom: `transport-adapte-dashboard`
3. Private ✅
4. Ne cocher AUCUNE option
5. Create repository

### 2. Lancer le script automatique

```bash
cd transport-adapte-dashboard
./setup-github.sh
```

Le script va:
- ✅ Initialiser Git
- ✅ Configurer ton username
- ✅ Ajouter tous les fichiers
- ✅ Faire le premier commit
- ✅ Te demander si tu veux pusher

**C'EST TOUT!** 🎉

---

## 📝 Méthode Manuelle (10 minutes)

### 1. Créer le dépôt sur GitHub (comme ci-dessus)

### 2. Dans le terminal:

```bash
# Aller dans le dossier
cd transport-adapte-dashboard

# Initialiser Git
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit"

# Renommer en main
git branch -M main

# Lier à GitHub (remplacer TON-USERNAME)
git remote add origin https://github.com/TON-USERNAME/transport-adapte-dashboard.git

# Push
git push -u origin main
```

### 3. S'authentifier

GitHub va demander:
- Username: ton username GitHub
- Password: ton Personal Access Token
  - Créer sur: https://github.com/settings/tokens
  - Cocher: `repo`

**TERMINÉ!** 🎊

---

## 🔐 Créer un Personal Access Token (PAT)

1. https://github.com/settings/tokens
2. "Generate new token (classic)"
3. Note: "Transport Dashboard"
4. Cocher: ☑️ `repo`
5. Generate token
6. **COPIER LE TOKEN** (tu ne le reverras plus!)
7. Utiliser comme mot de passe dans le terminal

---

## ✅ Vérifier que ça marche

1. Va sur https://github.com/TON-USERNAME/transport-adapte-dashboard
2. Rafraîchis la page
3. Tu dois voir tous tes fichiers!

---

## 🔄 Après avoir fait des changements

```bash
git add .
git commit -m "Description du changement"
git push
```

**3 commandes. C'est tout!**

---

## 🆘 Problèmes courants

### "Permission denied"
→ Vérifie ton Personal Access Token

### "Repository not found"
→ Vérifie l'URL: `git remote -v`

### "Already initialized"
→ Supprime `.git`: `rm -rf .git` et recommence

---

## 📱 Alternative: GitHub Desktop

Plus simple, interface graphique:

1. Télécharge: https://desktop.github.com
2. Connecte ton compte GitHub
3. File → Add Local Repository
4. Sélectionne le dossier
5. Publish repository

**FAIT!** 🎉

---

**Temps total: 5-10 minutes max!**

Pour plus de détails, voir GITHUB-SETUP.md
