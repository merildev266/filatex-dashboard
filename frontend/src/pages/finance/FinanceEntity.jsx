import { useParams, useNavigate } from 'react-router-dom'
import { FLX_CLIENTS, TCM_CLIENTS } from '../../data/finance_data'
import { COLOR, fmtMga, aggregate, KpiCards, NatureDonut, ClientCount } from './financeHelpers.jsx'

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
      <NatureDonut entity={entity} clients={cfg.data} linkTo={`/finance/${entity}`} />

      {/* Groupe / Hors Groupe cards + camembert sous chaque */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, width: '100%', maxWidth: 760, alignItems: 'start' }}>
        {CATEGORIES.map(cat => {
          const catClients = cat.key === 'groupe' ? groupe : horsGroupe
          return (
            <div key={cat.key} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                className="card card-finance"
                onClick={() => navigate(cat.path)}
                style={{ cursor: 'pointer', padding: '28px 20px' }}
              >
                <div className="card-accent" />
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: "'Larken','Playfair Display',serif", fontStyle: 'italic', marginBottom: 4 }}>
                  {cat.label}
                </div>
                <ClientCount count={cat.count} />
                <div className="grid grid-cols-3 gap-1 w-full mt-2">
                  {[
                    { label: 'Créances', value: fmtMga(cat.agg.totalCreances), color: COLOR },
                    { label: 'Encaissé', value: fmtMga(cat.agg.encaissements), color: '#00ab63' },
                    { label: 'Reste', value: fmtMga(cat.agg.resteACollecter), color: '#f39c12' },
                  ].map((k, i) => (
                    <div key={i} className="s1-card" style={{ padding: '7px 4px' }}>
                      <div className="s1-card-label" style={{ fontSize: 'clamp(5px, 0.55vw, 7px)', marginBottom: 2 }}>{k.label}</div>
                      <div className="s1-card-value" style={{ color: k.color, fontSize: 'clamp(12px, 1.6vw, 17px)' }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Camembert nature sous la carte */}
              <NatureDonut entity={entity} clients={catClients} linkTo={`/finance/${entity}/${cat.key}`} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
