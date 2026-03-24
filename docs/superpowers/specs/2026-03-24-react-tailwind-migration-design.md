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
| CSS | Tailwind CSS v4 | Responsive mobile-first natif, utilitaires |
| Routing | React Router v7 | Navigation SPA, sous-routes |
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
│   │   ├── index.css              # Tailwind imports + CSS variables metier
│   │   │
│   │   ├── components/            # Composants partages
│   │   │   ├── Layout.jsx         # Shell: bottom nav + header commun
│   │   │   ├── BottomNav.jsx      # Barre de navigation fixe en bas
│   │   │   ├── Login.jsx          # Ecran de login
│   │   │   ├── KpiBox.jsx         # <KpiBox value label color />
│   │   │   ├── ProjectCard.jsx    # Carte projet (badge + barre progression)
│   │   │   ├── FilterBar.jsx      # Filtres temporels (J-1, M, Q, A)
│   │   │   ├── NeonDot.jsx        # Indicateur neon pulsant
│   │   │   ├── SlidePanel.jsx     # Panel lateral coulissant
│   │   │   └── StatusBadge.jsx    # Badge statut (Termine, En cours, etc.)
│   │   │
│   │   ├── pages/                 # Une page par section
│   │   │   ├── Accueil.jsx        # Home avec grille de cartes sections
│   │   │   ├── energy/
│   │   │   │   ├── Energy.jsx     # Page principale Energy
│   │   │   │   ├── HfoDetail.jsx  # Detail HFO (inner page)
│   │   │   │   ├── EnrDetail.jsx  # Detail ENR (inner page)
│   │   │   │   ├── HfoSite.jsx    # Carte site HFO
│   │   │   │   └── EnrProject.jsx # Carte projet ENR
│   │   │   ├── properties/
│   │   │   │   ├── Properties.jsx # Page principale Properties
│   │   │   │   ├── DevDetail.jsx  # Sous-page Developpement
│   │   │   │   ├── TvxDetail.jsx  # Sous-page Travaux
│   │   │   │   ├── SavDetail.jsx  # Sous-page SAV
│   │   │   │   └── ComDetail.jsx  # Sous-page Commercial
│   │   │   ├── Capex.jsx
│   │   │   ├── Investments.jsx
│   │   │   ├── reporting/
│   │   │   │   ├── Reporting.jsx  # Page principale Reporting
│   │   │   │   ├── RptEnr.jsx     # Reporting ENR
│   │   │   │   ├── RptHfo.jsx     # Reporting HFO
│   │   │   │   ├── RptLfo.jsx     # Reporting LFO
│   │   │   │   ├── RptProps.jsx   # Reporting Properties
│   │   │   │   └── RptInvest.jsx  # Reporting Investments
│   │   │   └── Csi.jsx
│   │   │
│   │   ├── data/                  # Donnees embarquees (copies des *_data.js)
│   │   │   ├── site_data.js
│   │   │   ├── enr_site_data.js
│   │   │   ├── hfo_projects.js
│   │   │   ├── enr_projects_data.js
│   │   │   ├── reporting_data.js
│   │   │   ├── props_data.js
│   │   │   ├── props_data_dev_full.js
│   │   │   └── com_data.js
│   │   │
│   │   └── hooks/                 # Hooks React partages
│   │       ├── useAuth.js         # Gestion authentification (sessionStorage)
│   │       └── useFilters.js      # Etat filtres temporels (J-1, M, Q, A)
│   │
│   ├── public/
│   │   ├── manifest.json          # PWA manifest (copie)
│   │   └── icons/                 # Icones PWA
│   │
│   ├── vite.config.js             # Config Vite + proxy Flask
│   ├── tailwind.config.js         # Config Tailwind (couleurs custom)
│   └── package.json
│
├── app.py                         # Flask API (INCHANGE)
├── generate_*.py                  # Scripts generation donnees (INCHANGES)
├── data_loader.py                 # Extraction Excel (INCHANGE)
├── index.html                     # Ancien SPA (CONSERVE mais plus utilise)
├── index_reference.html           # Copie de reference du HTML original
├── js/                            # Ancien JS (CONSERVE comme reference)
└── css/                           # Ancien CSS (CONSERVE comme reference)
```

## Routes

| Route | Composant | Description |
|-------|-----------|-------------|
| `/` | `Login` ou `Accueil` | Redirige selon auth |
| `/energy` | `Energy` | Vue d'ensemble HFO + ENR |
| `/energy/hfo` | `HfoDetail` | Detail sites HFO |
| `/energy/enr` | `EnrDetail` | Detail projets ENR |
| `/properties` | `Properties` | Vue d'ensemble Properties |
| `/properties/dev` | `DevDetail` | Sous-section Developpement |
| `/properties/tvx` | `TvxDetail` | Sous-section Travaux |
| `/properties/sav` | `SavDetail` | Sous-section SAV |
| `/properties/com` | `ComDetail` | Sous-section Commercial |
| `/capex` | `Capex` | Page CAPEX |
| `/investments` | `Investments` | Page Investments |
| `/reporting` | `Reporting` | Hub reporting |
| `/reporting/enr` | `RptEnr` | Reporting ENR |
| `/reporting/hfo` | `RptHfo` | Reporting HFO |
| `/reporting/lfo` | `RptLfo` | Reporting LFO |
| `/reporting/properties` | `RptProps` | Reporting Properties |
| `/reporting/investments` | `RptInvest` | Reporting Investments |
| `/csi` | `Csi` | Page CSI |

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
Hook `useFilters()` gere l'etat : `currentFilter`, `selectedMonthIndex`, `selectedQuarter`, `selectedYear`.

### SlidePanel
```jsx
<SlidePanel isOpen={showDetail} onClose={() => setShowDetail(false)} title="Detail HFO">
  {children}
</SlidePanel>
```
Remplace les `inner-*` et `panel-*` actuels. Animation translateX identique.

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
- Bottom nav : inchange sur desktop, potentiellement adaptee sur mobile (icones seules sans texte)

### Accueil mobile
- Desktop : grille 3x2 de cartes sections
- Mobile : pile verticale de cartes pleine largeur, scrollable

### Pages section mobile
- KPI : en carousel horizontal ou empiles verticalement
- Cartes projet : pleine largeur, 1 colonne
- Panels detail : plein ecran au lieu de slide-in lateral

## CSS Variables et couleurs

Conservees dans `index.css` :
```css
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

Aussi declarees dans `tailwind.config.js` pour utilisation comme classes (`bg-energy`, `text-props`, etc.).

## Authentification

- Hook `useAuth()` verifie `sessionStorage('dash_auth')`
- Mot de passe : `1979` (inchange)
- `ProtectedRoute` wrapper redirige vers Login si non authentifie
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

## Donnees

### Fichiers existants conserves
Les fichiers `*_data.js` sont copies dans `frontend/src/data/` et transformes en exports ES modules :
```js
// Avant (global var)
var SITE_DATA = { ... };

// Apres (ES module)
export const SITE_DATA = { ... };
```

Les scripts `generate_*.py` sont adaptes pour produire des exports ES modules au lieu de `var`.

### API Flask
Les endpoints API existants sont conserves tels quels :
- `GET /api/tamatave` — Donnees Tamatave
- `POST /api/comment/enr` — Commentaires ENR
- `POST /api/comment/investments` — Commentaires Investments

Appeles via `fetch()` dans les composants React concernes.

## Strategie de migration par phases

### Phase 0 — Setup (fondation)
- Initialiser projet Vite + React + Tailwind dans `frontend/`
- Configurer le proxy Flask
- Creer `Layout.jsx` (bottom nav + structure)
- Creer `Login.jsx` + `useAuth()`
- Creer les composants partages de base (KpiBox, NeonDot, FilterBar)
- **Livrable** : app React qui affiche le login et une page vide avec la nav

### Phase 1 — Accueil
- Convertir la page d'accueil (grille de 6 cartes sections)
- Liens de navigation vers les pages (pages placeholder)
- Responsive : grille 3x2 desktop → pile 1 colonne mobile
- **Livrable** : accueil identique au desktop + version mobile

### Phase 2 — Energy (plus complexe, ~3 400 lignes JS)
- Vue d'ensemble Energy (HFO left + ENR right)
- Detail HFO : KPIs, cartes sites, moteurs
- Detail ENR : KPIs, projets pipeline
- Panels production, projets HFO
- Filtres temporels (J-1, M, Q, A)
- **Livrable** : section Energy complete, desktop + mobile

### Phase 3 — Properties
- Vue d'ensemble + 4 sous-pages (Dev, Tvx, SAV, Com)
- Cartes projet avec badge statut
- Navigation vers sous-sections
- **Livrable** : section Properties complete

### Phase 4 — CAPEX + Investments
- CAPEX : categories, tableaux, KPIs
- Investments : grille externe/interne
- Commentaires DG (API Flask)
- **Livrable** : deux sections completes

### Phase 5 — Reporting
- Hub reporting avec liens vers poles
- 5 sous-pages (ENR, HFO, LFO, Properties, Investments)
- Tableaux et KPIs par pole
- **Livrable** : reporting complet

### Phase 6 — CSI + Polish
- Page CSI
- PWA manifest + service worker
- Tests finaux desktop + mobile
- Suppression des anciens fichiers (ou archivage)
- **Livrable** : application complete et deployable

## Risques et mitigations

| Risque | Mitigation |
|--------|-----------|
| Regression visuelle | Comparer screenshot par screenshot a chaque phase |
| Complexite Energy (3 400 lignes) | Decomposer en sous-composants fins |
| Donnees *_data.js mal importees | Tester l'import ES module des le Phase 0 |
| Performance mobile | Lazy loading des pages (React.lazy) |
| Perte fonctionnalite | Tester chaque filtre et interaction |

## Hors scope

- TypeScript (ajout futur possible)
- Tests unitaires (ajout futur possible)
- Nouvelles sections (Finance, Audit, RH) — la structure les facilite mais elles ne sont pas construites dans cette migration
- Refonte du backend Flask
- Migration des scripts generate_*.py (seul le format de sortie change : `var` → `export const`)
