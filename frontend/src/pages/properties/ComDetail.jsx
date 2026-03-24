import { useState, useMemo, Fragment } from 'react'
import {
  comData_venteImmo, comData_venteImmoTotal,
  comData_venteFonciere, comData_venteFonciereTotal,
  comData_location, comData_locationTotal
} from '../../data/commercial_objectives'

const VERT = '#00ab63'
const YELLOW = '#FDB823'
const RED = '#E05C5C'
const TEAL = '#5aafaf'

const Q = Math.floor(new Date().getMonth() / 3) + 1
const Q_LABELS = ['Jan-Mar', 'Avr-Jun', 'Jul-Sep', 'Oct-Dec']

function fmtEur(v) {
  if (v == null) return '\u2014'
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace('.', ',') + ' M\u20AC'
  if (v >= 1000) return Math.round(v / 1000) + ' k\u20AC'
  return Math.round(v).toLocaleString('fr-FR') + ' \u20AC'
}

function fmtCell(v) {
  if (v == null) return <span style={{ color: 'rgba(255,255,255,0.15)' }}>&mdash;</span>
  return fmtEur(v)
}

function sumF(arr, field) {
  return arr.reduce((s, r) => s + (r[field] || 0), 0)
}

function pct(realise, objectif) {
  if (!objectif) return '\u2014'
  if (!realise) return <span style={{ color: 'rgba(255,255,255,0.25)' }}>0 %</span>
  const p = Math.round(realise / objectif * 100)
  const col = p >= 80 ? VERT : p >= 40 ? YELLOW : RED
  return <span style={{ color: col, fontWeight: 700 }}>{p} %</span>
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

/* ═══ Category section: header card + collapsible detail table ═══ */
function CategorySection({ cat }) {
  const [open, setOpen] = useState(false)
  const rgb = hexToRgb(cat.color)

  // Computed values
  let catRealise = 0
  for (let qi = 1; qi <= 4; qi++) catRealise += sumF(cat.data, 't' + qi + 'r')
  const catPct = cat.total ? Math.round(catRealise / cat.total * 100) : 0
  const catQObj = sumF(cat.data, 't' + Q)
  const catQReal = sumF(cat.data, 't' + Q + 'r')

  return (
    <div style={{ marginBottom: 36 }}>
      {/* Clickable header card */}
      <div
        className="com-obj-card"
        style={{ borderColor: `rgba(${rgb},0.25)`, cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <div className="com-obj-card-header">
          <div className="com-obj-card-title" style={{ color: cat.color }}>{cat.title}</div>
          <div className="com-obj-card-kpis">
            <div className="com-obj-kpi">
              <div className="com-obj-kpi-val" style={{ color: cat.color }}>{fmtEur(cat.total)}</div>
              <div className="com-obj-kpi-label">Objectif</div>
            </div>
            <div className="com-obj-kpi">
              <div className="com-obj-kpi-val">{cat.data.length}</div>
              <div className="com-obj-kpi-label">{cat.itemLabel}</div>
            </div>
            <div className="com-obj-kpi">
              <div className="com-obj-kpi-val" style={{ color: TEAL }}>{fmtEur(catQObj)}</div>
              <div className="com-obj-kpi-label">Obj. Q{Q}</div>
            </div>
            <div className="com-obj-kpi">
              <div className="com-obj-kpi-val" style={{ color: catPct >= 80 ? VERT : catPct >= 40 ? YELLOW : RED }}>{catPct} %</div>
              <div className="com-obj-kpi-label">Realise</div>
            </div>
          </div>
          <div className="com-obj-expand" style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.3s'
          }}>&#9660;</div>
        </div>
      </div>

      {/* Detail table (collapsible) */}
      {open && (
        <div className="com-obj-detail open">
          <div className="table-wrap" style={{
            background: `rgba(${rgb},0.02)`,
            borderColor: `rgba(${rgb},0.12)`,
            marginTop: 12,
            border: `1px solid rgba(${rgb},0.12)`,
            borderRadius: 12,
            overflow: 'hidden'
          }}>
            <table className="groups-table com-obj-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Nom</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>Objectif</th>
                  {[1, 2, 3, 4].map(qi => {
                    const isActive = qi === Q
                    return (
                      <th key={qi} colSpan={2} style={{
                        textAlign: 'center', padding: '10px 6px', fontSize: 10, fontWeight: 700,
                        color: isActive ? cat.color : 'rgba(255,255,255,0.4)',
                        letterSpacing: '0.05em'
                      }}>
                        Q{qi}{isActive ? ' \u25CF' : ''}
                      </th>
                    )
                  })}
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>% Annuel</th>
                </tr>
                <tr style={{ fontSize: 8, opacity: 0.5 }}>
                  <th></th>
                  <th></th>
                  {[1, 2, 3, 4].map(qi => (
                    <Fragment key={qi}>
                      <th style={{ padding: '4px 4px', textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>Obj.</th>
                      <th style={{ padding: '4px 4px', textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>Realise</th>
                    </Fragment>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cat.data.map((row, i) => {
                  let rowRealise = 0
                  for (let qi = 1; qi <= 4; qi++) rowRealise += (row['t' + qi + 'r'] || 0)
                  const rowPct = row.objectif ? Math.round(rowRealise / row.objectif * 100) : 0

                  return (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'rgba(255,255,255,0.8)' }}>{row.name}</td>
                      <td style={{ padding: '8px 8px', fontSize: 11, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>{fmtEur(row.objectif)}</td>
                      {[1, 2, 3, 4].map(qi => {
                        const obj = row['t' + qi]
                        const real = row['t' + qi + 'r']
                        const isActive = qi === Q
                        const bgS = isActive ? `rgba(${rgb},0.06)` : 'transparent'
                        return (
                          <Fragment key={qi}>
                            <td style={{ padding: '8px 4px', fontSize: 10, textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: bgS }}>
                              {fmtCell(obj)}
                            </td>
                            <td style={{ padding: '8px 4px', fontSize: 10, textAlign: 'center', fontWeight: 600, background: bgS,
                              color: real != null ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.15)'
                            }}>
                              {real != null ? fmtEur(real) : <span style={{ color: 'rgba(255,255,255,0.15)' }}>&mdash;</span>}
                            </td>
                          </Fragment>
                        )
                      })}
                      <td style={{ padding: '8px 8px', textAlign: 'center', fontSize: 11 }}>
                        {pct(rowRealise, row.objectif)}
                      </td>
                    </tr>
                  )
                })}

                {/* TOTAL row */}
                <tr style={{ borderTop: `2px solid rgba(${rgb},0.2)`, fontWeight: 800 }}>
                  <td style={{ padding: '10px 12px', fontSize: 11, textAlign: 'left', color: cat.color }}>TOTAL</td>
                  <td style={{ padding: '10px 8px', fontSize: 11, textAlign: 'center', color: cat.color }}>{fmtEur(cat.total)}</td>
                  {[1, 2, 3, 4].map(qi => {
                    const tObj = sumF(cat.data, 't' + qi)
                    const tReal = sumF(cat.data, 't' + qi + 'r')
                    const isActive = qi === Q
                    const bgS = isActive ? `rgba(${rgb},0.06)` : 'transparent'
                    return (
                      <Fragment key={qi}>
                        <td style={{ padding: '10px 4px', fontSize: 10, textAlign: 'center', color: cat.color, background: bgS }}>
                          {fmtCell(tObj || null)}
                        </td>
                        <td style={{ padding: '10px 4px', fontSize: 10, textAlign: 'center', color: VERT, fontWeight: 700, background: bgS }}>
                          {fmtCell(tReal || null)}
                        </td>
                      </Fragment>
                    )
                  })}
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 11 }}>
                    {pct(catRealise, cat.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══ MAIN COMPONENT ═══ */
export default function ComDetail() {
  const cats = [
    {
      id: 'vente-projet', title: 'Vente Projet', color: VERT,
      data: comData_venteImmo || [],
      total: comData_venteImmoTotal || 0,
      itemLabel: 'Projets'
    },
    {
      id: 'vente-terrain', title: 'Vente Terrain', color: YELLOW,
      data: comData_venteFonciere || [],
      total: comData_venteFonciereTotal || 0,
      itemLabel: 'Terrains'
    },
    {
      id: 'location', title: 'Location', color: TEAL,
      data: comData_location || [],
      total: comData_locationTotal || 0,
      itemLabel: 'Biens'
    }
  ]

  const grandTotal = cats.reduce((s, c) => s + c.total, 0)
  const nbItems = cats.reduce((s, c) => s + c.data.length, 0)
  let grandRealise = 0
  cats.forEach(cat => {
    for (let qi = 1; qi <= 4; qi++) grandRealise += sumF(cat.data, 't' + qi + 'r')
  })
  const globalPct = grandTotal ? Math.round(grandRealise / grandTotal * 100) : 0

  return (
    <div>
      {/* KPI bar */}
      <div className="com-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(0,171,99,0.18)' }}>
          <div className="props-kpi-label">Objectif total 2026</div>
          <div className="props-kpi-val" style={{ color: VERT }}>{fmtEur(grandTotal)}</div>
          <div className="props-kpi-sub">Ventes + Location</div>
        </div>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(0,171,99,0.18)' }}>
          <div className="props-kpi-label">Projets / Biens</div>
          <div className="props-kpi-val" style={{ color: VERT }}>{nbItems}</div>
          <div className="props-kpi-sub">{cats[0].data.length} projets &middot; {cats[1].data.length} terrains &middot; {cats[2].data.length} biens</div>
        </div>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(0,171,99,0.18)' }}>
          <div className="props-kpi-label">Realise global</div>
          <div className="props-kpi-val" style={{ color: globalPct >= 80 ? VERT : globalPct >= 40 ? YELLOW : RED }}>{globalPct} %</div>
          <div className="props-kpi-sub">{fmtEur(grandRealise)} encaisse</div>
        </div>
        <div className="props-kpi-card" style={{ borderColor: 'rgba(90,175,175,0.25)' }}>
          <div className="props-kpi-label">Trimestre</div>
          <div className="props-kpi-val" style={{ color: TEAL }}>Q{Q}</div>
          <div className="props-kpi-sub">{Q_LABELS[Q - 1]} 2026</div>
        </div>
      </div>

      {/* Category sections */}
      {cats.map(cat => (
        <CategorySection key={cat.id} cat={cat} />
      ))}
    </div>
  )
}
