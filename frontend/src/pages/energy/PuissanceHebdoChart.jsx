/**
 * PuissanceHebdoChart — Weekly power availability chart
 *
 * Visuals:
 *   - Ghost bars (dashed outline): Contrat — the "prévisionnel" reference
 *   - Solid stacked bars in front: ENELEC (green) + VESTOP (teal) — the "réalisé"
 *   - Line + dots: Peak Load (red-orange)
 *   - Color coding: green = good (dispo >= contrat), red = under
 *
 * Props:
 *   data    { weeks[], enelec[], vestop[], contrat[], peakLoad[] }
 *   title   optional title shown above the chart
 *   height  SVG height in px (default 200)
 */
export default function PuissanceHebdoChart({ data, title = 'Puissance hebdomadaire', height = 200 }) {
  if (!data || !data.weeks || data.weeks.length === 0) return null

  const weeks    = data.weeks || []
  const enelec   = data.enelec || []
  const vestop   = data.vestop || []
  const contrat  = data.contrat || []
  const peakLoad = data.peakLoad || []

  const n = weeks.length

  // Compute Y scale — max of (enelec+vestop), contrat, peakLoad
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
  maxY = Math.ceil(maxY * 1.2) // 20% headroom for labels

  // Layout
  const padL = 42
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

  // Y grid ticks (0, 25%, 50%, 75%, 100%)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    v: maxY * f,
    y: padT + chartH - f * chartH,
  }))

  // Peak Load path (smooth line connecting weekly peaks)
  const peakPoints = []
  for (let i = 0; i < n; i++) {
    const v = peakLoad[i]
    if (v != null && +v > 0) {
      const x = xFor(i) + barW / 2
      const y = yFor(+v)
      peakPoints.push({ x, y, v: +v, i })
    }
  }
  const peakPath = peakPoints.length > 1
    ? peakPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    : ''

  // Group weeks by month for separators + labels
  const MOIS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
  const monthGroups = [] // { monthLabel, startIdx, endIdx }
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

  // Value label stride — show value every ~4 bars
  const stride = Math.max(1, Math.ceil(n / 12))

  // Determine current week index — match by month + week-in-month
  const now = new Date()
  const curMonth = String(now.getMonth() + 1).padStart(2, '0')
  const curWeekInMonth = Math.ceil(now.getDate() / 7)
  const curKey = `${now.getFullYear()}-${curMonth}-S${curWeekInMonth}`
  let currentWeekIdx = -1
  for (let i = 0; i < n; i++) {
    if (weeks[i] === curKey) { currentWeekIdx = i; break }
  }
  // Fallback: find the last week of the current month if exact match not found
  if (currentWeekIdx === -1) {
    const curMonthPrefix = `${now.getFullYear()}-${curMonth}-`
    for (let i = n - 1; i >= 0; i--) {
      if ((weeks[i] || '').startsWith(curMonthPrefix)) { currentWeekIdx = i; break }
    }
  }

  // Check if site has VESTOP data at all
  const hasVestop = vestop.some(v => +v > 0)

  return (
    <div className="puiss-hebdo-chart">
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
            <span style={{ display:'inline-block', width:14, height:0, borderTop:'2px dashed #E05C5C', marginRight:4, verticalAlign:'middle' }} />
            Contrat
          </span>
          <span className="legend-item">
            <span style={{ display:'inline-block', width:12, height:2, borderRadius:1, background:'#f37056', marginRight:4, verticalAlign:'middle' }} />
            Peak
          </span>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block' }}
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
              {t.v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Y unit */}
        <text x={padL - 6} y={padT - 3} textAnchor="end" fontSize="7" fill="#ffffff">MW</text>

        {/* Contrat — horizontal reference line + Y-axis label */}
        {(() => {
          // Find the dominant contrat value (most common)
          const cVals = contrat.map(c => +c || 0).filter(c => c > 0)
          if (cVals.length === 0) return null
          const contratVal = cVals[Math.floor(cVals.length / 2)] // median
          const y = yFor(contratVal)
          return (
            <g>
              {/* Dashed horizontal line across full chart */}
              <line
                x1={padL} y1={y.toFixed(1)}
                x2={W - padR} y2={y.toFixed(1)}
                stroke="#E05C5C"
                strokeWidth="1.5"
                strokeDasharray="6,3"
              />
              {/* Value label on Y axis */}
              <text
                x={padL - 6} y={y + 3}
                textAnchor="end"
                fontSize="8"
                fontWeight="600"
                fill="#E05C5C"
              >
                {contratVal.toFixed(1)}
              </text>
            </g>
          )
        })()}

        {/* Bars: Solid ENELEC/VESTOP */}
        {weeks.map((_, i) => {
          const e = +enelec[i]  || 0
          const v = +vestop[i]  || 0
          const c = +contrat[i] || 0
          const total = e + v
          const x = xFor(i)

          const isCurrent = i === currentWeekIdx
          const isPast = currentWeekIdx >= 0 && i < currentWeekIdx
          const isFuture = currentWeekIdx >= 0 && i > currentWeekIdx

          // Ghost bar for Contrat (prévisionnel) — full width, behind
          const yContrat = c > 0 ? yFor(c) : padT + chartH
          const hContrat = padT + chartH - yContrat

          // Solid ENELEC bar (slightly narrower, in front)
          const yEnelec = e > 0 ? yFor(e) : padT + chartH
          const hEnelec = padT + chartH - yEnelec

          // VESTOP stacked on top of ENELEC
          const yVestop = v > 0 ? yFor(total) : yEnelec
          const hVestop = v > 0 ? (yEnelec - yVestop) : 0

          // Réalisé = vert/teal solide | Planifié (futur) = violet solide
          const enelecFill = isFuture ? '#5e4c9f' : '#00ab63'
          const vestopFill = isFuture ? '#7b6bb5' : '#5aafaf'

          return (
            <g key={i}>
              {/* ENELEC bar */}
              {e > 0 && (
                <rect
                  x={(x + gapBars).toFixed(1)}
                  y={yEnelec.toFixed(1)}
                  width={(barW - gapBars * 2).toFixed(1)}
                  height={Math.max(0, hEnelec).toFixed(1)}
                  rx="2"
                  fill={enelecFill}
                />
              )}
              {/* VESTOP bar */}
              {v > 0 && (
                <rect
                  x={(x + gapBars).toFixed(1)}
                  y={yVestop.toFixed(1)}
                  width={(barW - gapBars * 2).toFixed(1)}
                  height={Math.max(0, hVestop).toFixed(1)}
                  rx="2"
                  fill={vestopFill}
                />
              )}
              {/* Invisible hover zone with tooltip */}
              <rect
                x={(padL + i * slot).toFixed(1)}
                y={padT.toFixed(1)}
                width={slot.toFixed(1)}
                height={chartH.toFixed(1)}
                fill="transparent"
                style={{ cursor: 'pointer' }}
              >
                <title>{`${isFuture ? '(Prévisionnel)' : '(Réalisé)'}\nContrat: ${c.toFixed(1)} MW\nENELEC: ${e.toFixed(1)} MW\nVESTOP: ${v.toFixed(1)} MW\nTotal dispo: ${total.toFixed(1)} MW`}</title>
              </rect>
            </g>
          )
        })}

        {/* Peak Load line (prominent) */}
        {peakPath && (
          <path
            d={peakPath}
            fill="none"
            stroke="#f37056"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        )}
        {/* Peak Load dots */}
        {peakPoints.map((pt, idx) => (
          <g key={idx}>
            <circle cx={pt.x.toFixed(1)} cy={pt.y.toFixed(1)} r="2.5" fill="#080b18" stroke="#f37056" strokeWidth="1.2" />
          </g>
        ))}

        {/* Month separators (vertical lines) + month labels */}
        {monthGroups.map((mg, idx) => {
          const xStart = padL + mg.startIdx * slot
          const xEnd = padL + (mg.endIdx + 1) * slot
          const xCenter = (xStart + xEnd) / 2
          const currentMonthNum = new Date().getMonth() + 1
          const mMatch = /^\d{4}-(\d{2})/.exec(weeks[mg.startIdx] || '')
          const isCurrMonth = mMatch && parseInt(mMatch[1], 10) === currentMonthNum
          return (
            <g key={`month-${idx}`}>
              {/* Vertical separator at start of month (skip first) */}
              {idx > 0 && (
                <line
                  x1={xStart.toFixed(1)} y1={padT}
                  x2={xStart.toFixed(1)} y2={(padT + chartH + 4).toFixed(1)}
                  stroke="rgba(138,146,171,0.45)"
                  strokeWidth="1"
                />
              )}
              {/* Month label centered under the group */}
              <text
                x={xCenter.toFixed(1)}
                y={H - 5}
                textAnchor="middle"
                fontSize="8"
                fontWeight={isCurrMonth ? '700' : '400'}
                fill="#ffffff"
              >
                {mg.monthLabel}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
