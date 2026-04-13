/**
 * ProductionChart — Monthly production (MWh) chart shown alongside
 * PuissanceHebdoChart at HFO / Site levels.
 *
 * Props:
 *   months   Array<{ prod:number, prodObj?:number }>  length 12
 *   title    string (default "Production mensuelle")
 *   height   px (default 160)
 */
const MOIS_SHORT = ['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec']

export default function ProductionChart({ months = [], title = 'Production mensuelle', height = 160 }) {
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
  maxY = Math.ceil(maxY * 1.15)

  const padL = 36
  const padR = 10
  const padT = 10
  const padB = 20
  const W = 720
  const H = height
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const slot = chartW / n
  const barW = slot * 0.55

  const xFor = (i) => padL + i * slot + (slot - barW) / 2
  const yFor = (v) => padT + chartH - (v / maxY) * chartH

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    v: maxY * f,
    y: padT + chartH - f * chartH,
  }))

  // Objectif line (if prodObj is present)
  const objPath = data
    .map((d, i) => {
      if (!d.prodObj) return null
      const x = xFor(i) + barW / 2
      const y = yFor(d.prodObj)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .filter(Boolean)

  const currentMonth = new Date().getMonth()

  return (
    <div className="puiss-hebdo-chart">
      <div className="puiss-hebdo-header">
        <span className="puiss-hebdo-title">{title}</span>
        <span className="puiss-hebdo-legend">
          <span className="legend-item"><span className="swatch swatch-enelec" />Réelle</span>
          <span className="legend-item"><span className="swatch swatch-contrat" />Objectif</span>
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

        {/* Y unit label */}
        <text
          x={padL - 5} y={padT - 2}
          textAnchor="end"
          fontSize="7"
          fill="rgba(138,146,171,0.6)"
        >
          MWh
        </text>

        {/* Production bars */}
        {data.map((d, i) => {
          if (d.prod <= 0) return null
          const y = yFor(d.prod)
          const h = padT + chartH - y
          const isCurrent = i === currentMonth
          return (
            <rect
              key={i}
              x={xFor(i).toFixed(1)}
              y={y.toFixed(1)}
              width={barW.toFixed(1)}
              height={Math.max(0, h).toFixed(1)}
              fill={isCurrent ? 'rgba(0,171,99,0.85)' : 'rgba(0,171,99,0.55)'}
            />
          )
        })}

        {/* Objectif dashed line */}
        {objPath.length > 1 && (
          <polyline
            points={objPath.join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1.2"
            strokeDasharray="4,3"
          />
        )}

        {/* Month labels */}
        {MOIS_SHORT.slice(0, n).map((m, i) => (
          <text
            key={i}
            x={(xFor(i) + barW / 2).toFixed(1)}
            y={H - 6}
            textAnchor="middle"
            fontSize="8"
            fill="rgba(138,146,171,0.75)"
          >
            {m}
          </text>
        ))}
      </svg>
    </div>
  )
}
