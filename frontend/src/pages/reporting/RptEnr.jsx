import { useState, useMemo } from 'react'
import { REPORTING_ENR } from '../../data/reporting_data'
import KpiItem from '../../components/KpiItem'

const PHASE_ORDER = { Construction: 0, Developpement: 1, Planifie: 2, Termine: 3 }

function PhaseBadge({ phase }) {
  const map = {
    Termine: 'bg-[rgba(0,171,99,0.15)] text-[var(--text)] border-[rgba(0,171,99,0.3)]',
    Construction: 'bg-[rgba(253,184,35,0.15)] text-[var(--text)] border-[rgba(253,184,35,0.3)]',
    Developpement: 'bg-[rgba(66,106,179,0.15)] text-[var(--text)] border-[rgba(66,106,179,0.3)]',
    Planifie: 'bg-[rgba(255,255,255,0.06)] text-[var(--text-dim)] border-[rgba(255,255,255,0.1)]',
  }
  const cls = map[phase] || map.Planifie
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${cls}`}>
      {phase || '\u2014'}
    </span>
  )
}

export default function RptEnr() {
  const data = REPORTING_ENR
  const weekKeys = useMemo(() => {
    if (!data?.weeks) return []
    return Object.keys(data.weeks).sort((a, b) => {
      return parseInt(b.replace('S', '')) - parseInt(a.replace('S', ''))
    })
  }, [data])

  const [selectedWeek, setSelectedWeek] = useState(data?.currentSheet || weekKeys[0] || '_current')

  // Get projects for selected week
  const projects = useMemo(() => {
    if (data?.weeks && data.weeks[selectedWeek]) {
      return data.weeks[selectedWeek].projects || []
    }
    return data?.projects || []
  }, [data, selectedWeek])

  const weekLabel = useMemo(() => {
    if (data?.weeks && data.weeks[selectedWeek]) {
      return data.weeks[selectedWeek].week || ''
    }
    return data?.week || ''
  }, [data, selectedWeek])

  if (!data || !projects.length) {
    return <div className="text-sm text-[var(--text-dim)]">Aucune donnee ENR</div>
  }

  // KPIs
  const total = projects.length
  const termine = projects.filter(p => p.phase === 'Termine').length
  const construction = projects.filter(p => p.phase === 'Construction').length
  const dev = projects.filter(p => p.phase === 'Developpement').length
  const planifie = projects.filter(p => p.phase === 'Planifie').length
  const delayed = projects.filter(p => p.glissement > 0).length
  const totalMw = projects.reduce((s, p) => s + (p.puissance || 0), 0)

  // Sort
  const sorted = [...projects].sort((a, b) => {
    const oa = PHASE_ORDER[a.phase] ?? 9
    const ob = PHASE_ORDER[b.phase] ?? 9
    if (oa !== ob) return oa - ob
    return (b.avancement || 0) - (a.avancement || 0)
  })

  return (
    <div>
      {/* Week selector */}
      {weekKeys.length > 0 && (
        <div className="mb-4">
          <select
            value={selectedWeek}
            onChange={e => setSelectedWeek(e.target.value)}
            className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.15)]
                       rounded-lg text-[var(--text)] text-xs font-semibold px-3 py-1.5
                       cursor-pointer outline-none"
          >
            {weekKeys.map(k => (
              <option key={k} value={k}>
                {k} {'\u2014'} {data.weeks[k]?.week || ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* KPI bar */}
      <div className="flex flex-wrap gap-4 justify-center mb-6 py-3 bg-[rgba(255,255,255,0.02)] rounded-xl">
        <KpiItem value={total} label="Total Projets" color="#5aafaf" />
        <KpiItem value={totalMw.toFixed(1)} label="MWc Pipeline" color="#00ab63" />
        <KpiItem value={termine} label="Termines" color="#00ab63" />
        <KpiItem value={construction} label="Construction" color="#FDB823" />
        <KpiItem value={dev + planifie} label="Dev / Planifie" color="#5aafaf" />
        <KpiItem value={delayed} label="En retard" color="#E05C5C" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.1)]">
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Projet</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold text-right">MWc</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Phase</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Avancement</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Glissement</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">EPC</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Blocages & Risques</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Actions S</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => {
              const progColor = p.avancement >= 80 ? '#00ab63' : p.avancement >= 40 ? '#FDB823' : '#5aafaf'
              const glissColor = p.glissement > 30 ? '#E05C5C' : p.glissement > 0 ? '#FDB823' : '#00ab63'
              const glissText = p.glissement > 0 ? `+${p.glissement}j` : p.glissement === 0 ? '0j' : `${p.glissement}j`

              return (
                <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="px-3 py-2 font-semibold whitespace-nowrap text-[var(--text)]">{p.projet}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{p.puissance || 0}</td>
                  <td className="px-3 py-2"><PhaseBadge phase={p.phase} /></td>
                  <td className="px-3 py-2">
                    <span className="font-semibold" style={{ color: progColor }}>{p.avancement || 0}%</span>
                    <div className="w-full h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full mt-1">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${p.avancement || 0}%`, background: progColor }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 font-semibold" style={{ color: glissColor }}>{glissText}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{p.epc || ''}</td>
                  <td className="px-3 py-2 text-[11px] text-[var(--text-muted)] max-w-[200px]">{p.blocages || ''}</td>
                  <td className="px-3 py-2 text-[11px] text-[var(--text-muted)] max-w-[200px]">{p.actions || ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
