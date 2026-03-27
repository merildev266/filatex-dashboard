# /component — Créer un composant React dashboard

Argument: `$ARGUMENTS` = type de composant (ex: `kpi-card`, `data-table`, `progress-bar`, `stat-grid`, `detail-panel`)

## Composants disponibles

### `kpi-card` — Carte KPI individuelle
```jsx
<div className="bg-[#0d1117] border border-white/10 rounded-xl p-4 text-center">
  <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">{label}</div>
  <div className="text-3xl font-bold" style={{ color }}>{value}</div>
  <div className="text-xs text-white/50 mt-1">{subtitle}</div>
</div>
```

### `data-table` — Table de données avec tri
- Headers sticky, lignes alternées
- Badges de statut colorés (vert=OK, rouge=retard, jaune=en cours)
- Responsive : scroll horizontal sur mobile

### `progress-bar` — Barre de progression
- Fond `rgba(color, 0.1)`, remplissage couleur accent
- Label % à droite, label texte à gauche
- Animation CSS sur le remplissage

### `stat-grid` — Grille de KPIs (4 colonnes desktop, 2 mobile)
- `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`
- Chaque cellule = kpi-card

### `detail-panel` — Panel slide-in pleine page
- `position: fixed; inset: 0; transform: translateX(100%)`
- Transition `0.45s cubic-bezier(0.16,1,0.3,1)`
- Header avec bouton retour + titre
- Scroll interne

## Règles

1. **Tailwind first** — Utiliser les classes Tailwind, pas de CSS custom sauf animations
2. **Couleurs** — Utiliser les variables du design system :
   - Energy: `#00ab63`, Properties: `#FDB823`, CAPEX: `#5e4c9f`, Invest: `#f37056`
   - Fond: `#080b18`, Cartes: `#0d1117`, Bordures: `rgba(255,255,255,0.1)`
3. **Responsive** — Mobile-first, breakpoints : `sm:640px`, `md:768px`, `lg:1024px`
4. **Imports** — Utiliser `hexToRgb`, `fmtM`, `parseDollar` depuis `utils/helpers.js`
5. **Pas de surcharge** — Composant minimal, pas de features non demandées

## Placement

- Composants réutilisables → `frontend/src/components/`
- Composants spécifiques section → inline dans le fichier page

Composant demandé : `$ARGUMENTS`
