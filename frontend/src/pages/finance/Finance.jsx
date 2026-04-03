import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { COLOR } from './financeHelpers.jsx'

const ENTITY_LABELS = {
  'filatex-sa': 'Filatex SA',
  'tcm': 'TCM',
}
const CATEGORY_LABELS = {
  'groupe': 'Client Groupe',
  'hors-groupe': 'Client Hors Groupe',
}

export default function Finance() {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  const parts = path.replace(/\/$/, '').split('/').filter(Boolean)
  // parts: ["finance"] | ["finance","filatex-sa"] | ["finance","filatex-sa","groupe"] | ["finance","tcm","projet","..."]

  let backLabel, backPath, pageTitle
  if (parts.length <= 1) {
    backLabel = 'Accueil'
    backPath = '/'
    pageTitle = 'Finance'
  } else if (parts.length === 2) {
    backLabel = 'Finance'
    backPath = '/finance'
    pageTitle = ENTITY_LABELS[parts[1]] || parts[1]
  } else if (parts[2] === 'projet') {
    // /finance/tcm/projet/PROJET_NAME
    const entity = parts[1]
    backLabel = ENTITY_LABELS[entity] || 'Finance'
    backPath = `/finance/${entity}`
    pageTitle = decodeURIComponent(parts[3] || 'Projet')
  } else {
    // /finance/filatex-sa/groupe or /finance/tcm/hors-groupe
    const entity = parts[1]
    backLabel = ENTITY_LABELS[entity] || 'Finance'
    backPath = `/finance/${entity}`
    pageTitle = CATEGORY_LABELS[parts[2]] || parts[2]
  }

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100dvh' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-50" style={{ background: 'var(--banner-bg)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center px-4 py-3" style={{ position: 'relative' }}>
          <div className="nav-back">
            <button
              onClick={() => navigate(backPath)}
              className="section-back-btn text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg bg-transparent cursor-pointer transition-colors"
              style={{ border: `1px solid ${COLOR}4D`, color: COLOR }}
            >
              {backLabel}
            </button>
          </div>
          <div
            className="section-title-center text-sm tracking-wider uppercase"
            style={{ color: COLOR, position: 'absolute', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', whiteSpace: 'nowrap' }}
          >
            {pageTitle}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ width: 70 }} />
        </div>
        <div style={{ height: 2, background: COLOR, opacity: 0.5 }} />
      </div>

      {/* Content */}
      <div className="inner-page-inner p-4 md:p-6">
        <Outlet />
      </div>
    </div>
  )
}
