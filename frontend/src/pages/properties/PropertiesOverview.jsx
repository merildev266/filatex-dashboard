import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { propsData_dev } from '../../data/props_data'
import { comData_venteImmoTotal, comData_venteFonciereTotal, comData_locationTotal } from '../../data/commercial_objectives'

/* ── colour tokens (match original) ── */
const FONCIER_CLR = '#FDB823'
const DEV_CLR = '#426ab3'
const TVX_CLR = '#f37056'
const COM_CLR = '#00ab63'
const RECOUV_CLR = '#5e4c9f'
const SAV_CLR = '#00929e'

/* helper: rgba string from hex */
function rgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

/* ── KPI cell inside a card ── */
function KpiCell({ label, value, color, borderRight, borderBottom, accentColor }) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        borderRight: borderRight ? `1px solid ${rgba(accentColor, 0.1)}` : 'none',
        borderBottom: borderBottom ? `1px solid ${rgba(accentColor, 0.1)}` : 'none',
        padding: 'clamp(6px, 0.8vw, 12px)',
      }}
    >
      <div className="text-[clamp(6px,0.55vw,9px)] font-bold tracking-[0.15em] uppercase"
        style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-[clamp(14px,1.5vw,24px)] font-extrabold"
        style={{ color: color || 'var(--text)' }}>{value}</div>
    </div>
  )
}

/* ── Section card (one of the 6) ── */
function SectionCard({ title, subtitle, accent, kpis, onClick }) {
  return (
    <div className="p-col flex flex-col items-center">
      <div className="text-[clamp(16px,2vw,28px)] font-extrabold tracking-tight leading-none mb-1 text-center"
        style={{ color: accent }}>{title}</div>
      <div className="text-[clamp(6px,0.5vw,9px)] tracking-[0.2em] uppercase opacity-40 text-[var(--text)] mb-[clamp(8px,1vw,16px)]">
        {subtitle}
      </div>
      <div
        onClick={onClick}
        className="w-full cursor-pointer transition-all duration-200"
        style={{
          aspectRatio: '1/1',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${rgba(accent, 0.2)}`,
          borderRadius: '16px',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = rgba(accent, 0.5)
          e.currentTarget.style.background = rgba(accent, 0.06)
          e.currentTarget.style.boxShadow = `0 16px 50px ${rgba(accent, 0.15)}`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = rgba(accent, 0.2)
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
          gap: 0, flex: 1,
        }}>
          {kpis.map((k, i) => (
            <KpiCell
              key={i}
              label={k.label}
              value={k.value}
              color={k.color}
              accentColor={accent}
              borderRight={i % 2 === 0}
              borderBottom={i < 2}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PropertiesOverview() {
  const navigate = useNavigate()

  /* ── compute dev KPIs from data ── */
  const devKpis = useMemo(() => {
    const projects = propsData_dev || []
    const total = projects.length
    const permisDeposes = projects.filter(p =>
      p.etape && p.etape.toLowerCase().includes('permis')
    ).length || 3 // fallback to 3 like original
    const delayed = projects.filter(p => p.timing_var === 'Delay' || p.timing_var === 'delay')
    const glissMoy = total > 0 ? Math.round(delayed.length / total * 100) : 0
    return { total, permisDeposes, glissMoy }
  }, [])

  /* ── compute commercial KPIs ── */
  const comKpis = useMemo(() => {
    const total = (comData_venteImmoTotal || 0) + (comData_venteFonciereTotal || 0) + (comData_locationTotal || 0)
    const fmt = v => {
      if (v >= 1000000) return (v / 1000000).toFixed(1) + ' M'
      if (v >= 1000) return (v / 1000).toFixed(0) + ' k'
      return String(v)
    }
    return { obj: fmt(total) + ' EUR', nb: '—' }
  }, [])

  return (
    <div className="props-overview-wrap">
      <div className="props-overview-grid">

        {/* FONCIER */}
        <SectionCard
          title="Foncier"
          subtitle="Acquisition terrains"
          accent={FONCIER_CLR}
          onClick={() => navigate('/properties/foncier')}
          kpis={[
            { label: 'Terrains', value: '—', color: FONCIER_CLR },
            { label: 'Surface totale', value: '— m²' },
            { label: 'Budget foncier', value: '— M$', color: FONCIER_CLR },
            { label: 'En acquisition', value: '—', color: FONCIER_CLR },
          ]}
        />

        {/* DEVELOPPEMENT */}
        <SectionCard
          title="Développement"
          subtitle="Permis & études"
          accent={DEV_CLR}
          onClick={() => navigate('/properties/dev')}
          kpis={[
            { label: 'Projets', value: String(devKpis.total), color: DEV_CLR },
            { label: 'Permis obtenus', value: devKpis.permisDeposes + ' / ' + devKpis.total },
            { label: 'Budget Dev', value: '— M$', color: DEV_CLR },
            { label: 'Délai moyen', value: '— j', color: '#f37056' },
          ]}
        />

        {/* TRAVAUX */}
        <SectionCard
          title="Travaux"
          subtitle="Construction & chantiers"
          accent={TVX_CLR}
          onClick={() => navigate('/properties/tvx')}
          kpis={[
            { label: 'Chantiers actifs', value: '—', color: TVX_CLR },
            { label: 'Avancement moy.', value: '— %' },
            { label: 'Budget Travaux', value: '— M$', color: TVX_CLR },
            { label: 'Retard moyen', value: '— j', color: '#e05c5c' },
          ]}
        />

        {/* COMMERCIAL */}
        <SectionCard
          title="Commercial"
          subtitle="Objectifs 2026"
          accent={COM_CLR}
          onClick={() => navigate('/properties/com')}
          kpis={[
            { label: 'Objectif 2026', value: comKpis.obj, color: COM_CLR },
            { label: 'Projets / Biens', value: comKpis.nb, color: COM_CLR },
            { label: 'Réalisé', value: '—', color: FONCIER_CLR },
            { label: 'Trimestre', value: '—', color: '#5aafaf' },
          ]}
        />

        {/* RECOUVREMENT */}
        <SectionCard
          title="Recouvrement"
          subtitle="Encaissements & créances"
          accent={RECOUV_CLR}
          onClick={() => navigate('/properties/recouvrement')}
          kpis={[
            { label: 'Encours total', value: '— M$', color: RECOUV_CLR },
            { label: 'Taux recouvrem.', value: '— %' },
            { label: 'Impayés', value: '— M$', color: '#e05c5c' },
            { label: 'Délai moyen', value: '— j', color: RECOUV_CLR },
          ]}
        />

        {/* SAV */}
        <SectionCard
          title="SAV"
          subtitle="Service après-vente"
          accent={SAV_CLR}
          onClick={() => navigate('/properties/sav')}
          kpis={[
            { label: 'Tickets ouverts', value: '—', color: SAV_CLR },
            { label: 'Résolus / mois', value: '—' },
            { label: 'Délai moyen', value: '— j', color: SAV_CLR },
            { label: 'Satisfaction', value: '— %', color: '#00ab63' },
          ]}
        />

      </div>
    </div>
  )
}
