import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FLX_CLIENTS, TCM_CLIENTS, FLX_MONTHLY, TCM_MONTHLY, TCM_PROJECTS } from '../../data/finance_data'
import { COLOR, fmtMga, aggregate, KpiCards, NatureDonut, CashFlowChart, ClientCount } from './financeHelpers.jsx'

const ENTITY_CFG = {
  'filatex-sa': { label: 'Filatex SA', data: FLX_CLIENTS, monthly: FLX_MONTHLY },
  'tcm': { label: 'TCM', data: TCM_CLIENTS, monthly: TCM_MONTHLY },
}

/* ── Toggle Client / Projet ── */
function ViewToggle({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: `1px solid ${COLOR}33` }}>
      {[
        { key: 'client', label: 'Clients' },
        { key: 'projet', label: 'Projets' },
      ].map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: '7px 18px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            cursor: 'pointer', border: 'none', transition: 'all 0.2s',
            background: active === tab.key ? '#9b59b6' : 'transparent',
            color: active === tab.key ? '#fff' : 'var(--text-muted)',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

/* ── Project card (compact, for entity page) ── */
function ProjectCardMini({ project, onClick }) {
  const p = project
  const pct = p.totalCreances > 0 ? ((p.encaissements / p.totalCreances) * 100).toFixed(0) : 0
  return (
    <div
      className="card card-finance"
      onClick={onClick}
      style={{ cursor: 'pointer', padding: '20px 16px' }}
    >
      <div className="card-accent" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{p.projet}</div>
          <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>
            {p.nbClients} client{p.nbClients > 1 ? 's' : ''}
            {p.isGroup && ` · ${p.sousProjectes.length} sous-projets`}
          </div>
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: Number(pct) >= 50 ? '#00ab63' : '#f39c12' }}>{pct}%</span>
      </div>
      <div className="grid grid-cols-3 gap-1 w-full">
        {[
          { label: 'Créances', value: fmtMga(p.totalCreances), color: COLOR },
          { label: 'Encaissé', value: fmtMga(p.encaissements), color: '#00ab63' },
          { label: 'Reste', value: fmtMga(p.resteACollecter), color: '#f39c12' },
        ].map((k, i) => (
          <div key={i} className="s1-card" style={{ padding: '6px 4px' }}>
            <div className="s1-card-label" style={{ fontSize: 'clamp(5px, 0.55vw, 7px)', marginBottom: 2 }}>{k.label}</div>
            <div className="s1-card-value" style={{ color: k.color, fontSize: 'clamp(11px, 1.4vw, 15px)' }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'var(--card-border)', overflow: 'hidden', marginTop: 6 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#00ab63', borderRadius: 2 }} />
      </div>
    </div>
  )
}

/* ── Project detail popup ── */
function ProjectDetailPopup({ project, onClose }) {
  const p = project
  const pct = p.totalCreances > 0 ? ((p.encaissements / p.totalCreances) * 100).toFixed(0) : 0

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div
        style={{
          position: 'relative', background: 'var(--dark, #0a0d1a)', border: '1px solid var(--card-border)',
          borderRadius: 16, padding: '24px', width: 'min(92%, 500px)', maxHeight: '80vh', overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{p.projet}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              {p.nbClients} client{p.nbClients > 1 ? 's' : ''}
              {p.isGroup && ` · ${p.sousProjectes.length} sous-projets`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: Number(pct) >= 50 ? '#00ab63' : '#f39c12' }}>{pct}%</span>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>x</button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Créances', value: fmtMga(p.totalCreances), color: COLOR },
            { label: 'Encaissé', value: fmtMga(p.encaissements), color: '#00ab63' },
            { label: 'Reste', value: fmtMga(p.resteACollecter), color: '#f39c12' },
          ].map((k, i) => (
            <div key={i} className="s1-card" style={{ padding: '10px 6px' }}>
              <div className="s1-card-label">{k.label}</div>
              <div className="s1-card-value" style={{ color: k.color, fontSize: 16 }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, borderRadius: 3, background: 'var(--card-border)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#00ab63', borderRadius: 3 }} />
        </div>

        {/* Sub-projects */}
        {p.isGroup && p.sousProjectes.length > 0 && (
          <>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9b59b6', marginBottom: 8 }}>
              Sous-projets ({p.sousProjectes.length})
            </div>
            {p.sousProjectes.map((sp, i) => {
              const spPct = sp.totalCreances > 0 ? ((sp.encaissements / sp.totalCreances) * 100).toFixed(0) : 0
              return (
                <div key={i} style={{ marginBottom: 10, padding: '10px 12px', background: 'rgba(155,89,182,0.04)', borderRadius: 10, border: '1px solid rgba(155,89,182,0.12)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{sp.nom}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: Number(spPct) >= 50 ? '#00ab63' : '#f39c12' }}>{spPct}%</span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 10, marginBottom: 4 }}>
                    <span><span style={{ color: 'var(--text-muted)' }}>Créances:</span> <span style={{ fontWeight: 700, color: COLOR }}>{fmtMga(sp.totalCreances)}</span></span>
                    <span><span style={{ color: 'var(--text-muted)' }}>Encaissé:</span> <span style={{ fontWeight: 700, color: '#00ab63' }}>{fmtMga(sp.encaissements)}</span></span>
                    <span><span style={{ color: 'var(--text-muted)' }}>Reste:</span> <span style={{ fontWeight: 700, color: '#f39c12' }}>{fmtMga(sp.resteACollecter)}</span></span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'var(--card-border)', overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ width: `${spPct}%`, height: '100%', background: '#00ab63', borderRadius: 2 }} />
                  </div>
                  {sp.clients.map((c, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 10 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{c.client}</span>
                      <span style={{ fontWeight: 600, color: COLOR }}>{fmtMga(c.totalCreances)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </>
        )}

        {/* Direct clients for standalone projects */}
        {!p.isGroup && p.clients.length > 0 && (
          <>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
              Clients ({p.clients.length})
            </div>
            {p.clients.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 10 }}>
                <span style={{ color: 'var(--text)' }}>{c.client}</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontWeight: 700, color: COLOR }}>{fmtMga(c.totalCreances)}</span>
                  {c.encaissements > 0 && <span style={{ fontWeight: 600, color: '#00ab63' }}>{fmtMga(c.encaissements)}</span>}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default function FinanceEntity() {
  const { entity } = useParams()
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('client')
  const [selectedProject, setSelectedProject] = useState(null)
  const cfg = ENTITY_CFG[entity]
  if (!cfg) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Entité inconnue</div>

  const isTcm = entity === 'tcm'
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
      {/* Consolidated KPIs */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          {cfg.label} — Consolidé
        </div>
        <ClientCount count={aggAll.count} />
      </div>
      <KpiCards items={[
        { label: 'Total Créances', value: fmtMga(aggAll.totalCreances), color: COLOR },
        { label: 'Encaissé', value: fmtMga(aggAll.encaissements), color: '#00ab63', pct: aggAll.totalCreances > 0 ? ((aggAll.encaissements / aggAll.totalCreances) * 100).toFixed(0) : 0 },
        { label: 'Contentieux', value: fmtMga(aggAll.standby + aggAll.contentieux), color: '#e05c5c', pct: aggAll.totalCreances > 0 ? (((aggAll.standby + aggAll.contentieux) / aggAll.totalCreances) * 100).toFixed(0) : 0 },
        { label: 'Reste à collecter', value: fmtMga(aggAll.resteACollecter), color: '#f39c12', pct: aggAll.totalCreances > 0 ? ((aggAll.resteACollecter / aggAll.totalCreances) * 100).toFixed(0) : 0 },
        { label: 'Retard moyen', value: `${aggAll.avgRetard}j`, color: aggAll.avgRetard > 180 ? '#e05c5c' : aggAll.avgRetard > 90 ? '#f37056' : '#f39c12', unit: `${aggAll.countRetard} clients · max ${aggAll.maxRetard}j` },
      ]} />
      <KpiCards items={[
        { label: 'Plan Mars', value: fmtMga(aggAll.planMars), color: COLOR, pct: aggAll.totalCreances > 0 ? ((aggAll.planMars / aggAll.totalCreances) * 100).toFixed(0) : 0 },
        { label: 'Plan Avril', value: fmtMga(aggAll.planAvril), color: COLOR, pct: aggAll.totalCreances > 0 ? ((aggAll.planAvril / aggAll.totalCreances) * 100).toFixed(0) : 0 },
        { label: 'Plan Mai', value: fmtMga(aggAll.planMai), color: COLOR, pct: aggAll.totalCreances > 0 ? ((aggAll.planMai / aggAll.totalCreances) * 100).toFixed(0) : 0 },
        { label: 'Montant 2025', value: fmtMga(aggAll.montant2025), pct: aggAll.totalCreances > 0 ? ((aggAll.montant2025 / aggAll.totalCreances) * 100).toFixed(0) : 0 },
      ]} />

      <CashFlowChart monthlyData={cfg.monthly} />

      {/* Toggle Client / Projet (TCM only) */}
      {isTcm && <ViewToggle active={viewMode} onChange={setViewMode} />}

      {/* ── CLIENT VIEW ── */}
      {viewMode === 'client' && (
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
                <NatureDonut entity={entity} clients={catClients} linkTo={`/finance/${entity}/${cat.key}`} />
              </div>
            )
          })}
        </div>
      )}

      {/* ── PROJECT VIEW (TCM only) ── */}
      {viewMode === 'projet' && isTcm && (
        <>
          <div style={{ textAlign: 'center', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            {TCM_PROJECTS.length} projets immobiliers
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, width: '100%', maxWidth: 1000, paddingBottom: 40 }}>
            {TCM_PROJECTS.map((project, i) => (
              <ProjectCardMini
                key={project.projet || i}
                project={project}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
        </>
      )}

      {/* Project detail popup */}
      {selectedProject && (
        <ProjectDetailPopup
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  )
}
