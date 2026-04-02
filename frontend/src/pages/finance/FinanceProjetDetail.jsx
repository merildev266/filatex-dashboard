import { useParams } from 'react-router-dom'
import { TCM_PROJECTS } from '../../data/finance_data'
import { COLOR, fmtMga, ClientCount } from './financeHelpers.jsx'

function DetailRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--card-border)' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: color || 'var(--text)' }}>{value}</span>
    </div>
  )
}

function SubProjectCard({ sp }) {
  const pct = sp.totalCreances > 0 ? ((sp.encaissements / sp.totalCreances) * 100).toFixed(0) : 0
  return (
    <div style={{ padding: '16px 18px', background: 'rgba(155,89,182,0.04)', borderRadius: 12, border: '1px solid rgba(155,89,182,0.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{sp.nom}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: Number(pct) >= 50 ? '#00ab63' : '#f39c12' }}>{pct}%</span>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-1.5 w-full mb-2">
        {[
          { label: 'Créances', value: fmtMga(sp.totalCreances), color: COLOR },
          { label: 'Encaissé', value: fmtMga(sp.encaissements), color: '#00ab63' },
          { label: 'Reste', value: fmtMga(sp.resteACollecter), color: '#f39c12' },
        ].map((k, i) => (
          <div key={i} className="s1-card" style={{ padding: '8px 4px' }}>
            <div className="s1-card-label" style={{ fontSize: 'clamp(5px, 0.6vw, 7px)' }}>{k.label}</div>
            <div className="s1-card-value" style={{ color: k.color, fontSize: 'clamp(12px, 1.6vw, 16px)' }}>{k.value}</div>
          </div>
        ))}
      </div>
      {/* Progress */}
      <div style={{ height: 5, borderRadius: 3, background: 'var(--card-border)', overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#00ab63', borderRadius: 3 }} />
      </div>
      {/* Clients */}
      {sp.clients.map((c, j) => (
        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: 11, color: 'var(--text)' }}>{c.client}</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: COLOR }}>{fmtMga(c.totalCreances)}</span>
            {c.encaissements > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#00ab63' }}>{fmtMga(c.encaissements)}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FinanceProjetDetail() {
  const { projetName } = useParams()
  const project = TCM_PROJECTS.find(p => encodeURIComponent(p.projet) === projetName || p.projet === decodeURIComponent(projetName))
  if (!project) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Projet non trouvé</div>

  const p = project
  const pct = p.totalCreances > 0 ? ((p.encaissements / p.totalCreances) * 100).toFixed(0) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 24, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: "'Larken','Playfair Display',serif", fontStyle: 'italic' }}>{p.projet}</div>
        <ClientCount count={p.nbClients} label={p.isGroup ? `clients · ${p.sousProjectes.length} sous-projets` : 'clients'} />
      </div>

      {/* KPIs consolidé */}
      <div className="grid gap-2" style={{ width: '100%', maxWidth: '100%', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Créances', value: fmtMga(p.totalCreances), color: COLOR },
          { label: 'Encaissé', value: fmtMga(p.encaissements), color: '#00ab63' },
          { label: 'Reste', value: fmtMga(p.resteACollecter), color: '#f39c12' },
        ].map((k, i) => (
          <div key={i} className="s1-card" style={{ padding: 'clamp(10px, 1.4vw, 16px) clamp(8px, 1.2vw, 14px)' }}>
            <div className="s1-card-label" style={{ fontSize: 'clamp(6px, 0.7vw, 8px)', marginBottom: 'clamp(3px, 0.5vw, 6px)' }}>{k.label}</div>
            <div className="s1-card-value" style={{ color: k.color, fontSize: 'clamp(18px, 2.6vw, 28px)' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* % encaissement + barre */}
      <div style={{ width: '100%', maxWidth: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Taux d'encaissement</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: Number(pct) >= 50 ? '#00ab63' : Number(pct) >= 25 ? '#f39c12' : '#e05c5c' }}>{pct}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--card-border)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#00ab63', borderRadius: 4, transition: 'width 0.6s' }} />
        </div>
      </div>

      {/* Sub-projects (for groups) */}
      {p.isGroup && p.sousProjectes.length > 0 && (
        <div style={{ width: '100%', maxWidth: '100%' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9b59b6', marginBottom: 12 }}>
            Sous-projets ({p.sousProjectes.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {p.sousProjectes.map((sp, i) => (
              <SubProjectCard key={i} sp={sp} />
            ))}
          </div>
        </div>
      )}

      {/* Direct clients (for standalone) */}
      {!p.isGroup && p.clients.length > 0 && (
        <div style={{ width: '100%', maxWidth: '100%' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
            Clients ({p.clients.length})
          </div>
          {p.clients.map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--card-border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text)' }}>{c.client}</span>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: COLOR }}>{fmtMga(c.totalCreances)}</span>
                {c.encaissements > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: '#00ab63' }}>{fmtMga(c.encaissements)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
