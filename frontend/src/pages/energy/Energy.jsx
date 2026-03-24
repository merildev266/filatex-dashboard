import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useFilters } from '../../hooks/useFilters'
import FilterBar from '../../components/FilterBar'

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
          <FilterBar current={currentFilter} onChange={setFilter} />
        </div>
      </div>

      {/* Child routes */}
      <div className="inner-page-inner">
        <Outlet />
      </div>
    </div>
  )
}
