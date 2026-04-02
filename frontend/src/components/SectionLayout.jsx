import { Outlet, useNavigate, useLocation } from 'react-router-dom'

/**
 * Shared layout for all 6 main sections.
 * Black background, sticky header with back button + centered title.
 *
 * @param {string} name       — Section display name (e.g. "Energy")
 * @param {string} color      — Accent color hex (e.g. "#00ab63")
 * @param {string} basePath   — Root path (e.g. "/energy")
 * @param {React.ReactNode} [headerRight] — Optional right-side content (e.g. FilterBar)
 */
export default function SectionLayout({ name, color, basePath, headerRight, pageNames }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isRoot = location.pathname === basePath

  // Dynamic page title: match current path against pageNames map
  const currentPage = (() => {
    if (!pageNames) return name
    const rel = location.pathname.replace(basePath, '').replace(/^\//, '')
    if (!rel) return name
    // Try exact match first, then partial
    if (pageNames[rel]) return pageNames[rel]
    // Try matching first segment (e.g. "hfo" from "hfo/something")
    const first = rel.split('/')[0]
    if (pageNames[first]) return pageNames[first]
    return name
  })()

  const backLabel = isRoot ? 'Accueil' : name
  const handleBack = () => isRoot ? navigate('/') : navigate(basePath)

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100dvh' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-50" style={{ background: 'var(--banner-bg)' }}>
        <div className="flex items-center px-4 py-3" style={{ position: 'relative' }}>
        <div className="nav-back">
          <button
            onClick={handleBack}
            className="section-back-btn text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg
                       bg-transparent cursor-pointer transition-colors"
            style={{
              border: `1px solid ${color}4D`,
              color: color,
            }}
          >
            {backLabel}
          </button>
        </div>
        <div
          className="section-title-center text-sm font-extrabold tracking-wider uppercase"
          style={{
            color,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {currentPage}
        </div>
        <div style={{ flex: 1 }} />
        {headerRight ? (
          <div className="nav-filter">{headerRight}</div>
        ) : (
          <div style={{ width: 70 }} />
        )}
        </div>
        <div style={{ height: 2, background: color, opacity: 0.5 }} />
      </div>

      {/* Content */}
      <div className="inner-page-inner p-4 md:p-6">
        <Outlet />
      </div>
    </div>
  )
}
