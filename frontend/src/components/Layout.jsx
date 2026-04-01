import { Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import BottomNav from './BottomNav'

const MOTIF_BASE = import.meta.env.BASE_URL + 'logos'

export default function Layout() {
  const location = useLocation()
  const { theme } = useTheme()
  const isHome = location.pathname === '/'
  const motifSrc = theme === 'dark' ? `${MOTIF_BASE}/motif-dark.svg` : `${MOTIF_BASE}/motif-light.svg`
  return (
    <div className={`min-h-screen bg-dark ${isHome ? '' : 'pb-14'}`}>
      {/* ══ MOTIF DEFILANT (toutes pages) ══ */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,opacity:0.65,lineHeight:0,overflow:'hidden'}}>
        <div style={{display:'flex',width:'200%',height:'100%',animation:'scrollMotif 44s linear infinite'}}>
          <img src={motifSrc} alt="" style={{width:'50%',height:'100%',flexShrink:0,display:'block',objectFit:'cover',paddingRight:'40px',boxSizing:'border-box'}} draggable={false} />
          <img src={motifSrc} alt="" style={{width:'50%',height:'100%',flexShrink:0,display:'block',objectFit:'cover',paddingLeft:'40px',boxSizing:'border-box'}} draggable={false} />
        </div>
      </div>
      <Outlet />
      <BottomNav />
    </div>
  )
}
