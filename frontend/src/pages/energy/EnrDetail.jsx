import { useState, useMemo } from 'react'
import SlidePanel from '../../components/SlidePanel'
import KpiBox from '../../components/KpiBox'
import EnrProject from './EnrProject'
import { ENR_SITES } from '../../data/enr_site_data'
import { ENR_PROJECTS_DATA } from '../../data/enr_projects_data'
import { MONTH_NAMES } from '../../utils/projects'

const ENR_COLORS = ['#00ab63', '#5aafaf', '#4a8fe7']

/** ENR filter state — ENR has its own independent filters */
function useEnrFilter() {
  const [filter, setFilter] = useState('month') // 'month' | 'quarter' | 'year'
  const [monthIndex, setMonthIndex] = useState(() => getEnrDataMonth() - 1)
  const [quarter, setQuarter] = useState(() => Math.floor(new Date().getMonth() / 3) + 1)
  const [year, setYear] = useState(() => new Date().getFullYear())

  return { filter, setFilter, monthIndex, setMonthIndex, quarter, setQuarter, year, setYear }
}

function getEnrDataMonth() {
  const sites = ENR_SITES || []
  let maxMonth = 1
  sites.forEach(s => {
    if (s.latestDate) {
      const m = parseInt(s.latestDate.split('-')[1])
      if (m > maxMonth) maxMonth = m
    }
  })
  return maxMonth
}

/** Get filtered site data based on current ENR filter */
function getFilteredSiteData(site, filterState) {
  const result = { prodKwh: 0, deliveredKwh: 0, consumedKwh: 0, peakKw: 0, avgDailyKwh: 0, days: 0, label: '' }

  if (filterState.filter === 'month') {
    const mi = filterState.monthIndex
    const monthStr = new Date().getFullYear() + '-' + String(mi + 1).padStart(2, '0')
    for (let i = 0; i < site.monthly.length; i++) {
      if (site.monthly[i].month === monthStr) {
        const m = site.monthly[i]
        result.prodKwh = m.totalProdKwh
        result.deliveredKwh = m.totalDeliveredKwh
        result.consumedKwh = m.totalConsumedKwh
        result.peakKw = m.maxPeakKw
        result.avgDailyKwh = m.avgDailyProdKwh
        result.days = m.daysWithData
        result.label = MONTH_NAMES[mi] + ' ' + new Date().getFullYear()
        break
      }
    }
    return result
  }

  if (filterState.filter === 'quarter') {
    const startMonth = (filterState.quarter - 1) * 3 + 1
    const endMonth = startMonth + 2
    let totalProd = 0, totalDel = 0, totalCon = 0, maxPeak = 0, totalDays = 0
    site.monthly.forEach(m => {
      const mNum = parseInt(m.month.split('-')[1])
      if (mNum >= startMonth && mNum <= endMonth) {
        totalProd += m.totalProdKwh
        totalDel += m.totalDeliveredKwh
        totalCon += m.totalConsumedKwh
        if (m.maxPeakKw > maxPeak) maxPeak = m.maxPeakKw
        totalDays += m.daysWithData
      }
    })
    result.prodKwh = totalProd
    result.deliveredKwh = totalDel
    result.consumedKwh = totalCon
    result.peakKw = maxPeak
    result.avgDailyKwh = totalDays > 0 ? totalProd / totalDays : 0
    result.days = totalDays
    result.label = 'Q' + filterState.quarter + ' ' + new Date().getFullYear()
    return result
  }

  // year
  let totalProd = 0, totalDel = 0, totalCon = 0, maxPeak = 0, totalDays = 0
  site.monthly.forEach(m => {
    const mYear = parseInt(m.month.split('-')[0])
    if (mYear === filterState.year) {
      totalProd += m.totalProdKwh
      totalDel += m.totalDeliveredKwh
      totalCon += m.totalConsumedKwh
      if (m.maxPeakKw > maxPeak) maxPeak = m.maxPeakKw
      totalDays += m.daysWithData
    }
  })
  result.prodKwh = totalProd
  result.deliveredKwh = totalDel
  result.consumedKwh = totalCon
  result.peakKw = maxPeak
  result.avgDailyKwh = totalDays > 0 ? totalProd / totalDays : 0
  result.days = totalDays
  result.label = String(filterState.year)
  return result
}

export default function EnrDetail() {
  const filterState = useEnrFilter()
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedSite, setSelectedSite] = useState(null)
  const [view, setView] = useState('production') // 'production' | 'projets'

  const sites = ENR_SITES || []
  const projects = ENR_PROJECTS_DATA?.projects || []

  // Aggregate production data
  const { totalProdKwh, totalAvgDaily, totalCapMw, siteFiltered } = useMemo(() => {
    let tp = 0, ta = 0, tc = 0
    const sf = sites.map(s => {
      const fd = getFilteredSiteData(s, filterState)
      tp += fd.prodKwh
      ta += fd.avgDailyKwh
      tc += s.capacityMw
      return fd
    })
    return { totalProdKwh: tp, totalAvgDaily: ta, totalCapMw: tc, siteFiltered: sf }
  }, [sites, filterState.filter, filterState.monthIndex, filterState.quarter, filterState.year])

  // Project pipeline aggregates
  const pipelineAgg = useMemo(() => {
    let totalMwc = 0, totalBess = 0, totalCapex = 0
    let inConstruction = 0, termine = 0
    projects.forEach(p => {
      totalMwc += p.pvMw || 0
      totalBess += p.bessMwh || 0
      totalCapex += p.capexM || 0
      if (p.phase === 'Construction') inConstruction++
      if (p.phase === 'Termine') termine++
    })
    return { totalMwc, totalBess, totalCapex, count: projects.length, inConstruction, termine }
  }, [projects])

  const filterLabel = filterState.filter === 'month'
    ? MONTH_NAMES[filterState.monthIndex] + ' ' + new Date().getFullYear()
    : filterState.filter === 'quarter'
      ? 'Q' + filterState.quarter + ' ' + new Date().getFullYear()
      : String(filterState.year)

  const maxDataMonth = getEnrDataMonth()

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-bold">ENR — Energies Renouvelables</h2>
        <div className="flex gap-1 bg-[rgba(58,57,92,0.18)] rounded-lg p-1">
          {[
            { key: 'production', label: 'Production' },
            { key: 'projets', label: 'Projets' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setView(opt.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider
                transition-colors cursor-pointer border-none
                ${view === opt.key
                  ? 'bg-[rgba(0,171,99,0.3)] text-[#00ab63]'
                  : 'bg-transparent text-[var(--text-muted)] hover:text-white'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ======== PRODUCTION VIEW ======== */}
      {view === 'production' && (
        <>
          {/* ENR Filter bar */}
          <div className="flex gap-1 bg-[rgba(58,57,92,0.18)] rounded-lg p-1 mb-6 w-fit">
            <button
              onClick={() => { filterState.setFilter('month'); filterState.setMonthIndex(maxDataMonth - 1) }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-none transition-colors
                ${filterState.filter === 'month' ? 'bg-[rgba(0,171,99,0.3)] text-[#00ab63]' : 'bg-transparent text-[var(--text-muted)] hover:text-white'}`}
            >
              {filterState.filter === 'month' ? MONTH_NAMES[filterState.monthIndex]?.slice(0, 3) : 'M'}
            </button>
            <button
              onClick={() => filterState.setFilter('quarter')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-none transition-colors
                ${filterState.filter === 'quarter' ? 'bg-[rgba(0,171,99,0.3)] text-[#00ab63]' : 'bg-transparent text-[var(--text-muted)] hover:text-white'}`}
            >
              {filterState.filter === 'quarter' ? 'Q' + filterState.quarter : 'Q'}
            </button>
            <button
              onClick={() => filterState.setFilter('year')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-none transition-colors
                ${filterState.filter === 'year' ? 'bg-[rgba(0,171,99,0.3)] text-[#00ab63]' : 'bg-transparent text-[var(--text-muted)] hover:text-white'}`}
            >
              {filterState.filter === 'year' ? String(filterState.year) : 'A'}
            </button>
          </div>

          {/* Global KPIs (3 cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-6 text-center" style={{ background: 'rgba(0,171,99,0.07)', borderColor: 'rgba(0,171,99,0.2)' }}>
              <div className="text-[8px] font-bold tracking-widest uppercase text-[rgba(0,171,99,0.55)] mb-2">
                Production totale
              </div>
              <div className="text-4xl font-extrabold text-[#00ab63] leading-none">
                {(totalProdKwh / 1000).toFixed(1)}
                <span className="text-base font-normal text-[rgba(0,171,99,0.5)] ml-1">MWh</span>
              </div>
              <div className="text-[10px] text-[rgba(0,171,99,0.4)] mt-1.5">
                {filterLabel} · {sites.length} centrales
              </div>
            </div>

            <div className="glass-card p-6 text-center" style={{ background: 'rgba(0,171,99,0.04)', borderColor: 'rgba(0,171,99,0.12)' }}>
              <div className="text-[8px] font-bold tracking-widest uppercase text-[rgba(0,171,99,0.5)] mb-2">
                Moy. journaliere
              </div>
              <div className="text-4xl font-extrabold text-[#00ab63] leading-none">
                {(totalAvgDaily / 1000).toFixed(1)}
                <span className="text-base font-normal text-[rgba(0,171,99,0.5)] ml-1">MWh/j</span>
              </div>
              <div className="text-[10px] text-[rgba(0,171,99,0.4)] mt-1.5">
                {totalCapMw.toFixed(1)} MWc installes
              </div>
            </div>

            <div className="glass-card p-6 text-center" style={{ background: 'rgba(0,171,99,0.04)', borderColor: 'rgba(0,171,99,0.12)' }}>
              <div className="text-[8px] font-bold tracking-widest uppercase text-[rgba(0,171,99,0.5)] mb-2">
                Capacite installee
              </div>
              <div className="text-4xl font-extrabold text-[#00ab63] leading-none">
                {totalCapMw.toFixed(1)}
                <span className="text-base font-normal text-[rgba(0,171,99,0.5)] ml-1">MWc</span>
              </div>
              <div className="text-[10px] text-[rgba(0,171,99,0.4)] mt-1.5">
                {sites.length} centrales solaires
              </div>
            </div>
          </div>

          {/* Site cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sites.map((s, si) => {
              const col = ENR_COLORS[si % ENR_COLORS.length]
              const fd = siteFiltered[si]
              const pct = totalProdKwh > 0 ? (fd.prodKwh / totalProdKwh * 100).toFixed(0) : 0

              return (
                <div
                  key={s.code || si}
                  onClick={() => setSelectedSite(si)}
                  className="glass-card p-5 cursor-pointer hover:-translate-y-1 transition-transform"
                  style={{ background: `${col}0d`, borderColor: `${col}30` }}
                >
                  {/* Site name + badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-extrabold text-white/90">{s.name}</div>
                    <div
                      className="rounded-lg px-2.5 py-0.5 text-xs font-extrabold"
                      style={{ background: `${col}25`, color: col }}
                    >
                      {pct}%
                    </div>
                  </div>

                  {/* Main KPI */}
                  <div className="text-center mb-4">
                    <div className="text-4xl font-extrabold leading-none" style={{ color: col }}>
                      {(fd.prodKwh / 1000).toFixed(1)}
                      <span className="text-sm font-normal opacity-50 ml-1">MWh</span>
                    </div>
                    <div className="text-[9px] text-white/30 mt-1">
                      {filterLabel}
                    </div>
                  </div>

                  {/* Sub KPIs grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-black/20 rounded-lg p-2.5 text-center">
                      <div className="text-[7px] font-bold tracking-wider uppercase text-white/25 mb-0.5">Capacite</div>
                      <div className="text-base font-extrabold text-white/85">
                        {s.capacityMw} <span className="text-[9px] text-white/30">MWc</span>
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2.5 text-center">
                      <div className="text-[7px] font-bold tracking-wider uppercase text-white/25 mb-0.5">Livre</div>
                      <div className="text-base font-extrabold" style={{ color: col }}>
                        {(fd.deliveredKwh / 1000).toFixed(1)} <span className="text-[9px] text-white/30">MWh</span>
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2.5 text-center">
                      <div className="text-[7px] font-bold tracking-wider uppercase text-white/25 mb-0.5">Pic</div>
                      <div className="text-base font-extrabold text-white/70">
                        {fd.peakKw} <span className="text-[9px] text-white/30">kW</span>
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2.5 text-center">
                      <div className="text-[7px] font-bold tracking-wider uppercase text-white/25 mb-0.5">Jours</div>
                      <div className="text-base font-extrabold text-white/70">
                        {fd.days} <span className="text-[9px] text-white/30">j</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase" style={{ color: `${col}b0` }}>
                    <span>Voir le detail</span>
                    <span className="text-xs">→</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ======== PROJETS VIEW ======== */}
      {view === 'projets' && (
        <>
          {/* Pipeline KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="glass-card p-4 text-center" style={{ background: 'rgba(0,171,99,0.07)', borderColor: 'rgba(0,171,99,0.2)' }}>
              <KpiBox value={`${pipelineAgg.totalMwc.toFixed(1)} MWc`} label="Pipeline total" color="#00ab63" />
            </div>
            <div className="glass-card p-4 text-center">
              <KpiBox value={`${pipelineAgg.totalBess.toFixed(0)} MWh`} label="BESS" color="#5aafaf" />
            </div>
            <div className="glass-card p-4 text-center">
              <KpiBox value={`${pipelineAgg.totalCapex.toFixed(1)} M$`} label="CAPEX total" color="rgba(255,255,255,0.8)" />
            </div>
            <div className="glass-card p-4 text-center">
              <KpiBox value={pipelineAgg.count} label="Projets" color="rgba(255,255,255,0.8)" />
            </div>
          </div>

          {/* Project grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p, i) => (
              <EnrProject
                key={p.id || i}
                project={p}
                onClick={() => setSelectedProject(i)}
              />
            ))}
          </div>
        </>
      )}

      {/* ENR Site detail slide panel */}
      <SlidePanel
        isOpen={selectedSite !== null}
        onClose={() => setSelectedSite(null)}
        title={selectedSite !== null ? sites[selectedSite]?.name : ''}
      >
        {selectedSite !== null && sites[selectedSite] && (
          <EnrSiteDetailContent
            site={sites[selectedSite]}
            siteIndex={selectedSite}
            filterState={filterState}
          />
        )}
      </SlidePanel>

      {/* ENR Project detail slide panel */}
      <SlidePanel
        isOpen={selectedProject !== null}
        onClose={() => setSelectedProject(null)}
        title={selectedProject !== null ? projects[selectedProject]?.name : ''}
      >
        {selectedProject !== null && projects[selectedProject] && (
          <EnrProjectDetailContent project={projects[selectedProject]} />
        )}
      </SlidePanel>
    </div>
  )
}

/** ENR Site Detail Content */
function EnrSiteDetailContent({ site, siteIndex, filterState }) {
  const s = site
  const col = ENR_COLORS[siteIndex % ENR_COLORS.length]
  const fd = getFilteredSiteData(s, filterState)
  const filterLabel = filterState.filter === 'month'
    ? MONTH_NAMES[filterState.monthIndex] + ' ' + new Date().getFullYear()
    : filterState.filter === 'quarter'
      ? 'Q' + filterState.quarter + ' ' + new Date().getFullYear()
      : String(filterState.year)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="text-lg font-extrabold text-white/95">{s.entity}</div>
        <div className="text-[11px] text-white/35 mt-1">{s.loc} · {s.centrale}</div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          ['Capacite', s.capacityMw, 'MWc'],
          ['Production', (fd.prodKwh / 1000).toFixed(1), 'MWh'],
          ['Livre', (fd.deliveredKwh / 1000).toFixed(1), 'MWh'],
          ['Pic', fd.peakKw, 'kW'],
          ['Jours', fd.days, ''],
        ].map(([label, value, unit], i) => (
          <div
            key={label}
            className="rounded-xl p-3 text-center"
            style={{ background: `${col}10`, borderColor: `${col}1f` }}
          >
            <div className="text-[7px] font-bold tracking-wider uppercase text-white/30 mb-1.5">{label}</div>
            <div className="text-xl font-extrabold leading-none" style={{ color: i < 3 ? col : 'rgba(255,255,255,0.85)' }}>
              {value}
              {unit && <span className="text-[10px] font-normal text-white/30 ml-0.5">{unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Period label */}
      <div className="text-[9px] font-bold tracking-wider uppercase text-white/30 mb-3.5">{filterLabel}</div>

      {/* Daily production sparkline (month view) */}
      {filterState.filter === 'month' && (() => {
        const mi = filterState.monthIndex
        const monthStr = new Date().getFullYear() + '-' + String(mi + 1).padStart(2, '0')
        const monthData = s.monthly.find(m => m.month === monthStr)
        if (!monthData || !monthData.dailyProd.length) {
          return <div className="text-center py-10 text-white/30 text-sm">Pas de donnees pour ce mois</div>
        }
        const maxDayProd = Math.max(...monthData.dailyProd)
        return (
          <div className="rounded-2xl p-4 mb-6" style={{ background: `${col}0d`, borderColor: `${col}1f` }}>
            {/* Sparkline */}
            <div className="flex items-end gap-px h-20 mb-3.5">
              {monthData.dailyProd.map((dv, di) => {
                const bh = maxDayProd > 0 ? Math.max(Math.round(dv / maxDayProd * 80), 2) : 2
                return (
                  <div
                    key={di}
                    className="flex-1 rounded-t-sm"
                    style={{ height: bh, backgroundColor: col, opacity: 0.6 }}
                    title={`J${di + 1}: ${(dv / 1000).toFixed(1)} MWh`}
                  />
                )
              })}
            </div>
            {/* Sub stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-black/20 rounded-lg p-2.5 text-center">
                <div className="text-[7px] font-bold tracking-wider uppercase text-white/25">Moy/j</div>
                <div className="text-base font-extrabold" style={{ color: col }}>
                  {(monthData.avgDailyProdKwh / 1000).toFixed(1)} <span className="text-[9px] text-white/30">MWh</span>
                </div>
              </div>
              <div className="bg-black/20 rounded-lg p-2.5 text-center">
                <div className="text-[7px] font-bold tracking-wider uppercase text-white/25">Disponibilite</div>
                <div className="text-base font-extrabold text-white/70">
                  {monthData.totalAvailHours.toFixed(0)} <span className="text-[9px] text-white/30">h</span>
                </div>
              </div>
              <div className="bg-black/20 rounded-lg p-2.5 text-center">
                <div className="text-[7px] font-bold tracking-wider uppercase text-white/25">Irradiance moy.</div>
                <div className="text-base font-extrabold text-white/70">
                  {monthData.avgIrradiance || '—'}
                </div>
              </div>
            </div>
            {monthData.totalUnschedInterrupt > 0 && (
              <div className="mt-2 bg-[rgba(255,80,80,0.08)] border border-[rgba(255,80,80,0.15)] rounded-lg py-1.5 px-2.5 text-center text-[9px] text-[#ff5050] font-semibold">
                {monthData.totalUnschedInterrupt.toFixed(1)}h interruptions
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

/** ENR Project Detail Content */
function EnrProjectDetailContent({ project }) {
  const p = project
  const cc = p.cc || {}

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="text-sm text-[var(--text-dim)]">
          {p.loc} · {p.type} · {p.lead}
        </div>
        {p.epciste && (
          <div className="text-[10px] text-[var(--text-dim)] mt-1">EPC: {p.epciste}</div>
        )}
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="glass-card p-3">
          <KpiBox value={`${p.pvMw} MWc`} label="Puissance" color="#00ab63" size="sm" />
        </div>
        {p.bessMwh != null && (
          <div className="glass-card p-3">
            <KpiBox value={`${p.bessMwh} MWh`} label="BESS" color="#5aafaf" size="sm" />
          </div>
        )}
        <div className="glass-card p-3">
          <KpiBox value={p.capexM ? `${p.capexM.toFixed(2)} M$` : '—'} label="CAPEX" color="rgba(255,255,255,0.8)" size="sm" />
        </div>
        <div className="glass-card p-3">
          <KpiBox value={p.tri ? `${p.tri}%` : '—'} label="TRI" color="rgba(255,255,255,0.8)" size="sm" />
        </div>
      </div>

      {/* SPI / CPI */}
      {(cc.spi != null || cc.cpi != null) && (
        <div className="flex gap-4 mb-6">
          {cc.spi != null && (
            <div className="glass-card p-4 flex-1 text-center">
              <div className="text-[8px] font-bold tracking-wider uppercase text-[var(--text-dim)] mb-1">SPI</div>
              <div className="text-2xl font-extrabold" style={{ color: cc.spi >= 1.0 ? '#00ab63' : '#E05C5C' }}>
                {cc.spi.toFixed(2)}
              </div>
            </div>
          )}
          {cc.cpi != null && (
            <div className="glass-card p-4 flex-1 text-center">
              <div className="text-[8px] font-bold tracking-wider uppercase text-[var(--text-dim)] mb-1">CPI</div>
              <div className="text-2xl font-extrabold" style={{ color: cc.cpi >= 1.0 ? '#00ab63' : '#E05C5C' }}>
                {cc.cpi.toFixed(2)}
              </div>
            </div>
          )}
          {cc.perf && (
            <div className="glass-card p-4 flex-1 text-center flex items-center justify-center">
              <div className="text-[10px] text-[var(--text-muted)]">{cc.perf}</div>
            </div>
          )}
        </div>
      )}

      {/* Progress bars */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-[var(--text-dim)] uppercase tracking-wider font-bold">Etudes / Engineering</span>
            <span className="text-white/50">{p.engPct || p.engProgression || 0}%</span>
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(p.engPct || p.engProgression || 0, 100)}%`, backgroundColor: '#426ab3' }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-[var(--text-dim)] uppercase tracking-wider font-bold">Construction</span>
            <span className="text-white/50">{p.constProg != null ? Math.round(p.constProg * 100) : p.avancement || 0}%</span>
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(p.constProg != null ? p.constProg * 100 : p.avancement || 0, 100)}%`,
                backgroundColor: '#00ab63',
              }}
            />
          </div>
        </div>
      </div>

      {/* Studies list */}
      {p.studies && p.studies.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Etudes</h3>
          <div className="space-y-1.5">
            {p.studies.map((st, i) => (
              <div key={i} className="flex items-center justify-between glass-card p-2">
                <span className="text-[10px] text-white/70">{st.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${st.pct}%`, backgroundColor: st.pct >= 100 ? '#00ab63' : '#426ab3' }}
                    />
                  </div>
                  <span className="text-[9px] text-white/50 w-8 text-right">{st.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocages / Actions */}
      {p.blocages && (
        <div className="glass-card p-3 mb-3" style={{ background: 'rgba(224,92,92,0.06)', borderColor: 'rgba(224,92,92,0.15)' }}>
          <div className="text-[8px] font-bold tracking-wider uppercase text-[#E05C5C] mb-1">Blocages</div>
          <div className="text-[10px] text-white/60">{p.blocages}</div>
        </div>
      )}
      {p.actionsS && (
        <div className="glass-card p-3">
          <div className="text-[8px] font-bold tracking-wider uppercase text-[#00ab63] mb-1">Actions</div>
          <div className="text-[10px] text-white/60">{p.actionsS}</div>
        </div>
      )}
    </div>
  )
}
