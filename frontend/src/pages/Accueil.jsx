import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GroupeFilatexLogo from '../components/GroupeFilatexLogo'
import { useTheme } from '../context/ThemeContext'
import { useThemedLogo } from '../hooks/useThemedLogo'

/* ── Scrolling motif SVG pattern ── */
function MotifSvg() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 604.26 202.36" preserveAspectRatio="none" className="motif-svg" style={{width:'50%',height:'100%',flexShrink:0,display:'block'}}>
      <defs><style>{`.motif-cls{fill:none;stroke:var(--motif-stroke,#1a1d35);stroke-miterlimit:10;stroke-width:.6px;}@media(max-width:768px){.motif-cls{stroke-width:1.8px;}}`}</style></defs>
      <g>
        <path className="motif-cls" d="M50.23,201.96h14.43l3.4-57.77c1.68-28.54,1.68-57.49,0-86.03L64.66.4h-14.43l3.45,58.61c1.65,27.98,1.65,56.35,0,84.33l-3.45,58.61Z"/>
        <path className="motif-cls" d="M38.97,143.35c-1.65-27.98-1.65-56.35,0-84.33L42.43.4h-14.43l-3.4,57.77c-1.68,28.54-1.68,57.49,0,86.03l3.4,57.77h14.43l-3.45-58.61Z"/>
        <path className="motif-cls" d="M468.38,54.94c-2.33,6.93-4.11,14.03-5.36,21.21-.36-2.21-.76-4.43-1.21-6.63L447.52.4h-34.33l15.7,75.93c3.41,16.49,3.41,33.21,0,49.7l-15.7,75.93h34.33l14.29-69.12c.46-2.21.85-4.42,1.21-6.63,1.25,7.18,3.03,14.28,5.36,21.21l18.35,54.55h90.94l19.25-57.23c9.45-28.08,9.45-59.02,0-87.1L577.67.4h-90.94l-18.35,54.55ZM532.2.78l23.76,70.62c6.46,19.2,6.46,40.35,0,59.54l-23.76,70.62-22.85-67.94c-7.04-20.93-7.04-43.98,0-64.91L532.2.78Z"/>
        <rect className="motif-cls" x=".25" y=".4" width="4.8" height="201.56"/>
        <path className="motif-cls" d="M299.8,201.96h24.39l9.73-54.4c5.51-30.78,5.51-61.99,0-92.76L324.19.4h-24.39l10.49,58.63c5.01,27.97,5.01,56.33,0,84.3l-10.49,58.63Z"/>
        <path className="motif-cls" d="M385.14,126.03c-3.41-16.49-3.41-33.21,0-49.7L400.83.4h-34.33l-14.29,69.12c-4.34,21.01-4.34,42.31,0,63.31l14.29,69.12h34.33l-15.7-75.93Z"/>
        <path className="motif-cls" d="M105.1,152.92c-4.66-34.33-4.66-69.15,0-103.48L111.75.4h-19.38l-6.3,46.46c-4.89,36.05-4.89,72.6,0,108.65l6.3,46.46h19.38l-6.65-49.04Z"/>
        <path className="motif-cls" d="M189.19,201.96h19.38l6.3-46.46c4.89-36.05,4.89-72.6,0-108.65L208.58.4h-19.38l6.65,49.04c4.66,34.33,4.66,69.15,0,103.48l-6.65,49.04Z"/>
        <path className="motif-cls" d="M260.44,143.33c-5.01-27.97-5.01-56.33,0-84.3L270.93.4h-24.39l-9.73,54.4c-5.51,30.78-5.51,61.99,0,92.76l9.73,54.4h24.39l-10.49-58.63Z"/>
      </g>
    </svg>
  )
}

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

/* ── CAPEX card SVG (no official logo — text with theme color) ── */
function CapexLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 55">
      <text fill="var(--text)" x="90" y="38" textAnchor="middle" fontFamily="'Larken','Playfair Display',serif" fontSize="38" fontWeight="400" fontStyle="italic">CAPEX</text>
    </svg>
  )
}

/* ── CSI card SVG ── */
function CsiLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 55">
      <text fill="var(--text)" x="60" y="38" textAnchor="middle" fontFamily="'Larken','Playfair Display',serif" fontSize="38" fontWeight="400" fontStyle="italic">CSI</text>
    </svg>
  )
}

/* ── Reporting card SVG ── */
function ReportingLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 55">
      <text fill="var(--text)" x="90" y="38" textAnchor="middle" fontFamily="'Larken','Playfair Display',serif" fontSize="32" fontWeight="400" fontStyle="italic">Reporting</text>
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
}

const SECTIONS = [
  { pole: 'energy', label: 'Energy', color: '#00ab63', path: '/energy', cardClass: 'card-energy' },
  { pole: 'investments', label: 'Investments', color: '#f37056', path: '/investments', cardClass: 'card-invest' },
  { pole: 'properties', label: 'Properties', color: '#FDB823', path: '/properties', cardClass: 'card-props' },
  { pole: 'capex', label: 'CAPEX', color: '#5e4c9f', path: '/capex', cardClass: 'card-capex' },
  { pole: 'csi', label: 'CSI', color: '#0096c7', path: '/csi', cardClass: 'card-csi' },
  { pole: 'reporting', label: 'Reporting', color: '#5aafaf', path: '/reporting', cardClass: 'card-reporting' },
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
      <div style={{position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0,background: theme === 'dark' ? '#000000' : '#e4f4fd',transition:'background 0.4s ease'}} />

      {/* ══ MOTIF DEFILANT ══ */}
      <div id="home-motif" style={{position:'fixed',left:0,right:0,top:0,bottom:0,pointerEvents:'none',zIndex:0,opacity:0.65,lineHeight:0,overflow:'hidden'}}>
        <div style={{display:'flex',width:'200%',height:'100%',animation:'scrollMotif 40s linear infinite'}}>
          <MotifSvg />
          <MotifSvg />
        </div>
      </div>

      {/* ══ HOME ══ */}
      <div id="home" style={{position:'relative',zIndex:1,height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',overflow:'hidden',gap:0,width:'100%',boxSizing:'border-box'}}>

        {/* ── THEME TOGGLE — bottom right ── */}
        <div style={{position:'absolute',bottom:'16px',right:'16px',zIndex:10}}>
          <ThemeToggle />
        </div>

        {/* ── HEADER ── */}
        <header className="home-header" style={{position:'absolute',top:'48px',left:0,right:0,display:'flex',flexDirection:'column',alignItems:'center',gap:'12px',padding:'0 24px',boxSizing:'border-box',animation:'fadeIn 0.8s ease both'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
            <GroupeFilatexLogo />
          </div>

          {/* ── VALUES ── */}
          <div className="home-values" style={{display:'flex',alignItems:'center',gap:0,animation:'fadeIn 0.9s 0.1s ease both'}}>
            <span style={{fontSize:'10px',fontWeight:700,letterSpacing:'0.45em',textTransform:'uppercase',color:'var(--text-dim)'}}>Excellence</span>
            <span className="home-val-sep" style={{width:'28px',height:'1px',background:'rgba(255,255,255,0.1)',margin:'0 18px'}} />
            <span style={{fontSize:'10px',fontWeight:700,letterSpacing:'0.45em',textTransform:'uppercase',color:'var(--text-dim)'}}>Innovation</span>
            <span className="home-val-sep" style={{width:'28px',height:'1px',background:'rgba(255,255,255,0.1)',margin:'0 18px'}} />
            <span style={{fontSize:'10px',fontWeight:700,letterSpacing:'0.45em',textTransform:'uppercase',color:'var(--text-dim)'}}>Engagement</span>
            <span className="home-val-sep" style={{width:'28px',height:'1px',background:'rgba(255,255,255,0.1)',margin:'0 18px'}} />
            <span style={{fontSize:'10px',fontWeight:700,letterSpacing:'0.45em',textTransform:'uppercase',color:'var(--text-dim)'}}>Respect</span>
          </div>
        </header>

        {/* ── CARDS GRID ── */}
        <div className="cards-grid" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'20px',width:'100%',padding:'0 40px',margin:'0 auto',animation:'slideIn 0.7s 0.15s ease both'}}>
          <div className="cards-row1" style={{display:'inline-grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,220px))',gap:'12px',justifyContent:'center',width:'100%',maxWidth:'720px'}}>
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
        <span id="home-footer-pmo" style={{fontSize:'5px',fontFamily:"'Aeonik','DM Sans',sans-serif",letterSpacing:'0.22em',textTransform:'uppercase',color:'var(--text-dim)', opacity: 0.3,fontWeight:500}}>Made by PMO with <span style={{fontSize:'7px',color:'rgba(255,107,138,0.12)'}}>&#9829;</span></span>
        <span id="home-footer-magritte" style={{fontSize:'11px',fontFamily:"'Aeonik','DM Sans',sans-serif",color:'var(--text-dim)',letterSpacing:'0.14em',fontStyle:'italic'}}>Ceci n'est pas un Dashboard.</span>
      </div>
    </>
  )
}
