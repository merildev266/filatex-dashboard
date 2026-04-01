import { useNavigate } from 'react-router-dom'
import { FLX_CLIENTS, TCM_CLIENTS } from '../../data/finance_data'
import { COLOR, fmtMga, aggregate, KpiCards, NatureGruyere, ClientCount } from './financeHelpers.jsx'

export default function FinanceOverview() {
  const navigate = useNavigate()
  const all = aggregate([...FLX_CLIENTS, ...TCM_CLIENTS])

  const entities = [
    { key: 'filatex-sa', label: 'Filatex SA', data: FLX_CLIENTS, path: '/finance/filatex-sa' },
    { key: 'tcm', label: 'TCM', data: TCM_CLIENTS, path: '/finance/tcm' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 28 }}>
      {/* Global consolidated KPI cards */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Consolidé Groupe</div>
        <ClientCount count={all.count} />
      </div>
      <KpiCards items={[
        { label: 'Total Créances', value: fmtMga(all.totalCreances), color: COLOR },
        { label: 'Encaissé', value: fmtMga(all.encaissements), color: '#00ab63' },
        { label: 'Contentieux', value: fmtMga(all.standby + all.contentieux), color: '#e05c5c' },
        { label: 'Reste à collecter', value: fmtMga(all.resteACollecter), color: '#f39c12' },
      ]} />

      {/* Entity cards + Nature cards below each */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, width: '100%', maxWidth: 760, alignItems: 'start' }}>
        {entities.map((entity) => {
          const agg = aggregate(entity.data)
          const grpCount = entity.data.filter(c => c.groupe).length
          const horsCount = entity.data.filter(c => !c.groupe).length
          return (
            <div key={entity.key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Entity card */}
              <div
                className="card card-finance"
                onClick={() => navigate(entity.path)}
                style={{ cursor: 'pointer', padding: '28px 20px' }}
              >
                <div className="card-accent" />
                <div className="card-logo-wrap" style={{ marginBottom: 6 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 45">
                    <text fill="var(--text)" x="110" y="32" textAnchor="middle"
                      fontFamily="'Larken','Playfair Display',serif"
                      fontSize={entity.key === 'tcm' ? '34' : '26'} fontWeight="400" fontStyle="italic">
                      {entity.label}
                    </text>
                  </svg>
                </div>
                <ClientCount count={agg.count} label={`clients (${grpCount} groupe · ${horsCount} hors groupe)`} />
                <div className="grid grid-cols-3 gap-1 w-full mt-2">
                  {[
                    { label: 'Créances', value: fmtMga(agg.totalCreances), color: COLOR },
                    { label: 'Encaissé', value: fmtMga(agg.encaissements), color: '#00ab63' },
                    { label: 'Reste', value: fmtMga(agg.resteACollecter), color: '#f39c12' },
                  ].map((k, i) => (
                    <div key={i} className="s1-card" style={{ padding: '7px 4px' }}>
                      <div className="s1-card-label" style={{ fontSize: 'clamp(5px, 0.55vw, 7px)', marginBottom: 2 }}>{k.label}</div>
                      <div className="s1-card-value" style={{ color: k.color, fontSize: 'clamp(12px, 1.6vw, 17px)' }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Nature gruyère below */}
              <NatureGruyere entity={entity.key} clients={entity.data} linkTo={entity.path} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
