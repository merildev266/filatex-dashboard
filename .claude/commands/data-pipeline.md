# /data-pipeline — Générer un pipeline Excel → JS data

Argument: `$ARGUMENTS` = nom de la section (ex: `finance`, `capex`, `enr`)

## Contexte

Le dashboard Filatex charge ses données depuis des fichiers JS embarqués, générés par des scripts Python qui lisent des fichiers Excel (OneDrive).

## Pattern à suivre

Créer `generate_{section}.py` à la racine du projet en suivant ce template :

```python
"""
Generate {section}_data.js from {Section} Excel workbook.
Usage: python generate_{section}.py
"""
import os, json, openpyxl
from datetime import datetime

# Chemin OneDrive (adapter selon la section)
BASE = os.path.join(
    os.path.expanduser("~"),
    "OneDrive - GROUPE FILATEX",
    "Fichiers de DOSSIER DASHBOARD - Data_Dashbords",
    "{dossier_section}"
)

def read_workbook():
    """Lire le fichier Excel et extraire les données."""
    wb = openpyxl.load_workbook(os.path.join(BASE, "{fichier}.xlsx"), data_only=True)
    ws = wb.active
    data = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        # Adapter les colonnes selon le fichier
        data.append({
            "name": row[0],
            "value": row[1],
            # ...
        })
    return data

def main():
    data = read_workbook()

    # Écrire le fichier JS pour le frontend React
    react_path = os.path.join("frontend", "src", "data", "{section}_data.js")
    with open(react_path, "w", encoding="utf-8") as f:
        f.write(f"/* {section}_data.js - auto-generated {datetime.now():%Y-%m-%d %H:%M} */\n")
        f.write(f"/* Ne pas éditer à la main — relancer generate_{section}.py */\n\n")
        f.write(f"export const {section}Data = {json.dumps(data, ensure_ascii=False, indent=2)};\n")

    print(f"✓ {react_path} generated ({len(data)} entries)")

if __name__ == "__main__":
    main()
```

## Checklist

1. [ ] Identifier le fichier Excel source et son chemin OneDrive
2. [ ] Lire la structure du fichier (colonnes, onglets, semaines S##)
3. [ ] Créer `generate_{section}.py` avec le pattern ci-dessus
4. [ ] Générer `frontend/src/data/{section}_data.js` avec exports nommés
5. [ ] Importer les données dans le composant React de la section
6. [ ] Tester : `python generate_{section}.py` doit produire un fichier JS valide

## Conventions données

- Exports nommés : `export const {section}Data = [...]`
- Commentaire auto-gen en tête de fichier
- JSON avec `ensure_ascii=False` pour les accents
- Dates au format ISO (`YYYY-MM-DD`)
- Montants en nombre (pas de string formaté)

Section demandée : `$ARGUMENTS`
