# Filatex PMO Dashboard

## Vision produit

Dashboard PMO du Groupe Filatex à destination du **Directeur Général**.
L'objectif principal est la **visibilité et la prise de décision rapide et claire**.
Chaque écran, KPI et carte doit permettre au DG de comprendre la situation en un coup d'œil.

**Principes de design :**
- Clarté > exhaustivité : montrer l'essentiel, pas tout le détail
- Hiérarchie visuelle forte : les chiffres clés en grand, le contexte en petit
- Alertes visuelles immédiates : rouge = problème, vert = OK
- Pas de surcharge : épurer plutôt qu'ajouter

**Roadmap :**
- Devenir une **application desktop + mobile** (Electron/Tauri + PWA ou React Native)
- Le design mobile doit être pris en compte dès maintenant dans chaque nouvelle feature
- Sections futures prévues : **Finance, Audit, RH** (et potentiellement d'autres)

## Architecture

SPA vanilla (pas de framework) : un seul `index.html` + modules JS/CSS par section.
Backend Flask (Python) sur port 5000. Données issues d'Excel (OneDrive) transformées en fichiers JS embarqués.

## Règle critique : séparation du code par section

**Chaque section (pôle) doit rester strictement isolée dans ses propres fichiers.**
Ne JAMAIS modifier le code d'une section quand on travaille sur une autre.

| Section | JS | CSS | Data |
|---------|-----|-----|------|
| Shared/Nav | `shared.js` | `shared.css` | — |
| Energy (HFO+ENR) | `energy.js` | `energy.css` | `site_data.js`, `enr_site_data.js`, `hfo_projects.js` |
| Properties | `properties.js` | `properties.css` | `props_data.js`, `props_data_dev_full.js` |
| CAPEX | `capex.js` | `capex.css` | (données dans capex.js) |
| Investments | `investments.js` | `investments.css` | (données dans investments.js) |
| Reporting | `reporting.js` | `reporting.css` | `reporting_data.js` |
| Projects (utilitaires) | `projects.js` | — | `enr_projects_data.js` |
| CSI | `csi.js` | `csi.css` | — |
| Accueil | `accueil.js` | `accueil.css` | — |

**Pour ajouter une nouvelle section (Finance, Audit, RH, etc.) :**
1. Créer `js/{section}.js` + `css/{section}.css`
2. Ajouter le HTML dans `index.html` (bloc `page-{section}`)
3. Ajouter la carte accueil + bouton nav
4. Si données Excel : créer `generate_{section}.py` → `{section}_data.js`
5. Ne pas toucher aux fichiers des autres sections

## Structure des fichiers

```
app.py              → Flask server + API endpoints (commentaires)
data_loader.py      → Extraction Excel → Python (config sites HFO)
generate_*.py       → Scripts de génération de données JS depuis XLSX
index.html          → SPA complète (~2500 lignes)
js/
  shared.js         → Login, navigation, état global, scaling viewport
  energy.js         → HFO + ENR : KPI, cartes sites, production, moteurs
  reporting.js      → Reporting par pôle (ENR, HFO, LFO, Properties, Investments)
  properties.js     → Projets immobiliers (Dev, Travaux, SAV, Commercial)
  projects.js       → Utilitaires projets (Gantt, timeline)
  capex.js          → Suivi CAPEX par catégorie
  investments.js    → Investissements internes/externes
  csi.js            → CSI (placeholder)
  accueil.js        → Accueil (placeholder)
  com_data.js       → Système de commentaires
css/
  shared.css        → Design tokens, layout global, bottom nav
  {section}.css     → Styles par section
*_data.js           → Données embarquées (JSON dans des var JS)
```

## Conventions de nommage

### CSS
- `.card-{section}` — Cartes accueil (card-energy, card-props)
- `.kpi-*` — KPI boxes (kpi-box, kpi-label, kpi-value)
- `.e-*` — Section Energy
- `.rpt-*` — Section Reporting
- `.enrp-*` — Projets ENR
- `.bnav-*` — Bottom navigation
- `.inner-*` — Pages internes (slide-in panels)
- Préfixer les nouvelles sections : `.fin-*` (Finance), `.aud-*` (Audit), `.rh-*` (RH)

### JavaScript
- camelCase pour variables/fonctions : `currentFilter`, `renderSites()`
- `_prefix` pour fonctions privées/helpers : `_invCalcCapex()`
- SCREAMING_SNAKE pour constantes : `MONTH_NAMES`, `SITE_CONFIG`

### IDs DOM
- Pages : `page-{section}` (page-energy, page-properties)
- Inner : `inner-{type}` (inner-hfo, inner-enr)
- Panels : `panel-{type}-{detail}`
- KPI bars : `{section}-{element}` ou `rpt-props-{sub}-kpi-bar`

## Couleurs (CSS variables)

| Variable | Hex | Usage |
|----------|-----|-------|
| `--dark` | #080b18 | Fond principal |
| `--energy` / `#00ab63` | Vert | Energy, "on time" |
| `--props` / `#FDB823` | Jaune | Properties |
| `--capex` / `#5e4c9f` | Violet | CAPEX |
| `--invest` / `#f37056` | Orange | Investments |
| `#5aafaf` | Teal | Étapes, secondaire |
| `#E05C5C` | Rouge | En retard, alertes |
| `#426ab3` | Bleu | Développement |

Réserver des couleurs distinctes pour les futures sections (Finance, Audit, RH).

## Navigation

- `openPage(pole)` / `closePage(pageId)` — Ouvrir/fermer une page
- `navTo(pole)` — Navigation bottom bar
- `goHome()` — Retour accueil
- `openPropsDirectSub('dev')` — Sous-sections Properties dans Reporting

## Filtres temporels

Filtres globaux : J-1, Mois (M), Trimestre (Q), Année (A).
Variables d'état : `currentFilter`, `selectedMonthIndex`, `selectedQuarter`, `selectedYear`.
ENR a ses propres filtres : `enrCurrentFilter`, `enrSelectedMonthIndex`, etc.

## Données métier par section

### Energy — HFO (5 sites)

| Site | Contrat (MW) | MW/moteur | Nb moteurs |
|------|-------------|-----------|------------|
| Tamatave | 32 | 1.85 | 13 |
| Diego | 18.5 | 1.2 | 10 |
| Majunga | 16.3 | 2.0 | 5 |
| Tuléar | 9.9 | — | — |
| Antsirabe | 7.5 | — | — |

KPIs : MW dispo, production MWh, SFOC, SLOC, heures de marche, blackouts, stock fuel.
57 projets HFO (overhauls, maintenance, installation, SCADA).

### Energy — ENR (centrales solaires + projets)

Sites de production : Diego (2.4 MW), Tamatave (2.0 MW), Majunga (1.2 MW).
21 projets pipeline : 161.2 MWc, 45 MWh BESS, 157.6 M$ CAPEX total.
Champs projet : pvMw, bessMwh, capexM, tri, engPct, constPct, spi, cpi.

### Properties (4 sous-sections)

- **Développement (DEV)** — 11 projets nouveaux
- **Travaux (TVX)** — 33 projets en cours
- **SAV** — 13 projets, 35 étapes
- **Commercial (COM)** — Vente immobilière, vente foncière, location

Champs : name, site, responsable, etape, timing_var (On Time / Delay), budget_var, status_cps.

### CAPEX

Catégories : ENAT, infrastructure, tech, études.
Champs : budget init, incurred, H1/H2 2026, projection 2027, TRI.

### Investments (19 projets)

- **Externes (12)** : OASIS (5.6 M$), Seedstars (4.3 M$), Hotel Tamatave (2.7 M$), BGFI, Energiestro, etc.
- **Internes (7)** : Café Mary, GHU, HAYA, Hakanto House, etc.

Champs : invest (budget), etat (réalisé), pct (exécution %), resp.

### Reporting — LFO

Moteurs LFO avec filtres : tous, installés, au F23, à rapatrier, à définir.
Champs : série, type, puissance (kW), départ, affectation, situation (production/vente/investigation).

### Reporting — Commercial

3 catégories : Vente Immobilière, Vente Foncière, Location.
Objectifs trimestriels (T1-T4) avec réalisé vs objectif en EUR.

## Seuils et règles métier

- **Retard projet** : glissement > 0 jours → "En retard". Filtres : <30j, ≥30j.
- **Néon HFO** : vert si production ≥ 100% du contrat, rouge sinon.
- **Performance ENR** : SPI (Schedule Performance Index) cible = 1.0, CPI cible ≥ 1.0.
- **Statuts projet** : Terminé, En cours, Non démarré, Indéfini.

## Login

Mot de passe : `1979`. Stocké en `sessionStorage('dash_auth')`.

## API Endpoints

- `GET /` — Sert index.html
- `GET /api/tamatave` — Données Tamatave
- `POST /api/comment/{section}` — Sauvegarde commentaires dans Excel

## Patterns UI

- **KPI uniformes** : `<div class="rpt-kpi-item"><div class="kv" style="color:{couleur}">{valeur}</div><div class="kl">{label}</div></div>`. Pas de fond spécial, pas de flèche.
- **Cartes projet** : Nom + badge statut + barre avancement + phase en cours. Pas de mini-gantt ni commentaires dans les cartes résumé.
- **Indicateurs néon** : Pulsation CSS (vert = ok, orange = warn, rouge = ko).
- **Responsive** : Scaling depuis référence 1440px. Grilles `auto-fill, minmax(...)`.
- **Mobile** : Prévoir des layouts empilés (1 colonne) pour < 768px. Bottom nav déjà adapté.
- **Données** : Toujours embarquées en JS (pas d'API fetch au chargement). Les scripts `generate_*.py` écrivent des fichiers `*_data.js`.

## Workflow de développement

1. Modifier les données : éditer `generate_*.py` ou `data_loader.py`, relancer pour régénérer les `*_data.js`
2. Modifier le frontend : éditer `js/{section}.js` + `css/{section}.css` + `index.html`
3. Tester : `python app.py` → http://localhost:5000 → mot de passe `1979`
4. Les fichiers `.claude/launch.json` configurent le serveur de preview (cwd doit être `.`)
5. **Toujours vérifier qu'on ne touche qu'aux fichiers de la section concernée**
