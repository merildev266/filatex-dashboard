# /section-audit — Vérifier l'isolation d'une section

Argument: `$ARGUMENTS` = nom de la section à auditer (ex: `energy`, `properties`, `capex`, `investments`, `reporting`)

## Objectif

Vérifier que la section respecte les règles d'isolation du dashboard Filatex : chaque section doit rester strictement dans ses propres fichiers.

## Vérifications à effectuer

### 1. Fichiers modifiés récemment
```
git diff --name-only HEAD~5
```
Vérifier qu'aucun fichier d'une AUTRE section n'a été modifié.

### 2. Imports croisés (React)
Vérifier que les fichiers de la section n'importent PAS depuis d'autres sections :
- `frontend/src/pages/{section}/` ne doit pas importer depuis `frontend/src/pages/{autre_section}/`
- Exception : `components/` et `utils/` sont partagés (OK)

### 3. Données isolées
- Les données de la section utilisent uniquement `frontend/src/data/{section}_data.js`
- Pas d'accès aux données d'autres sections sauf via composants partagés

### 4. CSS sans collision
- Les classes CSS utilisent le préfixe de la section
- Pas de styles globaux modifiés

### 5. Vanilla SPA (si applicable)
Mapping des fichiers par section :
| Section | JS | CSS |
|---------|-----|-----|
| Energy | `js/energy.js` | `css/energy.css` |
| Properties | `js/properties.js` | `css/properties.css` |
| CAPEX | `js/capex.js` | `css/capex.css` |
| Investments | `js/investments.js` | `css/investments.css` |
| Reporting | `js/reporting.js` | `css/reporting.css` |
| Shared | `js/shared.js` | `css/shared.css` |

## Rapport

Produire un rapport court :
- ✅ Isolation fichiers OK / ❌ Fichiers d'autres sections modifiés : [liste]
- ✅ Imports OK / ❌ Imports croisés : [liste]
- ✅ Données isolées / ❌ Accès données croisés : [liste]
- ✅ CSS isolé / ❌ Collisions CSS : [liste]

Section à auditer : `$ARGUMENTS`
