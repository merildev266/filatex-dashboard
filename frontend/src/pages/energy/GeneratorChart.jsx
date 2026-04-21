import { useState, useRef } from 'react'
import { isoWeekDays } from '../../utils/weekUtils'

/**
 * GeneratorChart — Puissance disponible + Production per generator
 * Renders TWO separate charts: one for power (MW), one for production (MWh)
 *
 * Props:
 *   generator    — generator object (with monthlyMaxLoad, monthlyProd, dailyMaxLoad, dailyProd)
 *   filter       — 'A' | 'Q' | 'M' | 'S'
 *   monthIndex   — 0..11 (selected month index when filter='M')
 *   quarter      — 1..4 (selected quarter when filter='Q')
 *   week         — ISO week number when filter='S'
 *   weekYear     — ISO year for the week
 *   height       — SVG height in px per chart (default 180)
 */

const MOIS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const DAYS_FR    = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

export default function GeneratorChart({ generator: g, filter, monthIndex, quarter, week, weekYear, height = 180 }) {
  if (!g) return null

  const monthlyMaxLoad = g.monthlyMaxLoad || []
  const monthlyProd    = g.monthlyProd || []
  const dailyMaxLoad   = g.dailyMaxLoad || []
  const dailyProd      = g.dailyProd || []
  const dailyByMonth   = g.dailyByMonth || {}

  const hasMonthly = monthlyMaxLoad.some(v => v > 0) || monthlyProd.some(v => v > 0)
  const hasDaily   = dailyMaxLoad.some(v => v > 0) || dailyProd.some(v => v > 0)
  if (!hasMonthly && !hasDaily) return null

  const isDaily = filter === 'M' || filter === 'S'

  // Build data arrays
  let labels = []
  let maxLoadData = []   // kW → MW
  let prodData = []      // kWh → MWh

  if (filter === 'S' && week) {
    const wy = weekYear || new Date().getFullYear()
    const days = isoWeekDays(wy, week)
    for (let i = 0; i < 7; i++) {
      const wd = days[i]
      const dmMonth = dailyByMonth[String(wd.m)] || dailyByMonth[wd.m]
      const dml = (dmMonth && dmMonth.dailyMaxLoad) || []
      const dp  = (dmMonth && dmMonth.dailyProd) || []
      labels.push(`${DAYS_FR[i]} ${wd.d}`)
      maxLoadData.push((+dml[wd.d - 1] || 0) / 1000)
      prodData.push((+dp[wd.d - 1] || 0) / 1000)
    }
  } else if (filter === 'M' && hasDaily) {
    const daysInMonth = new Date(2026, (monthIndex || 0) + 1, 0).getDate()
    for (let d = 0; d < daysInMonth; d++) {
      labels.push(String(d + 1))
      maxLoadData.push((dailyMaxLoad[d] || 0) / 1000)
      prodData.push((dailyProd[d] || 0) / 1000)
    }
  } else if (filter === 'Q' && hasMonthly) {
    const startMonth = ((quarter || 1) - 1) * 3
    for (let m = startMonth; m < startMonth + 3 && m < 12; m++) {
      labels.push(MOIS_SHORT[m])
      maxLoadData.push((monthlyMaxLoad[m] || 0) / 1000)
      prodData.push((monthlyProd[m] || 0) / 1000)
    }
  } else if (hasMonthly) {
    for (let m = 0; m < 12; m++) {
      labels.push(MOIS_SHORT[m])
      maxLoadData.push((monthlyMaxLoad[m] || 0) / 1000)
      prodData.push((monthlyProd[m] || 0) / 1000)
    }
  } else {
    return null
  }

  const hasLoad = maxLoadData.some(v => v > 0)
  const hasProd = prodData.some(v => v > 0)
  if (!hasLoad && !hasProd) return null

  const nominalMw = g.nominal || g.mw || 0
  const periodLabel = filter === 'S' ? 'Semaine' : (isDaily ? 'Journalier' : 'Mensuel')

  return (
    <div>
      {hasLoad && (
        <SingleBarChart
          labels={labels}
          data={maxLoadData}
          title={`Puissance max — ${periodLabel}`}
          unit="MW"
          color="#00ab63"
          refLine={nominalMw > 0 ? { value: nominalMw, color: '#f0a030', label: 'Nominal' } : null}
          isDaily={isDaily}
          height={height}
        />
      )}
      {hasProd && (
        <SingleBarChart
          labels={labels}
          data={prodData}
          title={`Production — ${periodLabel}`}
          unit="MWh"
          color="#5e4c9f"
          isDaily={isDaily}
          height={height}
        />
      )}
    </div>
  )
}


/** Single metric bar chart */
function SingleBarChart({ labels, data, title, unit, color, refLine, isDaily, height }) {
  const [tooltip, setTooltip] = useState(null)
  const chartRef = useRef(null)

  const n = labels.length
  if (n === 0) return null

  const padL = 48
  const padR = 12
  const padT = 14
  const padB = 28
  const W = 720
  const H = height
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const slot = chartW / n
  const barW = isDaily ? slot * 0.85 : slot * 0.65
  const gap = barW * 0.08

  let maxY = 0
  data.forEach(v => { if (v > maxY) maxY = v })
  if (refLine && refLine.value > maxY) maxY = refLine.value * 1.1
  if (maxY === 0) maxY = 1
  maxY = Math.ceil(maxY * 1.2)

  const xFor = (i) => padL + i * slot + (slot - barW) / 2
  const yFor = (v) => padT + chartH - (v / maxY) * chartH

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    v: maxY * f,
    y: padT + chartH - f * chartH,
  }))

  const handleHover = (e, i) => {
    if (!chartRef.current) return
    const rect = chartRef.current.getBoundingClientRect()
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      label: labels[i],
      value: data[i],
    })
  }

  const refY = refLine ? yFor(refLine.value) : null

  return (
    <div ref={chartRef} className="puiss-hebdo-chart" style={{ position: 'relative' }}>
      <div className="puiss-hebdo-header">
        <span className="puiss-hebdo-title">{title}</span>
        <span className="puiss-hebdo-legend">
          <span className="legend-item">
            <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background: color, marginRight:4, verticalAlign:'middle' }} />
            {unit === 'MW' ? 'Puissance max' : 'Production'}
          </span>
          {refLine && (
            <span className="legend-item">
              <span style={{ display:'inline-block', width:14, height:0, borderTop:`1px dashed ${refLine.color}`, marginRight:4, verticalAlign:'middle' }} />
              {refLine.label}
            </span>
          )}
        </span>
      </div>

      <svg
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
              stroke="rgba(138,146,171,0.12)" strokeWidth="0.5"
              strokeDasharray={i === 0 ? '0' : '2,3'}
            />
            <text x={padL - 6} y={t.y + 3} textAnchor="end" fontSize="8" fill="#ffffff">
              {t.v >= 1000 ? (t.v / 1000).toFixed(1) + 'k' : t.v < 10 ? t.v.toFixed(1) : Math.round(t.v)}
            </text>
          </g>
        ))}

        <text x={padL - 6} y={padT - 6} textAnchor="end" fontSize="7" fill="#ffffff">{unit}</text>

        {/* Reference line */}
        {refY != null && (
          <g>
            <line
              x1={padL} y1={refY.toFixed(1)} x2={W - padR} y2={refY.toFixed(1)}
              stroke={refLine.color} strokeWidth="1" strokeDasharray="6,3"
            />
            <text x={padL - 6} y={refY + 3} textAnchor="end" fontSize="8" fontWeight="600" fill={refLine.color}>
              {refLine.value.toFixed(1)}
            </text>
          </g>
        )}

        {/* Bars */}
        {data.map((v, i) => {
          if (v <= 0) return null
          const x = xFor(i)
          const yBar = yFor(v)
          const hBar = padT + chartH - yBar
          return (
            <rect
              key={i}
              x={(x + gap).toFixed(1)} y={yBar.toFixed(1)}
              width={(barW - gap * 2).toFixed(1)} height={Math.max(0, hBar).toFixed(1)}
              rx="2" fill={color}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(ev) => handleHover(ev, i)}
              onMouseMove={(ev) => handleHover(ev, i)}
              onMouseLeave={() => setTooltip(null)}
            />
          )
        })}

        {/* X labels */}
        {labels.map((lbl, i) => {
          const x = padL + i * slot + slot / 2
          const isCurrent = isDaily
            ? i === new Date().getDate() - 1
            : i === new Date().getMonth()
          return (
            <text
              key={i} x={x.toFixed(1)} y={H - 5}
              textAnchor="middle"
              fontSize={isDaily ? '6' : '8'}
              fontWeight={isCurrent ? '700' : '400'}
              fill="#ffffff"
            >
              {lbl}
            </text>
          )
        })}
      </svg>

      {/* Tooltip */}
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
            minWidth: 120,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: '#ffffff', marginBottom: 6, borderBottom: '1px solid rgba(138,146,171,0.2)', paddingBottom: 4 }}>
            {isDaily ? `Jour ${tooltip.label}` : tooltip.label}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 10 }}>
            <span style={{ color: 'rgba(138,146,171,0.8)' }}>{unit === 'MW' ? 'Puissance max' : 'Production'}</span>
            <span style={{ color, fontWeight: 600 }}>
              {tooltip.value > 0
                ? (tooltip.value >= 100 ? Math.round(tooltip.value).toLocaleString('fr-FR') : tooltip.value.toFixed(1)) + ` ${unit}`
                : '—'}
            </span>
          </div>
          {refLine && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 10, marginTop: 4, borderTop: '1px solid rgba(138,146,171,0.15)', paddingTop: 4 }}>
              <span style={{ color: 'rgba(138,146,171,0.8)' }}>{refLine.label}</span>
              <span style={{ color: refLine.color, fontWeight: 600 }}>{refLine.value.toFixed(1)} {unit}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
