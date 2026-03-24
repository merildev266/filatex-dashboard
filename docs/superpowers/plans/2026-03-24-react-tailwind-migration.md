# React + Tailwind Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Filatex PMO Dashboard from a vanilla SPA (monolithic index.html) to React 18 + Tailwind CSS v3, with real mobile-first responsive design.

**Architecture:** Vite + React 18 SPA in `frontend/` folder. React Router v6 with nested routes. React Context for global state (auth + filters). Flask backend unchanged, proxied during dev. Data files kept as JS with `export const`.

**Tech Stack:** React 18, Vite, Tailwind CSS v3, React Router v6, Flask (backend unchanged)

**Spec:** `docs/superpowers/specs/2026-03-24-react-tailwind-migration-design.md`

---

## File Structure

```
frontend/
├── src/
│   ├── App.jsx                    # Router config with all routes
│   ├── main.jsx                   # ReactDOM.createRoot entry
│   ├── index.css                  # Tailwind directives + CSS variables
│   ├── components/
│   │   ├── Layout.jsx             # Shell: BottomNav + Outlet
│   │   ├── BottomNav.jsx          # Fixed bottom nav bar (8 buttons)
│   │   ├── Login.jsx              # Login screen
│   │   ├── ProtectedRoute.jsx     # Auth guard wrapper
│   │   ├── KpiBox.jsx             # Reusable KPI display
│   │   ├── ProjectCard.jsx        # Project card with status badge + progress
│   │   ├── FilterBar.jsx          # Temporal filter buttons (J-1, M, Q, A)
│   │   ├── NeonDot.jsx            # Pulsing status indicator
│   │   ├── SlidePanel.jsx         # Slide-in panel (side on desktop, fullscreen mobile)
│   │   └── StatusBadge.jsx        # Status badge (Termine, En cours, etc.)
│   ├── context/
│   │   ├── AuthContext.jsx         # Auth state provider
│   │   └── FilterContext.jsx       # Global filter state provider
│   ├── hooks/
│   │   ├── useAuth.js              # Auth context consumer hook
│   │   └── useFilters.js           # Filter context consumer hook
│   ├── pages/
│   │   ├── Accueil.jsx             # Home page with 6 section cards
│   │   ├── energy/
│   │   │   ├── Energy.jsx          # Layout wrapper with Outlet
│   │   │   ├── EnergyOverview.jsx  # HFO + ENR overview (index route)
│   │   │   ├── HfoDetail.jsx       # HFO detail page
│   │   │   ├── EnrDetail.jsx       # ENR detail page
│   │   │   ├── HfoSite.jsx         # HFO site card component
│   │   │   └── EnrProject.jsx      # ENR project card component
│   │   ├── properties/
│   │   │   ├── Properties.jsx      # Layout wrapper with Outlet
│   │   │   ├── PropertiesOverview.jsx
│   │   │   ├── DevDetail.jsx
│   │   │   ├── TvxDetail.jsx
│   │   │   ├── SavDetail.jsx
│   │   │   └── ComDetail.jsx
│   │   ├── Capex.jsx
│   │   ├── Investments.jsx
│   │   ├── reporting/
│   │   │   ├── Reporting.jsx
│   │   │   ├── ReportingHub.jsx
│   │   │   ├── RptEnr.jsx
│   │   │   ├── RptHfo.jsx
│   │   │   ├── RptLfo.jsx
│   │   │   ├── RptProps.jsx
│   │   │   └── RptInvest.jsx
│   │   └── Csi.jsx
│   ├── data/                       # Copied + converted to ES modules
│   │   ├── site_data.js
│   │   ├── enr_site_data.js
│   │   ├── hfo_projects.js
│   │   ├── enr_projects_data.js
│   │   ├── reporting_data.js
│   │   ├── tamatave_data.js
│   │   ├── commercial_objectives.js  # renamed from com_data.js
│   │   ├── com_reporting_data.js
│   │   ├── props_data.js
│   │   ├── props_data_dev_full.js
│   │   ├── capex_data.js            # extracted from capex.js
│   │   └── investments_data.js      # extracted from investments.js
│   └── utils/
│       ├── projects.js              # Gantt/timeline utilities from js/projects.js
│       └── formatters.js            # Number/date formatting helpers
├── public/
│   ├── manifest.json
│   └── icons/
├── index.html                      # Vite HTML entry
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## Task 1: Initialize Vite + React + Tailwind project

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/index.css`

- [ ] **Step 1: Scaffold Vite React project**

```bash
cd frontend
npm create vite@latest . -- --template react
```

Select React + JavaScript when prompted. If it asks about overwriting, confirm.

- [ ] **Step 2: Install Tailwind CSS v3 and dependencies**

```bash
cd frontend
npm install
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: Install React Router v6**

```bash
cd frontend
npm install react-router-dom@6
```

- [ ] **Step 4: Configure tailwind.config.js**

Replace `frontend/tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: 'var(--dark)',
        dark2: 'var(--dark2)',
        dark3: 'var(--dark3)',
        energy: 'var(--energy)',
        props: 'var(--props)',
        capex: 'var(--capex)',
        invest: 'var(--invest)',
        teal: 'var(--teal)',
        danger: 'var(--danger)',
        'dev-blue': 'var(--dev-blue)',
        csi: 'var(--csi)',
        filatex: 'var(--filatex)',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Larken', 'Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: Configure vite.config.js with Flask proxy**

Replace `frontend/vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 6: Write index.css with Tailwind directives and CSS variables**

Replace `frontend/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');

:root {
  --dark: #080b18;
  --dark2: #0d1025;
  --dark3: #1a1d35;
  --border: rgba(58,57,92,0.20);
  --text: #ffffff;
  --text-muted: #c7c6c4;
  --text-dim: #aec1cd;
  --energy: #00ab63;
  --energy-dim: rgba(0,171,99,0.15);
  --invest: #f37056;
  --props: #FDB823;
  --capex: #5e4c9f;
  --csi: #0096c7;
  --teal: #5aafaf;
  --orange: #f37056;
  --danger: #E05C5C;
  --red: #ff5050;
  --dev-blue: #426ab3;
  --filatex: #3A395C;
  --filatex-bg: rgba(58,57,92,0.10);
  --filatex-border: rgba(58,57,92,0.22);
}

body {
  margin: 0;
  font-family: 'DM Sans', sans-serif;
  background: var(--dark);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  min-height: 100dvh;
}

/* Neon pulsation keyframes */
@keyframes neonPulse {
  0%, 100% { box-shadow: 0 0 4px currentColor, 0 0 8px currentColor; opacity: 1; }
  50% { box-shadow: 0 0 8px currentColor, 0 0 16px currentColor; opacity: 0.7; }
}

/* Glassmorphic card base */
@layer components {
  .glass-card {
    @apply rounded-[20px] border border-[rgba(58,57,92,0.35)] backdrop-blur-[16px];
    background: rgba(58,57,92,0.18);
    box-shadow: 0 8px 60px rgba(58,57,92,0.12), 0 4px 24px rgba(58,57,92,0.08), inset 0 1px 0 rgba(58,57,92,0.15);
  }
}
```

- [ ] **Step 7: Write minimal App.jsx placeholder**

Replace `frontend/src/App.jsx`:

```jsx
function App() {
  return (
    <div className="min-h-screen bg-dark text-white flex items-center justify-center">
      <h1 className="text-2xl font-bold">Filatex Dashboard — React Migration</h1>
    </div>
  )
}

export default App
```

- [ ] **Step 8: Write main.jsx entry point**

Replace `frontend/src/main.jsx`:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 9: Create frontend/.gitignore**

Create `frontend/.gitignore`:
```
node_modules/
dist/
```

- [ ] **Step 10: Start dev server and verify it works**

```bash
cd frontend && npm run dev
```

Expected: Vite starts on port 5173. Browser shows "Filatex Dashboard — React Migration" on dark background with DM Sans font.

- [ ] **Step 11: Commit**

```bash
git add frontend/
git commit -m "feat: initialize Vite + React + Tailwind v3 project with design tokens"
```

---

## Task 2: Convert data files to ES modules

**Files:**
- Create: `frontend/src/data/site_data.js` (from root `site_data.js`)
- Create: `frontend/src/data/enr_site_data.js` (from root `enr_site_data.js`)
- Create: `frontend/src/data/hfo_projects.js` (from root `hfo_projects.js`)
- Create: `frontend/src/data/enr_projects_data.js` (from root `enr_projects_data.js`)
- Create: `frontend/src/data/reporting_data.js` (from root `reporting_data.js`)
- Create: `frontend/src/data/tamatave_data.js` (from root `tamatave_data.js`)
- Create: `frontend/src/data/commercial_objectives.js` (from `js/com_data.js`)
- Create: `frontend/src/data/com_reporting_data.js` (from `js/com_reporting_data.js`)
- Create: `frontend/src/data/props_data.js` (from `js/props_data.js`)
- Create: `frontend/src/data/props_data_dev_full.js` (from `js/props_data_dev_full.js`)
- Create: `frontend/src/data/capex_data.js` (extracted from `js/capex.js`)
- Create: `frontend/src/data/investments_data.js` (extracted from `js/investments.js`)

- [ ] **Step 1: Copy data files that use `const` (just add `export`)**

For files already using `const`:
- `hfo_projects.js`: `const HFO_PROJECTS` → `export const HFO_PROJECTS`
- Copy to `frontend/src/data/` and prepend `export` to each `const`.

- [ ] **Step 2: Convert `window.*` assigned files**

For files using `window.VARIABLE = ...`:
- `site_data.js`: Replace `window.TAMATAVE_LIVE =` with `export const TAMATAVE_LIVE =`
- Same for all `window.*` assignments in `enr_site_data.js`, `enr_projects_data.js`, `reporting_data.js`

- [ ] **Step 3: Convert `var` declared files**

For files using `var`:
- `js/com_data.js`: Replace `var comData_venteImmo` with `export const comData_venteImmo`
- Same for all `var` declarations in `com_reporting_data.js`, `props_data.js`, `props_data_dev_full.js`

- [ ] **Step 4: Extract inline data from capex.js**

Open `js/capex.js`, find the `var capexData = {...}` declaration. Copy just the data object to `frontend/src/data/capex_data.js` as `export const capexData = {...}`.

- [ ] **Step 5: Extract inline data from investments.js**

Open `js/investments.js`, find `var invProjects = [...]`. Copy just the data array to `frontend/src/data/investments_data.js` as `export const invProjects = [...]`.

- [ ] **Step 6: Verify all data imports work**

Temporarily add to `App.jsx`:
```jsx
import { HFO_PROJECTS } from './data/hfo_projects'
console.log('HFO_PROJECTS loaded:', HFO_PROJECTS.length, 'projects')
```

Run dev server. Check console for "HFO_PROJECTS loaded: 57 projects" (or similar count).

Remove the test import after verification.

- [ ] **Step 7: Update generate_*.py output paths and format**

For each `generate_*.py` script in the project root:
1. Change output path from root/`js/` to `frontend/src/data/`
2. Change output format from `var X = ...` or `window.X = ...` to `export const X = ...`

Example change in a generate script:
```python
# Before
with open('reporting_data.js', 'w') as f:
    f.write(f'var REPORTING_ENR = {json.dumps(data)};')

# After
with open('frontend/src/data/reporting_data.js', 'w') as f:
    f.write(f'export const REPORTING_ENR = {json.dumps(data)};')
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/data/ generate_*.py
git commit -m "feat: convert all data files to ES modules and update generate scripts"
```

---

## Task 3: Auth context + Login component

**Files:**
- Create: `frontend/src/context/AuthContext.jsx`
- Create: `frontend/src/hooks/useAuth.js`
- Create: `frontend/src/components/Login.jsx`
- Create: `frontend/src/components/ProtectedRoute.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create AuthContext**

Create `frontend/src/context/AuthContext.jsx`:

```jsx
import { createContext, useState, useCallback } from 'react'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('dash_auth') === '1'
  )

  const login = useCallback((password) => {
    if (password === '1979') {
      sessionStorage.setItem('dash_auth', '1')
      setIsAuthenticated(true)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('dash_auth')
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
```

- [ ] **Step 2: Create useAuth hook**

Create `frontend/src/hooks/useAuth.js`:

```jsx
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 3: Create Login component**

Create `frontend/src/components/Login.jsx`:

```jsx
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (login(password)) {
      navigate('/')
    } else {
      setError('Mot de passe incorrect')
      setPassword('')
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-dark flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-[90%] max-w-[360px] text-center">
        <h1 className="text-2xl font-bold tracking-wide mb-1">Groupe Filatex</h1>
        <div className="text-xs text-[var(--text-muted)] uppercase tracking-[0.3em] mb-8">
          PMO Dashboard
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          autoFocus
          className="w-full bg-[rgba(58,57,92,0.18)] border border-[rgba(58,57,92,0.35)] rounded-xl
                     px-4 py-3 text-white text-base text-center outline-none
                     focus:border-[rgba(58,57,92,0.6)] transition-colors mb-4"
        />
        <button
          type="submit"
          className="w-full bg-[rgba(58,57,92,0.25)] border border-[rgba(58,57,92,0.35)] rounded-xl
                     px-4 py-3 text-white text-sm font-semibold uppercase tracking-wider
                     hover:bg-[rgba(58,57,92,0.4)] transition-colors cursor-pointer"
        >
          Acceder
        </button>
        {error && (
          <div className="mt-4 text-[#ff5a5a] text-sm">{error}</div>
        )}
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Create ProtectedRoute**

Create `frontend/src/components/ProtectedRoute.jsx`:

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
```

- [ ] **Step 5: Wire up App.jsx with router + auth**

Replace `frontend/src/App.jsx`:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-dark text-white flex items-center justify-center">
                <p className="text-xl">Dashboard — Authenticated</p>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 6: Test login flow**

Start dev server. Verify:
1. `/` redirects to `/login`
2. Wrong password shows error
3. Password `1979` → redirects to `/` showing "Dashboard — Authenticated"
4. Reload page → still authenticated (sessionStorage)

- [ ] **Step 7: Commit**

```bash
git add frontend/src/
git commit -m "feat: add auth context, login screen, and protected routes"
```

---

## Task 4: Filter context + shared hooks

**Files:**
- Create: `frontend/src/context/FilterContext.jsx`
- Create: `frontend/src/hooks/useFilters.js`
- Create: `frontend/src/utils/formatters.js`

- [ ] **Step 1: Create FilterContext**

Create `frontend/src/context/FilterContext.jsx`:

```jsx
import { createContext, useReducer } from 'react'

const now = new Date()

const initialState = {
  currentFilter: 'M',  // Matches existing JS: 'J-1' | 'M' | 'Q' | 'A'
  selectedMonthIndex: now.getMonth(),
  selectedQuarter: Math.floor(now.getMonth() / 3) + 1,
  selectedYear: now.getFullYear(),
}

function filterReducer(state, action) {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, currentFilter: action.payload }
    case 'SET_MONTH':
      return { ...state, selectedMonthIndex: action.payload }
    case 'SET_QUARTER':
      return { ...state, selectedQuarter: action.payload }
    case 'SET_YEAR':
      return { ...state, selectedYear: action.payload }
    default:
      return state
  }
}

export const FilterContext = createContext(null)

export function FilterProvider({ children }) {
  const [state, dispatch] = useReducer(filterReducer, initialState)

  const value = {
    ...state,
    setFilter: (f) => dispatch({ type: 'SET_FILTER', payload: f }),
    setMonth: (m) => dispatch({ type: 'SET_MONTH', payload: m }),
    setQuarter: (q) => dispatch({ type: 'SET_QUARTER', payload: q }),
    setYear: (y) => dispatch({ type: 'SET_YEAR', payload: y }),
  }

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  )
}
```

- [ ] **Step 2: Create useFilters hook**

Create `frontend/src/hooks/useFilters.js`:

```jsx
import { useContext } from 'react'
import { FilterContext } from '../context/FilterContext'

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used within FilterProvider')
  return ctx
}
```

- [ ] **Step 3: Create formatters utility**

Create `frontend/src/utils/formatters.js`:

```js
export const MONTH_NAMES = [
  'Janvier','Fevrier','Mars','Avril','Mai','Juin',
  'Juillet','Aout','Septembre','Octobre','Novembre','Decembre'
]

export const MONTH_SHORT = ['01','02','03','04','05','06','07','08','09','10','11','12']

export function formatNumber(n) {
  if (n == null) return '—'
  return n.toLocaleString('fr-FR')
}

export function formatCurrency(n, unit = 'EUR') {
  if (n == null) return '—'
  return n.toLocaleString('fr-FR') + ' ' + unit
}

export function formatPercent(n) {
  if (n == null) return '—'
  return Math.round(n) + '%'
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/context/ frontend/src/hooks/ frontend/src/utils/
git commit -m "feat: add filter context, formatters, and shared hooks"
```

---

## Task 5: Layout + BottomNav + shared components

**Files:**
- Create: `frontend/src/components/Layout.jsx`
- Create: `frontend/src/components/BottomNav.jsx`
- Create: `frontend/src/components/KpiBox.jsx`
- Create: `frontend/src/components/NeonDot.jsx`
- Create: `frontend/src/components/FilterBar.jsx`
- Create: `frontend/src/components/SlidePanel.jsx`
- Create: `frontend/src/components/StatusBadge.jsx`
- Create: `frontend/src/components/ProjectCard.jsx`

- [ ] **Step 1: Create BottomNav**

Create `frontend/src/components/BottomNav.jsx`:

```jsx
import { useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { pole: 'home', path: '/', label: 'Accueil' },
  { pole: 'energy', path: '/energy', label: 'Energy' },
  { pole: 'investments', path: '/investments', label: 'Invest.' },
  { pole: 'properties', path: '/properties', label: 'Properties' },
  { pole: 'capex', path: '/capex', label: 'CAPEX' },
  { pole: 'csi', path: '/csi', label: 'CSI' },
  { pole: 'reporting', path: '/reporting', label: 'Reporting' },
]

const POLE_COLORS = {
  home: 'rgba(255,255,255,0.7)',
  energy: '#00ab63',
  investments: '#f37056',
  properties: '#FDB823',
  capex: '#5e4c9f',
  csi: '#0096c7',
  reporting: '#5aafaf',
}

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const activePole = NAV_ITEMS.find(
    (item) => item.path !== '/' && location.pathname.startsWith(item.path)
  )?.pole || 'home'

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 z-[900]
                    bg-[rgba(8,11,24,0.92)] backdrop-blur-[16px]
                    border-t border-[rgba(255,255,255,0.06)]
                    flex justify-around items-center">
      {NAV_ITEMS.map((item) => {
        const isActive = activePole === item.pole
        const color = isActive ? POLE_COLORS[item.pole] : 'rgba(255,255,255,0.25)'
        return (
          <button
            key={item.pole}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-[3px] bg-transparent border-none
                       cursor-pointer relative py-1 px-2"
            style={{ color }}
          >
            <span className="text-[8px] font-bold uppercase tracking-[0.1em]">
              {item.label}
            </span>
            {isActive && (
              <span
                className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Create Layout**

Create `frontend/src/components/Layout.jsx`:

```jsx
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-dark pb-14">
      <Outlet />
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 3: Create KpiBox**

Create `frontend/src/components/KpiBox.jsx`:

```jsx
export default function KpiBox({ value, label, color, size = 'md' }) {
  const sizes = {
    sm: { value: 'text-lg', label: 'text-[9px]' },
    md: { value: 'text-2xl', label: 'text-[10px]' },
    lg: { value: 'text-3xl', label: 'text-xs' },
  }
  const s = sizes[size] || sizes.md

  return (
    <div className="text-center">
      <div className={`${s.value} font-bold`} style={{ color }}>
        {value ?? '—'}
      </div>
      <div className={`${s.label} text-[var(--text-muted)] uppercase tracking-wider mt-1`}>
        {label}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create NeonDot**

Create `frontend/src/components/NeonDot.jsx`:

```jsx
const STATUS_COLORS = {
  ok: '#00ab63',
  warn: '#f37056',
  ko: '#E05C5C',
}

export default function NeonDot({ status = 'ok', size = 8 }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.ok

  return (
    <span
      className="inline-block rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        color: color,
        animation: 'neonPulse 2s ease-in-out infinite',
      }}
    />
  )
}
```

- [ ] **Step 5: Create FilterBar**

Create `frontend/src/components/FilterBar.jsx`:

```jsx
// Keys match existing JS convention: 'J-1', 'M', 'Q', 'A'
const FILTER_OPTIONS = [
  { key: 'J-1', label: 'J-1' },
  { key: 'M', label: 'M' },
  { key: 'Q', label: 'Q' },
  { key: 'A', label: 'A' },
]

export default function FilterBar({ current, onChange }) {
  return (
    <div className="flex gap-1 bg-[rgba(58,57,92,0.18)] rounded-lg p-1">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider
                     transition-colors cursor-pointer border-none
                     ${current === opt.key
                       ? 'bg-[rgba(58,57,92,0.5)] text-white'
                       : 'bg-transparent text-[var(--text-muted)] hover:text-white'
                     }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Create StatusBadge**

Create `frontend/src/components/StatusBadge.jsx`:

```jsx
const STATUS_STYLES = {
  termine: { bg: 'rgba(0,171,99,0.15)', color: '#00ab63', label: 'Termine' },
  en_cours: { bg: 'rgba(90,175,175,0.15)', color: '#5aafaf', label: 'En cours' },
  non_demarre: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', label: 'Non demarre' },
  indefini: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', label: 'Indefini' },
  delay: { bg: 'rgba(224,92,92,0.15)', color: '#E05C5C', label: 'En retard' },
}

export default function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.indefini
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}
```

- [ ] **Step 7: Create SlidePanel**

Create `frontend/src/components/SlidePanel.jsx`:

```jsx
import { useEffect } from 'react'

export default function SlidePanel({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <div
      className={`fixed inset-0 z-[800] transition-opacity duration-300
                  ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel - side on desktop, full on mobile */}
      <div
        className={`absolute top-0 right-0 h-full bg-dark border-l border-[var(--border)]
                    w-full md:w-[600px] lg:w-[700px]
                    transition-transform duration-300 overflow-y-auto
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-dark/90 backdrop-blur-sm
                       flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-white text-lg
                       bg-transparent border-none cursor-pointer"
          >
            ←
          </button>
          <h2 className="text-sm font-bold uppercase tracking-wider">{title}</h2>
        </div>

        {/* Content */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Create ProjectCard**

Create `frontend/src/components/ProjectCard.jsx`:

```jsx
import StatusBadge from './StatusBadge'

export default function ProjectCard({ name, status, progress, phase, timingVar, onClick }) {
  const barColor = timingVar === 'delay' ? '#E05C5C' : '#00ab63'

  return (
    <div
      onClick={onClick}
      className="glass-card p-4 cursor-pointer hover:-translate-y-1 transition-transform"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold leading-tight">{name}</h3>
        <StatusBadge status={status} />
      </div>

      {/* Progress bar */}
      {progress != null && (
        <div className="mb-2">
          <div className="h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: barColor }}
            />
          </div>
          <div className="text-[9px] text-[var(--text-muted)] mt-1 text-right">
            {Math.round(progress)}%
          </div>
        </div>
      )}

      {/* Phase */}
      {phase && (
        <div className="text-[10px] text-[var(--text-dim)]">
          {phase}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 9: Verify all components render**

Temporarily update `App.jsx` to render a test page with all components. Start dev server and verify visually.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: add Layout, BottomNav, and all shared UI components"
```

---

## Task 6: Accueil (Home) page

**Files:**
- Create: `frontend/src/pages/Accueil.jsx`
- Modify: `frontend/src/App.jsx` (add routes)

- [ ] **Step 1: Create Accueil page**

Create `frontend/src/pages/Accueil.jsx`:

Reference the original HTML from `index_reference.html` lines 37-305 for exact card structure and SVG logos. The page needs:
- Header with logo, "Groupe Filatex" text, divider, "PMO Dashboard" label
- Grid of 6 section cards (Energy, Investments, Properties, CAPEX, CSI, Reporting)
- Each card with colored accent bar, SVG icon, and hover effect
- Footer with "Ceci n'est pas un Dashboard." text
- Responsive: 3 columns on desktop, 2 on tablet, 1 on mobile

```jsx
import { useNavigate } from 'react-router-dom'

const SECTIONS = [
  { pole: 'energy', label: 'Energy', color: '#00ab63', path: '/energy' },
  { pole: 'investments', label: 'Investments', color: '#f37056', path: '/investments' },
  { pole: 'properties', label: 'Properties', color: '#FDB823', path: '/properties' },
  { pole: 'capex', label: 'CAPEX', color: '#5e4c9f', path: '/capex' },
  { pole: 'csi', label: 'CSI', color: '#0096c7', path: '/csi' },
  { pole: 'reporting', label: 'Reporting', color: '#5aafaf', path: '/reporting' },
]

export default function Accueil() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[calc(100dvh-56px)] flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-wide">Groupe Filatex</h1>
        <div className="w-12 h-px bg-[var(--border)] mx-auto my-3" />
        <div className="text-[9px] uppercase tracking-[0.4em] text-[var(--text-muted)]">
          PMO Dashboard
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-[720px]">
        {SECTIONS.map((section) => (
          <button
            key={section.pole}
            onClick={() => navigate(section.path)}
            className="glass-card p-8 text-center relative overflow-hidden group
                       cursor-pointer border-none transition-transform
                       hover:-translate-y-2.5 active:-translate-y-1 active:scale-[0.99]"
            style={{
              '--section-color': section.color,
              background: `rgba(${hexToRgb(section.color)},0.06)`,
            }}
          >
            {/* Accent bar */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-b"
              style={{ backgroundColor: section.color }}
            />
            {/* Label */}
            <div className="text-sm font-bold uppercase tracking-wider" style={{ color: section.color }}>
              {section.label}
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center opacity-20">
        <div className="text-[11px] italic">Ceci n'est pas un Dashboard.</div>
        <div className="text-[6px] uppercase tracking-wider mt-1">Made by PMO with ♥</div>
      </div>
    </div>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
```

- [ ] **Step 2: Update App.jsx with full route structure**

Replace `frontend/src/App.jsx` with the complete route tree. All section pages are lazy-loaded placeholders for now:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './context/AuthContext'
import { FilterProvider } from './context/FilterContext'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Lazy-loaded pages — each gets its own chunk via Vite code splitting
const Accueil = lazy(() => import('./pages/Accueil'))

// Placeholder for sections not yet migrated
const Placeholder = lazy(() => Promise.resolve({
  default: ({ name }) => (
    <div className="p-8 text-center">
      <h1 className="text-xl font-bold">{name}</h1>
      <p className="text-[var(--text-muted)] mt-2">En construction...</p>
    </div>
  )
}))

// Loading fallback
const Loading = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-[var(--text-muted)] text-sm">Chargement...</div>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FilterProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Accueil />} />
                <Route path="energy/*" element={<Placeholder name="Energy" />} />
                <Route path="properties/*" element={<Placeholder name="Properties" />} />
                <Route path="capex" element={<Placeholder name="CAPEX" />} />
                <Route path="investments" element={<Placeholder name="Investments" />} />
                <Route path="reporting/*" element={<Placeholder name="Reporting" />} />
                <Route path="csi" element={<Placeholder name="CSI" />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </FilterProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
```

Note: As each section is implemented, replace its `Placeholder` with a proper `lazy(() => import('./pages/...'))`.
For example, when Energy is done:
```jsx
const Energy = lazy(() => import('./pages/energy/Energy'))
// then in routes: <Route path="energy" element={<Energy />}> ...
```

- [ ] **Step 3: Test full navigation flow**

1. Login with `1979`
2. See 6 cards on home page
3. Click each card → navigates to placeholder
4. Bottom nav works to switch between sections
5. Home button returns to accueil
6. Resize to mobile → cards stack in 1 column

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: add Accueil page with section cards and full route structure"
```

---

## Task 7: Energy section — Overview + HFO + ENR

This is the largest section (~3,400 lines JS). Reference `js/energy.js` and `index_reference.html` lines 339-768 for the exact structure.

**Files:**
- Create: `frontend/src/pages/energy/Energy.jsx`
- Create: `frontend/src/pages/energy/EnergyOverview.jsx`
- Create: `frontend/src/pages/energy/HfoDetail.jsx`
- Create: `frontend/src/pages/energy/EnrDetail.jsx`
- Create: `frontend/src/pages/energy/HfoSite.jsx`
- Create: `frontend/src/pages/energy/EnrProject.jsx`
- Create: `frontend/src/utils/projects.js`
- Modify: `frontend/src/App.jsx` (replace Energy placeholder with real routes)

- [ ] **Step 1: Create Energy layout wrapper**

Create `frontend/src/pages/energy/Energy.jsx` with a header bar + `<Outlet />` for nested routes.

- [ ] **Step 2: Create EnergyOverview**

Create `frontend/src/pages/energy/EnergyOverview.jsx` with:
- Two-column layout (HFO left, ENR right) on desktop
- Single column on mobile
- HFO section: total MW, production MWh, SFOC KPIs, list of 5 site cards
- ENR section: total MWc, production summary, list of projects
- Import data from `data/site_data.js`, `data/enr_site_data.js`

- [ ] **Step 3: Create HfoSite card component**

Create `frontend/src/pages/energy/HfoSite.jsx`:
- Site name, contrat MW, neon dot for status
- Production bar visualization
- Click to navigate to detail

- [ ] **Step 4: Create HfoDetail page**

Create `frontend/src/pages/energy/HfoDetail.jsx`:
- KPI grid (MW dispo, MWh, SFOC, SLOC, heures de marche, blackouts, stock fuel)
- FilterBar integration
- Site cards with detailed motor info
- Import data from `data/site_data.js`, `data/hfo_projects.js`

- [ ] **Step 5: Create EnrProject card component**

Create `frontend/src/pages/energy/EnrProject.jsx`:
- Project name, MW capacity, SPI/CPI indicators
- Progress bar, CAPEX display
- NeonDot for performance status

- [ ] **Step 6: Create EnrDetail page**

Create `frontend/src/pages/energy/EnrDetail.jsx`:
- KPI grid (total MWc, BESS MWh, total CAPEX, pipeline count)
- Project list with filters
- Import data from `data/enr_projects_data.js`, `data/enr_site_data.js`

- [ ] **Step 7: Create projects utilities**

Create `frontend/src/utils/projects.js`:
- Port relevant functions from `js/projects.js` (Gantt calculation, timeline helpers)
- Export as named exports

- [ ] **Step 8: Wire Energy routes in App.jsx**

Replace the Energy placeholder route with nested routes:
```jsx
<Route path="energy" element={<Energy />}>
  <Route index element={<EnergyOverview />} />
  <Route path="hfo" element={<HfoDetail />} />
  <Route path="enr" element={<EnrDetail />} />
</Route>
```

- [ ] **Step 9: Test Energy section**

1. Navigate to `/energy` → overview with HFO + ENR
2. Click HFO section → `/energy/hfo` with KPIs and sites
3. Click ENR section → `/energy/enr` with projects
4. Filters change displayed data
5. Mobile: single column layout
6. Back navigation works

- [ ] **Step 10: Commit**

```bash
git add frontend/src/pages/energy/ frontend/src/utils/
git commit -m "feat: add Energy section (HFO + ENR) with overview and detail pages"
```

---

## Task 8: Properties section

Reference `js/properties.js`, `js/props_data_dev_full.js`, and `index_reference.html` lines 1093-1335.

**Files:**
- Create: `frontend/src/pages/properties/Properties.jsx`
- Create: `frontend/src/pages/properties/PropertiesOverview.jsx`
- Create: `frontend/src/pages/properties/DevDetail.jsx`
- Create: `frontend/src/pages/properties/TvxDetail.jsx`
- Create: `frontend/src/pages/properties/SavDetail.jsx`
- Create: `frontend/src/pages/properties/ComDetail.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create Properties layout + Overview**
- [ ] **Step 2: Create DevDetail (11 projects)**
- [ ] **Step 3: Create TvxDetail (33 projects)**
- [ ] **Step 4: Create SavDetail (13 projects, 35 steps)**
- [ ] **Step 5: Create ComDetail (vente immo, vente fonciere, location)**
- [ ] **Step 6: Wire Properties routes in App.jsx**
- [ ] **Step 7: Test navigation and data display**
- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/properties/
git commit -m "feat: add Properties section with 4 sub-pages"
```

---

## Task 9: CAPEX + Investments sections

Reference `js/capex.js`, `js/investments.js`, `index_reference.html` lines 910-1091 (Investments) and 1337-1553 (CAPEX).

**Files:**
- Create: `frontend/src/pages/Capex.jsx`
- Create: `frontend/src/pages/Investments.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create Capex page**

KPIs, category cards (ENAT, infrastructure, tech, etudes), budget tracking.
Import from `data/capex_data.js`.

- [ ] **Step 2: Create Investments page**

Two-column grid (external 12 projects, internal 7 projects).
Comment DG feature via Flask API fetch.
Import from `data/investments_data.js`.

- [ ] **Step 3: Test both pages**
- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Capex.jsx frontend/src/pages/Investments.jsx
git commit -m "feat: add CAPEX and Investments sections"
```

---

## Task 10: Reporting section

Reference `js/reporting.js` (~2,465 lines) and `index_reference.html` lines 1617-1843.

**Files:**
- Create: `frontend/src/pages/reporting/Reporting.jsx`
- Create: `frontend/src/pages/reporting/ReportingHub.jsx`
- Create: `frontend/src/pages/reporting/RptEnr.jsx`
- Create: `frontend/src/pages/reporting/RptHfo.jsx`
- Create: `frontend/src/pages/reporting/RptLfo.jsx`
- Create: `frontend/src/pages/reporting/RptProps.jsx`
- Create: `frontend/src/pages/reporting/RptInvest.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create Reporting layout + Hub**
- [ ] **Step 2: Create RptEnr (ENR reporting)**
- [ ] **Step 3: Create RptHfo (HFO reporting)**
- [ ] **Step 4: Create RptLfo (LFO motors with filters)**
- [ ] **Step 5: Create RptProps (Properties reporting)**
- [ ] **Step 6: Create RptInvest (Investments reporting)**
- [ ] **Step 7: Wire Reporting routes**
- [ ] **Step 8: Test all 5 sub-pages**
- [ ] **Step 9: Commit**

```bash
git add frontend/src/pages/reporting/
git commit -m "feat: add Reporting section with 5 pole sub-pages"
```

---

## Task 11: CSI page + PWA + Production build

**Files:**
- Create: `frontend/src/pages/Csi.jsx`
- Create: `frontend/public/manifest.json`
- Modify: `frontend/vite.config.js` (add PWA plugin if needed)
- Modify: root `app.py` (serve frontend/dist/)

- [ ] **Step 1: Create CSI page**
- [ ] **Step 2: Copy PWA manifest and icons to frontend/public/**
- [ ] **Step 3: Build production bundle**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Update Flask to serve React in production**

Add to `app.py`:
```python
# Serve React frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path and os.path.exists(os.path.join('frontend/dist', path)):
        return send_from_directory('frontend/dist', path)
    return send_from_directory('frontend/dist', 'index.html')
```

- [ ] **Step 5: Test production build served by Flask**
- [ ] **Step 6: Archive legacy files**

```bash
mkdir -p legacy
mv index.html js/ css/ legacy/
mv index_reference.html legacy/
```

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete React migration — CSI, PWA, production build"
```

---

## Task 12: Visual verification pass

- [ ] **Step 1: Compare each section desktop view against original**

Start both servers:
- Old: `python app.py` on port 5000
- New: `cd frontend && npm run dev` on port 5173

Compare side by side every section.

- [ ] **Step 2: Test all mobile views**

Resize to 375px width. Verify:
- Accueil: cards stack 1 column
- Energy: single column, panels fullscreen
- Properties: sub-pages accessible
- All KPIs readable
- Bottom nav usable

- [ ] **Step 3: Fix any visual regressions**
- [ ] **Step 4: Final commit**

```bash
git commit -m "fix: visual adjustments from comparison pass"
```
