import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GroupeFilatexLogo from '../components/GroupeFilatexLogo'
import { useTheme } from '../context/ThemeContext'
import { useThemedLogo } from '../hooks/useThemedLogo'
import { useAuth } from '../hooks/useAuth'

/* ── Themed card logos — use official SVGs from OneDrive ── */
const LOGO_H = 50 // uniform height — matches Investments

function EnergyLogo() {
  const src = useThemedLogo('energy')
  return <img src={src} alt="Energy" style={{height:LOGO_H,width:'auto',maxWidth:'100%'}} draggable={false} />
}

function InvestmentsLogo() {
  const src = useThemedLogo('investments')
  return <img src={src} alt="Investments" style={{height:LOGO_H,width:'auto',maxWidth:'100%'}} draggable={false} />
}

function PropertiesLogo() {
  const src = useThemedLogo('properties')
  return <img src={src} alt="Properties" style={{height:LOGO_H,width:'auto',maxWidth:'100%'}} draggable={false} />
}

/* ── Text card SVGs — uniform viewBox for consistent sizing ── */
function CapexLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 55">
      <text fill="var(--text)" x="120" y="38" textAnchor="middle" fontFamily="'Aeonik',sans-serif" fontSize="34" fontWeight="700" letterSpacing="0.12em">CAPEX</text>
    </svg>
  )
}

function CsiLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 55">
      <text fill="var(--text)" x="120" y="38" textAnchor="middle" fontFamily="'Aeonik',sans-serif" fontSize="34" fontWeight="700" letterSpacing="0.12em">CSI</text>
    </svg>
  )
}

function ReportingLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 55">
      <text fill="var(--text)" x="120" y="38" textAnchor="middle" fontFamily="'Aeonik',sans-serif" fontSize="34" fontWeight="700" letterSpacing="0.12em">REPORTING</text>
    </svg>
  )
}

function FinanceLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 55">
      <text fill="var(--text)" x="120" y="38" textAnchor="middle" fontFamily="'Aeonik',sans-serif" fontSize="34" fontWeight="700" letterSpacing="0.12em">FINANCE</text>
    </svg>
  )
}

const CARD_LOGOS = {
  energy: EnergyLogo,
  investments: InvestmentsLogo,
  properties: PropertiesLogo,
  capex: CapexLogo,
  csi: CsiLogo,
  reporting: ReportingLogo,
  finance: FinanceLogo,
}

const SECTIONS = [
  { pole: 'energy', label: 'Energy', color: '#00ab63', path: '/energy', cardClass: 'card-energy' },
  { pole: 'investments', label: 'Investments', color: '#f37056', path: '/investments', cardClass: 'card-invest' },
  { pole: 'properties', label: 'Properties', color: '#FDB823', path: '/properties', cardClass: 'card-props' },
  { pole: 'finance', label: 'Finance', color: '#1abc9c', path: '/finance', cardClass: 'card-finance' },
  { pole: 'capex', label: 'CAPEX', color: '#5e4c9f', path: '/capex', cardClass: 'card-capex' },
  { pole: 'csi', label: 'CSI', color: '#0096c7', path: '/csi', cardClass: 'card-csi' },
  { pole: 'reporting', label: 'Reporting', color: '#426ab3', path: '/reporting', cardClass: 'card-reporting' },
]


/* ── Theme toggle — sun/moon ── */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}

export default function Accueil() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { user, logout } = useAuth()

  // Lock scroll on accueil
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  return (
    <>
      {/* ══ GLOBAL BACKGROUND ══ */}
      <div style={{position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:-1,background: theme === 'dark' ? '#000000' : '#e4f4fd',transition:'background 0.4s ease'}} />

      {/* ══ HOME ══ */}
      <div id="home" style={{position:'relative',zIndex:1,height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',overflow:'hidden',gap:0,width:'100%',boxSizing:'border-box'}}>

        {/* ── TOP RIGHT: Logout ── */}
        <div style={{position:'absolute',top:'16px',right:'16px',zIndex:10}}>
          <button
            onClick={logout}
            style={{
              background:'rgba(224,92,92,0.1)',border:'1px solid rgba(224,92,92,0.2)',
              borderRadius:'50%',width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',
              cursor:'pointer',color:'#E05C5C',transition:'all 0.2s'
            }}
            title="Déconnexion"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>

        {/* ── BOTTOM LEFT: Admin (PMO only) ── */}
        {(user?.role === 'super_admin' || user?.role === 'admin') && (
          <div style={{position:'absolute',bottom:'16px',left:'16px',zIndex:10}}>
            <button
              onClick={() => navigate('/admin')}
              style={{
                background:'rgba(58,57,92,0.15)',border:'1px solid var(--card-border)',
                borderRadius:'50%',width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',
                cursor:'pointer',color:'var(--text-muted)',transition:'all 0.2s'
              }}
              title="Administration"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── HEADER ── */}
        <header className="home-header" style={{position:'absolute',top:'48px',left:0,right:0,display:'flex',flexDirection:'column',alignItems:'center',gap:'12px',padding:'0 24px',boxSizing:'border-box',animation:'fadeIn 0.8s ease both'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
            <GroupeFilatexLogo />
          </div>

          {/* ── VALUES ── */}
          <div className="home-values" style={{display:'flex',alignItems:'center',gap:0,animation:'fadeIn 0.9s 0.1s ease both'}}>
            <span style={{fontSize:'10px',fontWeight:700,letterSpacing:'0.45em',textTransform:'uppercase',color:'var(--text)'}}>Excellence</span>
            <span className="home-val-sep" style={{width:'28px',height:'1px',background:'var(--text-muted)',margin:'0 18px'}} />
            <span style={{fontSize:'10px',fontWeight:700,letterSpacing:'0.45em',textTransform:'uppercase',color:'var(--text)'}}>Innovation</span>
            <span className="home-val-sep" style={{width:'28px',height:'1px',background:'var(--text-muted)',margin:'0 18px'}} />
            <span style={{fontSize:'10px',fontWeight:700,letterSpacing:'0.45em',textTransform:'uppercase',color:'var(--text)'}}>Engagement</span>
            <span className="home-val-sep" style={{width:'28px',height:'1px',background:'var(--text-muted)',margin:'0 18px'}} />
            <span style={{fontSize:'10px',fontWeight:700,letterSpacing:'0.45em',textTransform:'uppercase',color:'var(--text)'}}>Respect</span>
          </div>
        </header>

        {/* ── CARDS GRID ── */}
        <div className="cards-grid" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'20px',width:'100%',padding:'0 40px',margin:'0 auto',animation:'slideIn 0.7s 0.15s ease both'}}>
          <div className="cards-row1" style={{display:'inline-grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,220px))',gap:'12px',justifyContent:'center',width:'100%',maxWidth:'100%'}}>
            {SECTIONS.map((section) => {
              const LogoComponent = CARD_LOGOS[section.pole]
              return (
                <div
                  key={section.pole}
                  className={`card ${section.cardClass}`}
                  onClick={() => navigate(section.path)}
                  style={{cursor:'pointer'}}
                >
                  <div className="card-accent" />
                  <div className="card-logo-wrap">
                    <LogoComponent />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* ══ FOOTER ══ */}
      <div id="home-footer" style={{position:'fixed',bottom:'10px',left:'50%',transform:'translateX(-50%)',zIndex:2,pointerEvents:'none',textAlign:'center',whiteSpace:'nowrap',display:'flex',flexDirection:'column',alignItems:'center',gap:'3px'}}>
        <span id="home-footer-pmo" style={{fontSize:'5px',fontFamily:"'Aeonik',sans-serif",letterSpacing:'0.22em',textTransform:'uppercase',color:'var(--text-dim)', opacity: 0.24,fontWeight:500}}>Made by PMO with Love</span>
        <span id="home-footer-magritte" style={{fontSize:'11px',fontFamily:"'Aeonik',sans-serif",color:'var(--text-dim)',letterSpacing:'0.14em',fontStyle:'italic',opacity:0.79}}>Ceci n'est pas un Dashboard.</span>
      </div>
    </>
  )
}
