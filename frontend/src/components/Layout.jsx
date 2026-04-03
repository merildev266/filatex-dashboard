import { Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import BottomNav from './BottomNav'
import ThemeToggle from './ThemeToggle'

const MOTIF_BASE = import.meta.env.BASE_URL + 'logos'

export default function Layout() {
  const location = useLocation()
  const { theme } = useTheme()
  const isHome = location.pathname === '/'
  const motifSrc = theme === 'dark' ? `${MOTIF_BASE}/motif-dark.svg` : `${MOTIF_BASE}/motif-light.svg`
  return (
    <div className={`min-h-screen bg-dark ${isHome ? '' : 'pb-14'}`}>
      {/* ══ MOTIF STATIQUE (toutes pages) ══ */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,opacity:isHome ? 0.3 : 0.35,lineHeight:0,overflow:'hidden'}}>
        <img src={motifSrc} alt="" style={{width:'100%',height:'100%',display:'block',objectFit:'cover'}} draggable={false} />
      </div>
      <div style={{position:'relative',zIndex:1}}>
        <Outlet />
      </div>
      <BottomNav />
      {/* Theme toggle — fixed bottom right */}
      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 100 }}>
        <ThemeToggle />
      </div>
    </div>
  )
}
