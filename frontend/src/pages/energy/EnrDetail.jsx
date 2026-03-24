import { useState, useMemo } from 'react'
import SlidePanel from '../../components/SlidePanel'
import { ENR_SITES } from '../../data/enr_site_data'
import { MONTH_NAMES } from '../../utils/projects'

const ENR_COLORS = ['#00ab63', '#5aafaf', '#4a8fe7']
const ENR_RGBS = ['0,171,99', '90,175,175', '74,143,231']

/* -- ENR filter state -- */
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

/* -- Filtered site data -- */
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

export default function EnrDetail() {
  const filterState = useEnrFilter()
  const [selectedSite, setSelectedSite] = useState(null)
  const maxDataMonth = getEnrDataMonth()

  const sites = ENR_SITES || []

  /* -- Aggregate production data -- */
  const { totalProdKwh, totalAvgDaily, totalCapMw, siteFiltered } = useMemo(() => {
    let tp = 0, ta = 0, tc = 0
    const sf = sites.map(s => {
      const fd = getFilteredSiteData(s, filterState)
      tp += fd.prodKwh; ta += fd.avgDailyKwh; tc += s.capacityMw
      return fd
    })
    return { totalProdKwh: tp, totalAvgDaily: ta, totalCapMw: tc, siteFiltered: sf }
  }, [sites, filterState.filter, filterState.monthIndex, filterState.quarter, filterState.year])

  const filterLabel = filterState.filter === 'month'
    ? MONTH_NAMES[filterState.monthIndex] + ' ' + new Date().getFullYear()
    : filterState.filter === 'quarter'
      ? 'Q' + filterState.quarter + ' ' + new Date().getFullYear()
      : String(filterState.year)

  /* -- Filter bar -- */
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

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 }}>
        {filterBar}
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(0,171,99,0.15)', paddingBottom: 20, marginBottom: 36 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#00ab63' }}>Production EnR</div>
        <div style={{ fontSize: 11, color: 'rgba(0,171,99,0.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          D&eacute;tail par site &middot; Donn&eacute;es r&eacute;elles de production
        </div>
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
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(0,171,99,0.5)', marginBottom: 8 }}>Moy. journali&egrave;re</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: '#00ab63', lineHeight: 1 }}>
            {(totalAvgDaily / 1000).toFixed(1)}
            <span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(0,171,99,0.5)', marginLeft: 4 }}>MWh/j</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(0,171,99,0.4)', marginTop: 6 }}>{totalCapMw.toFixed(1)} MWc install&eacute;s</div>
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
                  <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>Capacit&eacute;</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{s.capacityMw} <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>MWc</span></div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>Livr&eacute;</div>
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
                <span>Voir le d&eacute;tail</span><span style={{ fontSize: 12 }}>{'\u2192'}</span>
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

/* -- ENR Site Detail Content (slide panel) -- */
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
