import { useParams, useNavigate } from 'react-router-dom'
import { FLX_CLIENTS, TCM_CLIENTS } from '../../data/finance_data'
import { COLOR, fmtMga, aggregate, KpiCards, ClientCount } from './financeHelpers.jsx'

const ENTITY_CFG = {
  'filatex-sa': { label: 'Filatex SA', data: FLX_CLIENTS },
  'tcm': { label: 'TCM', data: TCM_CLIENTS },
}

export default function FinanceEntity() {
  const { entity } = useParams()
  const navigate = useNavigate()
  const cfg = ENTITY_CFG[entity]
  if (!cfg) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Entité inconnue</div>

  const groupe = cfg.data.filter(c => c.groupe)
  const horsGroupe = cfg.data.filter(c => !c.groupe)
  const aggAll = aggregate(cfg.data)
  const aggGrp = aggregate(groupe)
  const aggHors = aggregate(horsGroupe)

  const CATEGORIES = [
    { key: 'groupe', label: 'Client Groupe', agg: aggGrp, count: groupe.length, path: `/finance/${entity}/groupe` },
    { key: 'hors-groupe', label: 'Client Hors Groupe', agg: aggHors, count: horsGroupe.length, path: `/finance/${entity}/hors-groupe` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 28 }}>
      {/* Consolidated KPIs for the entity */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          {cfg.label} — Consolidé
        </div>
        <ClientCount count={aggAll.count} />
      </div>
      <KpiCards items={[
        { label: 'Total Créances', value: fmtMga(aggAll.totalCreances), color: COLOR },
        { label: 'Encaissé', value: fmtMga(aggAll.encaissements), color: '#00ab63' },
        { label: 'Contentieux', value: fmtMga(aggAll.standby + aggAll.contentieux), color: '#e05c5c' },
        { label: 'Reste à collecter', value: fmtMga(aggAll.resteACollecter), color: '#f39c12' },
      ]} />
      <KpiCards items={[
        { label: 'Plan Mars', value: fmtMga(aggAll.planMars), color: COLOR },
        { label: 'Plan Avril', value: fmtMga(aggAll.planAvril), color: COLOR },
        { label: 'Plan Mai', value: fmtMga(aggAll.planMai), color: COLOR },
        { label: 'Montant 2025', value: fmtMga(aggAll.montant2025) },
      ]} />

      {/* Groupe / Hors Groupe cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 340px))', gap: 20, justifyContent: 'center', width: '100%', maxWidth: 760 }}>
        {CATEGORIES.map(cat => (
          <div
            key={cat.key}
            className="card card-finance"
            onClick={() => navigate(cat.path)}
            style={{ cursor: 'pointer', padding: '28px 20px' }}
          >
            <div className="card-accent" />
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: "'Larken','Playfair Display',serif", fontStyle: 'italic', marginBottom: 4 }}>
              {cat.label}
            </div>
            <ClientCount count={cat.count} />
            <div className="grid grid-cols-3 gap-1.5 w-full mt-2">
              <div className="s1-card" style={{ padding: '10px 6px' }}>
                <div className="s1-card-label">Créances</div>
                <div className="s1-card-value" style={{ color: COLOR, fontSize: 'clamp(14px, 2vw, 20px)' }}>{fmtMga(cat.agg.totalCreances)}</div>
              </div>
              <div className="s1-card" style={{ padding: '10px 6px' }}>
                <div className="s1-card-label">Encaissé</div>
                <div className="s1-card-value" style={{ color: '#00ab63', fontSize: 'clamp(14px, 2vw, 20px)' }}>{fmtMga(cat.agg.encaissements)}</div>
              </div>
              <div className="s1-card" style={{ padding: '10px 6px' }}>
                <div className="s1-card-label">Reste</div>
                <div className="s1-card-value" style={{ color: '#f39c12', fontSize: 'clamp(14px, 2vw, 20px)' }}>{fmtMga(cat.agg.resteACollecter)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
