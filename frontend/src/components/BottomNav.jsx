import { useState, useEffect } from 'react'
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

/* ── SVG icons ── */
const NAV_ICONS = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  energy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  investments: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <line x1="12" y1="20" x2="12" y2="10"/>
      <line x1="18" y1="20" x2="18" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="16"/>
    </svg>
  ),
  properties: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M9 22v-4h6v4"/>
      <line x1="8" y1="6" x2="8" y2="6.01"/>
      <line x1="12" y1="6" x2="12" y2="6.01"/>
      <line x1="16" y1="6" x2="16" y2="6.01"/>
      <line x1="8" y1="10" x2="8" y2="10.01"/>
      <line x1="12" y1="10" x2="12" y2="10.01"/>
      <line x1="16" y1="10" x2="16" y2="10.01"/>
      <line x1="8" y1="14" x2="8" y2="14.01"/>
      <line x1="12" y1="14" x2="12" y2="14.01"/>
      <line x1="16" y1="14" x2="16" y2="14.01"/>
    </svg>
  ),
  capex: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <rect x="2" y="16" width="4" height="6" rx="0.5"/>
      <rect x="8" y="11" width="4" height="11" rx="0.5"/>
      <rect x="14" y="6" width="4" height="16" rx="0.5"/>
      <path d="M20 2l2 2-2 2" strokeWidth="1.5"/>
      <path d="M22 4h-4v5" strokeWidth="1.5"/>
    </svg>
  ),
  csi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <circle cx="12" cy="8" r="2.5"/>
      <path d="M12 10.5v2"/>
      <path d="M8 16l4-3.5 4 3.5"/>
      <path d="M4 20l4-4"/>
      <path d="M20 20l-4-4"/>
      <path d="M4 20h16"/>
      <path d="M2 3l5 4L12 4l5 3 5-4" strokeWidth="1.5"/>
    </svg>
  ),
  reporting: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
}

/* ── Radial positions: arc from bottom-right corner going counter-clockwise ── */
/* 7 items spread from ~15° to ~165° (measured from the right axis, going up-left) */
const RADIAL_POSITIONS = [
  { angle: 165, radius: 140 }, // Accueil (top-left of arc)
  { angle: 140, radius: 140 }, // Energy
  { angle: 115, radius: 140 }, // Invest.
  { angle: 90,  radius: 140 }, // Properties (straight up)
  { angle: 65,  radius: 140 }, // CAPEX
  { angle: 40,  radius: 140 }, // CSI
  { angle: 15,  radius: 140 }, // Reporting (right of arc)
]

function getRadialXY(angle, radius) {
  const rad = (angle * Math.PI) / 180
  return {
    x: -Math.cos(rad) * radius,
    y: -Math.sin(rad) * radius,
  }
}

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const isHome = location.pathname === '/'

  const activePole = NAV_ITEMS.find(
    (item) => item.path !== '/' && location.pathname.startsWith(item.path)
  )?.pole || 'home'

  const activeColor = POLE_COLORS[activePole] || 'rgba(255,255,255,0.7)'

  // Close menu on scroll or route change
  useEffect(() => {
    if (!isOpen) return
    const close = () => setIsOpen(false)
    window.addEventListener('scroll', close, { passive: true })
    return () => window.removeEventListener('scroll', close)
  }, [isOpen])

  useEffect(() => { setIsOpen(false) }, [location.pathname])

  if (isHome) return null

  const handleNav = (path) => {
    navigate(path)
    setIsOpen(false)
  }

  return (
    <>
      {/* ── Desktop: normal bar ── */}
      <nav className="bnav-bar bnav-desktop">
        {NAV_ITEMS.map((item) => {
          const isActive = activePole === item.pole
          const color = isActive ? POLE_COLORS[item.pole] : 'rgba(255,255,255,0.25)'
          return (
            <button
              key={item.pole}
              onClick={() => navigate(item.path)}
              className={`bnav-item${isActive ? ' active' : ''}`}
              style={{ color }}
            >
              {NAV_ICONS[item.pole]}
              <span>{item.label}</span>
              {isActive && (
                <span className="bnav-active-dot" style={{ backgroundColor: color }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* ── Mobile: radial wheel menu ── */}
      {/* Backdrop */}
      <div
        className={`radial-backdrop ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Radial items */}
      <div className="radial-container" style={{ pointerEvents: isOpen ? 'auto' : 'none' }}>
        {NAV_ITEMS.map((item, i) => {
          const isActive = activePole === item.pole
          const color = isActive ? POLE_COLORS[item.pole] : 'rgba(255,255,255,0.5)'
          const pos = RADIAL_POSITIONS[i]
          const { x, y } = getRadialXY(pos.angle, pos.radius)

          return (
            <button
              key={item.pole}
              onClick={() => handleNav(item.path)}
              className={`radial-item ${isOpen ? 'open' : ''}`}
              style={{
                '--rx': `${x}px`,
                '--ry': `${y}px`,
                '--delay': `${i * 40}ms`,
                '--item-color': color,
              }}
            >
              <div className="radial-icon" style={{
                color,
                borderColor: isActive ? color : 'rgba(255,255,255,0.08)',
                background: isActive ? `rgba(${color === '#00ab63' ? '0,171,99' : color === '#f37056' ? '243,112,86' : color === '#FDB823' ? '253,184,35' : color === '#5e4c9f' ? '94,76,159' : color === '#0096c7' ? '0,150,199' : color === '#5aafaf' ? '90,175,175' : '255,255,255'},0.12)` : 'rgba(255,255,255,0.03)',
              }}>
                {NAV_ICONS[item.pole]}
              </div>
              <span className="radial-label" style={{ color }}>{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Helm FAB button */}
      <button
        className={`radial-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ '--fab-color': activeColor }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{width:26,height:26}}>
          <circle cx="12" cy="12" r="7.5"/>
          <circle cx="12" cy="12" r="3"/>
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
          <line x1="12" y1="1" x2="12" y2="9"/>
          <line x1="12" y1="15" x2="12" y2="23"/>
          <line x1="1" y1="12" x2="9" y2="12"/>
          <line x1="15" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="4.22" x2="9.5" y2="9.5"/>
          <line x1="14.5" y1="14.5" x2="19.78" y2="19.78"/>
          <line x1="4.22" y1="19.78" x2="9.5" y2="14.5"/>
          <line x1="14.5" y1="9.5" x2="19.78" y2="4.22"/>
        </svg>
      </button>
    </>
  )
}
