import { useState, useMemo, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { propsData_sav, propsData_tvx, propsData_dev } from '../../data/props_data'
import KpiItem from '../../components/KpiItem'
import { propsData_dev_full } from '../../data/props_data_dev_full'
import { comReport_venteProjet, comReport_venteTerrain, comReport_location } from '../../data/com_reporting_data'


function TimingBadge({ timing }) {
  if (!timing) return <span className="text-[var(--text-dim)]">{'\u2014'}</span>
  if (timing === 'On Time') return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[rgba(0,171,99,0.15)] text-[var(--text)] border border-[rgba(0,171,99,0.3)]">On Time</span>
  if (timing.indexOf('Delay') >= 0) {
    const isLong = timing.indexOf('>=30') >= 0
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isLong ? 'bg-[rgba(224,92,92,0.15)] text-[var(--text)] border-[rgba(224,92,92,0.3)]' : 'bg-[rgba(253,184,35,0.15)] text-[var(--text)] border-[rgba(253,184,35,0.3)]'}`}>{timing}</span>
  }
  return <span className="text-[10px] text-[var(--text-dim)]">{timing}</span>
}

function BudgetBadge({ budget }) {
  if (!budget) return <span className="text-[var(--text-dim)]">{'\u2014'}</span>
  if (budget === 'No overrun') return <span className="text-[10px] text-[#00ab63]">{'\u2713'}</span>
  return <span className="text-[10px] text-[#E05C5C]">{budget}</span>
}

function CpsBadge({ cps }) {
  if (!cps) return <span className="text-[var(--text-dim)]">{'\u2014'}</span>
  if (cps === 'All CPs met') return <span className="text-[10px] text-[#00ab63]">{'\u2713'} OK</span>
  if (cps.indexOf('Management') >= 0) return <span className="text-[10px] text-[#FDB823]">{'\u26A0'} Mgmt</span>
  return <span className="text-[10px] text-[var(--text-muted)]">{cps}</span>
}

// Group rows by project name
function groupByProject(rows) {
  const map = {}
  const order = []
  rows.forEach(r => {
    const name = r.site || r.name || 'Inconnu'
    if (!map[name]) { map[name] = []; order.push(name) }
    map[name].push(r)
  })
  return order.map(name => ({ name, etapes: map[name] }))
}

// Sub-section tabs
const SUB_TABS = [
  { key: 'dev', label: 'D\u00e9veloppement', color: '#FDB823' },
  { key: 'tvx', label: 'Travaux', color: '#FDB823' },
  { key: 'sav', label: 'SAV', color: '#FDB823' },
  { key: 'com', label: 'Commercial', color: '#FDB823' },
]

function PropsTable({ sub }) {
  const [siteFilter, setSiteFilter] = useState('all')
  const [expandedProjects, setExpandedProjects] = useState(new Set())

  // Use full dev data for card view if available
  const useCards = sub === 'dev' && propsData_dev_full?.length > 0

  const dataMap = { sav: propsData_sav, tvx: propsData_tvx, dev: propsData_dev }
  const rawRows = dataMap[sub] || []

  // Get unique sites
  const sites = useMemo(() => {
    const s = new Set()
    rawRows.forEach(r => { if (r.site) s.add(r.site) })
    return [...s].sort()
  }, [rawRows])

  const rows = useMemo(() => {
    let r = rawRows
    if (siteFilter !== 'all') r = r.filter(row => row.site === siteFilter)
    return r
  }, [rawRows, siteFilter])

  const projects = useMemo(() => groupByProject(rows), [rows])

  // KPIs from all rows (unfiltered)
  const allProjects = useMemo(() => groupByProject(rawRows), [rawRows])
  const onTimeCount = rawRows.filter(r => r.timing_var === 'On Time').length
  const delayCount = rawRows.filter(r => r.timing_var && r.timing_var.indexOf('Delay') >= 0).length

  const toggleProject = name => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  // Card view for DEV
  if (useCards) {
    const devProjects = siteFilter === 'all'
      ? propsData_dev_full
      : propsData_dev_full.filter(p => p.name === siteFilter)

    return (
      <div>
        {/* Site filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSiteFilter('all')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all
              ${siteFilter === 'all'
                ? 'bg-[rgba(253,184,35,0.15)] text-[var(--text)] border-[rgba(253,184,35,0.3)]'
                : 'bg-[var(--inner-card)] text-[var(--text-muted)] border-[var(--inner-card-border)]'}`}
          >
            Tous
          </button>
          {propsData_dev_full.map(p => (
            <button
              key={p.name}
              onClick={() => setSiteFilter(p.name)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all
                ${siteFilter === p.name
                  ? 'bg-[rgba(253,184,35,0.15)] text-[var(--text)] border-[rgba(253,184,35,0.3)]'
                  : 'bg-[var(--inner-card)] text-[var(--text-muted)] border-[var(--inner-card-border)]'}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="unified-card flex flex-wrap gap-4 justify-center mb-6 py-3">
          <KpiItem value={propsData_dev_full.length} label="Projets" color="#00ab63" />
          <KpiItem value={propsData_dev_full.reduce((s, p) => s + p.etapes.length, 0)} label={'\u00c9tapes'} color="#5aafaf" />
          <KpiItem value={propsData_dev_full.reduce((s, p) => s + p.etapes.filter(e => e.timing_var === 'On Time').length, 0)} label="On Time" color="#FDB823" />
          <KpiItem value={propsData_dev_full.reduce((s, p) => s + p.etapes.filter(e => e.timing_var && e.timing_var.indexOf('Delay') >= 0).length, 0)} label="En retard" color="#E05C5C" />
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {devProjects.map((proj, pi) => {
            const delayedP = proj.etapes.filter(e => e.timing_var && e.timing_var.indexOf('Delay') >= 0).length
            const borderColor = delayedP > 0 ? '#E05C5C' : '#00ab63'

            return (
              <div
                key={pi}
                className="unified-card p-4"
                style={{
                  borderLeft: `3px solid ${borderColor}`,
                }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span style={{ color: delayedP > 0 ? '#E05C5C' : '#00ab63', fontSize: 14 }}>{'\u25CF'}</span>
                    <span className="font-bold text-[var(--text)] text-sm">{proj.name}</span>
                  </div>
                  <span className="text-[10px] text-[var(--text-dim)]">
                    {proj.etapes.length} {'\u00e9tape'}{proj.etapes.length > 1 ? 's' : ''}
                    {delayedP > 0 && <> {'\u2022'} <span className="text-[var(--text)]">{delayedP} retard</span></>}
                  </span>
                </div>

                {/* Etapes */}
                {proj.etapes.map((et, ei) => {
                  const lastH = et.history?.length > 0 ? et.history[et.history.length - 1] : null
                  const histKey = `${pi}-${ei}`
                  const showHist = expandedProjects.has(histKey)

                  return (
                    <div key={ei} className="mb-2 p-2 rounded-lg bg-[var(--inner-card)] border border-[var(--subtle-border)]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold text-[var(--text)]">{et.etape}</span>
                        <TimingBadge timing={et.timing_var} />
                      </div>
                      {lastH && (
                        <div className="text-xs text-[var(--text)] mb-1">
                          <span className="text-[var(--text-dim)] font-semibold">{lastH.week}</span>
                          {' \u2014 '}
                          {lastH.comment?.length > 120 ? lastH.comment.substring(0, 120) + '...' : lastH.comment}
                        </div>
                      )}
                      {et.history?.length > 1 && (
                        <>
                          <button
                            onClick={() => toggleProject(histKey)}
                            className="text-[var(--text-dim)] text-[9px] font-semibold bg-transparent border border-[rgba(253,184,35,0.2)] rounded px-2 py-0.5 cursor-pointer mt-1"
                          >
                            {showHist ? '\u25BC Masquer' : `\u25B6 Historique (${et.history.length})`}
                          </button>
                          {showHist && (
                            <div className="mt-2 p-2 bg-[var(--mini-card)] rounded-lg max-h-[200px] overflow-y-auto">
                              {[...et.history].reverse().map((h, hi) => (
                                <div key={hi} className="py-1 border-b border-[var(--separator-light)] text-[11px]">
                                  <span className="text-[var(--text-dim)] font-semibold">{h.week}</span>
                                  {' '}
                                  <span className="text-[var(--text)]">{h.comment}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Table view for SAV / TVX
  return (
    <div>
      {/* Site filter */}
      {sites.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSiteFilter('all')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all
              ${siteFilter === 'all'
                ? 'bg-[rgba(253,184,35,0.15)] text-[var(--text)] border-[rgba(253,184,35,0.3)]'
                : 'bg-[var(--inner-card)] text-[var(--text-muted)] border-[var(--inner-card-border)]'}`}
          >
            Tous
          </button>
          {sites.map(s => (
            <button
              key={s}
              onClick={() => setSiteFilter(s)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all
                ${siteFilter === s
                  ? 'bg-[rgba(253,184,35,0.15)] text-[var(--text)] border-[rgba(253,184,35,0.3)]'
                  : 'bg-[var(--inner-card)] text-[var(--text-muted)] border-[var(--inner-card-border)]'}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* KPI bar */}
      <div className="flex flex-wrap gap-4 justify-center mb-6 py-3 bg-[var(--subtle-bg)] rounded-xl">
        <KpiItem value={allProjects.length} label="Projets" color="#00ab63" />
        <KpiItem value={rawRows.length} label={'\u00c9tapes'} color="#5aafaf" />
        <KpiItem value={onTimeCount} label="On Time" color="#FDB823" />
        <KpiItem value={delayCount} label="En retard" color="#E05C5C" />
      </div>

      {/* Table with collapsible project groups */}
      <div className="unified-card overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--inner-card-border)]">
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Resp.</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">{'\u00c9tape / Objet'}</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Timing</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Budget</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Status CPS</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Dernier commentaire</th>
              <th className="px-3 py-2 text-[var(--text-muted)] font-semibold">Semaine</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((proj, pi) => {
              const delayedP = proj.etapes.filter(e => e.timing_var && e.timing_var.indexOf('Delay') >= 0).length
              const statusIcon = delayedP > 0
                ? <span className="text-[#E05C5C]">{'\u25CF'}</span>
                : <span className="text-[#00ab63]">{'\u25CF'}</span>

              return (
                <Fragment key={pi}>
                  {/* Project header row */}
                  <tr
                    className="bg-[rgba(253,184,35,0.08)] cursor-pointer"
                    onClick={() => toggleProject(proj.name)}
                  >
                    <td
                      colSpan={7}
                      className="px-3 py-2 font-bold text-[var(--text)] text-xs"
                    >
                      <span className="mr-1.5">{'\u25BE'}</span>
                      {statusIcon} {proj.name}
                      <span className="text-[var(--text-muted)] font-normal text-[11px] ml-2">
                        ({proj.etapes.length} {'\u00e9tapes'}
                        {delayedP > 0 && <> {'\u2022'} <span className="text-[var(--text)]">{delayedP} en retard</span></>})
                      </span>
                    </td>
                  </tr>
                  {/* Etape rows */}
                  {proj.etapes.map((et, ei) => (
                    <tr key={`${pi}-${ei}`} className="border-b border-[var(--separator-light)] hover:bg-[var(--subtle-bg)]">
                      <td className="px-3 py-2 whitespace-nowrap text-[11px]">{et.resp || ''}</td>
                      <td className="px-3 py-2 text-[11px] text-[var(--text-main)]">{et.etape || ''}</td>
                      <td className="px-3 py-2 text-center"><TimingBadge timing={et.timing_var} /></td>
                      <td className="px-3 py-2 text-center"><BudgetBadge budget={et.budget_var} /></td>
                      <td className="px-3 py-2 text-center"><CpsBadge cps={et.status_cps} /></td>
                      <td className="px-3 py-2 text-[10px] text-[var(--text-muted)] max-w-[300px] whitespace-pre-wrap break-words">{et.latest_comment || ''}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-[var(--text-dim)]">{et.latest_week || ''}</td>
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Commercial sub-section
function ComSection() {
  const [comFilter, setComFilter] = useState('all')

  const cats = [
    { key: 'immo', title: 'Vente Projet', color: '#FDB823', data: comReport_venteProjet || [] },
    { key: 'fonc', title: 'Vente Terrain', color: '#00ab63', data: comReport_venteTerrain || [] },
    { key: 'loc', title: 'Location', color: '#5aafaf', data: comReport_location || [] },
  ]

  const totalReport = cats.reduce((s, c) => s + c.data.length, 0)

  return (
    <div>
      {/* KPI bar */}
      <div className="flex flex-wrap gap-4 justify-center mb-6 py-3 bg-[var(--subtle-bg)] rounded-xl">
        {cats.map(cat => (
          <div
            key={cat.key}
            onClick={() => setComFilter(comFilter === cat.key ? 'all' : cat.key)}
            className={`text-center px-4 py-1 rounded-lg cursor-pointer transition-all
              ${comFilter === cat.key ? 'bg-[var(--badge-dim-bg)] border border-[var(--card-border)]' : ''}`}
          >
            <div className="text-lg font-bold" style={{ color: cat.color }}>{cat.data.length}</div>
            <div className="text-[10px] text-[var(--text-muted)]">{cat.title}</div>
          </div>
        ))}
        <KpiItem value={totalReport} label="Total suivis" color="#5aafaf" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {[{ key: 'all', label: 'Tous' }, ...cats.map(c => ({ key: c.key, label: c.title }))].map(t => (
          <button
            key={t.key}
            onClick={() => setComFilter(t.key)}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all
              ${comFilter === t.key
                ? 'bg-[rgba(253,184,35,0.15)] text-[var(--text)] border-[rgba(253,184,35,0.3)]'
                : 'bg-[var(--inner-card)] text-[var(--text-muted)] border-[var(--inner-card-border)]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards by category */}
      {cats.map(cat => {
        if (comFilter !== 'all' && comFilter !== cat.key) return null
        if (cat.data.length === 0) {
          return (
            <div key={cat.key} className="mb-8">
              <div className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>
                {cat.title} {'\u2014'} 0 items
              </div>
              <div className="text-[11px] text-[var(--text-dim)] italic">Aucun suivi disponible</div>
            </div>
          )
        }

        return (
          <div key={cat.key} className="mb-8">
            <div
              className="unified-card flex items-center justify-between mb-3 px-3 py-2"
              style={{
                borderLeft: `3px solid ${cat.color}`,
              }}
            >
              <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                {cat.title} {'\u2014'} {cat.data.length} items
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {cat.data.map((item, i) => {
                const lastH = item.history?.length > 0 ? item.history[item.history.length - 1] : null
                return (
                  <div
                    key={i}
                    className="unified-card p-3"
                    style={{
                      borderLeft: `3px solid ${lastH ? cat.color : 'var(--card-border)'}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ color: cat.color, fontSize: 13 }}>{'\u25CF'}</span>
                      <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{item.name}</span>
                      {lastH?.avancement && (
                        <span className="ml-auto text-[10px] font-bold text-[#00ab63] bg-[rgba(0,171,99,0.1)] px-2 py-0.5 rounded">
                          {lastH.avancement}
                        </span>
                      )}
                    </div>
                    {lastH ? (
                      <div className="text-[11px] mb-1">
                        <span className="text-[var(--text-dim)] font-semibold">{lastH.week}</span>
                        {lastH.phase && <> {'\u00b7'} <span style={{ color: 'var(--text-dim)' }} className="font-semibold">{lastH.phase}</span></>}
                        {lastH.comment && <div className="text-[var(--text-muted)] mt-1 leading-snug">{lastH.comment}</div>}
                      </div>
                    ) : (
                      <div className="text-[11px] text-[var(--text-dim)] italic">Aucun suivi</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function RptProps() {
  const [searchParams] = useSearchParams()
  const initialSub = searchParams.get('sub') || 'dev'
  const [activeSub, setActiveSub] = useState(initialSub)

  return (
    <div>
      {/* Sub-section tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SUB_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveSub(t.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all
              ${activeSub === t.key
                ? 'bg-[rgba(253,184,35,0.15)] text-[var(--text)] border-[rgba(253,184,35,0.3)]'
                : 'bg-[var(--inner-card)] text-[var(--text-muted)] border-[var(--inner-card-border)]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSub === 'com' ? <ComSection /> : <PropsTable sub={activeSub} />}
    </div>
  )
}
