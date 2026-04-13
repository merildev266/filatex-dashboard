/**
 * ProductionChart — Monthly production (MWh) chart
 * Réalisé = solid green bars | Prévisionnel = ghost bars behind
 *
 * Props:
 *   months   Array<{ prod:number, prodObj?:number }>  length 12
 *   title    string
 *   height   px (default 200)
 */
const MOIS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function ProductionChart({ months = [], title = 'Production mensuelle', height = 200 }) {
  if (!Array.isArray(months) || months.length === 0) return null

  const n = months.length
  const data = months.map(m => ({
    prod:    +(m?.prod || 0),
    prodObj: +(m?.prodObj || 0),
  }))

  let maxY = 0
  data.forEach(d => {
    if (d.prod > maxY) maxY = d.prod
    if (d.prodObj > maxY) maxY = d.prodObj
  })
  if (maxY === 0) maxY = 10
  maxY = Math.ceil(maxY * 1.2)

  const padL = 42
  const padR = 12
  const padT = 12
  const padB = 28
  const W = 720
  const H = height
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const slot = chartW / n
  const barW = slot * 0.65
  const gapBars = barW * 0.08

  const xFor = (i) => padL + i * slot + (slot - barW) / 2
  const yFor = (v) => padT + chartH - (v / maxY) * chartH

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    v: maxY * f,
    y: padT + chartH - f * chartH,
  }))

  const currentMonth = new Date().getMonth()

  return (
    <div className="puiss-hebdo-chart">
      <div className="puiss-hebdo-header">
        <span className="puiss-hebdo-title">{title}</span>
        <span className="puiss-hebdo-legend">
          <span className="legend-item">
            <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background:'#00ab63', marginRight:5, verticalAlign:'middle' }} />
            Réalisé
          </span>
          <span className="legend-item">
            <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background:'rgba(255,255,255,0.12)', border:'1px dashed rgba(255,255,255,0.4)', marginRight:5, verticalAlign:'middle' }} />
            Prévisionnel
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
              {t.v >= 1000 ? (t.v / 1000).toFixed(1) + 'k' : t.v.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Y unit */}
        <text x={padL - 6} y={padT - 3} textAnchor="end" fontSize="7" fill="rgba(138,146,171,0.5)">MWh</text>

        {/* Bars: Prévisionnel (ghost behind) + Réalisé (solid front) */}
        {data.map((d, i) => {
          const x = xFor(i)
          const hasProd = d.prod > 0
          const hasObj = d.prodObj > 0
          const isCurrent = i === currentMonth
          const isFuture = i > currentMonth

          // Prévisionnel ghost bar (full width, behind)
          const yObj = hasObj ? yFor(d.prodObj) : padT + chartH
          const hObj = padT + chartH - yObj

          // Réalisé bar (slightly narrower, in front)
          const yProd = hasProd ? yFor(d.prod) : padT + chartH
          const hProd = padT + chartH - yProd

          return (
            <g key={i}>
              {/* Prévisionnel ghost bar */}
              {hasObj && (
                <rect
                  x={x.toFixed(1)}
                  y={yObj.toFixed(1)}
                  width={barW.toFixed(1)}
                  height={Math.max(0, hObj).toFixed(1)}
                  rx="2"
                  fill="rgba(255,255,255,0.06)"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="0.8"
                  strokeDasharray="3,2"
                />
              )}
              {/* Réalisé solid bar */}
              {hasProd && (
                <rect
                  x={(x + gapBars).toFixed(1)}
                  y={yProd.toFixed(1)}
                  width={(barW - gapBars * 2).toFixed(1)}
                  height={Math.max(0, hProd).toFixed(1)}
                  rx="2"
                  fill={isCurrent ? '#00ab63' : 'rgba(0,171,99,0.7)'}
                />
              )}
              {/* Value on top of bar if there's data */}
              {hasProd && (
                <text
                  x={(x + barW / 2).toFixed(1)}
                  y={(yProd - 4).toFixed(1)}
                  textAnchor="middle"
                  fontSize="7"
                  fontWeight="400"
                  fill={isCurrent ? '#00ab63' : 'rgba(0,171,99,0.8)'}
                >
                  {d.prod >= 1000 ? (d.prod / 1000).toFixed(1) + 'k' : Math.round(d.prod)}
                </text>
              )}
              {/* Delta indicator: red arrow down if under obj, green check if above */}
              {hasProd && hasObj && !isFuture && (
                <text
                  x={(x + barW / 2).toFixed(1)}
                  y={(padT + chartH + 11).toFixed(1)}
                  textAnchor="middle"
                  fontSize="7"
                  fill={d.prod >= d.prodObj ? '#00ab63' : '#E05C5C'}
                >
                  {d.prod >= d.prodObj ? '▲' : '▼'}
                </text>
              )}
            </g>
          )
        })}

        {/* Month labels */}
        {MOIS_SHORT.slice(0, n).map((m, i) => (
          <text
            key={i}
            x={(xFor(i) + barW / 2).toFixed(1)}
            y={H - 4}
            textAnchor="middle"
            fontSize="8"
            fontWeight={i === currentMonth ? '700' : '400'}
            fill={i === currentMonth ? 'var(--text)' : 'rgba(138,146,171,0.7)'}
          >
            {m}
          </text>
        ))}
      </svg>
    </div>
  )
}
