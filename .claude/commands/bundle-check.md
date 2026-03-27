# /bundle-check — Analyser le bundle Vite

## Objectif

Analyser la taille du bundle frontend React/Vite et identifier les optimisations possibles.

## Étapes

### 1. Build production
```bash
cd frontend && npx vite build 2>&1
```
Capturer la sortie avec les tailles de chaque chunk.

### 2. Analyser les chunks
Pour chaque fichier dans `dist/assets/` :
- Taille brute et gzip
- Identifier les plus gros chunks (>50KB gzip)

### 3. Vérifications

**Code splitting** :
- Chaque page doit être lazy-loaded (`React.lazy`)
- Les données volumineuses (`site_data.js` ~150KB) doivent être dans des chunks séparés
- Vérifier que `vite.config.js` a des `manualChunks` si nécessaire

**Dépendances lourdes** :
- `react-router-dom` — nécessaire
- `chart.js` / bibliothèques graphiques — vérifier si tree-shaking fonctionne
- Imports nommés vs imports par défaut

**Assets** :
- Images optimisées (WebP > PNG/JPG)
- Icônes SVG inline plutôt que fichiers séparés
- Fonts chargées en `font-display: swap`

**PWA** :
- Service worker configuré correctement
- Precache raisonnable (<2MB total)

### 4. Rapport

```
📦 Bundle total: XXX KB (gzip)
├── index.js:       XXX KB — React core + router + shared components
├── {page}.js:      XXX KB — Page-specific code + data
├── site_data.js:   XXX KB — HFO site data (biggest chunk)
└── ...

🎯 Optimisations suggérées:
1. [action] — gain estimé: XX KB
2. [action] — gain estimé: XX KB

✅ Bonnes pratiques déjà en place:
- [liste]
```
