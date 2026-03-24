import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useFilters } from '../../hooks/useFilters'

const FILTER_KEYS = ['J-1', 'M', 'Q', 'A']

export default function Energy() {
  const navigate = useNavigate()
  const location = useLocation()
  const isRoot = location.pathname === '/energy'
  const { currentFilter, setFilter } = useFilters()

  return (
    <div style={{minHeight:'calc(100dvh - 56px)', background:'#080d18'}}>
      {/* Sticky bar matching original sd-sticky-bar */}
      <div className="sd-sticky-bar">
        <div className="nav-back">
          <button
            className="back-btn"
            onClick={() => isRoot ? navigate('/') : navigate('/energy')}
            style={{borderColor:'rgba(0,171,99,0.3)', color:'#00ab63'}}
          >
            Accueil
          </button>
        </div>
        <div className="sd-site-name" style={{color:'#00ab63'}}>Energy</div>
        <div className="nav-filter">
          <div className="time-filter">
            {FILTER_KEYS.map((key) => (
              <button
                key={key}
                className={`tfilter${currentFilter === key ? ' active' : ''}`}
                onClick={() => setFilter(key)}
                style={key === 'J-1' ? {marginRight:'8px'} : undefined}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Child routes */}
      <div style={{padding:'18px 48px 60px', maxWidth:'1440px', margin:'0 auto', position:'relative', zIndex:1}}>
        <Outlet />
      </div>
    </div>
  )
}
