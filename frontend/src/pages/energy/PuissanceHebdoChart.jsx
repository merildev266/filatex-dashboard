import { useState, useRef } from 'react'

/**
 * PuissanceHebdoChart — Power availability chart (weekly or daily)
 *
 * Props:
 *   data    { weeks[], enelec[], vestop[], contrat[], peakLoad[] }
 *           — in daily mode, weeks[] holds day numbers ('1'..'31') and data.monthLabel
 *             carries the month name for display/grouping
 *   title   optional title shown above the chart
 *   height  SVG height in px (default 200)
 *   isDaily true when items represent days of a single month
 */
export default function PuissanceHebdoChart({ data, title = 'Puissance hebdomadaire', height = 200, isDaily = false }) {
  if (!data || !data.weeks || data.weeks.length === 0) return null

  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  const weeks    = data.weeks || []
  const enelec   = data.enelec || []
  const vestop   = data.vestop || []
  const contrat  = data.contrat || []
  const peakLoad = data.peakLoad || []

  const n = weeks.length

  // Compute Y scale
  let maxY = 0
  for (let i = 0; i < n; i++) {
    const e = +enelec[i]   || 0
    const v = +vestop[i]   || 0
    const c = +contrat[i]  || 0
    const p = +peakLoad[i] || 0
    const stack = e + v
    if (stack > maxY) maxY = stack
    if (c > maxY) maxY = c
    if (p > maxY) maxY = p
  }
  if (maxY === 0) maxY = 10
  maxY = Math.ceil(maxY * 1.2)

  // Layout
  const padL = 48
  const padR = 12
  const padT = 14
  const padB = 28
  const W = 720
  const H = height
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const slot = chartW / n
  const barW = slot * 0.75
  const gapBars = barW * 0.08

  const xFor = (i) => padL + i * slot + (slot - barW) / 2
  const yFor = (v) => padT + chartH - (v / maxY) * chartH

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    v: maxY * f,
    y: padT + chartH - f * chartH,
  }))

  // Group weeks by month (or single-month group for daily view)
  const MOIS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
  const monthGroups = []
  if (isDaily) {
    monthGroups.push({ monthLabel: data.monthLabel || '', startIdx: 0, endIdx: n - 1 })
  } else {
    let prevMonth = null
    for (let i = 0; i < n; i++) {
      const m = /^\d{4}-(\d{2})/.exec(weeks[i] || '')
      const monthNum = m ? parseInt(m[1], 10) : null
      if (monthNum !== prevMonth && monthNum != null) {
        if (monthGroups.length > 0) monthGroups[monthGroups.length - 1].endIdx = i - 1
        monthGroups.push({ monthLabel: MOIS_SHORT[monthNum - 1] || `M${monthNum}`, startIdx: i, endIdx: n - 1 })
        prevMonth = monthNum
      }
    }
  }

  // Current index detection (week or day)
  const now = new Date()
  let currentWeekIdx = -1
  if (isDaily) {
    // If we're in the month this chart represents, highlight today
    if (data.monthNum === now.getMonth() + 1 && (data.year || now.getFullYear()) === now.getFullYear()) {
      currentWeekIdx = now.getDate() - 1
    }
  } else {
    const curMonth = String(now.getMonth() + 1).padStart(2, '0')
    const curWeekInMonth = Math.ceil(now.getDate() / 7)
    const curKey = `${now.getFullYear()}-${curMonth}-S${curWeekInMonth}`
    for (let i = 0; i < n; i++) {
      if (weeks[i] === curKey) { currentWeekIdx = i; break }
    }
    if (currentWeekIdx === -1) {
      const curMonthPrefix = `${now.getFullYear()}-${curMonth}-`
      for (let i = n - 1; i >= 0; i--) {
        if ((weeks[i] || '').startsWith(curMonthPrefix)) { currentWeekIdx = i; break }
      }
    }
  }

  const hasVestop = vestop.some(v => +v > 0)

  // Tooltip handler — uses container div for positioning
  const chartRef = useRef(null)
  const handleBarHover = (e, i) => {
    if (!chartRef.current) return
    const rect = chartRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const ev = +enelec[i] || 0
    const vv = +vestop[i] || 0
    const cv = +contrat[i] || 0
    const pv = +peakLoad[i] || 0
    const isFuture = currentWeekIdx >= 0 && i > currentWeekIdx
    // Parse week/day label
    let weekLabel
    if (isDaily) {
      weekLabel = `${data.monthLabel || ''} ${weeks[i]}`
    } else {
      const wm = /^\d{4}-(\d{2})-S(\d+)/.exec(weeks[i] || '')
      weekLabel = wm ? `${MOIS_SHORT[parseInt(wm[1], 10) - 1]} S${wm[2]}` : weeks[i]
    }
    setTooltip({
      x: mouseX, y: mouseY,
      weekLabel,
      isFuture,
      contrat: cv, enelec: ev, vestop: vv, total: ev + vv, peak: pv,
    })
  }

  return (
    <div ref={chartRef} className="puiss-hebdo-chart" style={{ position: 'relative' }}>
      <div className="puiss-hebdo-header">
        <span className="puiss-hebdo-title">{title}</span>
        <span className="puiss-hebdo-legend">
          <span className="legend-item">
            <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background:'#00ab63', marginRight:4, verticalAlign:'middle' }} />
            Réalisé
          </span>
          {hasVestop && (
            <span className="legend-item">
              <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background:'#5aafaf', marginRight:4, verticalAlign:'middle' }} />
              VESTOP
            </span>
          )}
          <span className="legend-item">
            <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background:'#5e4c9f', marginRight:4, verticalAlign:'middle' }} />
            Planifié
          </span>
          <span className="legend-item">
            <span style={{ display:'inline-block', width:14, height:0, borderTop:'1px solid #00ab63', marginRight:4, verticalAlign:'middle' }} />
            Contrat
          </span>
          <span className="legend-item">
            <span style={{ display:'inline-block', width:12, height:2, borderRadius:1, background:'#E05C5C', marginRight:4, verticalAlign:'middle' }} />
            Peak
          </span>
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Y grid lines + labels */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL} y1={t.y} x2={W - padR} y2={t.y}
              stroke="rgba(138,146,171,0.12)"
              strokeWidth="0.5"
              strokeDasharray={i === 0 ? '0' : '2,3'}
            />
            <text
              x={padL - 6} y={t.y + 3}
              textAnchor="end"
              fontSize="8"
              fill="#ffffff"
            >
              {Math.round(t.v)}
            </text>
          </g>
        ))}

        <text x={padL - 6} y={padT - 6} textAnchor="end" fontSize="7" fill="#ffffff">MW</text>

        {/* Contrat line */}
        {(() => {
          const cVals = contrat.map(c => +c || 0).filter(c => c > 0)
          if (cVals.length === 0) return null
          const contratVal = cVals[Math.floor(cVals.length / 2)]
          const y = yFor(contratVal)
          return (
            <g>
              <line x1={padL} y1={y.toFixed(1)} x2={W - padR} y2={y.toFixed(1)} stroke="#00ab63" strokeWidth="1" />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="8" fontWeight="600" fill="#00ab63">
                {Math.round(contratVal)}
              </text>
            </g>
          )
        })()}

        {/* Bars */}
        {weeks.map((_, i) => {
          const e = +enelec[i]  || 0
          const v = +vestop[i]  || 0
          const c = +contrat[i] || 0
          const total = e + v
          const x = xFor(i)
          const isFuture = currentWeekIdx >= 0 && i > currentWeekIdx

          const yEnelec = e > 0 ? yFor(e) : padT + chartH
          const hEnelec = padT + chartH - yEnelec
          const yVestop = v > 0 ? yFor(total) : yEnelec
          const hVestop = v > 0 ? (yEnelec - yVestop) : 0

          const enelecFill = isFuture ? '#5e4c9f' : '#00ab63'
          const vestopFill = isFuture ? '#7b6bb5' : '#5aafaf'

          return (
            <g key={i}>
              {e > 0 && (
                <rect
                  x={(x + gapBars).toFixed(1)} y={yEnelec.toFixed(1)}
                  width={(barW - gapBars * 2).toFixed(1)} height={Math.max(0, hEnelec).toFixed(1)}
                  rx="2" fill={enelecFill}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(ev) => handleBarHover(ev, i)}
                  onMouseMove={(ev) => handleBarHover(ev, i)}
                  onMouseLeave={() => setTooltip(null)}
                />
              )}
              {v > 0 && (
                <rect
                  x={(x + gapBars).toFixed(1)} y={yVestop.toFixed(1)}
                  width={(barW - gapBars * 2).toFixed(1)} height={Math.max(0, hVestop).toFixed(1)}
                  rx="2" fill={vestopFill}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(ev) => handleBarHover(ev, i)}
                  onMouseMove={(ev) => handleBarHover(ev, i)}
                  onMouseLeave={() => setTooltip(null)}
                />
              )}
            </g>
          )
        })}

        {/* Peak Load line */}
        {(() => {
          const pVals = peakLoad.map(p => +p || 0).filter(p => p > 0)
          if (pVals.length === 0) return null
          const peakVal = pVals[pVals.length - 1]
          const y = yFor(peakVal)
          return (
            <g>
              <line x1={padL} y1={y.toFixed(1)} x2={W - padR} y2={y.toFixed(1)} stroke="#E05C5C" strokeWidth="1" />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="8" fontWeight="600" fill="#E05C5C">
                {Math.round(peakVal)}
              </text>
            </g>
          )
        })()}

        {/* Daily mode: day number per bar */}
        {isDaily && weeks.map((w, i) => (
          <text
            key={`d-${i}`}
            x={(xFor(i) + barW / 2).toFixed(1)} y={H - 5}
            textAnchor="middle" fontSize="6"
            fontWeight={i === currentWeekIdx ? '700' : '400'}
            fill="#ffffff"
          >
            {w}
          </text>
        ))}

        {/* Weekly mode: month separators + month labels */}
        {!isDaily && monthGroups.map((mg, idx) => {
          const xStart = padL + mg.startIdx * slot
          const xEnd = padL + (mg.endIdx + 1) * slot
          const xCenter = (xStart + xEnd) / 2
          const currentMonthNum = new Date().getMonth() + 1
          const mMatch = /^\d{4}-(\d{2})/.exec(weeks[mg.startIdx] || '')
          const isCurrMonth = mMatch && parseInt(mMatch[1], 10) === currentMonthNum
          return (
            <g key={`month-${idx}`}>
              {idx > 0 && (
                <line
                  x1={xStart.toFixed(1)} y1={padT}
                  x2={xStart.toFixed(1)} y2={(padT + chartH + 4).toFixed(1)}
                  stroke="rgba(138,146,171,0.45)" strokeWidth="1"
                />
              )}
              <text
                x={xCenter.toFixed(1)} y={H - 5}
                textAnchor="middle" fontSize="8"
                fontWeight={isCurrMonth ? '700' : '400'}
                fill="#ffffff"
              >
                {mg.monthLabel}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Custom tooltip — centered above cursor */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            marginTop: -12,
            background: '#0d1117',
            border: '1px solid rgba(138,146,171,0.3)',
            borderRadius: 10,
            padding: '10px 14px',
            pointerEvents: 'none',
            zIndex: 50,
            minWidth: 160,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: '#ffffff', marginBottom: 8, borderBottom: '1px solid rgba(138,146,171,0.2)', paddingBottom: 6 }}>
            {tooltip.weekLabel}
            <span style={{ fontSize: 9, fontWeight: 400, color: tooltip.isFuture ? '#5e4c9f' : '#00ab63', marginLeft: 6 }}>
              {tooltip.isFuture ? 'Planifié' : 'Réalisé'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ color: 'rgba(138,146,171,0.8)' }}>Contrat</span>
              <span style={{ color: '#00ab63', fontWeight: 600 }}>{tooltip.contrat.toFixed(1)} MW</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ color: 'rgba(138,146,171,0.8)' }}>ENELEC</span>
              <span style={{ color: tooltip.isFuture ? '#5e4c9f' : '#00ab63', fontWeight: 600 }}>{tooltip.enelec.toFixed(1)} MW</span>
            </div>
            {tooltip.vestop > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ color: 'rgba(138,146,171,0.8)' }}>VESTOP</span>
                <span style={{ color: tooltip.isFuture ? '#7b6bb5' : '#5aafaf', fontWeight: 600 }}>{tooltip.vestop.toFixed(1)} MW</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderTop: '1px solid rgba(138,146,171,0.15)', paddingTop: 4, marginTop: 2 }}>
              <span style={{ color: '#ffffff', fontWeight: 500 }}>Total dispo</span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>{tooltip.total.toFixed(1)} MW</span>
            </div>
            {tooltip.peak > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ color: 'rgba(138,146,171,0.8)' }}>Peak Load</span>
                <span style={{ color: '#E05C5C', fontWeight: 600 }}>{tooltip.peak.toFixed(1)} MW</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
