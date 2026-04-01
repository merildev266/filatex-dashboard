import { useParams } from 'react-router-dom'

const COLOR = '#1abc9c'

const ENTITY_NAMES = {
  'filatex-sa': 'Filatex SA',
  'tcm': 'TCM',
}

export default function FinanceCreance() {
  const { entity } = useParams()
  const entityName = ENTITY_NAMES[entity] || entity

  return (
    <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <h2 style={{
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '0.04em',
        color: COLOR,
        textAlign: 'center',
      }}>
        Créances — {entityName}
      </h2>

      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 16,
        padding: '40px 32px',
        width: '100%',
        maxWidth: 800,
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 14,
      }}>
        KPI à venir
      </div>
    </div>
  )
}
