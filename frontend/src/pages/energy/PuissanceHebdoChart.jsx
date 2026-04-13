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

  // Week tick labels — adaptive stride
  const stride = Math.max(1, Math.ceil(n / 8))
  const xLabels = []
  for (let i = 0; i < n; i += stride) {
    const wk = weeks[i] || ''
    const m = /^\d{4}-(\d{2})-S(\d+)/.exec(wk)
    const lab = m
      ? `${['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][parseInt(m[1], 10) - 1]} S${m[2]}`
      : wk
    xLabels.push({ i, lab })
  }

  // Determine current week index (approximate)
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const currentWeekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
  let currentWeekIdx = -1
  for (let i = 0; i < n; i++) {
    const m = /S(\d+)/.exec(weeks[i] || '')
    if (m && parseInt(m[1], 10) === currentWeekNum) { currentWeekIdx = i; break }
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
            ENELEC
          </span>
          {hasVestop && (
            <span className="legend-item">
              <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background:'#5aafaf', marginRight:4, verticalAlign:'middle' }} />
              VESTOP
            </span>
          )}
          <span className="legend-item">
            <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background:'rgba(255,255,255,0.06)', border:'1px dashed rgba(255,255,255,0.4)', marginRight:4, verticalAlign:'middle' }} />
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
              fill="rgba(138,146,171,0.6)"
            >
              {t.v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Y unit */}
        <text x={padL - 6} y={padT - 3} textAnchor="end" fontSize="7" fill="rgba(138,146,171,0.5)">MW</text>

        {/* Bars: Ghost contrat behind + Solid ENELEC/VESTOP in front */}
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

          // Color intensity: current week = full, past = slightly dimmed, future = very dim
          const enelecFill = isCurrent ? '#00ab63' : isPast ? 'rgba(0,171,99,0.65)' : 'rgba(0,171,99,0.35)'
          const vestopFill = isCurrent ? '#5aafaf' : isPast ? 'rgba(90,175,175,0.65)' : 'rgba(90,175,175,0.35)'

          // Status indicator: total vs contrat
          const isUnder = total > 0 && c > 0 && total < c

          return (
            <g key={i}>
              {/* Ghost contrat bar */}
              {c > 0 && (
                <rect
                  x={x.toFixed(1)}
                  y={yContrat.toFixed(1)}
                  width={barW.toFixed(1)}
                  height={Math.max(0, hContrat).toFixed(1)}
                  rx="2"
                  fill="rgba(255,255,255,0.05)"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="0.7"
                  strokeDasharray="3,2"
                />
              )}
              {/* ENELEC solid bar */}
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
              {/* VESTOP solid bar (stacked on top of ENELEC) */}
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
              {/* Value on top of stacked bar — show total */}
              {total > 0 && i % stride === 0 && (
                <text
                  x={(x + barW / 2).toFixed(1)}
                  y={((v > 0 ? yVestop : yEnelec) - 3).toFixed(1)}
                  textAnchor="middle"
                  fontSize="6.5"
                  fontWeight="400"
                  fill={isUnder ? '#E05C5C' : isCurrent ? '#00ab63' : 'rgba(0,171,99,0.7)'}
                >
                  {total.toFixed(1)}
                </text>
              )}
              {/* Delta indicator if under contrat */}
              {isUnder && !isFuture && i % stride === 0 && (
                <text
                  x={(x + barW / 2).toFixed(1)}
                  y={(padT + chartH + 10).toFixed(1)}
                  textAnchor="middle"
                  fontSize="6"
                  fill="#E05C5C"
                >
                  ▼
                </text>
              )}
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
            {/* Show peak value every stride */}
            {pt.i % stride === 0 && (
              <text
                x={pt.x.toFixed(1)}
                y={(pt.y - 5).toFixed(1)}
                textAnchor="middle"
                fontSize="6"
                fill="#f37056"
              >
                {pt.v.toFixed(1)}
              </text>
            )}
          </g>
        ))}

        {/* X axis labels */}
        {xLabels.map(({ i, lab }) => (
          <text
            key={i}
            x={(xFor(i) + barW / 2).toFixed(1)}
            y={H - 5}
            textAnchor="middle"
            fontSize="7.5"
            fontWeight={i === currentWeekIdx ? '700' : '400'}
            fill={i === currentWeekIdx ? 'var(--text)' : 'rgba(138,146,171,0.7)'}
          >
            {lab}
          </text>
        ))}
      </svg>
    </div>
  )
}
