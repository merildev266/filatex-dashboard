import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const COLOR = '#1abc9c'

const ENTITY_LABELS = {
  'filatex-sa': 'Filatex SA',
  'tcm': 'TCM',
}

export default function Finance() {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  // Determine back button label & target based on depth
  // /finance                        → Accueil
  // /finance/filatex-sa             → Finance
  // /finance/filatex-sa/groupe      → Filatex SA
  // /finance/tcm/hors-groupe        → TCM
  const parts = path.replace(/\/$/, '').split('/').filter(Boolean)
  // parts: ["finance"] or ["finance","filatex-sa"] or ["finance","filatex-sa","groupe"]

  let backLabel, backPath
  if (parts.length <= 1) {
    backLabel = 'Accueil'
    backPath = '/'
  } else if (parts.length === 2) {
    backLabel = 'Finance'
    backPath = '/finance'
  } else {
    // On client list — go back to entity
    const entity = parts[1]
    backLabel = ENTITY_LABELS[entity] || 'Finance'
    backPath = `/finance/${entity}`
  }

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100dvh' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-50" style={{ background: 'var(--banner-bg)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center px-4 py-3" style={{ position: 'relative' }}>
          <div className="nav-back">
            <button
              onClick={() => navigate(backPath)}
              className="section-back-btn text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-transparent cursor-pointer transition-colors"
              style={{ border: `1px solid ${COLOR}4D`, color: COLOR }}
            >
              {backLabel}
            </button>
          </div>
          <div
            className="section-title-center text-sm font-extrabold tracking-wider uppercase"
            style={{ color: COLOR, position: 'absolute', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', whiteSpace: 'nowrap' }}
          >
            Finance
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
