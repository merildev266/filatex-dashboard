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
export default function SectionLayout({ name, color, basePath, headerRight }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isRoot = location.pathname === basePath

  const backLabel = isRoot ? 'Accueil' : name
  const handleBack = () => isRoot ? navigate('/') : navigate(basePath)

  return (
    <div style={{ background: '#000000', minHeight: '100dvh' }}>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-50 flex items-center px-4 py-3"
        style={{
          background: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${color}22`,
        }}
      >
        <div className="nav-back">
          <button
            onClick={handleBack}
            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg
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
          className="flex-1 text-center text-sm font-extrabold tracking-wider uppercase"
          style={{ color }}
        >
          {name}
        </div>
        {headerRight ? (
          <div className="nav-filter">{headerRight}</div>
        ) : (
          <div style={{ width: 70 }} />
        )}
      </div>

      {/* Content */}
      <div className="inner-page-inner p-4 md:p-6">
        <Outlet />
      </div>
    </div>
  )
}
