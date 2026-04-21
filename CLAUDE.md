# Filatex PMO Dashboard

Dashboard PMO pour le DG du Groupe Filatex. Priorité : **visibilité et décision rapide**.
Design : clarté > exhaustivité, hiérarchie visuelle forte, alertes rouge/vert.
Cible : desktop + mobile (PWA/Tauri). Sections futures : Finance, Audit, RH.

## Architecture

- **Frontend** : React 18 + Vite + Tailwind + React Router dans `frontend/` (unique stack — la vanilla SPA `js/`+`index.html` n'existe plus).
- **Backend** : Flask (`app.py`) + SQLite (`dashboard.db`) servi port 5000. Auth : `auth.py`.
- **Données** : Excel (OneDrive) → `generate_*.py` → `*_data.js` (embarquées, pas d'API fetch).
- **Auth** : username (`prenom.nom` ou `pmo`/`DG`/`CPO`) + PIN 4/6 chiffres → JWT 8 h stocké en `sessionStorage`. Rôles : `super_admin`, `admin`, `utilisateur`. Lockout après 5 échecs. PIN hashé bcrypt côté serveur.
- **Build/déploiement** : `npm run build` dans `frontend/` → `frontend/dist/` servi par Flask ou GitHub Pages.

## Règle critique : isolation par section

**Ne JAMAIS modifier le code d'une section quand on travaille sur une autre.**

| Section | React pages | CSS | Data |
|---------|------------|-----|------|
| Shared | `components/`, `context/`, `utils/` | `index.css` (tokens, `.login-*`, `.bnav-*`) | — |
| Accueil | `pages/Accueil.jsx` | — | — |
| Energy | `pages/energy/` | `.e-*`, `.card-energy` | `site_data`, `enr_site_data`, `hfo_projects`, `enr_projects_data` |
| Properties | `pages/properties/` | `.p-*`, `.card-props` | `props_data`, `props_data_dev_full` |
| CAPEX | `pages/Capex.jsx` | `.card-capex` | `capex_data` |
| Investments | `pages/Investments.jsx` | `.card-invest` | `investments_data`, `investments_echeancier` |
| Finance | `pages/finance/` | `.card-finance` | `finance_data`, `finance_echeancier` |
| Reporting | `pages/reporting/` | `.rpt-*` | `reporting_data` |
| CSI | `pages/Csi.jsx` | — | — |
| Admin | `pages/Admin.jsx`, `pages/Comptes.jsx`, `pages/Historique.jsx`, `pages/Parametres.jsx` | — | DB `users`, `login_history` |

Utiliser `/new-section` pour ajouter une section, `/section-audit` pour vérifier l'isolation.

## Conventions

**CSS** : `.card-{section}`, `.kpi-*`, `.e-*` (Energy), `.p-*` (Properties), `.rpt-*` (Reporting), `.bnav-*` (nav)
**JS** : camelCase fonctions, SCREAMING_SNAKE constantes, `_prefix` privées
**IDs** : `page-{section}`, `inner-{type}`, `panel-{type}-{detail}`

## Auth — règles

- Toute nouvelle route protégée : wrapper dans `<ProtectedRoute>` (cf. `App.jsx`) et — pour accès section — vérifier `hasAccess('section')` via `useAuth()`.
- Tout endpoint backend muté : décorer `@require_auth`, `@require_admin` ou `@require_super_admin` (cf. `app.py`).
- **Ne jamais** hardcoder un PIN, un username de démo, ou une liste nominative dans le code source — passer par DB/env/CSV hors repo.
- `JWT_SECRET` **doit** être fourni via variable d'env — pas de valeur par défaut.

## Couleurs

`--dark:#080b18` `--energy:#00ab63` `--props:#FDB823` `--capex:#5e4c9f` `--invest:#f37056`
Secondaires : `#5aafaf` (teal), `#E05C5C` (rouge/retard), `#426ab3` (bleu/dev)

## Helpers partagés (React)

`frontend/src/utils/helpers.js` : `hexToRgb()`, `parseDollar()`

## Règles métier

- Retard : glissement > 0j → rouge. Filtres : <30j, ≥30j
- Néon HFO : vert si prod ≥ contrat, rouge sinon
- ENR : SPI cible=1.0, CPI cible≥1.0
- Statuts : Terminé, En cours, Non démarré, Indéfini

## Skills disponibles

- `/new-section {nom}` — Créer une nouvelle section complète
- `/data-pipeline {nom}` — Générer pipeline Excel → JS
- `/component {type}` — Créer un composant React (kpi-card, data-table, progress-bar, stat-grid, detail-panel)
- `/section-audit {nom}` — Vérifier l'isolation d'une section
- `/bundle-check` — Analyser le bundle Vite
