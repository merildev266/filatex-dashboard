import { useNavigate } from 'react-router-dom'

const COLOR = '#1abc9c'

const ENTITIES = [
  { key: 'filatex-sa', label: 'Filatex SA', path: '/finance/filatex-sa/creance' },
  { key: 'tcm', label: 'TCM', path: '/finance/tcm/creance' },
]

export default function FinanceOverview() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, paddingTop: 40 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 280px))', gap: 20, justifyContent: 'center', width: '100%', maxWidth: 640 }}>
        {ENTITIES.map((entity) => (
          <div
            key={entity.key}
            className="card card-finance"
            onClick={() => navigate(entity.path)}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-accent" />
            <div className="card-logo-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 55">
                <text
                  fill="var(--text)"
                  x="110"
                  y="38"
                  textAnchor="middle"
                  fontFamily="'Larken','Playfair Display',serif"
                  fontSize={entity.key === 'tcm' ? '38' : '28'}
                  fontWeight="400"
                  fontStyle="italic"
                >
                  {entity.label}
                </text>
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
