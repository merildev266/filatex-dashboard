import { Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
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
  const isHome = location.pathname === '/'
  const motifSrc = theme === 'dark' ? `${MOTIF_BASE}/motif-dark.svg` : `${MOTIF_BASE}/motif-light.svg`

  const sectionKey = getSectionFromPath(location.pathname)
  const sectionColor = sectionKey ? SECTION_COLORS[sectionKey] : null

  return (
    <div className={`min-h-screen bg-dark ${isHome ? '' : 'pb-14'}`} data-section={sectionKey?.replace('/', '') || ''}>
      {/* ══ MOTIF — colored strokes via CSS mask ══ */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
        {sectionColor ? (
          /* Section pages: motif as mask → pole-colored strokes */
          <div style={{
            width:'100%',height:'100%',
            background: sectionColor,
            WebkitMaskImage: `url(${motifSrc})`,
            maskImage: `url(${motifSrc})`,
            WebkitMaskSize: 'cover',
            maskSize: 'cover',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            opacity: theme === 'dark' ? 0.4 : 0.3,
          }} />
        ) : (
          /* Home: original motif at full opacity */
          <img src={motifSrc} alt="" style={{width:'100%',height:'100%',display:'block',objectFit:'cover',opacity:1}} draggable={false} />
        )}
      </div>
      <Outlet />
      <BottomNav />
      {/* Theme toggle — fixed bottom right */}
      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 100 }}>
        <ThemeToggle />
      </div>
    </div>
  )
}
