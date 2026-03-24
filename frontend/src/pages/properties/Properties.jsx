import { Outlet, useNavigate, useLocation } from 'react-router-dom'

export default function Properties() {
  const navigate = useNavigate()
  const location = useLocation()
  const isRoot = location.pathname === '/properties'

  /* Determine sub-page name for back button */
  const subPage = location.pathname.split('/').pop()
  const backLabel = isRoot ? 'Accueil' : 'Properties'
  const handleBack = () => isRoot ? navigate('/') : navigate('/properties')

  return (
    <div style={{ background: '#0a0916', minHeight: '100dvh' }}>
      {/* Sticky header matching original sd-sticky-bar */}
      <div className="sticky top-0 z-50 flex items-center px-4 py-3"
        style={{
          background: 'rgba(10,9,22,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(253,184,35,0.08)',
        }}
      >
        <div className="nav-back">
          <button
            onClick={handleBack}
            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg
                       bg-transparent cursor-pointer transition-colors"
            style={{
              border: '1px solid rgba(253,184,35,0.3)',
              color: '#FDB823',
            }}
          >
            {backLabel}
          </button>
        </div>
        <div className="flex-1 text-center text-sm font-extrabold tracking-wider uppercase"
          style={{ color: '#FDB823' }}>
          Properties
        </div>
        <div style={{ width: 70 }} /> {/* spacer to center title */}
      </div>

      {/* Content area — no extra padding for overview (it centers itself) */}
      {isRoot ? (
        <div className="inner-page-inner">
          <Outlet />
        </div>
      ) : (
        <div className="inner-page-inner p-4 md:p-6">
          <Outlet />
        </div>
      )}
    </div>
  )
}
