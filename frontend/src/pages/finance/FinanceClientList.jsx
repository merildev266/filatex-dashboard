import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { FLX_CLIENTS, TCM_CLIENTS } from '../../data/finance_data'
import { COLOR, fmtMga, aggregate, KpiRow } from './financeHelpers.jsx'

const ENTITY_CFG = {
  'filatex-sa': { label: 'Filatex SA', data: FLX_CLIENTS },
  'tcm': { label: 'TCM', data: TCM_CLIENTS },
}

function DetailRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--card-border)' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: color || 'var(--text)' }}>{value}</span>
    </div>
  )
}

function ClientCard({ client, isFlx }) {
  const [open, setOpen] = useState(false)
  const c = client

  return (
    <div
      className="card card-finance"
      style={{ padding: '20px 18px', cursor: 'pointer', alignItems: 'stretch', textAlign: 'left' }}
      onClick={() => setOpen(!open)}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{c.client}</div>
          {isFlx && c.code && <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{c.code}</div>}
        </div>
        <svg viewBox="0 0 20 20" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ width: 16, height: 16, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <polyline points="5 8 10 13 15 8" />
        </svg>
      </div>

      {/* KPIs summary */}
      <KpiRow items={[
        { label: 'Créances', value: fmtMga(c.totalCreances) },
        { label: 'Encaissé', value: fmtMga(c.encaissements), color: '#00ab63' },
        { label: 'Reste', value: fmtMga(c.resteACollecter), color: '#f39c12' },
      ]} />

      {/* Status badge */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {c.observations && (
          <span style={{
            fontSize: 8, padding: '2px 8px', borderRadius: 6, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
            background: c.observations.includes('JURIDIQUE') ? 'rgba(224,92,92,0.15)' : c.observations.includes('PAYE') ? 'rgba(0,171,99,0.12)' : c.observations.includes('IRRECOUVRABLE') ? 'rgba(224,92,92,0.25)' : 'rgba(26,188,156,0.12)',
            color: c.observations.includes('JURIDIQUE') ? '#e05c5c' : c.observations.includes('PAYE') ? '#00ab63' : c.observations.includes('IRRECOUVRABLE') ? '#e05c5c' : COLOR,
          }}>
            {c.observations.length > 30 ? c.observations.slice(0, 28) + '…' : c.observations}
          </span>
        )}
        {c.acteur && (
          <span style={{ fontSize: 8, padding: '2px 8px', borderRadius: 6, background: 'rgba(66,106,179,0.12)', color: '#426ab3', fontWeight: 600 }}>
            {c.acteur}
          </span>
        )}
      </div>

      {/* Detail panel */}
      {open && (
        <div style={{ marginTop: 14, padding: '12px 0 0', borderTop: `1px solid ${COLOR}33` }}>
          <DetailRow label="Montant 2025" value={fmtMga(c.montant2025)} />
          <DetailRow label="Montant 2026" value={fmtMga(c.montant2026)} />
          <DetailRow label="Total Créances" value={fmtMga(c.totalCreances)} color={COLOR} />
          <DetailRow label="Encaissements" value={fmtMga(c.encaissements)} color="#00ab63" />
          {isFlx && <DetailRow label="Stand by / Contentieux" value={fmtMga(c.standby)} color="#e05c5c" />}
          {!isFlx && <DetailRow label="Contentieux / Irrécouvrables" value={fmtMga(c.contentieux)} color="#e05c5c" />}
          <DetailRow label="Reste à collecter" value={fmtMga(c.resteACollecter)} color="#f39c12" />
          <div style={{ height: 8 }} />
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Plan d'appurement</div>
          <DetailRow label="Mars 2026" value={fmtMga(c.planMars)} />
          <DetailRow label="Avril 2026" value={fmtMga(c.planAvril)} />
          <DetailRow label="Mai 2026" value={fmtMga(c.planMai)} />
          {!isFlx && c.souche && (
            <>
              <div style={{ height: 8 }} />
              <DetailRow label="Souche" value={c.souche} />
              {c.projet && <DetailRow label="Projet" value={c.projet} />}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function FinanceClientList() {
  const { entity, category } = useParams()
  const cfg = ENTITY_CFG[entity]
  if (!cfg) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Entité inconnue</div>

  const isGroupe = category === 'groupe'
  const isFlx = entity === 'filatex-sa'
  const clients = cfg.data.filter(c => c.groupe === isGroupe)
  const agg = aggregate(clients)
  const categoryLabel = isGroupe ? 'Client Groupe' : 'Client Hors Groupe'

  // Sort by totalCreances descending
  const sorted = [...clients].sort((a, b) => (b.totalCreances || 0) - (a.totalCreances || 0))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 24 }}>
      {/* Header KPI */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
          {cfg.label} — {categoryLabel}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 8 }}>{clients.length} client{clients.length > 1 ? 's' : ''}</div>
        <KpiRow items={[
          { label: 'Total Créances', value: fmtMga(agg.totalCreances) },
          { label: 'Encaissé', value: fmtMga(agg.encaissements), color: '#00ab63' },
          { label: 'Contentieux', value: fmtMga(agg.standby + agg.contentieux), color: '#e05c5c' },
          { label: 'Reste', value: fmtMga(agg.resteACollecter), color: '#f39c12' },
        ]} />
      </div>

      {/* Client cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 360px))', gap: 14, justifyContent: 'center', width: '100%', maxWidth: 800, paddingBottom: 40 }}>
        {sorted.map((client, i) => (
          <ClientCard key={client.code || client.client || i} client={client} isFlx={isFlx} />
        ))}
      </div>
    </div>
  )
}
