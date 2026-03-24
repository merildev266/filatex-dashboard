# Filatex Dashboard — Migration React + Tailwind

## Objectif

Migrer le dashboard PMO Filatex d'une SPA vanilla (index.html monolithique + JS/CSS modulaire) vers une application React + Tailwind CSS. Objectifs :

1. **Maintenabilite** : Remplacer 1 870 lignes HTML monolithiques par des composants React isoles
2. **Mobile** : Passer d'un hack de zoom viewport a du vrai responsive mobile-first (Tailwind)
3. **Extensibilite** : Faciliter l'ajout de nouvelles sections (Finance, Audit, RH)

Le visuel desktop actuel doit etre reproduit a 90-95%.

## Decisions techniques

| Decision | Choix | Raison |
|----------|-------|--------|
| Framework frontend | React 18 + Vite | Rapide, ecosysteme riche, HMR |
| CSS | Tailwind CSS v3 | Stable, bien documente, mobile-first, config via tailwind.config.js |
| Routing | React Router v6 | SPA simple, API stable, bien documentee pour debutants |
| State global | React Context + useReducer | Filtres et auth partages entre pages |
| Backend | Flask (inchange) | Garde les scripts Python, API commentaires |
| Donnees | Fichiers *_data.js (inchanges) | Import ES modules, minimum de changement |
| TypeScript | Non (pour l'instant) | Simplifier l'apprentissage, ajout possible plus tard |
| Langage | JavaScript (JSX) | Coherent avec l'absence de TS |

## Architecture des fichiers

```
filatex-dashboard/
├── frontend/                      # Application React (NOUVEAU)
│   ├── src/
│   │   ├── App.jsx                # Router principal
│   │   ├── main.jsx               # Point d'entree React
│   │   ├── index.css              # Tailwind imports + CSS variables metier (source unique)
│   │   │
│   │   ├── components/            # Composants partages
│   │   │   ├── Layout.jsx         # Shell: bottom nav + header commun
│   │   │   ├── BottomNav.jsx      # Barre de navigation fixe en bas
│   │   │   ├── Login.jsx          # Ecran de login
│   │   │   ├── ProtectedRoute.jsx # Wrapper auth redirect
│   │   │   ├── KpiBox.jsx         # <KpiBox value label color />
│   │   │   ├── ProjectCard.jsx    # Carte projet (badge + barre progression)
│   │   │   ├── FilterBar.jsx      # Filtres temporels (J-1, M, Q, A)
│   │   │   ├── NeonDot.jsx        # Indicateur neon pulsant
│   │   │   ├── SlidePanel.jsx     # Panel lateral coulissant (desktop) / plein ecran (mobile)
│   │   │   └── StatusBadge.jsx    # Badge statut (Termine, En cours, etc.)
│   │   │
│   │   ├── pages/                 # Une page par section
│   │   │   ├── Accueil.jsx        # Home avec grille de cartes sections
│   │   │   ├── energy/
│   │   │   │   ├── Energy.jsx     # Page principale Energy (Outlet pour sous-routes)
│   │   │   │   ├── EnergyOverview.jsx  # Vue d'ensemble HFO + ENR (index route)
│   │   │   │   ├── HfoDetail.jsx  # Detail HFO (sous-route nested)
│   │   │   │   ├── EnrDetail.jsx  # Detail ENR (sous-route nested)
│   │   │   │   ├── HfoSite.jsx    # Carte site HFO
│   │   │   │   └── EnrProject.jsx # Carte projet ENR
│   │   │   ├── properties/
│   │   │   │   ├── Properties.jsx # Page principale Properties (Outlet)
│   │   │   │   ├── PropertiesOverview.jsx  # Vue d'ensemble (index route)
│   │   │   │   ├── DevDetail.jsx  # Sous-page Developpement
│   │   │   │   ├── TvxDetail.jsx  # Sous-page Travaux
│   │   │   │   ├── SavDetail.jsx  # Sous-page SAV
│   │   │   │   └── ComDetail.jsx  # Sous-page Commercial
│   │   │   ├── Capex.jsx
│   │   │   ├── Investments.jsx
│   │   │   ├── reporting/
│   │   │   │   ├── Reporting.jsx  # Page principale Reporting (Outlet)
│   │   │   │   ├── ReportingHub.jsx  # Hub avec liens vers poles (index route)
│   │   │   │   ├── RptEnr.jsx     # Reporting ENR
│   │   │   │   ├── RptHfo.jsx     # Reporting HFO
│   │   │   │   ├── RptLfo.jsx     # Reporting LFO
│   │   │   │   ├── RptProps.jsx   # Reporting Properties
│   │   │   │   └── RptInvest.jsx  # Reporting Investments
│   │   │   └── Csi.jsx
│   │   │
│   │   ├── data/                  # Donnees embarquees (voir inventaire ci-dessous)
│   │   │
│   │   ├── utils/                 # Fonctions utilitaires partagees
│   │   │   ├── projects.js        # Gantt, timeline, calculs projet (depuis js/projects.js)
│   │   │   └── formatters.js      # Formatage nombres, dates, pourcentages
│   │   │
│   │   ├── context/               # React Context providers
│   │   │   ├── AuthContext.jsx     # Auth state + provider
│   │   │   └── FilterContext.jsx   # Filtres temporels globaux + provider
│   │   │
│   │   └── hooks/                 # Hooks React partages
│   │       ├── useAuth.js         # Hook consommateur du AuthContext
│   │       └── useFilters.js      # Hook consommateur du FilterContext
│   │
│   ├── public/
│   │   ├── manifest.json          # PWA manifest (copie)
│   │   └── icons/                 # Icones PWA
│   │
│   ├── vite.config.js             # Config Vite + proxy Flask
│   ├── tailwind.config.js         # Config Tailwind (couleurs referencent CSS vars)
│   └── package.json
│
├── app.py                         # Flask API (INCHANGE)
├── generate_*.py                  # Scripts generation donnees (output path adapte)
├── data_loader.py                 # Extraction Excel (INCHANGE)
├── index.html                     # Ancien SPA (CONSERVE mais plus utilise)
├── index_reference.html           # Copie de reference du HTML original
├── js/                            # Ancien JS (CONSERVE comme reference)
└── css/                           # Ancien CSS (CONSERVE comme reference)
```

## Inventaire des fichiers de donnees

| Fichier actuel | Emplacement actuel | Style variable | Destination React | Notes |
|----------------|-------------------|----------------|-------------------|-------|
| `site_data.js` | racine | `const TAMATAVE_LIVE`, etc. | `data/site_data.js` | Ajouter `export` |
| `enr_site_data.js` | racine | `const ENR_SITE_DATA` | `data/enr_site_data.js` | Ajouter `export` |
| `hfo_projects.js` | racine | `const HFO_PROJECTS` | `data/hfo_projects.js` | Ajouter `export` |
| `enr_projects_data.js` | racine | `const ENR_PROJECTS` | `data/enr_projects_data.js` | Ajouter `export` |
| `reporting_data.js` | racine | `var RPT_DATA` | `data/reporting_data.js` | `var` → `export const` |
| `tamatave_data.js` | racine | `const TAMATAVE_DATA` | `data/tamatave_data.js` | Ajouter `export` |
| `js/com_data.js` | js/ | `const COM_OBJECTIVES` | `data/commercial_objectives.js` | Renommer pour clarte |
| `js/com_reporting_data.js` | js/ | `const COM_RPT_DATA` | `data/com_reporting_data.js` | Ajouter `export` |
| `js/props_data.js` | js/ | `const PROPS_DATA` | `data/props_data.js` | Ajouter `export` |
| `js/props_data_dev_full.js` | js/ | `const PROPS_DEV_FULL` | `data/props_data_dev_full.js` | Ajouter `export` |
| (inline dans `js/capex.js`) | js/ | `var capexData` | `data/capex_data.js` | Extraire en fichier separe |
| (inline dans `js/investments.js`) | js/ | `const INVESTMENTS` | `data/investments_data.js` | Extraire en fichier separe |

Les scripts `generate_*.py` doivent etre adaptes :
1. Format de sortie : `export const` au lieu de `var`/`const` global
2. Chemin de sortie : `frontend/src/data/` au lieu de racine ou `js/`

## Routes et navigation

### Modele de sous-routes : nested (React Router v6 Outlet)

Les sous-pages (HFO detail, ENR detail, etc.) sont des **routes nested** rendues dans le parent via `<Outlet />`. Cela signifie :

- `/energy` → `Energy.jsx` contient le header + `<Outlet />` → affiche `EnergyOverview.jsx`
- `/energy/hfo` → `Energy.jsx` contient le header + `<Outlet />` → affiche `HfoDetail.jsx`
- Le header/nav de la section reste visible quand on navigue dans les sous-pages
- Sur **mobile** : les sous-pages prennent tout l'ecran (SlidePanel en mode fullscreen)
- Sur **desktop** : comportement similaire a l'actuel (le contenu change dans la zone principale)

### Table des routes

| Route | Composant | Parent | Type |
|-------|-----------|--------|------|
| `/login` | `Login` | — | Standalone |
| `/` | `Accueil` | `Layout` | Index |
| `/energy` | `Energy` | `Layout` | Layout (Outlet) |
| `/energy/` (index) | `EnergyOverview` | `Energy` | Index route |
| `/energy/hfo` | `HfoDetail` | `Energy` | Nested |
| `/energy/enr` | `EnrDetail` | `Energy` | Nested |
| `/properties` | `Properties` | `Layout` | Layout (Outlet) |
| `/properties/` (index) | `PropertiesOverview` | `Properties` | Index route |
| `/properties/dev` | `DevDetail` | `Properties` | Nested |
| `/properties/tvx` | `TvxDetail` | `Properties` | Nested |
| `/properties/sav` | `SavDetail` | `Properties` | Nested |
| `/properties/com` | `ComDetail` | `Properties` | Nested |
| `/capex` | `Capex` | `Layout` | Standalone |
| `/investments` | `Investments` | `Layout` | Standalone |
| `/reporting` | `Reporting` | `Layout` | Layout (Outlet) |
| `/reporting/` (index) | `ReportingHub` | `Reporting` | Index route |
| `/reporting/enr` | `RptEnr` | `Reporting` | Nested |
| `/reporting/hfo` | `RptHfo` | `Reporting` | Nested |
| `/reporting/lfo` | `RptLfo` | `Reporting` | Nested |
| `/reporting/properties` | `RptProps` | `Reporting` | Nested |
| `/reporting/investments` | `RptInvest` | `Reporting` | Nested |
| `/csi` | `Csi` | `Layout` | Standalone |

Toutes les routes sous `Layout` sont protegees par `ProtectedRoute`.

## Gestion d'etat (State Management)

### Etat global (React Context)

**AuthContext** — partage entre toutes les pages :
- `isAuthenticated` : boolean
- `login(password)` : verifie le mot de passe, stocke en sessionStorage
- `logout()` : clear sessionStorage

**FilterContext** — partage entre sections qui utilisent des filtres temporels :
- `currentFilter` : 'J-1' | 'M' | 'Q' | 'A'
- `selectedMonthIndex` : number
- `selectedQuarter` : number
- `selectedYear` : number
- `setFilter(type)`, `setMonth(idx)`, `setQuarter(q)`, `setYear(y)`

Note : les filtres ENR-specifiques (`enrCurrentFilter`, etc.) restent locaux au composant Energy car ils ne sont utilises nulle part ailleurs.

### Etat local (useState dans les composants)
- Panels ouverts/fermes
- Element selectionne dans une liste
- Filtres specifiques a une section

## Composants partages

### KpiBox
```jsx
<KpiBox value="32" label="MW Dispo" color="var(--energy)" size="lg|md|sm" />
```
Reproduit le pattern `.rpt-kpi-item` actuel. Responsive : `lg` sur desktop, `md` sur tablette, `sm` sur mobile.

### ProjectCard
```jsx
<ProjectCard
  name="Overhaul M12"
  status="en_cours"       // termine | en_cours | non_demarre | indefini
  progress={65}           // pourcentage barre
  phase="Reassemblage"    // phase en cours
  timingVar="delay"       // on_time | delay
  onClick={() => ...}
/>
```

### FilterBar
```jsx
<FilterBar
  filters={['J-1', 'M', 'Q', 'A']}
  current={currentFilter}
  onChange={setCurrentFilter}
/>
```

### SlidePanel
```jsx
<SlidePanel isOpen={showDetail} onClose={() => setShowDetail(false)} title="Detail HFO">
  {children}
</SlidePanel>
```
- **Desktop** : panel lateral coulissant (translateX), identique a l'actuel
- **Mobile** : plein ecran avec bouton retour en haut

### NeonDot
```jsx
<NeonDot status="ok" />  // ok=vert, warn=orange, ko=rouge
```
Pulsation CSS identique a l'actuelle.

## Design responsive (Tailwind)

### Breakpoints
- **Default** (< 640px) : Mobile — 1 colonne, cartes empilees
- **sm** (>= 640px) : Grand mobile — 1-2 colonnes
- **md** (>= 768px) : Tablette — 2 colonnes, KPI en ligne
- **lg** (>= 1024px) : Desktop — Layout actuel (multi-colonnes)
- **xl** (>= 1280px) : Grand ecran — Layout actuel elargi

### Principes
- Mobile-first : on code le mobile d'abord, on ajoute les breakpoints pour desktop
- Le hack de zoom viewport actuel (`max(width/1440, 0.55)`) est SUPPRIME
- Les grilles `auto-fill, minmax(...)` deviennent des classes Tailwind `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Bottom nav : inchange sur desktop, icones seules sur mobile

### Accueil mobile
- Desktop : grille 3x2 de cartes sections
- Mobile : pile verticale de cartes pleine largeur, scrollable

### Pages section mobile
- KPI : empiles verticalement ou en grille 2x2
- Cartes projet : pleine largeur, 1 colonne
- Sous-pages : plein ecran (SlidePanel fullscreen mode)

## CSS Variables et couleurs

Source unique de verite : les couleurs sont definies dans `index.css` via CSS variables, et Tailwind les reference :

```css
/* index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --dark: #080b18;
  --energy: #00ab63;
  --props: #FDB823;
  --capex: #5e4c9f;
  --invest: #f37056;
  --teal: #5aafaf;
  --danger: #E05C5C;
  --dev-blue: #426ab3;
}
```

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        dark: 'var(--dark)',
        energy: 'var(--energy)',
        props: 'var(--props)',
        capex: 'var(--capex)',
        invest: 'var(--invest)',
        teal: 'var(--teal)',
        danger: 'var(--danger)',
        'dev-blue': 'var(--dev-blue)',
      }
    }
  }
}
```

Ainsi `bg-energy`, `text-props`, `border-danger` etc. sont disponibles et pointent vers la meme source.

## Authentification

- `AuthContext` + hook `useAuth()` verifie `sessionStorage('dash_auth')`
- Mot de passe : `1979` (inchange)
- `ProtectedRoute` wrapper redirige vers `/login` si non authentifie
- Meme comportement que l'actuel

## Integration Flask

### Developpement
- Vite dev server sur port 5173 avec proxy vers Flask port 5000
- `vite.config.js` : `proxy: { '/api': 'http://localhost:5000' }`
- HMR actif pour le frontend

### Production
- `npm run build` genere `frontend/dist/`
- Flask sert `frontend/dist/` en statique
- Ou deploiement separe (Nginx pour static + Flask pour API)

## API Flask

Les endpoints API existants sont conserves tels quels :
- `GET /api/tamatave` — Donnees Tamatave
- `POST /api/comment/enr` — Commentaires ENR
- `POST /api/comment/investments` — Commentaires Investments

Appeles via `fetch()` dans les composants React concernes.

## Coexistence ancien / nouveau frontend

Pendant la migration (Phases 0-5), les deux frontends coexistent :

- **Ancien** : Flask sert `index.html` sur port 5000 (route `/`)
- **Nouveau** : Vite sert le React sur port 5173

L'utilisateur final continue d'utiliser l'ancien sur port 5000. Le nouveau est teste en dev sur 5173.

A la fin de la Phase 6, le React remplace l'ancien :
- `app.py` est modifie pour servir `frontend/dist/` au lieu de `index.html`
- Les anciens fichiers (index.html, js/, css/) sont archives dans un dossier `legacy/`

## Strategie de migration par phases

### Phase 0 — Setup (fondation)
- Initialiser projet Vite + React + Tailwind v3 dans `frontend/`
- Configurer le proxy Flask dans `vite.config.js`
- Creer `AuthContext`, `FilterContext`, `useAuth()`, `useFilters()`
- Creer `Layout.jsx` (bottom nav + structure) + `ProtectedRoute.jsx`
- Creer `Login.jsx`
- Creer les composants partages de base (KpiBox, NeonDot, FilterBar, SlidePanel, StatusBadge)
- Copier et adapter un fichier data pour valider l'import ES module
- **Acceptance** :
  - Login fonctionne (mot de passe 1979)
  - Bottom nav s'affiche avec tous les boutons
  - Page placeholder s'affiche apres login
  - Import d'un fichier data fonctionne sans erreur

### Phase 1 — Accueil
- Convertir la page d'accueil (grille de 6 cartes sections)
- Liens de navigation vers les pages (pages placeholder)
- Responsive : grille 3x2 desktop, 1 colonne mobile
- **Acceptance** :
  - 6 cartes sections visibles, couleurs correctes
  - Click sur carte → navigation vers page (placeholder OK)
  - Mobile : cartes empilees en 1 colonne
  - Desktop : rendu visuellement proche de l'actuel

### Phase 2 — Energy (plus complexe, ~3 400 lignes JS)
- Vue d'ensemble Energy (HFO left + ENR right)
- Detail HFO : KPIs, cartes sites avec indicateurs neon, moteurs
- Detail ENR : KPIs, projets pipeline avec SPI/CPI
- Panels production, projets HFO
- Filtres temporels (J-1, M, Q, A) fonctionnels
- Utilitaires Gantt/timeline (depuis projects.js → utils/projects.js)
- **Acceptance** :
  - Tous les KPI s'affichent avec valeurs correctes
  - Filtres J-1/M/Q/A changent les donnees affichees
  - Navigation overview → HFO detail → site detail fonctionne
  - Navigation overview → ENR detail → projet detail fonctionne
  - Indicateurs neon pulsent correctement
  - Mobile : layout 1 colonne, panels en plein ecran

### Phase 3 — Properties
- Vue d'ensemble + 4 sous-pages (Dev, Tvx, SAV, Com)
- Cartes projet avec badge statut et barre progression
- Navigation vers sous-sections via routes nested
- **Acceptance** :
  - 4 sous-sections accessibles et fonctionnelles
  - Cartes projet avec bon statut et couleur
  - Navigation overview ↔ sous-page fluide
  - Mobile : cartes pleine largeur

### Phase 4 — CAPEX + Investments
- CAPEX : categories, tableaux, KPIs (extraire data inline → fichier)
- Investments : grille externe/interne (extraire data inline → fichier)
- Commentaires DG via API Flask (fetch POST)
- **Acceptance** :
  - Donnees CAPEX et Investments affichees correctement
  - Commentaires DG : saisie, sauvegarde, rechargement OK
  - KPIs calcules correctement
  - Mobile : tableaux scrollables horizontalement

### Phase 5 — Reporting
- Hub reporting avec liens vers poles
- 5 sous-pages (ENR, HFO, LFO, Properties, Investments)
- Tableaux et KPIs par pole
- **Acceptance** :
  - Hub affiche tous les poles avec navigation
  - Chaque sous-page affiche ses KPIs et tableaux
  - Filtres LFO fonctionnels (tous, installes, au F23, etc.)
  - Mobile : tableaux responsive

### Phase 6 — CSI + Polish + Bascule
- Page CSI
- PWA : vite-plugin-pwa pour manifest + service worker
- Basculer Flask pour servir `frontend/dist/`
- Archiver anciens fichiers dans `legacy/`
- Tests finaux desktop + mobile sur toutes les sections
- **Acceptance** :
  - Toutes les sections fonctionnent identiquement a l'ancien
  - PWA installable sur mobile
  - Flask sert le React en production
  - Aucune regression visuelle majeure

## Performance

- **Lazy loading** : chaque page chargee via `React.lazy()` + `Suspense`
- **Data splitting** : les fichiers data sont importes dynamiquement (`import()`) dans chaque page, pas dans le bundle principal
- **Optimisation images** : Vite optimise les assets statiques
- **Code splitting** : Vite genere automatiquement des chunks par route

## Risques et mitigations

| Risque | Mitigation |
|--------|-----------|
| Regression visuelle | Comparer screenshot par screenshot a chaque phase |
| Complexite Energy (3 400 lignes) | Decomposer en sous-composants fins |
| Donnees *_data.js mal importees | Tester l'import ES module des le Phase 0 |
| Performance mobile (gros data files) | Dynamic import() par page, lazy loading |
| Perte fonctionnalite | Tester chaque filtre et interaction |
| Coexistence ancien/nouveau | Ports separes, bascule uniquement en Phase 6 |
| Derive couleurs (2 sources) | Source unique CSS vars, Tailwind reference les vars |

## Hors scope

- TypeScript (ajout futur possible)
- Tests unitaires (ajout futur possible)
- Nouvelles sections (Finance, Audit, RH) — la structure les facilite mais elles ne sont pas dans cette migration
- Refonte du backend Flask
- Refonte des scripts generate_*.py (seuls le format de sortie et le chemin changent)
