import { useState, useRef } from 'react'

/**
 * ProductionChart — Production (MWh) chart
 *
 * Props:
 *   months   Array<{ prod:number, prodObj?:number, prod2025?:number }>
 *   labels   Array<string>   (optional) custom labels — defaults to MOIS_SHORT
 *   isDaily  boolean         (optional) true when bars represent days
 *   compare2025 boolean      render 2025 bars side-by-side when truthy
 *   title    string
 *   height   px (default 200)
 */
const MOIS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function ProductionChart({ months = [], labels, isDaily = false, compare2025 = false, onToggleCompare2025, title = 'Production mensuelle', height = 200 }) {
  if (!Array.isArray(months) || months.length === 0) return null

  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  const n = months.length
  const data = months.map(m => ({
    prod:    +(m?.prod || 0),
    prodObj: +(m?.prodObj || 0),
    prod2025: +(m?.prod2025 || 0),
  }))
  const xLabels = Array.isArray(labels) && labels.length === n ? labels : MOIS_SHORT.slice(0, n)

  let maxY = 0
  data.forEach(d => {
    if (d.prod > maxY) maxY = d.prod
    if (d.prodObj > maxY) maxY = d.prodObj
    if (compare2025 && d.prod2025 > maxY) maxY = d.prod2025
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
  // Largeur barre : plus fine quand comparaison (2 barres cote a cote)
  const barW = slot * (compare2025 ? 0.36 : 0.65)
  const barGap = compare2025 ? slot * 0.04 : 0
  const gapBars = barW * 0.08

  // Position de la barre "realise" (decalee a gauche quand compare2025)
  const xFor = (i) => {
    const baseX = padL + i * slot + (slot - (compare2025 ? (barW * 2 + barGap) : barW)) / 2
    return baseX
  }
  // Position de la 2e barre (2025) quand comparaison active
  const xFor2025 = (i) => xFor(i) + barW + barGap
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
      prod2025: data[i].prod2025,
    })
  }

  return (
    <div ref={chartRef} className="puiss-hebdo-chart" style={{ position: 'relative' }}>
      <div className="puiss-hebdo-header" style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span className="puiss-hebdo-title" style={{ flex: '1 1 auto' }}>{title}</span>
        {compare2025 && (() => {
          const tot25 = data.reduce((s, d) => s + (d.prod2025 || 0), 0)
          const tot26 = data.reduce((s, d) => s + (d.prod || 0), 0)
          const fmt = (v) => v >= 1000 ? (v / 1000).toFixed(1) + ' GWh' : Math.round(v).toLocaleString('fr-FR') + ' MWh'
          return (
            <div style={{ display:'flex', alignItems:'center', gap:14, fontSize:11 }}>
              <span className="legend-item" style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
                <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background:'#426ab3' }} />
                <span>2025</span>
                <span style={{ color:'#426ab3', fontWeight:600 }}>· {fmt(tot25)}</span>
              </span>
              <span className="legend-item" style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
                <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background:'#00ab63' }} />
                <span>2026</span>
                <span style={{ color:'#00ab63', fontWeight:600 }}>· {fmt(tot26)}</span>
              </span>
            </div>
          )
        })()}
        <span className="puiss-hebdo-legend" style={{ marginLeft: 'auto', flex: '0 0 auto' }}>
          {onToggleCompare2025 && (
            <label
              className="legend-item"
              style={{ display:'inline-flex', alignItems:'center', gap:5, cursor:'pointer', userSelect:'none' }}
            >
              <input
                type="checkbox"
                checked={!!compare2025}
                onChange={(e) => onToggleCompare2025(e.target.checked)}
                style={{
                  appearance:'none', WebkitAppearance:'none',
                  width:12, height:12, borderRadius:3,
                  border:`1.5px solid ${compare2025 ? '#426ab3' : 'rgba(138,146,171,0.5)'}`,
                  backgroundColor: compare2025 ? '#426ab3' : 'transparent',
                  backgroundImage: compare2025
                    ? "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'><path d='M2.5 6.2l2.3 2.3 4.7-4.7' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>\")"
                    : 'none',
                  backgroundSize:'10px 10px',
                  backgroundRepeat:'no-repeat',
                  backgroundPosition:'center',
                  cursor:'pointer', margin:0,
                }}
              />
              <span style={{ color: compare2025 ? '#426ab3' : 'inherit', fontWeight: compare2025 ? 600 : 400 }}>2025</span>
            </label>
          )}
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

        {/* Barres — ordre: 2025 (gauche, bleu) puis 2026 (droite, vert) si compare2025 */}
        {data.map((d, i) => {
          const has2025 = compare2025 && d.prod2025 > 0
          const hasProd = d.prod > 0
          const yProd = hasProd ? yFor(d.prod) : padT + chartH
          const hProd = padT + chartH - yProd
          const yProd25 = has2025 ? yFor(d.prod2025) : padT + chartH
          const hProd25 = padT + chartH - yProd25
          // Quand compare : 2025 a gauche (xFor), 2026 a droite (xFor2025)
          const x2025 = compare2025 ? xFor(i) : xFor(i)
          const x2026 = compare2025 ? xFor2025(i) : xFor(i)

          return (
            <g key={i}>
              {has2025 && (
                <rect
                  x={(x2025 + gapBars).toFixed(1)} y={yProd25.toFixed(1)}
                  width={(barW - gapBars * 2).toFixed(1)} height={Math.max(0, hProd25).toFixed(1)}
                  rx="2" fill="#426ab3"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(ev) => handleBarHover(ev, i)}
                  onMouseMove={(ev) => handleBarHover(ev, i)}
                  onMouseLeave={() => setTooltip(null)}
                />
              )}
              {hasProd && (
                <rect
                  x={(x2026 + gapBars).toFixed(1)} y={yProd.toFixed(1)}
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

        {/* X labels (months or days) — centres sur le groupe de barres */}
        {xLabels.map((m, i) => {
          const groupW = compare2025 ? (barW * 2 + barGap) : barW
          const cx = xFor(i) + groupW / 2
          return (
            <text
              key={i}
              x={cx.toFixed(1)}
              y={H - 4}
              textAnchor="middle"
              fontSize={isDaily ? '6' : '8'}
              fontWeight={i === currentIndex ? '700' : '400'}
              fill="#ffffff"
            >
              {m}
            </text>
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
            minWidth: 150,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: '#ffffff', marginBottom: 8, borderBottom: '1px solid rgba(138,146,171,0.2)', paddingBottom: 6 }}>
            {tooltip.month}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10 }}>
            {!compare2025 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ color: 'rgba(138,146,171,0.8)' }}>Prévisionnel</span>
                <span style={{ color: '#5e4c9f', fontWeight: 600 }}>{tooltip.prodObj > 0 ? Math.round(tooltip.prodObj) + ' MWh' : '—'}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ color: 'rgba(138,146,171,0.8)' }}>{compare2025 ? '2026' : 'Réalisé HFO'}</span>
              <span style={{ color: '#00ab63', fontWeight: 600 }}>{tooltip.prod > 0 ? Math.round(tooltip.prod) + ' MWh' : '—'}</span>
            </div>
            {compare2025 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: 'rgba(138,146,171,0.8)' }}>2025</span>
                  <span style={{ color: '#426ab3', fontWeight: 600 }}>{tooltip.prod2025 > 0 ? Math.round(tooltip.prod2025) + ' MWh' : '—'}</span>
                </div>
                {(tooltip.prod > 0 || tooltip.prod2025 > 0) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderTop: '1px solid rgba(138,146,171,0.2)', paddingTop: 4, marginTop: 2 }}>
                    <span style={{ color: 'rgba(138,146,171,0.8)' }}>Écart</span>
                    <span style={{
                      color: (tooltip.prod - tooltip.prod2025) >= 0 ? '#00ab63' : '#E05C5C',
                      fontWeight: 600,
                    }}>
                      {(tooltip.prod - tooltip.prod2025) >= 0 ? '+' : ''}
                      {Math.round(tooltip.prod - tooltip.prod2025)} MWh
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
