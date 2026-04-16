import { useState, useRef } from 'react'

/**
 * ProductionChart — Production (MWh) chart
 *
 * Props:
 *   months   Array<{ prod:number, prodObj?:number }>  arbitrary length
 *   labels   Array<string>   (optional) custom labels — defaults to MOIS_SHORT
 *   isDaily  boolean         (optional) true when bars represent days
 *   title    string
 *   height   px (default 200)
 */
const MOIS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function ProductionChart({ months = [], labels, isDaily = false, title = 'Production mensuelle', height = 200 }) {
  if (!Array.isArray(months) || months.length === 0) return null

  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  const n = months.length
  const data = months.map(m => ({
    prod:    +(m?.prod || 0),
    prodObj: +(m?.prodObj || 0),
  }))
  const xLabels = Array.isArray(labels) && labels.length === n ? labels : MOIS_SHORT.slice(0, n)

  let maxY = 0
  data.forEach(d => {
    if (d.prod > maxY) maxY = d.prod
    if (d.prodObj > maxY) maxY = d.prodObj
  })
  if (maxY === 0) maxY = 10
  maxY = Math.ceil(maxY * 1.2)

  const padL = 48
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

  const today = new Date()
  const currentIndex = isDaily ? (today.getDate() - 1) : today.getMonth()

  const chartRef = useRef(null)
  const handleBarHover = (e, i) => {
    if (!chartRef.current) return
    const rect = chartRef.current.getBoundingClientRect()
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      month: isDaily ? `Jour ${xLabels[i]}` : xLabels[i],
      prod: data[i].prod,
      prodObj: data[i].prodObj,
    })
  }

  return (
    <div ref={chartRef} className="puiss-hebdo-chart" style={{ position: 'relative' }}>
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
              {t.v >= 1000 ? (t.v / 1000).toFixed(1) + 'k' : t.v.toFixed(0)}
            </text>
          </g>
        ))}

        <text x={padL - 6} y={padT - 6} textAnchor="end" fontSize="7" fill="#ffffff">MWh</text>

        {/* Prévisionnel line */}
        {(() => {
          const objVals = data.map(d => d.prodObj).filter(v => v > 0)
          if (objVals.length === 0) return null
          const objVal = objVals[Math.floor(objVals.length / 2)]
          const y = yFor(objVal)
          return (
            <g>
              <line x1={padL} y1={y.toFixed(1)} x2={W - padR} y2={y.toFixed(1)} stroke="#5e4c9f" strokeWidth="1.5" strokeDasharray="6,3" />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="8" fontWeight="600" fill="#5e4c9f">
                {objVal >= 1000 ? (objVal / 1000).toFixed(1) + 'k' : objVal.toFixed(0)}
              </text>
            </g>
          )
        })()}

        {/* Réalisé bars */}
        {data.map((d, i) => {
          const x = xFor(i)
          const hasProd = d.prod > 0
          const yProd = hasProd ? yFor(d.prod) : padT + chartH
          const hProd = padT + chartH - yProd

          return (
            <g key={i}>
              {hasProd && (
                <rect
                  x={(x + gapBars).toFixed(1)} y={yProd.toFixed(1)}
                  width={(barW - gapBars * 2).toFixed(1)} height={Math.max(0, hProd).toFixed(1)}
                  rx="2" fill="#00ab63"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(ev) => handleBarHover(ev, i)}
                  onMouseMove={(ev) => handleBarHover(ev, i)}
                  onMouseLeave={() => setTooltip(null)}
                />
              )}
            </g>
          )
        })}

        {/* X labels (months or days) */}
        {xLabels.map((m, i) => (
          <text
            key={i}
            x={(xFor(i) + barW / 2).toFixed(1)}
            y={H - 4}
            textAnchor="middle"
            fontSize={isDaily ? '6' : '8'}
            fontWeight={i === currentIndex ? '700' : '400'}
            fill="#ffffff"
          >
            {m}
          </text>
        ))}
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
            minWidth: 150,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: '#ffffff', marginBottom: 8, borderBottom: '1px solid rgba(138,146,171,0.2)', paddingBottom: 6 }}>
            {tooltip.month}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ color: 'rgba(138,146,171,0.8)' }}>Prévisionnel</span>
              <span style={{ color: '#5e4c9f', fontWeight: 600 }}>{tooltip.prodObj > 0 ? Math.round(tooltip.prodObj) + ' MWh' : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ color: 'rgba(138,146,171,0.8)' }}>Réalisé HFO</span>
              <span style={{ color: '#00ab63', fontWeight: 600 }}>{tooltip.prod > 0 ? Math.round(tooltip.prod) + ' MWh' : '—'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
