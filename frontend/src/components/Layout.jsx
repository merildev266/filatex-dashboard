import { useState, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../hooks/useAuth'
import BottomNav from './BottomNav'
import ThemeToggle from './ThemeToggle'

const MOTIF_BASE = import.meta.env.BASE_URL + 'logos'

/* ── Section color map for motif stroke tinting ── */
const SECTION_COLORS = {
  '/energy':      '#00ab63',
  '/investments': '#f37056',
  '/properties':  '#FDB823',
  '/finance':     '#1abc9c',
  '/capex':       '#5e4c9f',
  '/csi':         '#0096c7',
  '/reporting':   '#426ab3',
}

function getSectionFromPath(pathname) {
  const match = pathname.match(/^\/([^/]+)/)
  return match ? `/${match[1]}` : null
}

export default function Layout() {
  const location = useLocation()
  const { theme } = useTheme()
  const { refreshData } = useAuth()
  const isHome = location.pathname === '/'
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refreshData()
    // Show spinner for 3s then prompt reload
    setTimeout(() => {
      setRefreshing(false)
      window.location.reload()
    }, 8000)
  }, [refreshData])
  const motifSrc = theme === 'dark' ? `${MOTIF_BASE}/motif-dark.svg` : `${MOTIF_BASE}/motif-light.svg`

  const sectionKey = getSectionFromPath(location.pathname)
  const sectionColor = sectionKey ? SECTION_COLORS[sectionKey] : null

  return (
    <div className={`min-h-screen bg-dark ${isHome ? '' : 'pb-14'}`} data-section={sectionKey?.replace('/', '') || ''}>
      {/* ══ MOTIF — colored strokes via CSS mask ══ */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
        {/* Motif — same technique everywhere so position never shifts */}
        <div style={{
          width:'100%',height:'100%',
          ...(sectionColor ? {
            /* Section pages: mask → only strokes visible, colored by pole */
            background: sectionColor,
            WebkitMaskImage: `url(${motifSrc})`,
            maskImage: `url(${motifSrc})`,
            WebkitMaskSize: 'cover',
            maskSize: 'cover',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            opacity: theme === 'dark' ? 0.4 : 0.3,
          } : {
            /* Home: original motif image at full opacity */
            backgroundImage: `url(${motifSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 1,
          }),
        }} />
      </div>
      <Outlet />
      <BottomNav />
      {/* Refresh button — centered bottom on mobile, next to theme toggle on desktop */}
      <div className="refresh-btn-wrapper">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Rafraîchir les données"
          style={{
            background: 'var(--inner-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: refreshing ? 'wait' : 'pointer',
            opacity: refreshing ? 0.5 : 0.7,
            transition: 'opacity 0.2s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{
            animation: refreshing ? 'spin 1s linear infinite' : 'none',
          }}>
            <path d="M13.65 2.35A7.96 7.96 0 008 0a8 8 0 108 8h-2a6 6 0 11-1.76-4.24L10 6h6V0l-2.35 2.35z" fill="var(--text-dim)" />
          </svg>
        </button>
      </div>
      {/* Theme toggle */}
      <div className="theme-toggle-wrapper">
        <ThemeToggle />
      </div>
    </div>
  )
}
