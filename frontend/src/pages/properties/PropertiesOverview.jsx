import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { propsData_dev, propsData_tvx, propsData_sav } from '../../data/props_data'
import { comData_venteImmoTotal, comData_venteFonciereTotal, comData_locationTotal } from '../../data/commercial_objectives'

const AZUR = '#426ab3'
const PROPS = '#FDB823'
const VERT = '#00ab63'
const RED = '#E05C5C'

function countByTiming(items) {
  let onTime = 0, delay = 0
  items.forEach(p => {
    if (p.timing_var === 'Delay' || p.timing_var === 'delay') delay++
    else onTime++
  })
  return { onTime, delay, total: items.length }
}

function SubCard({ title, icon, count, subtitle, accent, delayCount, onClick }) {
  return (
    <div
      onClick={onClick}
      className="glass-card p-5 cursor-pointer hover:-translate-y-1 transition-transform group"
      style={{ background: `${accent}08`, borderColor: `${accent}25` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: `${accent}20` }}
          >
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: accent }}>{title}</h2>
          </div>
        </div>
        <span className="text-[var(--text-dim)] group-hover:text-white transition-colors text-lg">
          &#8594;
        </span>
      </div>

      <div className="text-center mb-3">
        <div className="text-3xl font-extrabold" style={{ color: accent }}>
          {count}
        </div>
        <div className="text-[10px] text-[var(--text-muted)] mt-1">{subtitle}</div>
      </div>

      {delayCount != null && (
        <div className="flex items-center justify-center gap-2 mt-2">
          {delayCount > 0 ? (
            <span className="text-[10px] font-bold text-[#E05C5C] bg-[rgba(224,92,92,0.1)] px-2 py-0.5 rounded">
              {delayCount} en retard
            </span>
          ) : (
            <span className="text-[10px] font-bold text-[#00ab63] bg-[rgba(0,171,99,0.1)] px-2 py-0.5 rounded">
              Tous dans les temps
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function PropertiesOverview() {
  const navigate = useNavigate()

  const dev = useMemo(() => countByTiming(propsData_dev), [])
  const tvx = useMemo(() => countByTiming(propsData_tvx), [])
  const sav = useMemo(() => countByTiming(propsData_sav), [])

  const comTotal = useMemo(() => {
    const total = (comData_venteImmoTotal || 0) + (comData_venteFonciereTotal || 0) + (comData_locationTotal || 0)
    return total
  }, [])

  const formatEur = (v) => {
    if (v >= 1000000) return (v / 1000000).toFixed(1) + ' M'
    if (v >= 1000) return (v / 1000).toFixed(0) + ' k'
    return v.toLocaleString()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SubCard
        title="Developpement"
        icon="&#128204;"
        count={dev.total}
        subtitle="Projets en developpement"
        accent={AZUR}
        delayCount={dev.delay}
        onClick={() => navigate('/properties/dev')}
      />
      <SubCard
        title="Travaux"
        icon="&#128679;"
        count={tvx.total}
        subtitle="Projets en cours"
        accent={PROPS}
        delayCount={tvx.delay}
        onClick={() => navigate('/properties/tvx')}
      />
      <SubCard
        title="SAV"
        icon="&#128295;"
        count={sav.total}
        subtitle="Projets apres-vente"
        accent="#5aafaf"
        delayCount={sav.delay}
        onClick={() => navigate('/properties/sav')}
      />
      <SubCard
        title="Commercial"
        icon="&#128176;"
        count={formatEur(comTotal) + ' EUR'}
        subtitle="Objectif annuel total"
        accent="#f37056"
        delayCount={null}
        onClick={() => navigate('/properties/com')}
      />
    </div>
  )
}
