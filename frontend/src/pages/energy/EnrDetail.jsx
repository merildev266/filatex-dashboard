import { useState, useMemo } from 'react'
import { ENR_SITES } from '../../data/enr_site_data'
import { MONTH_NAMES } from '../../utils/projects'

const ENR_COLORS = ['#00ab63', '#5aafaf', '#4a8fe7']
const ENR_RGBS = ['0,171,99', '90,175,175', '74,143,231']
const ENR_MONTHS = { 1:'Janvier',2:'Février',3:'Mars',4:'Avril',5:'Mai',6:'Juin',7:'Juillet',8:'Août',9:'Septembre',10:'Octobre',11:'Novembre',12:'Décembre' }

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
    <div style={{ display: 'flex', gap: 4, background: 'var(--card)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
      {[
        { key: 'month', label: filterState.filter === 'month' ? MONTH_NAMES[filterState.monthIndex]?.slice(0, 3) : 'M', onClick: () => { filterState.setFilter('month'); filterState.setMonthIndex(maxDataMonth - 1) } },
        { key: 'quarter', label: filterState.filter === 'quarter' ? 'Q' + filterState.quarter : 'Q', onClick: () => filterState.setFilter('quarter') },
        { key: 'year', label: filterState.filter === 'year' ? String(filterState.year) : 'A', onClick: () => filterState.setFilter('year') },
      ].map(f => (
        <button
          key={f.key}
          onClick={f.onClick}
          style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: 'none', transition: 'all 0.2s',
            background: filterState.filter === f.key ? 'rgba(0,171,99,0.3)' : 'transparent',
            color: filterState.filter === f.key ? 'var(--text)' : 'var(--text-muted)',
          }}
        >{f.label}</button>
      ))}
    </div>
  )

  /* ═══ SITE DETAIL VIEW (full page, like HFO) ═══ */
  if (selectedSite !== null && sites[selectedSite]) {
    const s = sites[selectedSite]
    const si = selectedSite
    const col = ENR_COLORS[si % ENR_COLORS.length]
    const rgb = ENR_RGBS[si % ENR_RGBS.length]
    const fd = getFilteredSiteData(s, filterState)

    return (
      <div style={{ padding: '0 20px 40px' }}>
        {/* Site navigation strip */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24, justifyContent: 'center' }}>
          {/* Back to overview */}
          <button
            onClick={() => setSelectedSite(null)}
            style={{
              background: 'var(--inner-card)', border: '1px solid var(--inner-card-border)',
              color: 'var(--text-muted)', padding: '6px 0', borderRadius: 20, fontSize: 10,
              fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s', minWidth: 80, textAlign: 'center',
            }}
          >← Tous</button>
          {sites.map((ns, ni) => {
            const active = ni === si
            const nCol = ENR_COLORS[ni % ENR_COLORS.length]
            const nRgb = ENR_RGBS[ni % ENR_RGBS.length]
            return (
              <button
                key={ni}
                onClick={() => setSelectedSite(ni)}
                style={{
                  background: active ? nCol : `rgba(${nRgb},0.04)`,
                  border: `1px solid ${active ? nCol : `rgba(${nRgb},0.2)`}`,
                  color: active ? '#1e1d38' : `rgba(${nRgb},0.6)`,
                  padding: '6px 0', borderRadius: 20, fontSize: 10, fontWeight: active ? 700 : 600,
                  letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s', minWidth: 130, textAlign: 'center',
                }}
              >{ns.name}</button>
            )
          })}
        </div>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>☀️ {s.entity}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>📍 {s.loc} · {s.centrale}</div>
        </div>

        {/* 5 KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            ['Capacité', s.capacityMw, 'MWc'],
            ['Production', (fd.prodKwh / 1000).toFixed(1), 'MWh'],
            ['Livré', (fd.deliveredKwh / 1000).toFixed(1), 'MWh'],
            ['Pic', fd.peakKw, 'kW'],
            ['Jours', fd.days, ''],
          ].map(([label, value, unit], ki) => (
            <div key={label} className="unified-card" style={{
              padding: '16px 10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: ki < 3 ? col : 'var(--text)', lineHeight: 1 }}>
                {value}
                {unit && <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-dim)', marginLeft: 3 }}>{unit}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Period label */}
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 14 }}>{filterLabel}</div>

        {/* MONTH VIEW — sparkline + sub-KPIs */}
        {filterState.filter === 'month' && (() => {
          const mi = filterState.monthIndex
          const monthStr = new Date().getFullYear() + '-' + String(mi + 1).padStart(2, '0')
          const monthData = s.monthly.find(m => m.month === monthStr)
          if (!monthData || !monthData.dailyProd.length) {
            return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)', fontSize: 13 }}>Pas de données pour ce mois</div>
          }
          const maxDayProd = Math.max(...monthData.dailyProd)
          return (
            <div className="unified-card" style={{ padding: '18px 16px', marginBottom: 28 }}>
              {/* Daily sparkline */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 80, marginBottom: 14 }}>
                {monthData.dailyProd.map((dv, di) => {
                  const bh = maxDayProd > 0 ? Math.max(Math.round(dv / maxDayProd * 80), 2) : 2
                  return <div key={di} title={`J${di + 1}: ${(dv / 1000).toFixed(1)} MWh`} style={{ flex: 1, height: bh, background: col, opacity: 0.6, borderRadius: '2px 2px 0 0' }} />
                })}
              </div>
              {/* 3 sub-KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div style={{ background: 'var(--mini-card)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Moy/j</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: col }}>{(monthData.avgDailyProdKwh / 1000).toFixed(1)} <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>MWh</span></div>
                </div>
                <div style={{ background: 'var(--mini-card)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Disponibilité</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-secondary)' }}>{monthData.totalAvailHours.toFixed(0)} <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>h</span></div>
                </div>
                <div style={{ background: 'var(--mini-card)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Irradiance moy.</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-secondary)' }}>{monthData.avgIrradiance || '—'}</div>
                </div>
              </div>
              {monthData.totalUnschedInterrupt > 0 && (
                <div style={{ marginTop: 8, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.15)', borderRadius: 8, padding: '6px 10px', textAlign: 'center', fontSize: 9, color: '#ff5050', fontWeight: 600 }}>
                  ⚠ {monthData.totalUnschedInterrupt.toFixed(1)}h interruptions
                </div>
              )}
            </div>
          )
        })()}

        {/* YEAR VIEW — monthly cards grid */}
        {(filterState.filter === 'quarter' || filterState.filter === 'year') && (() => {
          const filteredMonths = s.monthly.filter(m => {
            const mNum = parseInt(m.month.split('-')[1])
            const mYear = parseInt(m.month.split('-')[0])
            if (filterState.filter === 'quarter') {
              const start = (filterState.quarter - 1) * 3 + 1
              return mYear === new Date().getFullYear() && mNum >= start && mNum <= start + 2
            }
            return mYear === filterState.year
          })
          if (!filteredMonths.length) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)', fontSize: 13 }}>Pas de données</div>
          return (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(filteredMonths.length, 3)},1fr)`, gap: 14, marginBottom: 28 }}>
              {filteredMonths.map(m => {
                const monthNum = parseInt(m.month.split('-')[1])
                const monthName = ENR_MONTHS[monthNum] || m.month
                const maxDayProd = Math.max(...(m.dailyProd.length ? m.dailyProd : [0]))
                return (
                  <div key={m.month} className="unified-card" style={{ padding: '18px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)' }}>{monthName}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: col }}>{(m.totalProdKwh / 1000).toFixed(0)} <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-dim)' }}>MWh</span></div>
                    </div>
                    {/* Daily bars */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 55, marginBottom: 14 }}>
                      {m.dailyProd.map((dv, di) => {
                        const bh = maxDayProd > 0 ? Math.max(Math.round(dv / maxDayProd * 55), 2) : 2
                        return <div key={di} style={{ flex: 1, height: bh, background: col, opacity: 0.5, borderRadius: '2px 2px 0 0' }} />
                      })}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: 'var(--mini-card)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Moy/j</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: col }}>{(m.avgDailyProdKwh / 1000).toFixed(1)} <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>MWh</span></div>
                      </div>
                      <div style={{ background: 'var(--mini-card)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Pic</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-secondary)' }}>{m.maxPeakKw} <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>kW</span></div>
                      </div>
                    </div>
                    {m.totalUnschedInterrupt > 0 && (
                      <div style={{ marginTop: 8, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.15)', borderRadius: 8, padding: '6px 10px', textAlign: 'center', fontSize: 9, color: '#ff5050', fontWeight: 600 }}>
                        ⚠ {m.totalUnschedInterrupt.toFixed(1)}h interruptions
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
    )
  }

  /* ═══ OVERVIEW — 3 site cards ═══ */
  return (
    <div>
      {/* Title */}
      <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(0,171,99,0.15)', paddingBottom: 20, marginBottom: 36 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>Production EnR</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Détail par site · Données réelles de production
        </div>
      </div>

      {/* Global KPIs (3 cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
        <div className="unified-card" style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>Production totale</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: '#00ab63', lineHeight: 1 }}>
            {(totalProdKwh / 1000).toFixed(1)}
            <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-dim)', marginLeft: 4 }}>MWh</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 6 }}>{filterLabel} · {sites.length} centrales</div>
        </div>
        <div className="unified-card" style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>Moy. journalière</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: '#00ab63', lineHeight: 1 }}>
            {(totalAvgDaily / 1000).toFixed(1)}
            <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-dim)', marginLeft: 4 }}>MWh/j</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 6 }}>{totalCapMw.toFixed(1)} MWc installés</div>
        </div>
        <div className="unified-card" style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>Part EnR dans le mix</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: '#00ab63', lineHeight: 1 }}>
            —<span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-dim)', marginLeft: 2 }}>%</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 6 }}>EnR / (EnR + HFO)</div>
        </div>
      </div>

      {/* 3 Site Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
        {sites.map((s, si) => {
          const col = ENR_COLORS[si % ENR_COLORS.length]
          const rgb = ENR_RGBS[si % ENR_RGBS.length]
          const fd = siteFiltered[si]
          const pct = totalProdKwh > 0 ? (fd.prodKwh / totalProdKwh * 100).toFixed(0) : 0

          return (
            <div
              key={s.code || si}
              className="unified-card clickable-energy"
              onClick={() => setSelectedSite(si)}
              style={{
                padding: '24px 20px',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>☀️ {s.name}</div>
                <div style={{ background: `rgba(${rgb},0.15)`, borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 800, color: col }}>{pct}%</div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: col, lineHeight: 1 }}>
                  {(fd.prodKwh / 1000).toFixed(1)}
                  <span style={{ fontSize: 14, fontWeight: 400, color: `rgba(${rgb},0.5)`, marginLeft: 3 }}>MWh</span>
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>{filterLabel}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <div style={{ background: 'var(--mini-card)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 3 }}>Capacité</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{s.capacityMw} <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>MWc</span></div>
                </div>
                <div style={{ background: 'var(--mini-card)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 3 }}>Livré</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: col }}>{(fd.deliveredKwh / 1000).toFixed(1)} <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>MWh</span></div>
                </div>
                <div style={{ background: 'var(--mini-card)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 3 }}>Pic</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-secondary)' }}>{fd.peakKw} <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>kW</span></div>
                </div>
                <div style={{ background: 'var(--mini-card)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 3 }}>Jours</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-secondary)' }}>{fd.days} <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>j</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: `rgba(${rgb},0.7)`, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                <span>Voir le détail</span><span style={{ fontSize: 12 }}>→</span>
              </div>

              <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle,rgba(${rgb},0.1),transparent 70%)`, pointerEvents: 'none' }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
