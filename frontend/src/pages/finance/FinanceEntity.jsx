import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FLX_CLIENTS, TCM_CLIENTS, TCM_PROJECTS } from '../../data/finance_data'
import { TCM_ECHEANCIER, TCM_ECHEANCIER_GLOBAL } from '../../data/finance_echeancier'
import { COLOR, fmtMga, aggregate, KpiCards, NatureDonut, ContractFlowChart, ClientCount } from './financeHelpers.jsx'
import KpiCard from '../../components/KpiCard'

const ENTITY_CFG = {
  'filatex-sa': { label: 'Filatex SA', data: FLX_CLIENTS },
  'tcm': { label: 'TCM', data: TCM_CLIENTS },
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

/* ── Project card mini — navigates to detail page ── */
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
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-1 w-full">
        {[
          { label: 'Créances', value: fmtMga(p.totalCreances), color: COLOR },
          { label: 'Encaissé', value: fmtMga(p.encaissements), color: '#00ab63' },
          { label: 'Reste', value: fmtMga(p.resteACollecter), color: '#f39c12' },
        ].map((k, i) => (
          <KpiCard key={i} variant="card" size="xs" value={k.value} label={k.label} color={k.color} />
        ))}
      </div>
      {/* % + progress bar BELOW KPIs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, width: '100%' }}>
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--card-border)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#00ab63', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: Number(pct) >= 50 ? '#00ab63' : '#f39c12', flexShrink: 0 }}>{pct}%</span>
      </div>
    </div>
  )
}

export default function FinanceEntity() {
  const { entity } = useParams()
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('client')
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
        <ClientCount count={aggAll.count} />
      </div>
      <KpiCards items={[
        { label: 'Total Créances', value: fmtMga(aggAll.totalCreances), color: COLOR },
        { label: 'Encaissé', value: fmtMga(aggAll.encaissements), color: '#00ab63' },
        { label: 'Contentieux', value: fmtMga(aggAll.standby + aggAll.contentieux), color: '#e05c5c' },
        { label: 'Reste à collecter', value: fmtMga(aggAll.resteACollecter), color: '#f39c12' },
        { label: 'Retard moyen', value: `${aggAll.avgRetard}j`, color: aggAll.avgRetard > 180 ? '#e05c5c' : aggAll.avgRetard > 90 ? '#f37056' : '#f39c12', unit: `${aggAll.countRetard} clients · max ${aggAll.maxRetard}j` },
      ]} />
      <KpiCards items={[
        { label: 'Plan Mars', value: fmtMga(aggAll.planMars), color: COLOR },
        { label: 'Plan Avril', value: fmtMga(aggAll.planAvril), color: COLOR },
        { label: 'Plan Mai', value: fmtMga(aggAll.planMai), color: COLOR },
        { label: 'Montant 2025', value: fmtMga(aggAll.montant2025) },
        { label: 'Montant 2026', value: fmtMga(aggAll.montant2026) },
      ]} />

      {isTcm && <ContractFlowChart timeline={TCM_ECHEANCIER_GLOBAL} projects={TCM_ECHEANCIER} />}

      {/* Toggle Client / Projet (TCM only) */}
      {isTcm && <ViewToggle active={viewMode} onChange={setViewMode} />}

      {/* ── CLIENT VIEW ── */}
      {viewMode === 'client' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, width: '100%', maxWidth: '100%', alignItems: 'start' }}>
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
                      <KpiCard key={i} variant="card" size="xs" value={k.value} label={k.label} color={k.color} />
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, width: '100%', maxWidth: '100%', paddingBottom: 40 }}>
            {TCM_PROJECTS.map((project, i) => (
              <ProjectCardMini
                key={project.projet || i}
                project={project}
                onClick={() => navigate(`/finance/tcm/projet/${encodeURIComponent(project.projet)}`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
