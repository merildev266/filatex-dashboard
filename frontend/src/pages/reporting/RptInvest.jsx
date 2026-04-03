import { useState, useMemo } from 'react'
import { invProjects } from '../../data/investments_data'
import KpiItem from '../../components/KpiItem'

// Weekly reporting data (from reporting.js invReportingWeeks)
const INV_REPORTING_WEEKS = {
  S07: { week: 'Semaine 7  |  09/02/2026 - 13/02/2026' },
  S08: { week: 'Semaine 8  |  16/02/2026 - 20/02/2026' },
  S09: { week: 'Semaine 9  |  23/02/2026 - 27/02/2026' },
  S10: { week: 'Semaine 10  |  02/03/2026 - 06/03/2026' },
  S11: { week: 'Semaine 11  |  09/03/2026 - 13/03/2026' },
}


export default function RptInvest() {
  const [filter, setFilter] = useState('externe')
  const [selectedWeek] = useState('S11')

  const ps = useMemo(() => {
    if (filter === 'all') return invProjects || []
    return (invProjects || []).filter(p => p.type === filter)
  }, [filter])

  // KPIs
  const total = ps.length
  const ext = ps.filter(p => p.type === 'externe').length
  const int = ps.filter(p => p.type === 'interne').length
  const enCours = ps.filter(p => p.status === 'En cours').length

  const sorted = [...ps].sort((a, b) => a.nom.localeCompare(b.nom))

  const weekLabel = INV_REPORTING_WEEKS[selectedWeek]?.week || selectedWeek

  return (
    <div>
      {/* Week label + filter tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-xs text-[var(--text-muted)]">{weekLabel}</span>
        <div className="flex gap-2 ml-auto">
          {[
            { key: 'externe', label: 'Externe' },
            { key: 'interne', label: 'Interne' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all
                ${filter === t.key
                  ? 'bg-[rgba(243,112,86,0.15)] text-[var(--text)] border-[rgba(243,112,86,0.3)]'
                  : 'bg-[var(--inner-card)] text-[var(--text-muted)] border-[var(--inner-card-border)]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI bar */}
      <div className="unified-card flex flex-wrap gap-4 justify-center mb-6 py-3">
        <KpiItem value={total} label="Total Projets" color="#f37056" />
        <KpiItem value={ext} label="Externe" color="#5aafaf" />
        <KpiItem value={int} label="Interne" color="#FDB823" />
        <KpiItem value={enCours} label="En cours" color="#4ecdc4" />
      </div>

      {/* Table */}
      <div className="unified-card overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--inner-card-border)]">
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Projet</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Type</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Status</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Invest</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Realise</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold text-right">%</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Resp.</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => {
              const capex = p.capex || {}
              const pctColor = (capex.pct || 0) >= 80 ? '#00ab63' : (capex.pct || 0) >= 40 ? '#FDB823' : '#E05C5C'
              const typeColor = p.type === 'externe' ? 'var(--text-dim)' : 'var(--text-dim)'

              return (
                <tr key={p.id} className="border-b border-[var(--separator-light)] hover:bg-[var(--subtle-bg)]">
                  <td className="px-3 py-2 font-semibold text-[var(--text)]">{p.nom}</td>
                  <td className="px-3 py-2">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded border"
                      style={{
                        color: typeColor,
                        background: `${typeColor}20`,
                        borderColor: `${typeColor}40`,
                      }}
                    >
                      {p.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{p.status}</td>
                  <td className="px-3 py-2 font-semibold text-[#f37056]">{capex.invest || '\u2014'}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{capex.etat || '\u2014'}</td>
                  <td className="px-3 py-2 text-right font-bold" style={{ color: p.capex ? pctColor : 'var(--text-dim)' }}>
                    {p.capex ? `${capex.pct || 0}%` : '\u2014'}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-[var(--text-muted)]">{p.resp}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
