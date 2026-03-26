# /new-section — Créer une nouvelle section du dashboard

Argument: `$ARGUMENTS` = nom de la section (ex: `finance`, `audit`, `rh`)

## Étapes obligatoires

1. **Créer les fichiers** (ne JAMAIS toucher aux fichiers des autres sections) :
   - `frontend/src/pages/{Section}.jsx` — Page React principale
   - `frontend/src/data/{section}_data.js` — Données embarquées (export vide initial)
   - Si sous-sections nécessaires : `frontend/src/pages/{section}/` avec un fichier par sous-section

2. **Ajouter la route** dans `frontend/src/App.jsx` :
   - Import lazy : `const {Section} = lazy(() => import('./pages/{Section}'))`
   - Route : `<Route path="/{section}" element={<{Section} />} />`

3. **Ajouter la carte accueil** dans `frontend/src/pages/Accueil.jsx` :
   - Nouvelle carte avec icône, couleur dédiée, titre, KPIs placeholder
   - Navigation vers `/{section}`

4. **Ajouter dans la nav** :
   - Entrée dans `frontend/src/components/BottomNav.jsx`
   - Couleur CSS variable dédiée

5. **Convention de nommage** :
   - CSS classes : `.{prefix}-*` (ex: `.fin-*` pour Finance, `.aud-*` pour Audit, `.rh-*` pour RH)
   - Composant React : PascalCase (`Finance`, `Audit`, `Rh`)
   - Route : kebab-case (`/finance`, `/audit`, `/rh`)
   - Data : snake_case (`finance_data.js`)

6. **Si données Excel** :
   - Créer `generate_{section}.py` à la racine
   - Pattern : lire XLSX → transformer → écrire `frontend/src/data/{section}_data.js`
   - Ajouter le script dans le README workflow

7. **Template minimal du composant** :
```jsx
import SectionHeader from '../components/SectionHeader'

const ACCENT = '{couleur_hex}'

export default function {Section}() {
  return (
    <div className="min-h-screen bg-[#080b18] text-white pb-24">
      <SectionHeader title="{Section}" color={ACCENT} />
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* KPIs */}
        {/* Contenu */}
      </div>
    </div>
  )
}
```

8. **Mettre à jour CLAUDE.md** : ajouter la section dans le tableau des fichiers

Section demandée : `$ARGUMENTS`
