import { useState, useMemo } from 'react'
import { HFO_PROJECTS } from '../../data/hfo_projects'
import KpiItem from '../../components/KpiItem'

function StatusBadge({ status }) {
  const map = {
    en_cours: { bg: 'rgba(0,171,99,0.15)', color: '#00ab63', label: 'En cours' },
    urgent: { bg: 'rgba(224,92,92,0.15)', color: '#E05C5C', label: 'Urgent' },
    indefini: { bg: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)', label: 'Indefini' },
    termine: { bg: 'rgba(90,175,175,0.15)', color: '#5aafaf', label: 'Termine' },
  }
  const s = map[status] || map.indefini
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-bold border"
      style={{ background: s.bg, color: s.color, borderColor: `${s.color}33` }}
    >
      {s.label}
    </span>
  )
}

// Sub-views within HFO reporting
function HfoSubCards({ onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-8">
      <div
        onClick={() => onSelect('overhauls')}
        className="bg-[rgba(255,255,255,0.03)] border border-[rgba(0,171,99,0.15)] rounded-xl p-6 text-center cursor-pointer hover:bg-[rgba(0,171,99,0.05)] transition-all"
      >
        <div className="text-base font-bold text-[#00ab63] mb-1">Overhauls</div>
        <div className="text-[11px] text-[var(--text-muted)]">Maintenance moteurs</div>
      </div>
      <div
        onClick={() => onSelect('projets')}
        className="bg-[rgba(255,255,255,0.03)] border border-[rgba(0,171,99,0.15)] rounded-xl p-6 text-center cursor-pointer hover:bg-[rgba(0,171,99,0.05)] transition-all"
      >
        <div className="text-base font-bold text-[#00ab63] mb-1">Projet annexe</div>
        <div className="text-[11px] text-[var(--text-muted)]">Projets complementaires</div>
      </div>
      <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 text-center opacity-40">
        <div className="text-base font-bold text-[#00ab63] mb-1">Informations site</div>
        <div className="text-[11px] text-[var(--text-dim)]">Bientot disponible</div>
      </div>
    </div>
  )
}

export default function RptHfo() {
  const [view, setView] = useState('cards') // 'cards' | 'overhauls' | 'projets'
  const [siteFilter, setSiteFilter] = useState('all')
  const projects = HFO_PROJECTS?.projects || []
  const sites = HFO_PROJECTS?.sites || []

  const isOverhaul = view === 'overhauls'

  const filtered = useMemo(() => {
    let ps = projects
    if (view === 'overhauls') {
      ps = ps.filter(p => p.categorie === 'overhaul')
    } else if (view === 'projets') {
      ps = ps.filter(p => p.categorie !== 'overhaul')
    }
    if (siteFilter !== 'all') {
      ps = ps.filter(p => p.site === siteFilter)
    }
    return ps
  }, [projects, view, siteFilter])

  // Relevant sites for current view
  const relevantSites = useMemo(() => {
    const type = view === 'overhauls' ? 'overhaul' : null
    return sites.filter(s =>
      projects.some(p => {
        if (type) return p.categorie === type && p.site === s
        return p.categorie !== 'overhaul' && p.site === s
      })
    )
  }, [projects, sites, view])

  // KPIs
  const total = filtered.length
  const enCours = filtered.filter(p => p.status === 'en_cours').length
  const urgent = filtered.filter(p => p.status === 'urgent').length
  const delayed = filtered.filter(p => (p.ecartJours || 0) > 30).length

  if (view === 'cards') {
    return <HfoSubCards onSelect={v => { setView(v); setSiteFilter('all') }} />
  }

  return (
    <div>
      {/* View nav tabs */}
      <div className="flex gap-2 mb-4">
        {['overhauls','projets','info'].map(v => (
          <button
            key={v}
            onClick={() => { setView(v); setSiteFilter('all') }}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all
              ${view === v
                ? 'bg-[rgba(0,171,99,0.15)] border-[rgba(0,171,99,0.4)] text-[#00ab63]'
                : 'bg-transparent border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.6)]'
              }`}
          >
            {v === 'overhauls' ? 'Overhauls' : v === 'projets' ? 'Projets' : 'Info'}
          </button>
        ))}
      </div>

      {/* Site filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSiteFilter('all')}
          className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all
            ${siteFilter === 'all'
              ? 'bg-[rgba(0,171,99,0.15)] text-[#00ab63] border-[rgba(0,171,99,0.3)]'
              : 'bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] border-[rgba(255,255,255,0.1)]'}`}
        >
          Tous
        </button>
        {relevantSites.map(s => (
          <button
            key={s}
            onClick={() => setSiteFilter(s)}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all
              ${siteFilter === s
                ? 'bg-[rgba(0,171,99,0.15)] text-[#00ab63] border-[rgba(0,171,99,0.3)]'
                : 'bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] border-[rgba(255,255,255,0.1)]'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* KPI bar */}
      <div className="flex flex-wrap gap-4 justify-center mb-6 py-3 bg-[rgba(255,255,255,0.02)] rounded-xl">
        <KpiItem value={total} label="Total" color="#00ab63" />
        <KpiItem value={enCours} label="En cours" color="#5aafaf" />
        <KpiItem value={urgent} label="Urgent" color="#E05C5C" />
        <KpiItem value={delayed} label=">30j retard" color="#FDB823" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.1)]">
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Site</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Projet</th>
              {isOverhaul && <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Moteur</th>}
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Status</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Ecart (j)</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">DTG (j)</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Commentaire</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Action</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Resp.</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const ecartColor = (p.ecartJours || 0) > 90 ? '#E05C5C' : (p.ecartJours || 0) > 30 ? '#FDB823' : '#00ab63'
              return (
                <tr key={i} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="px-3 py-2 whitespace-nowrap text-[#5aafaf] font-semibold">{p.site}</td>
                  <td className="px-3 py-2 font-semibold text-[var(--text)] max-w-[200px]">{p.projet}</td>
                  {isOverhaul && <td className="px-3 py-2 text-[#FDB823] font-semibold">{p.moteur || '\u2014'}</td>}
                  <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                  <td className="px-3 py-2 font-semibold" style={{ color: ecartColor }}>
                    {p.ecartJours != null ? `${p.ecartJours}j` : '\u2014'}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {p.dayToGo != null ? `${p.dayToGo}j` : '\u2014'}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-[var(--text-muted)] max-w-[250px] whitespace-pre-wrap break-words">
                    {p.commentaire || ''}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-[var(--text-muted)] max-w-[200px] whitespace-pre-wrap break-words">
                    {p.action || ''}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-[11px]">{p.resp || ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
