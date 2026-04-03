# Audit Visuel du Dashboard Filatex

**Date** : 2026-04-03
**Scope** : Unification visuelle, code mort, conflits CSS, isolation des sections

---

## 1. UNIFICATION VISUELLE - Problemes identifies

### 1.1 Couleurs hardcodees (73+ instances)

Les couleurs de section sont dupliquees en dur au lieu d'utiliser des CSS variables.

**Fichier** : `frontend/src/index.css`

| Lignes | Contexte | Couleurs hardcodees |
|--------|----------|---------------------|
| 204-210 | Bordures nav | `#00ab63`, `#f37056`, `#FDB823`, `#5e4c9f`, `#0096c7`, `#426ab3` |
| 462-468 | `.card-{section}` borders | Toutes les couleurs section |
| 474-480 | Hover states | Couleurs + backgrounds |
| 846-852 | `.unified-card` selectors | Toutes dupliquees |
| 1153-1155 | `.rpt-pole-*` hovers | `#426ab3` |
| 1236-1239 | `capex-section-card[data-pole]` | Avec `!important` |

**Recommandation** : Centraliser dans des variables CSS :
```css
--color-energy: #00ab63;
--color-invest: #f37056;
--color-props: #FDB823;
--color-finance: #1abc9c;
--color-capex: #5e4c9f;
--color-csi: #0096c7;
--color-reporting: #426ab3;
```

### 1.2 Paddings inconsistants entre cards

| Classe | Padding | Ligne |
|--------|---------|-------|
| `.card` | `34px 24px` | 451 |
| `.s1-card` | `clamp(12px, 1.8vw, 20px) clamp(10px, 1.6vw, 22px)` | 928 |
| `.enrp-kbox` | `16px 14px` | 1090 |
| `.enrp-card` | `18px` | 1115 |
| `.rpt-pole-card` | `36px 24px 28px` | 1151 |
| `.rpt-pole-card-sm` | `16px 12px 14px` | 1165 |
| `.capex-kpi-card` | `20px 18px` | 1220 |
| `.capex-proj-card` | `28px` | 1255 |
| `.props-kpi-card` | `20px` | 1294 |
| `.com-obj-card` | `20px 24px` | 1300 |

**Impact** : Hierarchie visuelle incoherente entre sections.

### 1.3 Border-radius inconsistants

- Standard cards : `20px` (10+ classes)
- Medium : `14px` (3 classes)
- Compact : `10px` (11 classes)
- Mini : `8px` (5 classes)
- Tags/badges : `5px`/`6px` (mix)

**Recommandation** : Creer une echelle :
```css
--radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px; --radius-xl: 20px;
```

### 1.4 Box-shadow dupliquee 17+ fois

Le meme shadow est copie-colle partout :
```css
box-shadow: 0 8px 60px rgba(58,57,92,0.12), 0 4px 24px rgba(58,57,92,0.08), inset 0 1px 0 rgba(58,57,92,0.15);
```

**Lignes** : 460, 903, 928, 1023, 1046, 1074, 1090, 1115, 1151, 1177, 1182, 1220, 1255, 1260, 1294, 1300

**Recommandation** : `--shadow-card: ...;`

### 1.5 Hover animations inconsistantes

| Classe | translateY | Shadow opacity |
|--------|-----------|----------------|
| `.card` (home) | `-10px` | variable |
| `.unified-card` | `-6px` | 0.22 |
| `.rpt-pole-card` | `-6px` | 0.22 |
| `.rpt-pole-card-sm` | `-3px` | 0.1 |

### 1.6 Boutons de navigation dupliques

3 classes identiques avec couleur differente :
- `.site-nav-btn` (Energy)
- `.inv-nav-btn` (Investments)
- `.gd-gen-nav-btn` (EnR)

**Recommandation** : Une seule classe `.section-nav-btn` + `data-section` pour la couleur.

### 1.7 Font sizes sans echelle

KPI values : 26px, 22px, 28px, 24px (aucune logique)
Labels : 8px, 9px (mix aleatoire)

**Recommandation** : Echelle typographique coherente via variables CSS.

---

## 2. CODE MORT

### 2.1 Fichier data inutilise (PRIORITE HAUTE)

| Fichier | Taille | Statut |
|---------|--------|--------|
| `frontend/src/data/hfo_site_data.js` | ~157 KB | **Jamais importe nulle part** |

**Action** : Supprimer ce fichier.

### 2.2 Composant ThemeToggle duplique

- `frontend/src/components/ThemeToggle.jsx` : composant principal (utilise dans Layout)
- `frontend/src/pages/Accueil.jsx:81-102` : version locale dupliquee

**Action** : Utiliser le composant partage dans Accueil.jsx.

### 2.3 Bilan code mort

| Type | Nombre | Severite |
|------|--------|----------|
| Fichiers data inutilises | 1 (157KB) | **HAUTE** |
| CSS classes inutilisees | 0 | - |
| Fonctions inutilisees | 0 | - |
| Imports inutilises | 0 | - |
| Composants orphelins | 0 | - |
| Code commente | 0 | - |
| Fonctions dupliquees | 1 | BASSE |

---

## 3. CONFLITS CSS ET SPECIFICITE

### 3.1 Usage excessif de `!important` (33 instances)

**Lignes critiques** dans `index.css` :
- **813** : `.e-card-mini` - 4x `!important` sur une ligne
- **1236-1239** : `capex-section-card[data-pole]` - 4x `!important` CHAQUE (16 total)
- **1326-1330** : overrides capex avec `!important`

**Cause racine** : Les selecteurs `data-*` n'ont pas assez de specificite.

### 3.2 Transitions inconsistantes

- Cards standards : `0.3s ease`
- Nav bar : `0.35s cubic-bezier`
- Back buttons : `0.2s`
- Table rows : `0.15s`
- Progress bars : `0.5s`

---

## 4. VIOLATIONS D'ISOLATION DES SECTIONS

### 4.1 Imports cross-section (CRITIQUE)

La section **Reporting** importe les donnees de 3 autres sections :

| Fichier Reporting | Import externe | Section source |
|-------------------|---------------|----------------|
| `ReportingOverview.jsx:3` | `hfo_projects` | Energy |
| `ReportingOverview.jsx:4` | `investments_data` | Investments |
| `ReportingOverview.jsx:5` | `props_data` | Properties |
| `ReportingHub.jsx:3-10` | Memes violations | Energy/Inv/Props |
| `RptHfo.jsx:2` | `hfo_projects` | Energy |
| `RptInvest.jsx:2` | `investments_data` | Investments |
| `RptProps.jsx:3-6` | `props_data`, `props_data_dev_full` | Properties |

**Recommandation** : Creer des fichiers de donnees agreges dedies au Reporting.

### 4.2 Fuite CSS entre sections (CRITIQUE)

La classe `.capex-section-card` (definie pour CAPEX) est utilisee par :
- **Energy** : `EnergyOverview.jsx` lignes 233, 327, 355, 438
- **Investments** : `Investments.jsx`

**Recommandation** : Creer des classes specifiques par section.

### 4.3 Bilan isolation

| Type de violation | Nombre | Severite |
|-------------------|--------|----------|
| Imports cross-section data | 7 fichiers | **CRITIQUE** |
| Fuite CSS inter-sections | 4+ instances | **CRITIQUE** |
| Nommage CSS conflictuel | 2 sections | HAUTE |
| `window.history` pollution | 4 instances | MOYENNE |

---

## 5. PLAN D'ACTION RECOMMANDE

### Priorite 1 - Quick wins
1. Supprimer `hfo_site_data.js` (157KB de dead code)
2. Centraliser les couleurs en CSS variables
3. Creer `--shadow-card` variable

### Priorite 2 - Unification visuelle
4. Creer echelle border-radius (`--radius-sm/md/lg/xl`)
5. Unifier les boutons navigation en une classe unique
6. Harmoniser paddings des cards KPI
7. Creer echelle typographique

### Priorite 3 - Isolation
8. Renommer `capex-section-card` en classes specifiques par section
9. Creer donnees agregees pour le Reporting
10. Eliminer les `!important` via meilleure specificite

### Priorite 4 - Polish
11. Harmoniser les transitions (0.3s partout)
12. Unifier les hover animations (translateY coherent)
13. Consolider ThemeToggle duplique dans Accueil.jsx
