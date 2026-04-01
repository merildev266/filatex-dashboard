import { useNavigate } from 'react-router-dom'
import { FLX_CLIENTS, TCM_CLIENTS } from '../../data/finance_data'
import { COLOR, fmtMga, aggregate, KpiRow } from './financeHelpers.jsx'

const ENTITIES = [
  { key: 'filatex-sa', label: 'Filatex SA', data: FLX_CLIENTS, path: '/finance/filatex-sa' },
  { key: 'tcm', label: 'TCM', data: TCM_CLIENTS, path: '/finance/tcm' },
]

export default function FinanceOverview() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 32 }}>
      {/* Global KPI */}
      {(() => {
        const all = aggregate([...FLX_CLIENTS, ...TCM_CLIENTS])
        return (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Consolidé Groupe</div>
            <KpiRow items={[
              { label: 'Total Créances', value: fmtMga(all.totalCreances) },
              { label: 'Encaissé', value: fmtMga(all.encaissements), color: '#00ab63' },
              { label: 'Contentieux', value: fmtMga(all.standby + all.contentieux), color: '#e05c5c' },
              { label: 'Reste à collecter', value: fmtMga(all.resteACollecter), color: '#f39c12' },
            ]} />
          </div>
        )
      })()}

      {/* Entity cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 320px))', gap: 20, justifyContent: 'center', width: '100%', maxWidth: 720 }}>
        {ENTITIES.map((entity) => {
          const agg = aggregate(entity.data)
          const grpCount = entity.data.filter(c => c.groupe).length
          const horsCount = entity.data.filter(c => !c.groupe).length
          return (
            <div
              key={entity.key}
              className="card card-finance"
              onClick={() => navigate(entity.path)}
              style={{ cursor: 'pointer', padding: '28px 20px' }}
            >
              <div className="card-accent" />
              <div className="card-logo-wrap" style={{ marginBottom: 8 }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 45">
                  <text fill="var(--text)" x="110" y="32" textAnchor="middle"
                    fontFamily="'Larken','Playfair Display',serif"
                    fontSize={entity.key === 'tcm' ? '34' : '26'} fontWeight="400" fontStyle="italic">
                    {entity.label}
                  </text>
                </svg>
              </div>
              <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                {grpCount} groupe · {horsCount} hors groupe
              </div>
              <KpiRow items={[
                { label: 'Total Créances', value: fmtMga(agg.totalCreances) },
                { label: 'Encaissé', value: fmtMga(agg.encaissements), color: '#00ab63' },
                { label: 'Reste', value: fmtMga(agg.resteACollecter), color: '#f39c12' },
              ]} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
