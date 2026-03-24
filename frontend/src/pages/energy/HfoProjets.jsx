import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { HFO_PROJECTS } from '../../data/hfo_projects'
import { HFO_STATUS_LABELS, HFO_STATUS_COLORS, HFO_CAT_LABELS, formatDateFR } from '../../utils/projects'

function parseProjects() {
  const projects = (HFO_PROJECTS || []).map(p => ({ ...p }))
  const total = projects.length
  const overhauls = projects.filter(p => (p.categorie || '').toLowerCase() === 'overhaul').length
  const enCours = projects.filter(p => p.status === 'En cours').length
  const termine = projects.filter(p => p.status === 'Terminé').length
  const urgents = projects.filter(p => p.dayToGo != null && p.dayToGo <= 7 && p.status === 'En cours').length
  const sites = [...new Set(projects.map(p => p.site).filter(Boolean))]
  const bySite = {}
  sites.forEach(s => {
    const sp = projects.filter(p => p.site === s)
    bySite[s] = { total: sp.length }
  })
  return { projects, total, overhauls, enCours, termine, urgents, sites, bySite }
}

export default function HfoProjets() {
  const navigate = useNavigate()
  const hfp = useMemo(() => parseProjects(), [])
  const [filter, setFilter] = useState(null)

  const filtered = useMemo(() => {
    if (!filter) return hfp.projects
    if (filter.type === 'cat') return hfp.projects.filter(p => p.categorie === filter.key.toLowerCase())
    return hfp.projects.filter(p => p.site === filter.key)
  }, [filter, hfp])

  return (
    <div className="inner-page-inner">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/energy')}
          className="text-[#00ab63] text-sm font-bold bg-transparent border border-[rgba(0,171,99,0.3)] rounded-lg px-3 py-1 cursor-pointer hover:bg-[rgba(0,171,99,0.08)]"
        >
          ← Energy
        </button>
        <h2 className="text-lg font-extrabold tracking-wider uppercase">Projets HFO</h2>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { value: hfp.total, label: 'Total', color: 'rgba(255,255,255,0.9)' },
          { value: hfp.overhauls, label: 'Overhauls', color: 'rgba(255,255,255,0.9)' },
          { value: hfp.enCours, label: 'En cours', color: '#FDB823' },
          { value: hfp.termine, label: 'Terminés', color: '#00ab63' },
          { value: hfp.urgents, label: 'Urgents', color: '#f37056' },
        ].map(k => (
          <div key={k.label} className="s1-card text-center">
            <div className="text-2xl font-extrabold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[8px] font-bold tracking-widest uppercase text-[var(--text-dim)] mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filter by site/category */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-2 mb-6">
        <button
          onClick={() => setFilter(null)}
          className={`rounded-xl p-3 text-center cursor-pointer transition-all border
            ${!filter ? 'border-[#00ab63] bg-[rgba(0,171,99,0.08)]' : 'border-[rgba(138,146,171,0.15)] bg-[rgba(138,146,171,0.05)] hover:border-[rgba(138,146,171,0.5)]'}`}
        >
          <div className="text-[10px] font-bold text-white/70 mb-1">Tous</div>
          <div className="text-xl font-extrabold text-white/90">{hfp.total}</div>
        </button>
        <button
          onClick={() => setFilter(filter?.key === 'OVERHAUL' ? null : { type: 'cat', key: 'OVERHAUL' })}
          className={`rounded-xl p-3 text-center cursor-pointer transition-all border
            ${filter?.key === 'OVERHAUL' ? 'border-[#00ab63] bg-[rgba(0,171,99,0.08)]' : 'border-[rgba(138,146,171,0.15)] bg-[rgba(138,146,171,0.05)] hover:border-[rgba(138,146,171,0.5)]'}`}
        >
          <div className="text-[10px] font-bold text-white/70 mb-1">Overhauls</div>
          <div className="text-xl font-extrabold text-white/90">{hfp.overhauls}</div>
        </button>
        {hfp.sites.map(s => (
          <button
            key={s}
            onClick={() => setFilter(filter?.key === s ? null : { type: 'site', key: s })}
            className={`rounded-xl p-3 text-center cursor-pointer transition-all border
              ${filter?.key === s ? 'border-[#00ab63] bg-[rgba(0,171,99,0.08)]' : 'border-[rgba(138,146,171,0.15)] bg-[rgba(138,146,171,0.05)] hover:border-[rgba(138,146,171,0.5)]'}`}
          >
            <div className="text-[10px] font-bold text-white/70 mb-1">{s.charAt(0) + s.slice(1).toLowerCase()}</div>
            <div className="text-xl font-extrabold text-white/90">{hfp.bySite[s]?.total || 0}</div>
          </button>
        ))}
      </div>

      {/* Project list */}
      <div className="text-[10px] font-bold tracking-widest uppercase text-[rgba(138,146,171,0.6)] border-b border-[rgba(138,146,171,0.15)] pb-2 mb-3">
        {filter ? (filter.type === 'cat' ? `Overhauls — ${filtered.length} projets` : `${filter.key.charAt(0)}${filter.key.slice(1).toLowerCase()} — ${filtered.length} projets`) : `Tous les projets — ${filtered.length}`}
      </div>
      <div className="space-y-2">
        {filtered.map((p, i) => {
          const sCol = HFO_STATUS_COLORS[p.status] || 'rgba(138,146,171,0.5)'
          const sLabel = HFO_STATUS_LABELS[p.status] || p.status
          const cLabel = HFO_CAT_LABELS[p.categorie] || p.categorie
          return (
            <div key={i} className="glass-card p-3.5 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white/85 truncate">{p.projet}</div>
                <div className="text-[9px] text-white/35 mt-0.5">
                  {cLabel}{p.moteur ? ` · ${p.moteur}` : ''}{p.resp ? ` · ${p.resp}` : ''}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[9px] font-bold tracking-wider uppercase" style={{ color: sCol }}>
                  {sLabel}
                </div>
                {p.dayToGo != null && p.dayToGo > 0 && (
                  <div className="text-sm font-extrabold text-white/70 mt-0.5">
                    {p.dayToGo} <span className="text-[9px] font-normal text-white/30">jours</span>
                  </div>
                )}
                {p.dlRevu && (
                  <div className="text-[8px] text-white/25 mt-0.5">DL: {formatDateFR(p.dlRevu)}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
