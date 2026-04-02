// Finance helpers — shared formatting & aggregation utilities
import KpiCard from '../../components/KpiCard'

export const COLOR = '#1abc9c'

export function fmtMga(v) {
  if (!v) return '—'
  const abs = Math.abs(v)
  if (abs >= 1e9) return `${(v / 1e9).toFixed(2)} Mds`
  if (abs >= 1e6) return `${(v / 1e6).toFixed(1)} M`
  if (abs >= 1e3) return `${(v / 1e3).toFixed(0)} K`
  return v.toLocaleString('fr-FR')
}

export function aggregate(clients) {
  let totalCreances = 0, encaissements = 0, standby = 0, contentieux = 0
  let resteACollecter = 0, planMars = 0, planAvril = 0, planMai = 0
  let montant2025 = 0, montant2026 = 0
  clients.forEach(c => {
    totalCreances += c.totalCreances || 0
    encaissements += c.encaissements || 0
    standby += c.standby || 0
    contentieux += c.contentieux || 0
    resteACollecter += c.resteACollecter || 0
    planMars += c.planMars || 0
    planAvril += c.planAvril || 0
    planMai += c.planMai || 0
    montant2025 += c.montant2025 || 0
    montant2026 += c.montant2026 || 0
  })
  // Average delay in days (only clients with retard > 0)
  const retards = clients.map(c => c.retardJours).filter(r => r && r > 0)
  const avgRetard = retards.length > 0 ? Math.round(retards.reduce((a, b) => a + b, 0) / retards.length) : 0
  const maxRetard = retards.length > 0 ? Math.max(...retards) : 0
  const countRetard = retards.length

  return { totalCreances, encaissements, standby, contentieux, resteACollecter, planMars, planAvril, planMai, montant2025, montant2026, count: clients.length, avgRetard, maxRetard, countRetard }
}

// Compact KPI cards (static, no filter)
export function KpiCards({ items }) {
  return (
    <div className="grid gap-2 mb-3" style={{ width: '100%', maxWidth: 700, gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map((kpi, i) => (
        <KpiCard
          key={i}
          variant="card"
          size="sm"
          value={kpi.value}
          label={kpi.label}
          color={kpi.color || 'var(--text)'}
          subText={kpi.pct !== undefined && kpi.pct !== null ? `${kpi.pct}%` : undefined}
          unit={kpi.unit}
          unitPosition="below"
          style={{ padding: 'clamp(8px, 1.2vw, 14px) clamp(6px, 1vw, 12px)' }}
        />
      ))}
    </div>
  )
}

// Clickable KPI filter cards
export function KpiFilterCards({ items, active, onSelect }) {
  return (
    <div className="grid gap-2 mb-3" style={{ width: '100%', maxWidth: 700, gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map((kpi, i) => {
        const isActive = active === kpi.filterKey
        return (
          <div
            key={i}
            onClick={(e) => { e.stopPropagation(); onSelect(isActive ? null : kpi.filterKey) }}
          >
            <KpiCard
              variant="card"
              size="sm"
              value={kpi.value}
              label={kpi.label}
              color={kpi.color || 'var(--text)'}
              subText={kpi.pct !== undefined && kpi.pct !== null ? `${kpi.pct}%` : (kpi.count !== undefined ? `${kpi.count} client${kpi.count > 1 ? 's' : ''}` : undefined)}
              style={{
                padding: 'clamp(8px, 1.2vw, 14px) clamp(6px, 1vw, 12px)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                borderColor: isActive ? (kpi.color || COLOR) : undefined,
                boxShadow: isActive ? `0 0 20px ${kpi.color || COLOR}33, inset 0 0 12px ${kpi.color || COLOR}11` : undefined,
                background: isActive ? `${kpi.color || COLOR}0A` : undefined,
                transform: isActive ? 'scale(1.03)' : undefined,
                opacity: active && !isActive ? 0.45 : 1,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ── Nature classification ──
// TCM: Note de Débit vs Loyer+Vente (based on souche field)
// FLX: Loyer vs Pénalité vs Caution (based on observations)

// Nature classifiers (exported for filter use)
export function isTcmNoteDebit(c) {
  const s = (c.souche || '').toLowerCase()
  return s.includes('notede') || s.includes('notedé')
}

export function getFlxNature(c) {
  const obs = (c.observations || '').toUpperCase()
  if (obs.includes('NOTE DE DEBIT')) return 'penalite'
  if (obs.includes('FONCIER')) return 'caution'
  return 'loyer'
}

// Nature filter card renderer (shared between FLX and TCM)
function NatureFilterCard({ it, isActive, hasFilter, onClick }) {
  return (
    <div onClick={onClick}>
      <KpiCard
        variant="card"
        size="sm"
        value={fmtMga(it.total)}
        label={it.label}
        color={it.color}
        subText={`${it.count} client${it.count > 1 ? 's' : ''}`}
        style={{
          padding: 'clamp(8px, 1.2vw, 14px) clamp(6px, 1vw, 12px)',
          borderLeft: `3px solid ${it.color}`,
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          borderColor: isActive ? it.color : undefined,
          boxShadow: isActive ? `0 0 20px ${it.color}33, inset 0 0 12px ${it.color}11` : undefined,
          background: isActive ? `${it.color}0A` : undefined,
          transform: isActive ? 'scale(1.03)' : undefined,
          opacity: hasFilter && !isActive ? 0.45 : 1,
        }}
      />
    </div>
  )
}

// TCM Nature KPI — 2 cards: Note de Débit | Loyer+Vente (filterable)
export function TcmNatureKpiCards({ clients, active, onSelect }) {
  const noteDebit = clients.filter(c => isTcmNoteDebit(c))
  const loyerVente = clients.filter(c => !isTcmNoteDebit(c))
  const items = [
    { key: 'tcm-notedebit', label: 'Note de Débit', total: aggregate(noteDebit).totalCreances, count: noteDebit.length, color: '#e67e22' },
    { key: 'tcm-loyervente', label: 'Loyer + Vente', total: aggregate(loyerVente).totalCreances, count: loyerVente.length, color: '#3498db' },
  ]
  const isFilterable = !!onSelect
  return (
    <div className="grid gap-2 mb-3" style={{ width: '100%', maxWidth: 700, gridTemplateColumns: 'repeat(2, 1fr)' }}>
      {items.map((it) => (
        <NatureFilterCard
          key={it.key} it={it}
          isActive={active === it.key}
          hasFilter={!!active}
          onClick={isFilterable ? () => onSelect(active === it.key ? null : it.key) : undefined}
        />
      ))}
    </div>
  )
}

// FLX Nature KPI — 3 cards: Loyer | Pénalité | Caution (filterable)
export function FlxNatureKpiCards({ clients, active, onSelect }) {
  const loyer = clients.filter(c => getFlxNature(c) === 'loyer')
  const penalite = clients.filter(c => getFlxNature(c) === 'penalite')
  const caution = clients.filter(c => getFlxNature(c) === 'caution')
  const items = [
    { key: 'flx-loyer', label: 'Loyer', total: aggregate(loyer).totalCreances, count: loyer.length, color: '#3498db' },
    { key: 'flx-penalite', label: 'Pénalité', total: aggregate(penalite).totalCreances, count: penalite.length, color: '#e67e22' },
    { key: 'flx-caution', label: 'Caution', total: aggregate(caution).totalCreances, count: caution.length, color: '#9b59b6' },
  ]
  const isFilterable = !!onSelect
  return (
    <div className="grid gap-2 mb-3" style={{ width: '100%', maxWidth: 700, gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {items.map((it) => (
        <NatureFilterCard
          key={it.key} it={it}
          isActive={active === it.key}
          hasFilter={!!active}
          onClick={isFilterable ? () => onSelect(active === it.key ? null : it.key) : undefined}
        />
      ))}
    </div>
  )
}

// Nature filter predicates (used in FinanceClientList)
export const NATURE_FILTERS = {
  'tcm-notedebit': (c) => isTcmNoteDebit(c),
  'tcm-loyervente': (c) => !isTcmNoteDebit(c),
  'flx-loyer': (c) => getFlxNature(c) === 'loyer',
  'flx-penalite': (c) => getFlxNature(c) === 'penalite',
  'flx-caution': (c) => getFlxNature(c) === 'caution',
}

// Nature KPI cards with percentage — replaces pie chart
import { useNavigate } from 'react-router-dom'

function buildSegments(entity, clients) {
  if (entity === 'filatex-sa') {
    const loyer = clients.filter(c => getFlxNature(c) === 'loyer')
    const penalite = clients.filter(c => getFlxNature(c) === 'penalite')
    const caution = clients.filter(c => getFlxNature(c) === 'caution')
    return [
      { filterKey: 'flx-loyer', label: 'Loyer', value: aggregate(loyer).totalCreances, count: loyer.length, color: '#3498db' },
      { filterKey: 'flx-penalite', label: 'Pénalité', value: aggregate(penalite).totalCreances, count: penalite.length, color: '#e67e22' },
      { filterKey: 'flx-caution', label: 'Caution', value: aggregate(caution).totalCreances, count: caution.length, color: '#9b59b6' },
    ]
  }
  const noteDebit = clients.filter(c => isTcmNoteDebit(c))
  const loyerVente = clients.filter(c => !isTcmNoteDebit(c))
  return [
    { filterKey: 'tcm-loyervente', label: 'Loyer + Vente', value: aggregate(loyerVente).totalCreances, count: loyerVente.length, color: '#3498db' },
    { filterKey: 'tcm-notedebit', label: 'Note de Débit', value: aggregate(noteDebit).totalCreances, count: noteDebit.length, color: '#e67e22' },
  ]
}

export function NatureDonut({ entity, clients, linkTo }) {
  const navigate = useNavigate()
  const total = clients.reduce((s, c) => s + (c.totalCreances || 0), 0)
  if (!total) return null
  const segments = buildSegments(entity, clients)

  const handleClick = (seg) => {
    if (linkTo) {
      const target = linkTo.includes('/groupe') || linkTo.includes('/hors-groupe')
        ? `${linkTo}?nature=${seg.filterKey}`
        : `${linkTo}/hors-groupe?nature=${seg.filterKey}`
      navigate(target)
    }
  }

  return (
    <div className="grid gap-2" style={{ width: '100%', gridTemplateColumns: `repeat(${segments.length}, 1fr)` }}>
      {segments.map((seg, i) => {
        const pct = total > 0 ? ((seg.value / total) * 100).toFixed(0) : 0
        return (
          <div
            key={i}
            onClick={(e) => { e.stopPropagation(); handleClick(seg) }}
            onMouseEnter={linkTo ? (e) => { const card = e.currentTarget.firstChild; card.style.borderColor = seg.color; card.style.boxShadow = `0 0 16px ${seg.color}22`; card.style.transform = 'translateY(-2px)' } : undefined}
            onMouseLeave={linkTo ? (e) => { const card = e.currentTarget.firstChild; card.style.borderColor = ''; card.style.boxShadow = ''; card.style.transform = '' } : undefined}
          >
            <KpiCard
              variant="card"
              size="sm"
              value={fmtMga(seg.value)}
              label={seg.label}
              color={seg.color}
              subText={`${pct}% — ${seg.count} client${seg.count > 1 ? 's' : ''}`}
              style={{
                padding: 'clamp(8px, 1.2vw, 14px) clamp(6px, 1vw, 12px)',
                borderLeft: `3px solid ${seg.color}`,
                cursor: linkTo ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ── Contractual Flow Chart — échéancier with à temps / en retard split ──
const MOIS_LABELS = { '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Aoû', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc' }

export function ContractFlowChart({ timeline }) {
  const [selectedBar, setSelectedBar] = useState(null)

  if (!timeline || timeline.length === 0) return null

  // Split into sections: before 2026 (condensed), 2026 months, after 2026
  const before2026 = timeline.filter(t => !t.periode.includes('-') && parseInt(t.periode) < 2026)
  const months2026 = timeline.filter(t => t.periode.startsWith('2026-'))
  const after2026 = timeline.filter(t => !t.periode.includes('-') && parseInt(t.periode) >= 2027)

  const allBars = [
    ...before2026.map(t => ({ ...t, label: t.periode, section: 'past' })),
    ...months2026.map(t => ({ ...t, label: MOIS_LABELS[t.periode.slice(5)] || t.periode.slice(5), section: '2026' })),
    ...after2026.map(t => ({ ...t, label: t.periode, section: 'future' })),
  ]

  const maxVal = Math.max(...allBars.map(b => b.contractuel), 1)
  const barH = 180
  const totalContractuel = allBars.reduce((s, b) => s + b.contractuel, 0)
  const totalATemps = allBars.reduce((s, b) => s + b.aTemps, 0)
  const totalEnRetard = allBars.reduce((s, b) => s + b.enRetard, 0)

  return (
    <div style={{ width: '100%', maxWidth: 850, margin: '0 auto', position: 'relative' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Échéancier contractuel TCM
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', display: 'flex', gap: 10 }}>
          <span>Total: <span style={{ fontWeight: 700, color: COLOR }}>{fmtMga(totalContractuel)}</span></span>
          <span>À temps: <span style={{ fontWeight: 700, color: '#00ab63' }}>{fmtMga(totalATemps)}</span></span>
          <span>En retard: <span style={{ fontWeight: 700, color: '#e05c5c' }}>{fmtMga(totalEnRetard)}</span></span>
        </div>
      </div>

      {/* Vertical bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: barH, padding: '0 2px' }}>
        {allBars.map((bar, i) => {
          const totalH = maxVal > 0 ? (bar.contractuel / maxVal) * barH : 0
          const retardH = maxVal > 0 ? (bar.enRetard / maxVal) * barH : 0
          const tempsH = totalH - retardH
          const is2026 = bar.section === '2026'
          const isPast = bar.section === 'past'
          const isSelected = selectedBar?.periode === bar.periode

          return (
            <div
              key={i}
              style={{ flex: is2026 ? 1.5 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
              onClick={() => setSelectedBar(isSelected ? null : bar)}
            >
              {/* Value on top */}
              {bar.contractuel > 0 && (
                <div style={{ fontSize: 6, fontWeight: 700, color: bar.enRetard > 0 ? '#e05c5c' : '#00ab63', marginBottom: 1, whiteSpace: 'nowrap', opacity: is2026 ? 1 : 0.6 }}>
                  {fmtMga(bar.contractuel)}
                </div>
              )}
              {/* Stacked bar: green (à temps) + red (en retard) */}
              <div style={{ width: '80%', height: barH, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {bar.enRetard > 0 && (
                  <div style={{
                    width: '100%', height: retardH, background: '#e05c5c',
                    borderRadius: tempsH > 0 ? '4px 4px 0 0' : '4px 4px 0 0',
                    opacity: isPast ? 0.5 : 1,
                  }} />
                )}
                {bar.aTemps > 0 && (
                  <div style={{
                    width: '100%', height: tempsH, background: '#00ab63',
                    borderRadius: bar.enRetard > 0 ? '0' : '4px 4px 0 0',
                    opacity: isPast ? 0.5 : 1,
                  }} />
                )}
                {bar.contractuel === 0 && (
                  <div style={{ width: '100%', height: 2, background: 'var(--card-border)', borderRadius: 1 }} />
                )}
              </div>
              {/* Selection indicator */}
              {isSelected && <div style={{ width: '80%', height: 2, background: COLOR, marginTop: 2, borderRadius: 1 }} />}
            </div>
          )
        })}
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', gap: 1, padding: '3px 2px 0' }}>
        {allBars.map((bar, i) => {
          const is2026 = bar.section === '2026'
          return (
            <div key={i} style={{
              flex: is2026 ? 1.5 : 1, textAlign: 'center',
              fontSize: is2026 ? 8 : 7, fontWeight: is2026 ? 700 : 400,
              color: is2026 ? 'var(--text)' : 'var(--text-muted)',
              opacity: is2026 ? 1 : 0.5,
            }}>
              {bar.label}
            </div>
          )
        })}
      </div>

      {/* Section separators */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8, fontSize: 7, color: 'var(--text-muted)' }}>
        <span style={{ opacity: 0.5 }}>← Historique</span>
        <span style={{ fontWeight: 700, color: COLOR }}>2026 (mois)</span>
        <span style={{ opacity: 0.5 }}>Futur →</span>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 8 }}>
        {[
          { color: '#00ab63', label: 'Clients à temps' },
          { color: '#e05c5c', label: 'Clients en retard' },
        ].map((l, i) => (
          <span key={i} style={{ fontSize: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)' }}>{l.label}</span>
          </span>
        ))}
      </div>

      {/* Selected bar detail */}
      {selectedBar && (
        <div style={{
          marginTop: 12, padding: '12px 16px', background: 'var(--dark, #0a0d1a)',
          border: '1px solid var(--card-border)', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{selectedBar.periode}</span>
            <button onClick={() => setSelectedBar(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>x</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 8, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Contractuel</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLOR }}>{fmtMga(selectedBar.contractuel)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 8, textTransform: 'uppercase', color: '#00ab63', letterSpacing: '0.08em' }}>À temps</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#00ab63' }}>{fmtMga(selectedBar.aTemps)}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{selectedBar.contractuel > 0 ? ((selectedBar.aTemps / selectedBar.contractuel) * 100).toFixed(0) : 0}%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 8, textTransform: 'uppercase', color: '#e05c5c', letterSpacing: '0.08em' }}>En retard</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e05c5c' }}>{fmtMga(selectedBar.enRetard)}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{selectedBar.contractuel > 0 ? ((selectedBar.enRetard / selectedBar.contractuel) * 100).toFixed(0) : 0}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Merge two monthly arrays into one
export function mergeMonthly(a, b) {
  const map = {}
  ;[...(a || []), ...(b || [])].forEach(m => {
    if (!map[m.mois]) map[m.mois] = { mois: m.mois, prevu: 0, reel: 0, clientsPrevu: [], clientsReel: [] }
    map[m.mois].prevu += m.prevu
    map[m.mois].reel += m.reel
    map[m.mois].clientsPrevu.push(...m.clientsPrevu)
    map[m.mois].clientsReel.push(...m.clientsReel)
  })
  return Object.values(map).sort((a, b) => a.mois.localeCompare(b.mois))
}

// ── Cash Flow Chart — vertical bars, prévu vs réel, click popup ──
import { useState } from 'react'

const MOIS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

export function CashFlowChart({ monthlyData }) {
  const [popup, setPopup] = useState(null)
  const [popupFilter, setPopupFilter] = useState(null) // 'reel' | 'nonpaye' | null

  if (!monthlyData || monthlyData.length === 0) return null

  // Filter 2026 months + group 2027
  const months2026 = []
  let sum2027prevu = 0, sum2027reel = 0, clients2027prevu = [], clients2027reel = []

  for (let m = 1; m <= 12; m++) {
    const key = `2026-${String(m).padStart(2, '0')}`
    const found = monthlyData.find(d => d.mois === key)
    months2026.push({
      label: MOIS_SHORT[m - 1],
      mois: key,
      prevu: found ? found.prevu : 0,
      reel: found ? found.reel : 0,
      clientsPrevu: found ? found.clientsPrevu : [],
      clientsReel: found ? found.clientsReel : [],
    })
  }

  monthlyData.forEach(d => {
    if (d.mois >= '2027') {
      sum2027prevu += d.prevu
      sum2027reel += d.reel
      d.clientsPrevu.forEach(c => clients2027prevu.push(c))
      d.clientsReel.forEach(c => clients2027reel.push(c))
    }
  })

  const allBars = [...months2026]
  if (sum2027prevu > 0 || sum2027reel > 0) {
    allBars.push({ label: '2027', mois: '2027', prevu: sum2027prevu, reel: sum2027reel, clientsPrevu: clients2027prevu, clientsReel: clients2027reel })
  }

  const maxVal = Math.max(...allBars.map(b => Math.max(b.prevu, b.reel)), 1)
  const barHeight = 160
  const totalPrevu = allBars.reduce((s, b) => s + b.prevu, 0)
  const totalReel = allBars.reduce((s, b) => s + b.reel, 0)

  return (
    <div style={{ width: '100%', maxWidth: 780, margin: '0 auto', position: 'relative' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Encaissements 2026
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
          Réel: <span style={{ fontWeight: 700, color: '#00ab63' }}>{fmtMga(totalReel)}</span>
          <span style={{ margin: '0 6px', opacity: 0.3 }}>|</span>
          Prévu: <span style={{ fontWeight: 700, color: '#3498db' }}>{fmtMga(totalPrevu)}</span>
        </div>
      </div>

      {/* Vertical bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: barHeight, padding: '0 4px' }}>
        {allBars.map((bar, i) => {
          const prevuH = maxVal > 0 ? (bar.prevu / maxVal) * barHeight : 0
          const reelH = maxVal > 0 ? (bar.reel / maxVal) * barHeight : 0
          const hasData = bar.prevu > 0 || bar.reel > 0
          const is2027 = bar.mois === '2027'

          return (
            <div
              key={i}
              onClick={() => { if (hasData) { setPopupFilter(null); setPopup(popup?.mois === bar.mois ? null : bar) } }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: hasData ? 'pointer' : 'default', position: 'relative' }}
            >
              {/* Value on top */}
              {hasData && (
                <div style={{ fontSize: 7, fontWeight: 700, color: bar.reel > 0 ? '#00ab63' : '#3498db', marginBottom: 2, whiteSpace: 'nowrap' }}>
                  {bar.reel > 0 ? fmtMga(bar.reel) : fmtMga(bar.prevu)}
                </div>
              )}
              {/* Stacked bar */}
              <div style={{ width: '100%', height: barHeight, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 0 }}>
                {/* Prévu (full bar, lighter) */}
                <div style={{
                  width: '80%', height: Math.max(prevuH, hasData ? 2 : 0), borderRadius: '4px 4px 0 0',
                  background: is2027 ? '#9b59b644' : '#3498db33',
                  position: 'relative',
                  transition: 'height 0.4s ease',
                }}>
                  {/* Réel (overlay from bottom, solid) */}
                  {bar.reel > 0 && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: Math.min(reelH, prevuH || reelH),
                      background: '#00ab63',
                      borderRadius: prevuH <= reelH ? '4px 4px 0 0' : '0',
                      transition: 'height 0.4s ease',
                    }} />
                  )}
                </div>
                {/* If réel > prévu, show overflow */}
                {bar.reel > bar.prevu && bar.prevu > 0 && (
                  <div style={{
                    width: '80%', height: reelH - prevuH, background: '#00ab63',
                    borderRadius: '4px 4px 0 0', marginBottom: -1,
                    transition: 'height 0.4s ease',
                  }} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Month labels */}
      <div style={{ display: 'flex', gap: 2, padding: '4px 4px 0' }}>
        {allBars.map((bar, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 8, fontWeight: (bar.prevu > 0 || bar.reel > 0) ? 700 : 400, color: (bar.prevu > 0 || bar.reel > 0) ? 'var(--text)' : 'var(--text-muted)', opacity: (bar.prevu > 0 || bar.reel > 0) ? 1 : 0.4 }}>
            {bar.label}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 10 }}>
        {[
          { color: '#3498db33', border: '#3498db', label: 'Prévu (échéances)' },
          { color: '#00ab63', label: 'Réel (encaissé)' },
        ].map((l, i) => (
          <span key={i} style={{ fontSize: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 10, borderRadius: 2, background: l.color, border: l.border ? `1px solid ${l.border}` : 'none', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)' }}>{l.label}</span>
          </span>
        ))}
      </div>

      {/* Popup — client detail on bar click */}
      {popup && (() => {
        const pctReel = popup.prevu > 0 ? ((popup.reel / popup.prevu) * 100).toFixed(0) : popup.reel > 0 ? '100+' : '0'
        const nonPaye = popup.clientsPrevu.filter(c => !popup.clientsReel.find(r => r.client === c.client))
        return (
          <div
            style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--dark, #0a0d1a)', border: '1px solid var(--card-border)', borderRadius: 12,
              padding: '16px 20px', zIndex: 20, width: 'min(92%, 400px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
              maxHeight: 340, overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{popup.mois}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 18, fontWeight: 800,
                  color: Number(pctReel) >= 100 ? '#00ab63' : Number(pctReel) >= 50 ? '#f39c12' : '#e05c5c',
                }}>{pctReel}%</span>
                <button onClick={() => setPopup(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>x</button>
              </div>
            </div>

            {/* Clickable filter cards: Encaissé / Non encaissé */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
              <div
                onClick={() => setPopupFilter(popupFilter === 'reel' ? null : 'reel')}
                style={{
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                  background: popupFilter === 'reel' ? 'rgba(0,171,99,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${popupFilter === 'reel' ? '#00ab63' : 'var(--card-border)'}`,
                  transition: 'all 0.2s',
                  opacity: popupFilter && popupFilter !== 'reel' ? 0.4 : 1,
                }}
              >
                <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#00ab63', fontWeight: 700, marginBottom: 2 }}>Encaissé</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#00ab63' }}>{fmtMga(popup.reel)}</div>
                <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>{popup.clientsReel.length} client{popup.clientsReel.length > 1 ? 's' : ''}</div>
              </div>
              <div
                onClick={() => setPopupFilter(popupFilter === 'nonpaye' ? null : 'nonpaye')}
                style={{
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                  background: popupFilter === 'nonpaye' ? 'rgba(224,92,92,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${popupFilter === 'nonpaye' ? '#e05c5c' : 'var(--card-border)'}`,
                  transition: 'all 0.2s',
                  opacity: popupFilter && popupFilter !== 'nonpaye' ? 0.4 : 1,
                }}
              >
                <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e05c5c', fontWeight: 700, marginBottom: 2 }}>Non encaissé</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#e05c5c' }}>{fmtMga(Math.max(0, popup.prevu - popup.reel))}</div>
                <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>{nonPaye.length} client{nonPaye.length > 1 ? 's' : ''}</div>
              </div>
            </div>

            {/* Mini progress bar */}
            <div style={{ height: 5, borderRadius: 3, background: '#e05c5c33', overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ width: `${Math.min(Number(pctReel) || 0, 100)}%`, height: '100%', background: '#00ab63', borderRadius: 3 }} />
            </div>

            {/* Client lists — filtered by popupFilter */}
            {(!popupFilter || popupFilter === 'reel') && popup.clientsReel.length > 0 && (
              <>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#00ab63', marginBottom: 4 }}>
                  Encaissé ({popup.clientsReel.length})
                </div>
                {popup.clientsReel.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 10, color: 'var(--text)' }}>{c.client}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#00ab63' }}>{fmtMga(c.montant)}</span>
                  </div>
                ))}
              </>
            )}

            {(!popupFilter || popupFilter === 'nonpaye') && nonPaye.length > 0 && (
              <>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e05c5c', marginTop: popupFilter ? 0 : 10, marginBottom: 4 }}>
                  Non encaissé ({nonPaye.length})
                </div>
                {nonPaye.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.client}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#e05c5c' }}>{fmtMga(c.montant)}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )
      })()}
    </div>
  )
}

// Client count badge
export function ClientCount({ count, label }) {
  return (
    <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>
      <span style={{ fontWeight: 700, color: COLOR, fontSize: 14 }}>{count}</span>{' '}
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 9 }}>{label || (count > 1 ? 'clients' : 'client')}</span>
    </div>
  )
}
