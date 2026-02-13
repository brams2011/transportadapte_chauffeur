# 🔧 Guide de Dépannage

## Problème: "Compiling..." infini dans le navigateur

### ✅ Vérifications rapides:

1. **Le serveur fonctionne?**
   - Regardez le terminal: doit afficher "✓ Ready in XXXms"
   - Si non: `Ctrl+C` puis `npm run dev`

2. **Port correct?**
   - Ouvrez: http://localhost:3000
   - PAS: http://localhost:3001 ou autre

3. **Cache du navigateur:**
   ```
   Chrome/Edge: Ctrl + Shift + R (force refresh)
   Firefox: Ctrl + F5
   Ou: Ctrl + Shift + Delete > Vider le cache
   ```

4. **Console du navigateur (F12):**
   - Ouvrez les DevTools (F12)
   - Onglet "Console"
   - Y a-t-il des erreurs rouges?

---

## 🔧 Fixes communs:

### Fix 1: Hard Refresh
```
1. Ouvrez http://localhost:3000
2. Appuyez sur Ctrl + Shift + R
3. Attendez 5 secondes
```

### Fix 2: Nettoyer .next
```bash
# Dans le terminal:
rm -rf .next
npm run dev
```

### Fix 3: Navigation privée
```
1. Ouvrez une fenêtre de navigation privée
2. Allez sur http://localhost:3000
3. Si ça marche → problème de cache
```

### Fix 4: Vérifier les extensions
```
Désactivez temporairement les extensions de navigateur:
- AdBlock
- Privacy extensions
- React DevTools
```

---

## 🐛 Erreurs communes:

### Erreur: localStorage
**Symptôme**: Page blanche ou erreur hydration
**Fix**: Effacer localStorage
```javascript
// Dans la console du navigateur (F12):
localStorage.clear()
// Puis rafraîchir: F5
```

### Erreur: "Hydration failed"
**Fix**: Hard refresh (Ctrl + Shift + R)

### Erreur: "Module not found"
**Fix**:
```bash
rm -rf node_modules .next
npm install
npm run dev
```

---

## 📊 Performance:

### Temps de compilation normaux:
- **Premier chargement**: 200-400ms ✅
- **Rechargements**: 3-50ms ✅
- **Hot reload**: <10ms ✅

### Temps ANORMAUX:
- **>5 secondes**: Problème de mémoire ou cache
- **Infini**: Problème de cache navigateur ou erreur JS

---

## ✅ Checklist de debug:

- [ ] Serveur actif? (`npm run dev` dans terminal)
- [ ] Port 3000 accessible? (http://localhost:3000)
- [ ] Cache vidé? (Ctrl + Shift + R)
- [ ] Console sans erreurs? (F12 > Console)
- [ ] Navigation privée testée?
- [ ] `.next` supprimé et rebuild?

---

## 🆘 Si rien ne fonctionne:

```bash
# Reset complet:
taskkill //F //IM node.exe
rm -rf .next node_modules
npm install
npm run dev
```

Puis ouvrez une fenêtre de navigation privée et allez sur http://localhost:3000
