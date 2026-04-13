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
            <span style={{ display:'inline-block', width:14, height:0, borderTop:'2px dashed #5e4c9f', marginRight:5, verticalAlign:'middle' }} />
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

        {/* Prévisionnel — horizontal reference line + Y-axis label */}
        {(() => {
          const objVals = data.map(d => d.prodObj).filter(v => v > 0)
          if (objVals.length === 0) return null
          const objVal = objVals[Math.floor(objVals.length / 2)] // median
          const y = yFor(objVal)
          return (
            <g>
              <line
                x1={padL} y1={y.toFixed(1)}
                x2={W - padR} y2={y.toFixed(1)}
                stroke="#5e4c9f"
                strokeWidth="1.5"
                strokeDasharray="6,3"
              />
              <text
                x={padL - 6} y={y + 3}
                textAnchor="end"
                fontSize="8"
                fontWeight="600"
                fill="#5e4c9f"
              >
                {objVal >= 1000 ? (objVal / 1000).toFixed(1) + 'k' : objVal.toFixed(0)}
              </text>
            </g>
          )
        })()}

        {/* Réalisé bars (solid green) */}
        {data.map((d, i) => {
          const x = xFor(i)
          const hasProd = d.prod > 0
          const hasObj = d.prodObj > 0
          const isCurrent = i === currentMonth
          const isFuture = i > currentMonth

          // Réalisé bar
          const yProd = hasProd ? yFor(d.prod) : padT + chartH
          const hProd = padT + chartH - yProd

          return (
            <g key={i}>
              {/* Réalisé solid bar */}
              {hasProd && (
                <rect
                  x={(x + gapBars).toFixed(1)}
                  y={yProd.toFixed(1)}
                  width={(barW - gapBars * 2).toFixed(1)}
                  height={Math.max(0, hProd).toFixed(1)}
                  rx="2"
                  fill="#00ab63"
                />
              )}
              {/* Value on top of bar */}
              {hasProd && (
                <text
                  x={(x + barW / 2).toFixed(1)}
                  y={(yProd - 4).toFixed(1)}
                  textAnchor="middle"
                  fontSize="7"
                  fontWeight="400"
                  fill="#00ab63"
                >
                  {d.prod >= 1000 ? (d.prod / 1000).toFixed(1) + 'k' : Math.round(d.prod)}
                </text>
              )}
              {/* No delta indicators — the line reference is enough */}
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
