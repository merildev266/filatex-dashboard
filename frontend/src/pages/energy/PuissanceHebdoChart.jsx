/**
 * PuissanceHebdoChart — Weekly "puissance previsionnelle" chart
 * shown at every HFO level (HFO / Site / Generator).
 *
 * Displays:
 *   - Stacked bars: ENELEC (green) + VESTOP (teal) per week
 *   - Horizontal line: Contrat (dashed)
 *   - Line/dots: Peak Load (red-orange)
 *
 * Props:
 *   data    { weeks[], enelec[], vestop[], contrat[], peakLoad[] }
 *   title   optional title shown above the chart (default: "Puissance hebdomadaire")
 *   height  SVG height in px (default 160)
 */
export default function PuissanceHebdoChart({ data, title = 'Puissance hebdomadaire', height = 160 }) {
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
  maxY = Math.ceil(maxY * 1.15) // 15% headroom

  // Layout
  const padL = 28   // left axis labels
  const padR = 10
  const padT = 10
  const padB = 22   // bottom week labels
  const W = 720     // logical width — SVG will scale via viewBox
  const H = height
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const barGap = 2
  const barW   = Math.max(1.5, (chartW - barGap * (n - 1)) / n)

  const xFor = (i) => padL + i * (barW + barGap)
  const yFor = (v) => padT + chartH - (v / maxY) * chartH

  // Y grid ticks (0, 25%, 50%, 75%, 100%)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    v: maxY * f,
    y: padT + chartH - f * chartH,
  }))

  // Contrat: we draw as a step line (value per week) + highlight as dashed
  const contratPath = contrat.length === n ? contrat.map((v, i) => {
    const x = xFor(i) + barW / 2
    const y = yFor(+v || 0)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ') : ''

  // PeakLoad: same — line with dots
  const peakPath = peakLoad.length === n ? peakLoad.map((v, i) => {
    if (v == null) return null
    const x = xFor(i) + barW / 2
    const y = yFor(+v)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).filter(Boolean) : []

  // Week tick labels — every ~8 weeks to avoid overcrowding
  const stride = Math.max(1, Math.ceil(n / 8))
  const xLabels = []
  for (let i = 0; i < n; i += stride) {
    const wk = weeks[i] || ''
    // weeks look like "2026-01-S1" — keep "Jan" + week num, or just "S1"
    const m = /^\d{4}-(\d{2})-S(\d+)/.exec(wk)
    const lab = m
      ? `${['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec'][parseInt(m[1], 10) - 1]} S${m[2]}`
      : wk
    xLabels.push({ i, lab })
  }

  return (
    <div className="puiss-hebdo-chart">
      <div className="puiss-hebdo-header">
        <span className="puiss-hebdo-title">{title}</span>
        <span className="puiss-hebdo-legend">
          <span className="legend-item"><span className="swatch swatch-enelec" />ENELEC</span>
          <span className="legend-item"><span className="swatch swatch-vestop" />VESTOP</span>
          <span className="legend-item"><span className="swatch swatch-contrat" />Contrat</span>
          <span className="legend-item"><span className="swatch swatch-peak" />Peak Load</span>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block' }}
      >
        {/* Y grid lines + tick labels */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL} y1={t.y} x2={W - padR} y2={t.y}
              stroke="rgba(138,146,171,0.15)"
              strokeWidth="0.5"
              strokeDasharray={i === 0 ? '0' : '2,3'}
            />
            <text
              x={padL - 5} y={t.y + 3}
              textAnchor="end"
              fontSize="8"
              fill="rgba(138,146,171,0.7)"
            >
              {t.v.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Stacked bars: ENELEC (bottom) + VESTOP (top) */}
        {weeks.map((_, i) => {
          const e = +enelec[i] || 0
          const v = +vestop[i] || 0
          const x = xFor(i)
          const yEnelecTop = yFor(e)
          const hEnelec = padT + chartH - yEnelecTop
          const yVestopTop = yFor(e + v)
          const hVestop = yEnelecTop - yVestopTop
          return (
            <g key={i}>
              {e > 0 && (
                <rect
                  x={x.toFixed(1)} y={yEnelecTop.toFixed(1)}
                  width={barW.toFixed(1)} height={Math.max(0, hEnelec).toFixed(1)}
                  fill="rgba(0,171,99,0.55)"
                />
              )}
              {v > 0 && (
                <rect
                  x={x.toFixed(1)} y={yVestopTop.toFixed(1)}
                  width={barW.toFixed(1)} height={Math.max(0, hVestop).toFixed(1)}
                  fill="rgba(90,175,175,0.75)"
                />
              )}
            </g>
          )
        })}

        {/* Contrat line (dashed) */}
        {contratPath && (
          <path
            d={contratPath}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1.2"
            strokeDasharray="4,3"
          />
        )}

        {/* Peak Load line + dots */}
        {peakPath.length > 1 && (
          <polyline
            points={peakPath.join(' ')}
            fill="none"
            stroke="#f37056"
            strokeWidth="1.4"
          />
        )}
        {peakPath.map((pt, i) => {
          const [x, y] = pt.split(',')
          return <circle key={i} cx={x} cy={y} r="1.8" fill="#f37056" />
        })}

        {/* X axis tick labels */}
        {xLabels.map(({ i, lab }) => (
          <text
            key={i}
            x={(xFor(i) + barW / 2).toFixed(1)}
            y={H - 6}
            textAnchor="middle"
            fontSize="8"
            fill="rgba(138,146,171,0.75)"
          >
            {lab}
          </text>
        ))}
      </svg>
    </div>
  )
}
