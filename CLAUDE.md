# Filatex PMO Dashboard

Dashboard PMO pour le DG du Groupe Filatex. Priorité : **visibilité et décision rapide**.
Design : clarté > exhaustivité, hiérarchie visuelle forte, alertes rouge/vert.
Cible : desktop + mobile (PWA/Tauri). Sections futures : Finance, Audit, RH.

## Architecture

- **Vanilla SPA** : `index.html` + `js/` + `css/` servi par Flask (port 5000)
- **React app** : `frontend/` (Vite + Tailwind + React Router) — nouvelle version
- **Données** : Excel (OneDrive) → `generate_*.py` → `*_data.js` (embarquées, pas d'API fetch)
- **Login** : mot de passe `1979`, `sessionStorage('dash_auth')`

## Règle critique : isolation par section

**Ne JAMAIS modifier le code d'une section quand on travaille sur une autre.**

| Section | React pages | Vanilla JS | CSS | Data |
|---------|------------|------------|-----|------|
| Shared | `components/`, `utils/` | `shared.js` | `shared.css` | — |
| Energy | `pages/energy/` | `energy.js` | `energy.css` | `site_data`, `enr_site_data`, `hfo_projects` |
| Properties | `pages/properties/` | `properties.js` | `properties.css` | `props_data`, `props_data_dev_full` |
| CAPEX | `pages/Capex.jsx` | `capex.js` | `capex.css` | `capex_data` |
| Investments | `pages/Investments.jsx` | `investments.js` | `investments.css` | `investments_data` |
| Reporting | `pages/reporting/` | `reporting.js` | `reporting.css` | `reporting_data` |

Utiliser `/new-section` pour ajouter une section, `/section-audit` pour vérifier l'isolation.

## Conventions

**CSS** : `.card-{section}`, `.kpi-*`, `.e-*` (Energy), `.rpt-*` (Reporting), `.bnav-*` (nav)
**JS** : camelCase fonctions, SCREAMING_SNAKE constantes, `_prefix` privées
**IDs** : `page-{section}`, `inner-{type}`, `panel-{type}-{detail}`

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
