import { useMemo, Fragment } from 'react'
import KpiBox from '../../components/KpiBox'
import {
  comData_venteImmo, comData_venteImmoTotal,
  comData_venteFonciere, comData_venteFonciereTotal,
  comData_location, comData_locationTotal
} from '../../data/commercial_objectives'

const ORANGE = '#f37056'
const VERT = '#00ab63'
const RED = '#E05C5C'
const QUARTERS = ['T1', 'T2', 'T3', 'T4']

function formatEur(v) {
  if (v == null) return '-'
  if (v >= 1000000) return (v / 1000000).toFixed(2) + ' M'
  if (v >= 1000) return Math.round(v).toLocaleString()
  return v.toFixed(0)
}

function QuarterTable({ data, total, title, unit }) {
  // Calculate quarterly totals
  const qTotals = useMemo(() => {
    const totals = { t1: 0, t1r: 0, t2: 0, t2r: 0, t3: 0, t3r: 0, t4: 0, t4r: 0 }
    data.forEach(row => {
      QUARTERS.forEach((_, qi) => {
        const key = `t${qi + 1}`
        const keyR = `t${qi + 1}r`
        totals[key] += row[key] || 0
        totals[keyR] += row[keyR] || 0
      })
    })
    return totals
  }, [data])

  const totalRealised = qTotals.t1r + qTotals.t2r + qTotals.t3r + qTotals.t4r

  return (
    <div className="glass-card p-5 mb-6" style={{ borderColor: `${ORANGE}20` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold" style={{ color: ORANGE }}>{title}</h3>
        <div className="text-[10px] text-[var(--text-muted)]">
          Objectif: <span className="font-bold text-white/80">{formatEur(total)} {unit}</span>
        </div>
      </div>

      {/* Realised summary */}
      <div className="mb-4 p-3 rounded-lg bg-[rgba(243,112,86,0.06)] border border-[rgba(243,112,86,0.12)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-dim)]">Realise total</span>
          <span className="text-sm font-bold" style={{ color: totalRealised > 0 ? VERT : 'rgba(255,255,255,0.4)' }}>
            {totalRealised > 0 ? formatEur(totalRealised) + ' ' + unit : 'Aucune donnee'}
          </span>
        </div>
        {total > 0 && totalRealised > 0 && (
          <div className="mt-2">
            <div className="h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min((totalRealised / total) * 100, 100)}%`,
                  backgroundColor: (totalRealised / total) >= 0.5 ? VERT : ORANGE
                }}
              />
            </div>
            <div className="text-[9px] text-[var(--text-muted)] mt-1 text-right">
              {((totalRealised / total) * 100).toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-2 px-2 font-bold text-[var(--text-dim)] uppercase tracking-wider">Projet</th>
              <th className="text-right py-2 px-2 font-bold text-[var(--text-dim)]">Objectif</th>
              {QUARTERS.map(q => (
                <th key={q} className="text-center py-2 px-2 font-bold text-[var(--text-dim)]" colSpan={2}>
                  {q}
                </th>
              ))}
            </tr>
            <tr className="border-b border-[rgba(255,255,255,0.04)]">
              <th></th>
              <th></th>
              {QUARTERS.map(q => (
                <Fragment key={q + 'sub'}>
                  <th className="text-right py-1 px-1 text-[8px] text-[var(--text-dim)]">Obj</th>
                  <th className="text-right py-1 px-1 text-[8px] text-[var(--text-dim)]">Real</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                <td className="py-2 px-2 font-semibold text-white/80">{row.name}</td>
                <td className="py-2 px-2 text-right font-bold" style={{ color: ORANGE }}>
                  {formatEur(row.objectif)}
                </td>
                {QUARTERS.map((_, qi) => {
                  const obj = row[`t${qi + 1}`]
                  const real = row[`t${qi + 1}r`]
                  return (
                    <Fragment key={`q${qi}`}>
                      <td className="py-2 px-1 text-right text-[var(--text-dim)]">
                        {obj ? formatEur(obj) : '-'}
                      </td>
                      <td className="py-2 px-1 text-right font-bold"
                        style={{ color: real != null ? (obj && real >= obj ? VERT : ORANGE) : 'rgba(255,255,255,0.2)' }}>
                        {real != null ? formatEur(real) : '-'}
                      </td>
                    </Fragment>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ComDetail() {
  const globalTotal = (comData_venteImmoTotal || 0) + (comData_venteFonciereTotal || 0) + (comData_locationTotal || 0)

  return (
    <div>
      {/* Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4" style={{ borderColor: `${ORANGE}25` }}>
          <KpiBox value={formatEur(comData_venteImmoTotal) + ' EUR'} label="Vente Immobiliere" color={ORANGE} size="sm" />
        </div>
        <div className="glass-card p-4" style={{ borderColor: `${ORANGE}25` }}>
          <KpiBox value={formatEur(comData_venteFonciereTotal) + ' EUR'} label="Vente Fonciere" color={ORANGE} size="sm" />
        </div>
        <div className="glass-card p-4" style={{ borderColor: `${ORANGE}25` }}>
          <KpiBox value={formatEur(comData_locationTotal) + ' EUR'} label="Location" color={ORANGE} size="sm" />
        </div>
      </div>

      {/* Sections */}
      <QuarterTable
        data={comData_venteImmo}
        total={comData_venteImmoTotal}
        title="Vente Immobiliere"
        unit="EUR"
      />

      <QuarterTable
        data={comData_venteFonciere}
        total={comData_venteFonciereTotal}
        title="Vente Fonciere"
        unit="EUR"
      />

      <QuarterTable
        data={comData_location}
        total={comData_locationTotal}
        title="Location"
        unit="EUR"
      />
    </div>
  )
}
