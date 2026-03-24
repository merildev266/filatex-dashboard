import { useState, useMemo } from 'react'
import SlidePanel from '../../components/SlidePanel'
import KpiBox from '../../components/KpiBox'
import { ENR_SITES } from '../../data/enr_site_data'
import { ENR_PROJECTS_DATA } from '../../data/enr_projects_data'
import { MONTH_NAMES } from '../../utils/projects'

const ENR_COLORS = ['#00ab63', '#5aafaf', '#4a8fe7']
const ENR_RGBS = ['0,171,99', '90,175,175', '74,143,231']

const PHASE_LABELS = { termine: 'Termine', construction: 'En construction', developpement: 'Developpement', planifie: 'Planifie' }
const PHASE_COLORS = { termine: '#00ab63', construction: '#FDB823', developpement: '#5aafaf', planifie: 'rgba(255,255,255,0.35)' }
const PHASE_RGBS = { termine: '0,171,99', construction: '253,184,35', developpement: '90,175,175', planifie: '255,255,255' }

/* ── ENR filter state ── */
function useEnrFilter() {
  const [filter, setFilter] = useState('month')
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

/* ── Phase classifier (same as original energy.js) ── */
function getPhase(p) {
  const today = new Date()
  const cs = new Date(p.constStart)
  const ce = new Date(p.constEnd)
  const avReel = p.cc && p.cc.avReel !== null ? p.cc.avReel : null
  if (avReel !== null) {
    if (avReel === 100) return 'termine'
    if (cs <= today) return 'construction'
  } else {
    if (ce < today && p.engPct === 100) return 'termine'
    if (cs <= today) return 'construction'
  }
  if (p.engPct !== null && p.engPct > 0) return 'developpement'
  return 'planifie'
}

/* ── Filtered site data ── */
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
        totalProd += m.totalProdKwh; totalDel += m.totalDeliveredKwh; totalCon += m.totalConsumedKwh
        if (m.maxPeakKw > maxPeak) maxPeak = m.maxPeakKw; totalDays += m.daysWithData
      }
    })
    result.prodKwh = totalProd; result.deliveredKwh = totalDel; result.consumedKwh = totalCon
    result.peakKw = maxPeak; result.avgDailyKwh = totalDays > 0 ? totalProd / totalDays : 0
    result.days = totalDays; result.label = 'Q' + filterState.quarter + ' ' + new Date().getFullYear()
    return result
  }

  // year
  let totalProd = 0, totalDel = 0, totalCon = 0, maxPeak = 0, totalDays = 0
  site.monthly.forEach(m => {
    const mYear = parseInt(m.month.split('-')[0])
    if (mYear === filterState.year) {
      totalProd += m.totalProdKwh; totalDel += m.totalDeliveredKwh; totalCon += m.totalConsumedKwh
      if (m.maxPeakKw > maxPeak) maxPeak = m.maxPeakKw; totalDays += m.daysWithData
    }
  })
  result.prodKwh = totalProd; result.deliveredKwh = totalDel; result.consumedKwh = totalCon
  result.peakKw = maxPeak; result.avgDailyKwh = totalDays > 0 ? totalProd / totalDays : 0
  result.days = totalDays; result.label = String(filterState.year)
  return result
}

/* ── Helpers ── */
function fmtM(v) { if (!v && v !== 0) return '\u2014'; return v >= 1 ? v.toFixed(1) + 'M$' : Math.round(v * 1000).toLocaleString('fr-FR') + 'k$' }
function fmtDate(d) { if (!d) return '\u2014'; const dt = new Date(d); return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }) }
function typeIcon(t) { return t === 'wind' ? '\uD83D\uDCA8' : t === 'floating' ? '\uD83C\uDF0A' : '\u2600\uFE0F' }

export default function EnrDetail() {
  const filterState = useEnrFilter()
  // view: 'main' (two-card), 'production' (detail), 'projets' (detail)
  const [view, setView] = useState('main')
  const [selectedSite, setSelectedSite] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [phaseFilter, setPhaseFilter] = useState(null)

  const sites = ENR_SITES || []
  const projects = ENR_PROJECTS_DATA?.projects || []
  const maxDataMonth = getEnrDataMonth()

  /* ── Aggregate production data ── */
  const { totalProdKwh, totalAvgDaily, totalCapMw, siteFiltered } = useMemo(() => {
    let tp = 0, ta = 0, tc = 0
    const sf = sites.map(s => {
      const fd = getFilteredSiteData(s, filterState)
      tp += fd.prodKwh; ta += fd.avgDailyKwh; tc += s.capacityMw
      return fd
    })
    return { totalProdKwh: tp, totalAvgDaily: ta, totalCapMw: tc, siteFiltered: sf }
  }, [sites, filterState.filter, filterState.monthIndex, filterState.quarter, filterState.year])

  /* ── Global totals for main card (unfiltered — latest data) ── */
  const globalTotals = useMemo(() => {
    let avgKwh = 0, prodKwh = 0, capMw = 0
    sites.forEach(s => { avgKwh += s.avgDailyKwh; prodKwh += s.totalProdKwh; capMw += s.capacityMw })
    return { avgMwhJ: (avgKwh / 1000).toFixed(1), totalMwh: Math.round(prodKwh / 1000), capMw: capMw.toFixed(1) }
  }, [sites])

  /* ── Project classification ── */
  const { grouped, totalMwc, totalCapex } = useMemo(() => {
    const g = { termine: [], construction: [], developpement: [], planifie: [] }
    let mwc = 0, capex = 0
    projects.forEach(p => {
      g[getPhase(p)].push(p)
      mwc += p.pvMw || 0
      capex += p.capexM || 0
    })
    return { grouped: g, totalMwc: mwc, totalCapex: capex }
  }, [projects])

  const filterLabel = filterState.filter === 'month'
    ? MONTH_NAMES[filterState.monthIndex] + ' ' + new Date().getFullYear()
    : filterState.filter === 'quarter'
      ? 'Q' + filterState.quarter + ' ' + new Date().getFullYear()
      : String(filterState.year)

  /* ═══════════ FILTER BAR (shared) ═══════════ */
  const filterBar = (
    <div style={{ display: 'flex', gap: 4, background: 'rgba(58,57,92,0.18)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
      <button
        onClick={() => { filterState.setFilter('month'); filterState.setMonthIndex(maxDataMonth - 1) }}
        style={{
          padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          border: 'none', transition: 'all 0.2s',
          background: filterState.filter === 'month' ? 'rgba(0,171,99,0.3)' : 'transparent',
          color: filterState.filter === 'month' ? '#00ab63' : 'rgba(255,255,255,0.4)',
        }}
      >
        {filterState.filter === 'month' ? MONTH_NAMES[filterState.monthIndex]?.slice(0, 3) : 'M'}
      </button>
      <button
        onClick={() => filterState.setFilter('quarter')}
        style={{
          padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          border: 'none', transition: 'all 0.2s',
          background: filterState.filter === 'quarter' ? 'rgba(0,171,99,0.3)' : 'transparent',
          color: filterState.filter === 'quarter' ? '#00ab63' : 'rgba(255,255,255,0.4)',
        }}
      >
        {filterState.filter === 'quarter' ? 'Q' + filterState.quarter : 'Q'}
      </button>
      <button
        onClick={() => filterState.setFilter('year')}
        style={{
          padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          border: 'none', transition: 'all 0.2s',
          background: filterState.filter === 'year' ? 'rgba(0,171,99,0.3)' : 'transparent',
          color: filterState.filter === 'year' ? '#00ab63' : 'rgba(255,255,255,0.4)',
        }}
      >
        {filterState.filter === 'year' ? String(filterState.year) : 'A'}
      </button>
    </div>
  )

  /* ═══════════════════════════════════════════════════════════
     VIEW: MAIN — Two-card layout (Production + Projets)
     ═══════════════════════════════════════════════════════════ */
  if (view === 'main') {
    return (
      <div>
        {/* Title bar */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(0,171,99,0.15)', paddingBottom: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#00ab63', letterSpacing: -1 }}>EnR</div>
          <div style={{ fontSize: 11, color: 'rgba(0,171,99,0.5)', marginTop: 4 }}>Energies renouvelables &middot; Groupe Filatex</div>
        </div>

        {/* Two cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>

          {/* ── CARD 1: Production EnR ── */}
          <div
            onClick={() => setView('production')}
            style={{
              background: 'rgba(0,171,99,0.06)', border: '1px solid rgba(0,171,99,0.18)',
              borderRadius: 20, padding: '28px 32px', cursor: 'pointer', transition: 'all 0.3s',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,171,99,0.11)'; e.currentTarget.style.borderColor = 'rgba(0,171,99,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,171,99,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,171,99,0.18)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(0,171,99,0.6)' }}>
                Production EnR
              </div>
            </div>
            {/* KPI principal */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#00ab63', lineHeight: 1, letterSpacing: -2 }}>
                {globalTotals.avgMwhJ}
                <span style={{ fontSize: 18, fontWeight: 400, color: 'rgba(0,171,99,0.6)', marginLeft: 6 }}>MWh/j</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>
                Moyenne journaliere &middot; {sites.length} centrales solaires
              </div>
            </div>
            {/* KPIs secondaires: Puissance + Cumule + Mix */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Puissance</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{globalTotals.capMw}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>MWc installes</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Prod. cumulee</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#00ab63' }}>{globalTotals.totalMwh}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>MWh depuis janv.</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Mix EnR</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#00ab63' }}>\u2014<span style={{ fontSize: 10, fontWeight: 400 }}>%</span></div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>moy. jour.</div>
              </div>
            </div>
            {/* Per-site row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {sites.map((s, i) => {
                const col = ENR_COLORS[i % ENR_COLORS.length]
                return (
                  <div key={s.code || i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>
                      {'\u2600\uFE0F'} {s.name}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: col }}>{(s.avgDailyKwh / 1000).toFixed(1)}</div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>MWh/j &middot; {s.capacityMw} MWc</div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(0,171,99,0.7)', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              <span>Voir le detail</span><span style={{ fontSize: 12 }}>{'\u2192'}</span>
            </div>
            {/* Green gradient decoration */}
            <div style={{ position: 'absolute', bottom: -30, right: -30, width: 120, height: 120, background: 'radial-gradient(circle,rgba(0,171,99,0.12),transparent 70%)', pointerEvents: 'none' }} />
          </div>

          {/* ── CARD 2: Projets EnR ── */}
          <div
            onClick={() => setView('projets')}
            style={{
              background: 'rgba(0,171,99,0.04)', border: '1px solid rgba(0,171,99,0.12)',
              borderRadius: 20, padding: '28px 32px', cursor: 'pointer', transition: 'all 0.3s',
              position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,171,99,0.09)'; e.currentTarget.style.borderColor = 'rgba(0,171,99,0.28)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,171,99,0.04)'; e.currentTarget.style.borderColor = 'rgba(0,171,99,0.12)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(0,171,99,0.5)', marginBottom: 18 }}>
              Projets EnR
            </div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 42, fontWeight: 800, color: '#00ab63', lineHeight: 1, letterSpacing: -2 }}>{projects.length}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                  projets &middot; {totalMwc.toFixed(1)} MWc &middot; {totalCapex.toFixed(1)} M$
                </span>
              </div>
              {/* Phase rows */}
              {[
                { key: 'termine', label: 'Termine', dotColor: '#00ab63', countColor: 'rgba(0,171,99,0.8)' },
                { key: 'construction', label: 'En construction', dotColor: '#FDB823', countColor: 'rgba(253,184,35,0.8)' },
                { key: 'developpement', label: 'Developpement', dotColor: '#5aafaf', countColor: 'rgba(90,175,175,0.8)' },
                { key: 'planifie', label: 'Planifie', dotColor: 'rgba(255,255,255,0.25)', countColor: 'rgba(255,255,255,0.4)' },
              ].map((row, ri) => (
                <div key={row.key} style={{
                  background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '10px 16px',
                  marginBottom: ri < 3 ? 6 : 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.dotColor, flexShrink: 0 }} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{row.label}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: row.countColor }}>{grouped[row.key].length}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(0,171,99,0.7)', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              <span>Voir les projets</span><span style={{ fontSize: 12 }}>{'\u2192'}</span>
            </div>
            {/* Green gradient decoration (top-right) */}
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'radial-gradient(circle,rgba(0,171,99,0.08),transparent 70%)', pointerEvents: 'none' }} />
          </div>

        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════
     VIEW: PRODUCTION DETAIL
     ═══════════════════════════════════════════════════════════ */
  if (view === 'production') {
    return (
      <div>
        {/* Back + filter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button
            onClick={() => setView('main')}
            style={{
              background: 'none', border: '1px solid rgba(0,171,99,0.3)', color: '#00ab63',
              borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {'\u2190'} Energy
          </button>
          {filterBar}
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(0,171,99,0.15)', paddingBottom: 20, marginBottom: 36 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#00ab63' }}>Production EnR</div>
          <div style={{ fontSize: 11, color: 'rgba(0,171,99,0.5)', marginTop: 4 }}>Detail par site &middot; Donnees reelles de production</div>
        </div>

        {/* Global KPIs (3 cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 36 }}>
          <div style={{ background: 'rgba(0,171,99,0.07)', border: '1px solid rgba(0,171,99,0.2)', borderRadius: 18, padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(0,171,99,0.55)', marginBottom: 8 }}>Production totale</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: '#00ab63', lineHeight: 1 }}>
              {(totalProdKwh / 1000).toFixed(1)}
              <span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(0,171,99,0.5)', marginLeft: 4 }}>MWh</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(0,171,99,0.4)', marginTop: 6 }}>{filterLabel} &middot; {sites.length} centrales</div>
          </div>
          <div style={{ background: 'rgba(0,171,99,0.04)', border: '1px solid rgba(0,171,99,0.12)', borderRadius: 18, padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(0,171,99,0.5)', marginBottom: 8 }}>Moy. journaliere</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: '#00ab63', lineHeight: 1 }}>
              {(totalAvgDaily / 1000).toFixed(1)}
              <span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(0,171,99,0.5)', marginLeft: 4 }}>MWh/j</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(0,171,99,0.4)', marginTop: 6 }}>{totalCapMw.toFixed(1)} MWc installes</div>
          </div>
          <div style={{ background: 'rgba(0,171,99,0.04)', border: '1px solid rgba(0,171,99,0.12)', borderRadius: 18, padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(0,171,99,0.5)', marginBottom: 8 }}>Part EnR dans le mix</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: '#00ab63', lineHeight: 1 }}>
              {'\u2014'}
              <span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(0,171,99,0.5)', marginLeft: 2 }}>%</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(0,171,99,0.4)', marginTop: 6 }}>EnR / (EnR + HFO)</div>
          </div>
        </div>

        {/* 3 Site Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {sites.map((s, si) => {
            const col = ENR_COLORS[si % ENR_COLORS.length]
            const rgb = ENR_RGBS[si % ENR_RGBS.length]
            const fd = siteFiltered[si]
            const pct = totalProdKwh > 0 ? (fd.prodKwh / totalProdKwh * 100).toFixed(0) : 0

            return (
              <div
                key={s.code || si}
                onClick={() => setSelectedSite(si)}
                style={{
                  background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.18)`,
                  borderRadius: 20, padding: '24px 20px', cursor: 'pointer', transition: 'all 0.3s',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `rgba(${rgb},0.1)`; e.currentTarget.style.borderColor = `rgba(${rgb},0.35)`; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = `rgba(${rgb},0.05)`; e.currentTarget.style.borderColor = `rgba(${rgb},0.18)`; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {/* Site name + badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>{'\u2600\uFE0F'} {s.name}</div>
                  <div style={{ background: `rgba(${rgb},0.15)`, borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 800, color: col }}>{pct}%</div>
                </div>

                {/* Main KPI */}
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: col, lineHeight: 1 }}>
                    {(fd.prodKwh / 1000).toFixed(1)}
                    <span style={{ fontSize: 14, fontWeight: 400, color: `rgba(${rgb},0.5)`, marginLeft: 3 }}>MWh</span>
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{filterLabel}</div>
                </div>

                {/* Sub KPIs 2x2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>Capacite</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{s.capacityMw} <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>MWc</span></div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>Livre</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: col }}>{(fd.deliveredKwh / 1000).toFixed(1)} <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>MWh</span></div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>Pic</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{fd.peakKw} <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>kW</span></div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>Jours</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{fd.days} <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>j</span></div>
                  </div>
                </div>

                {/* CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: `rgba(${rgb},0.7)`, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  <span>Voir le detail</span><span style={{ fontSize: 12 }}>{'\u2192'}</span>
                </div>

                {/* Gradient decoration */}
                <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle,rgba(${rgb},0.1),transparent 70%)`, pointerEvents: 'none' }} />
              </div>
            )
          })}
        </div>

        {/* Site detail slide panel */}
        <SlidePanel
          isOpen={selectedSite !== null}
          onClose={() => setSelectedSite(null)}
          title={selectedSite !== null ? sites[selectedSite]?.name : ''}
        >
          {selectedSite !== null && sites[selectedSite] && (
            <EnrSiteDetailContent site={sites[selectedSite]} siteIndex={selectedSite} filterState={filterState} />
          )}
        </SlidePanel>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════
     VIEW: PROJETS DETAIL
     ═══════════════════════════════════════════════════════════ */
  if (view === 'projets') {
    const activeFilter = phaseFilter
    const showPhases = activeFilter ? [activeFilter] : ['termine', 'construction', 'developpement', 'planifie']
    const filtered = activeFilter ? grouped[activeFilter] : projects

    // KPI aggregates for filtered set
    const fMw = filtered.reduce((s, p) => s + (p.pvMw || 0), 0)
    const fCapex = filtered.reduce((s, p) => s + (p.capexM || 0), 0)
    const fBess = filtered.reduce((s, p) => s + (p.bessMwh || 0), 0)
    const fProd = filtered.reduce((s, p) => s + (p.prodJour || 0), 0)
    const projsWithDelay = filtered.filter(p => p.glissement && p.glissement > 0)
    const avgDelay = projsWithDelay.length > 0 ? Math.round(projsWithDelay.reduce((s, p) => s + p.glissement, 0) / projsWithDelay.length) : 0

    const togglePhaseFilter = (phase) => {
      setPhaseFilter(prev => prev === phase ? null : phase)
    }

    const getFilterBtnStyle = (phase) => {
      const s = { termine: 'rgba(0,171,99,', construction: 'rgba(253,184,35,', developpement: 'rgba(90,175,175,', planifie: 'rgba(255,255,255,' }
      const bg = s[phase]
      const isActive = activeFilter === phase
      const isNone = activeFilter === null
      if (isActive) return { background: bg + '0.2)', borderColor: bg + '0.6)', transform: 'scale(1.03)', boxShadow: '0 0 16px ' + bg + '0.2)', opacity: 1 }
      if (isNone) return { background: phase === 'planifie' ? 'rgba(255,255,255,0.03)' : bg + '0.06)', borderColor: phase === 'planifie' ? 'rgba(255,255,255,0.08)' : bg + '0.15)', opacity: 1 }
      return { background: phase === 'planifie' ? 'rgba(255,255,255,0.02)' : bg + '0.03)', borderColor: phase === 'planifie' ? 'rgba(255,255,255,0.05)' : bg + '0.08)', opacity: 0.4 }
    }

    return (
      <div>
        {/* Back button */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setView('main')}
            style={{
              background: 'none', border: '1px solid rgba(0,171,99,0.3)', color: '#00ab63',
              borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Energy
          </button>
        </div>

        {/* Title */}
        <div style={{ fontSize: 20, fontWeight: 800, color: '#00ab63', marginBottom: 24 }}>Projets EnR</div>

        {/* KPI Consolidated (6 boxes) */}
        <div className="enrp-consolidated">
          <div className="enrp-kbox"><div className="kv" style={{ color: '#00ab63' }}>{filtered.length}</div><span className="kl">Projets</span></div>
          <div className="enrp-kbox"><div className="kv" style={{ color: '#00ab63' }}>{fMw.toFixed(1)}</div><span className="kl">MWc Pipeline</span></div>
          <div className="enrp-kbox"><div className="kv" style={{ color: '#FDB823' }}>{fCapex.toFixed(1)}M$</div><span className="kl">CAPEX Total</span></div>
          <div className="enrp-kbox"><div className="kv" style={{ color: '#5aafaf' }}>{fBess || 0}</div><span className="kl">MWh BESS</span><div className="ks">{fProd > 0 ? Math.round(fProd / 1000) + ' MWh/j est.' : ''}</div></div>
          <div className="enrp-kbox"><div className="kv" style={{ color: projsWithDelay.length > 0 ? '#ff5050' : 'rgba(255,255,255,0.3)' }}>{projsWithDelay.length}</div><span className="kl">En retard</span><div className="ks">{avgDelay > 0 ? 'moy. ' + avgDelay + 'j' : ''}</div></div>
          <div className="enrp-kbox"><div className="kv" style={{ color: '#00ab63' }}>{grouped.termine.length}</div><span className="kl">Termines</span><div className="ks">{grouped.construction.length} en constr.</div></div>
        </div>

        {/* Phase filters */}
        <div className="enrp-filters">
          {[
            { key: 'termine', label: 'Termine', dotColor: '#00ab63', labelColor: 'rgba(0,171,99,0.7)', countColor: '#00ab63' },
            { key: 'construction', label: 'Construction', dotColor: '#FDB823', labelColor: 'rgba(253,184,35,0.7)', countColor: '#FDB823' },
            { key: 'developpement', label: 'Developpement', dotColor: '#5aafaf', labelColor: 'rgba(90,175,175,0.7)', countColor: '#5aafaf' },
            { key: 'planifie', label: 'Planifie', dotColor: 'rgba(255,255,255,0.25)', labelColor: 'rgba(255,255,255,0.35)', countColor: 'rgba(255,255,255,0.4)' },
          ].map(f => (
            <div
              key={f.key}
              className="enrp-filter-btn"
              onClick={() => togglePhaseFilter(f.key)}
              style={getFilterBtnStyle(f.key)}
            >
              <div className="enrp-fdot" style={{ background: f.dotColor }} />
              <span className="enrp-flabel" style={{ color: f.labelColor }}>{f.label}</span>
              <span className="enrp-fcount" style={{ color: f.countColor }}>{grouped[f.key].length}</span>
            </div>
          ))}
        </div>

        {/* Delay alert */}
        {projsWithDelay.length > 0 && (
          <div className="enrp-alert">
            <span style={{ fontSize: 16 }}>{'\u26A0\uFE0F'}</span>
            <span style={{ fontWeight: 700, color: '#ff5050' }}>{projsWithDelay.length} projet{projsWithDelay.length > 1 ? 's' : ''} en retard</span>
            {projsWithDelay.map((p, i) => (
              <span key={i} className="enrp-alert-tag">{p.name.replace(/^(Top Energie |Vestop |Lidera |Floating Solar )/, '')} {p.glissement}j</span>
            ))}
          </div>
        )}

        {/* Phase sections with project cards */}
        {showPhases.map(phase => {
          const list = grouped[phase]
          if (!list.length) return null
          const color = PHASE_COLORS[phase]
          const rgb = PHASE_RGBS[phase]
          return (
            <div key={phase} className="enrp-phase-section">
              <div className="enrp-phase-hdr">
                <div className="dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                <span className="lbl" style={{ color }}>{PHASE_LABELS[phase]}</span>
                <span className="cnt" style={{ color, background: `rgba(${rgb},0.12)` }}>{list.length}</span>
                <div className="line" style={{ background: `rgba(${rgb},0.15)` }} />
              </div>
              <div className="enrp-cards-grid">
                {list.map((p, pi) => (
                  <EnrProjectCard key={p.id || pi} project={p} onClick={() => setSelectedProject(p)} />
                ))}
              </div>
            </div>
          )
        })}

        {/* Project detail slide panel */}
        <SlidePanel
          isOpen={selectedProject !== null}
          onClose={() => setSelectedProject(null)}
          title={selectedProject?.name || ''}
        >
          {selectedProject && <EnrProjectDetailContent project={selectedProject} />}
        </SlidePanel>
      </div>
    )
  }

  return null
}

/* ═══════════════════════════════════════════════════════════
   ENR Project Card (matching original enrp-card style)
   ═══════════════════════════════════════════════════════════ */
function EnrProjectCard({ project, onClick }) {
  const p = project
  const phase = getPhase(p)
  const color = PHASE_COLORS[phase]
  const rgb = PHASE_RGBS[phase]
  const engPct = p.engPct !== null ? p.engPct : 0
  const constProg = Math.round((p.constProg || 0) * 100)
  const gliss = p.glissement || 0
  const hasCc = p.cc && p.cc.avReel != null
  const avReel = hasCc ? p.cc.avReel : null

  return (
    <div className="enrp-card" style={{ borderColor: `rgba(${rgb},0.18)` }} onClick={onClick}>
      <div className="enrp-card-head">
        <span className="enrp-card-icon">{typeIcon(p.type)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="enrp-card-title">{p.name}</div>
          <div className="enrp-card-sub">
            {p.loc || ''}{p.lead ? ' \u00B7 ' + p.lead : ''}{p.epciste && p.epciste !== 'TBC' ? ' \u00B7 ' + p.epciste : ''}
          </div>
        </div>
        <span className="enrp-card-badge" style={{ color, background: `rgba(${rgb},0.12)` }}>{PHASE_LABELS[phase]}</span>
      </div>
      <div className="enrp-card-kpis">
        <div className="enrp-ck"><div className="v" style={{ color: '#00ab63' }}>{p.pvMw || 0}</div><div className="l">MWc</div></div>
        <div className="enrp-ck"><div className="v" style={{ color: '#FDB823' }}>{fmtM(p.capexM)}</div><div className="l">CAPEX</div></div>
        <div className="enrp-ck"><div className="v" style={{ color: p.tri && p.tri >= 10 ? '#00ab63' : p.tri ? '#f37056' : 'rgba(255,255,255,0.25)' }}>{p.tri ? p.tri + '%' : '\u2014'}</div><div className="l">TRI</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        <div style={{ padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Engineering</div>
          <div className="enrp-bar"><div className="enrp-bar-fill" style={{ width: `${engPct}%`, background: color }} /></div>
          <div style={{ fontSize: 12, fontWeight: 800, color }}>{p.engPct != null ? engPct + '%' : '\u2014'}</div>
        </div>
        <div style={{ padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Construction</div>
          <div className="enrp-bar"><div className="enrp-bar-fill" style={{ width: `${constProg}%`, background: '#4a9eff' }} /></div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#4a9eff' }}>{constProg}%</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
        <span>{fmtDate(p.constStart)} {'\u2192'} {fmtDate(p.constEnd)}</span>
        {avReel != null && <span style={{ marginLeft: 'auto', fontWeight: 700, color }}>Reel: {avReel}%</span>}
        {p.cc && p.cc.spi != null && (
          <span style={{ fontWeight: 700, color: p.cc.spi >= 0.9 ? '#00ab63' : p.cc.spi >= 0.7 ? '#FDB823' : '#ff5050' }}>
            SPI {Number(p.cc.spi).toFixed(2)}
          </span>
        )}
      </div>
      {gliss > 0 && <div className="enrp-delay">{'\u26A0'} {gliss}j de retard</div>}
      {p.comment && <div className="enrp-comment">{'\u26A0'} {p.comment}</div>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ENR Site Detail Content (slide panel)
   ═══════════════════════════════════════════════════════════ */
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
      <div className="mb-6">
        <div className="text-lg font-extrabold text-white/95">{s.entity}</div>
        <div className="text-[11px] text-white/35 mt-1">{s.loc} &middot; {s.centrale}</div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          ['Capacite', s.capacityMw, 'MWc'],
          ['Production', (fd.prodKwh / 1000).toFixed(1), 'MWh'],
          ['Livre', (fd.deliveredKwh / 1000).toFixed(1), 'MWh'],
          ['Pic', fd.peakKw, 'kW'],
          ['Jours', fd.days, ''],
        ].map(([label, value, unit], i) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: `${col}10`, borderColor: `${col}1f` }}>
            <div className="text-[7px] font-bold tracking-wider uppercase text-white/30 mb-1.5">{label}</div>
            <div className="text-xl font-extrabold leading-none" style={{ color: i < 3 ? col : 'rgba(255,255,255,0.85)' }}>
              {value}
              {unit && <span className="text-[10px] font-normal text-white/30 ml-0.5">{unit}</span>}
            </div>
          </div>
        ))}
      </div>

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
                  {monthData.avgIrradiance || '\u2014'}
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

/* ═══════════════════════════════════════════════════════════
   ENR Project Detail Content (slide panel)
   ═══════════════════════════════════════════════════════════ */
function EnrProjectDetailContent({ project }) {
  const p = project
  const cc = p.cc || {}

  return (
    <div>
      <div className="mb-6">
        <div className="text-sm text-[var(--text-dim)]">
          {p.loc} &middot; {p.type} &middot; {p.lead}
        </div>
        {p.epciste && <div className="text-[10px] text-[var(--text-dim)] mt-1">EPC: {p.epciste}</div>}
      </div>

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
          <KpiBox value={p.capexM ? `${p.capexM.toFixed(2)} M$` : '\u2014'} label="CAPEX" color="rgba(255,255,255,0.8)" size="sm" />
        </div>
        <div className="glass-card p-3">
          <KpiBox value={p.tri ? `${p.tri}%` : '\u2014'} label="TRI" color="rgba(255,255,255,0.8)" size="sm" />
        </div>
      </div>

      {(cc.spi != null || cc.cpi != null) && (
        <div className="flex gap-4 mb-6">
          {cc.spi != null && (
            <div className="glass-card p-4 flex-1 text-center">
              <div className="text-[8px] font-bold tracking-wider uppercase text-[var(--text-dim)] mb-1">SPI</div>
              <div className="text-2xl font-extrabold" style={{ color: cc.spi >= 1.0 ? '#00ab63' : '#E05C5C' }}>{cc.spi.toFixed(2)}</div>
            </div>
          )}
          {cc.cpi != null && (
            <div className="glass-card p-4 flex-1 text-center">
              <div className="text-[8px] font-bold tracking-wider uppercase text-[var(--text-dim)] mb-1">CPI</div>
              <div className="text-2xl font-extrabold" style={{ color: cc.cpi >= 1.0 ? '#00ab63' : '#E05C5C' }}>{cc.cpi.toFixed(2)}</div>
            </div>
          )}
          {cc.perf && (
            <div className="glass-card p-4 flex-1 text-center flex items-center justify-center">
              <div className="text-[10px] text-[var(--text-muted)]">{cc.perf}</div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-[var(--text-dim)] uppercase tracking-wider font-bold">Etudes / Engineering</span>
            <span className="text-white/50">{p.engPct || p.engProgression || 0}%</span>
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(p.engPct || p.engProgression || 0, 100)}%`, backgroundColor: '#426ab3' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-[var(--text-dim)] uppercase tracking-wider font-bold">Construction</span>
            <span className="text-white/50">{p.constProg != null ? Math.round(p.constProg * 100) : p.avancement || 0}%</span>
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(p.constProg != null ? p.constProg * 100 : p.avancement || 0, 100)}%`, backgroundColor: '#00ab63' }} />
          </div>
        </div>
      </div>

      {p.studies && p.studies.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Etudes</h3>
          <div className="space-y-1.5">
            {p.studies.map((st, i) => (
              <div key={i} className="flex items-center justify-between glass-card p-2">
                <span className="text-[10px] text-white/70">{st.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${st.pct}%`, backgroundColor: st.pct >= 100 ? '#00ab63' : '#426ab3' }} />
                  </div>
                  <span className="text-[9px] text-white/50 w-8 text-right">{st.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
