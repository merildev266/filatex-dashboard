import { useNavigate } from 'react-router-dom'
import { REPORTING_ENR } from '../../data/reporting_data'
import { HFO_PROJECTS } from '../../data/hfo_projects'
import { invProjects } from '../../data/investments_data'
import { propsData_sav, propsData_tvx, propsData_dev } from '../../data/props_data'
import {
  comData_venteImmoTotal,
  comData_venteFonciereTotal,
  comData_locationTotal,
} from '../../data/commercial_objectives'

/* ── Helpers ── */

function groupByProject(rows) {
  const map = {}
  rows.forEach(r => {
    if (!map[r.site]) map[r.site] = { name: r.site, etapes: [] }
    map[r.site].etapes.push(r)
  })
  return Object.values(map)
}

/* ── SVG Icons (match original stroke colors & paths) ── */

function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#00ab63" strokeWidth="2" style={{ width: 24, height: 24 }}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}
function IconMotor() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#00ab63" strokeWidth="1.5" style={{ width: 24, height: 24 }}>
      <rect x="3" y="8" width="18" height="10" rx="2" />
      <line x1="7" y1="8" x2="7" y2="5" /><line x1="12" y1="8" x2="12" y2="5" /><line x1="17" y1="8" x2="17" y2="5" />
      <circle cx="8" cy="13" r="2" /><circle cx="16" cy="13" r="2" />
      <line x1="10" y1="13" x2="14" y2="13" />
    </svg>
  )
}
function IconSun() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#00ab63" strokeWidth="2" style={{ width: 24, height: 24 }}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#f37056" strokeWidth="2" style={{ width: 24, height: 24 }}>
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  )
}
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#FDB823" strokeWidth="1.5" style={{ width: 24, height: 24 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#FDB823" strokeWidth="1.5" style={{ width: 24, height: 24 }}>
      <path d="M2 20h20M5 20V10l7-7 7 7v10M9 20v-6h6v6" />
    </svg>
  )
}
function IconLayers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#FDB823" strokeWidth="1.5" style={{ width: 24, height: 24 }}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}
function IconWrench() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#FDB823" strokeWidth="1.5" style={{ width: 24, height: 24 }}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

/* ── Reusable KPI chip inside a card ── */

function Kpi({ value, label, color }) {
  return (
    <div className="rpt-pole-kpi">
      <span className="kv" style={{ color }}>{value}</span>
      <span className="kl">{label}</span>
    </div>
  )
}

/* ── Hub ── */

export default function ReportingHub() {
  const navigate = useNavigate()

  // ── ENR KPIs ──
  const enrPs = REPORTING_ENR?.projects || []
  const enrTotal = enrPs.length
  const enrOnTrack = enrPs.filter(p => p.glissement <= 0).length
  const enrDelayed = enrPs.filter(p => p.glissement > 0).length
  const enrAvgProg = enrTotal > 0
    ? Math.round(enrPs.reduce((s, p) => s + (p.avancement || 0), 0) / enrTotal)
    : 0

  // ── HFO KPIs ──
  const hfoTotal = HFO_PROJECTS?.total || 0
  const hfoOverhauls = HFO_PROJECTS?.overhauls || 0
  const hfoProjects = HFO_PROJECTS?.projects || []
  const hfoAnnexes = hfoTotal - hfoOverhauls
  const hfoSites = new Set(hfoProjects.map(p => p.site)).size

  // ── LFO KPIs (hardcoded like original) ──
  const lfoTotal = 40
  const lfoInstalles = 12
  const lfoAuF23 = 14
  const lfoARapatrier = 11

  // ── Investments KPIs ──
  const invTotal = invProjects?.length || 0
  const invExt = invProjects?.filter(p => p.type === 'externe').length || 0
  const invInt = invProjects?.filter(p => p.type === 'interne').length || 0

  // ── Properties KPIs ──
  const savProjects = groupByProject(propsData_sav || [])
  const savEtapes = (propsData_sav || []).length
  const savDelayed = (propsData_sav || []).filter(r => r.timing_var && r.timing_var.indexOf('Delay') >= 0).length

  const tvxProjects = groupByProject(propsData_tvx || [])
  const tvxEtapes = (propsData_tvx || []).length
  const tvxDelayed = (propsData_tvx || []).filter(r => r.timing_var && r.timing_var.indexOf('Delay') >= 0).length

  const devProjects = groupByProject(propsData_dev || [])
  const devEtapes = (propsData_dev || []).length
  const devDelayed = (propsData_dev || []).filter(r => r.timing_var && r.timing_var.indexOf('Delay') >= 0).length

  const comVenteImmo = (comData_venteImmoTotal / 1000000).toFixed(1) + 'M'
  const comVenteFonc = (comData_venteFonciereTotal / 1000000).toFixed(1) + 'M'
  const comLocation = (comData_locationTotal / 1000).toFixed(0) + 'k/m'

  return (
    <div className="rpt-poles-grid" style={{ alignItems: 'start' }}>

      {/* ══ COLUMN 1: ENERGY ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ color: '#00ab63', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 2px', textAlign: 'center' }}>
          Energy
        </h3>

        {/* HFO + LFO side by side */}
        <div className="rpt-hub-subgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* HFO */}
          <div
            className="rpt-pole-card rpt-pole-card-sm rpt-pole-enr"
            onClick={() => navigate('/reporting/hfo')}
            style={{ margin: 0 }}
          >
            <div className="rpt-pole-icon"><IconBolt /></div>
            <div className="rpt-pole-title" style={{ color: '#00ab63', fontSize: 13 }}>HFO</div>
            <div className="rpt-pole-sub" style={{ fontSize: 10 }}>{hfoTotal} projets</div>
            <div className="rpt-pole-kpis">
              <Kpi value={hfoTotal} label="Projets" color="#00ab63" />
              <Kpi value={hfoOverhauls} label="Overhauls" color="#5aafaf" />
              <Kpi value={hfoAnnexes} label="Annexes" color="#E05C5C" />
              <Kpi value={hfoSites} label="Sites" color="#FDB823" />
            </div>
          </div>

          {/* LFO */}
          <div
            className="rpt-pole-card rpt-pole-card-sm rpt-pole-enr"
            onClick={() => navigate('/reporting/lfo')}
            style={{ margin: 0 }}
          >
            <div className="rpt-pole-icon"><IconMotor /></div>
            <div className="rpt-pole-title" style={{ color: '#00ab63', fontSize: 13 }}>LFO</div>
            <div className="rpt-pole-sub" style={{ fontSize: 10 }}>{lfoTotal} moteurs</div>
            <div className="rpt-pole-kpis">
              <Kpi value={lfoTotal} label="Moteurs" color="#00ab63" />
              <Kpi value={lfoInstalles} label="Install\u00e9s" color="#5aafaf" />
              <Kpi value={lfoAuF23} label="Au F23" color="#E05C5C" />
              <Kpi value={lfoARapatrier} label="A rapatrier" color="#FDB823" />
            </div>
          </div>
        </div>

        {/* EnR */}
        <div
          className="rpt-pole-card rpt-pole-card-sm rpt-pole-enr"
          onClick={() => navigate('/reporting/enr')}
          style={{ margin: 0 }}
        >
          <div className="rpt-pole-icon"><IconSun /></div>
          <div className="rpt-pole-title" style={{ color: '#00ab63', fontSize: 13 }}>EnR</div>
          <div className="rpt-pole-sub" style={{ fontSize: 10 }}>{enrTotal} projets</div>
          <div className="rpt-pole-kpis">
            <Kpi value={enrTotal} label="Projets" color="#00ab63" />
            <Kpi value={enrOnTrack} label="On track" color="#5aafaf" />
            <Kpi value={enrDelayed} label="Retard" color="#E05C5C" />
            <Kpi value={`${enrAvgProg}%`} label="Avg" color="#FDB823" />
          </div>
        </div>
      </div>

      {/* ══ COLUMN 2: INVESTMENTS ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ color: '#f37056', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 2px', textAlign: 'center' }}>
          Investments
        </h3>

        <div
          className="rpt-pole-card rpt-pole-card-sm rpt-pole-inv"
          onClick={() => navigate('/reporting/investments')}
          style={{ margin: 0 }}
        >
          <div className="rpt-pole-icon"><IconChart /></div>
          <div className="rpt-pole-title" style={{ color: '#f37056', fontSize: 13 }}>Ventures</div>
          <div className="rpt-pole-sub" style={{ fontSize: 10 }}>{invTotal} projets</div>
          <div className="rpt-pole-kpis">
            <Kpi value={invTotal} label="Projets" color="#f37056" />
            <Kpi value={invExt} label="Externe" color="#5aafaf" />
            <Kpi value={invInt} label="Interne" color="#FDB823" />
          </div>
        </div>
      </div>

      {/* ══ COLUMN 3: PROPERTIES ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ color: '#FDB823', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 2px', textAlign: 'center' }}>
          Properties
        </h3>

        {/* Row 1: Foncier + Suivis de permis (disabled) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="rpt-pole-card rpt-pole-card-sm rpt-pole-props" style={{ margin: 0, opacity: 0.4, pointerEvents: 'none' }}>
            <div className="rpt-pole-title" style={{ color: '#FDB823', fontSize: 13 }}>Foncier</div>
            <div className="rpt-pole-sub" style={{ color: 'var(--text-dim)', fontSize: 10 }}>Bient&ocirc;t disponible</div>
          </div>
          <div className="rpt-pole-card rpt-pole-card-sm rpt-pole-props" style={{ margin: 0, opacity: 0.4, pointerEvents: 'none' }}>
            <div className="rpt-pole-title" style={{ color: '#FDB823', fontSize: 13 }}>Suivis de permis</div>
            <div className="rpt-pole-sub" style={{ color: 'var(--text-dim)', fontSize: 10 }}>Bient&ocirc;t disponible</div>
          </div>
        </div>

        {/* Row 2: Dev + Travaux */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div
            className="rpt-pole-card rpt-pole-card-sm rpt-pole-props"
            onClick={() => navigate('/reporting/properties?sub=dev')}
            style={{ margin: 0, cursor: 'pointer' }}
          >
            <div className="rpt-pole-icon"><IconGlobe /></div>
            <div className="rpt-pole-title" style={{ color: '#FDB823', fontSize: 13 }}>Dev</div>
            <div className="rpt-pole-sub" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
              {devProjects.length} projets &bull; {devEtapes} {'\u00e9'}tapes
            </div>
            <div className="rpt-pole-kpis">
              <Kpi value={devProjects.length} label="Projets" color="#FDB823" />
              <Kpi value={devEtapes} label={'\u00c9tapes'} color="#00ab63" />
              <Kpi value={devDelayed} label="Retard" color="#E05C5C" />
            </div>
          </div>

          <div
            className="rpt-pole-card rpt-pole-card-sm rpt-pole-props"
            onClick={() => navigate('/reporting/properties?sub=tvx')}
            style={{ margin: 0, cursor: 'pointer' }}
          >
            <div className="rpt-pole-icon"><IconBuilding /></div>
            <div className="rpt-pole-title" style={{ color: '#FDB823', fontSize: 13 }}>Travaux</div>
            <div className="rpt-pole-sub" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
              {tvxProjects.length} projets &bull; {tvxEtapes} {'\u00e9'}tapes
            </div>
            <div className="rpt-pole-kpis">
              <Kpi value={tvxProjects.length} label="Projets" color="#FDB823" />
              <Kpi value={tvxEtapes} label={'\u00c9tapes'} color="#00ab63" />
              <Kpi value={tvxDelayed} label="Retard" color="#E05C5C" />
            </div>
          </div>
        </div>

        {/* Row 3: Commercial + SAV */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div
            className="rpt-pole-card rpt-pole-card-sm rpt-pole-props"
            onClick={() => navigate('/reporting/properties?sub=com')}
            style={{ margin: 0, cursor: 'pointer' }}
          >
            <div className="rpt-pole-icon"><IconLayers /></div>
            <div className="rpt-pole-title" style={{ color: '#FDB823', fontSize: 13 }}>Commercial</div>
            <div className="rpt-pole-sub" style={{ color: 'var(--text-muted)', fontSize: 10 }}>Objectifs 2026</div>
            <div className="rpt-pole-kpis">
              <Kpi value={comVenteImmo} label="Vente Immo" color="#FDB823" />
              <Kpi value={comVenteFonc} label="Vente Fonc." color="#00ab63" />
              <Kpi value={comLocation} label="Location" color="#E05C5C" />
            </div>
          </div>

          <div
            className="rpt-pole-card rpt-pole-card-sm rpt-pole-props"
            onClick={() => navigate('/reporting/properties?sub=sav')}
            style={{ margin: 0, cursor: 'pointer' }}
          >
            <div className="rpt-pole-icon"><IconWrench /></div>
            <div className="rpt-pole-title" style={{ color: '#FDB823', fontSize: 13 }}>SAV</div>
            <div className="rpt-pole-sub" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
              {savProjects.length} projets &bull; {savEtapes} {'\u00e9'}tapes
            </div>
            <div className="rpt-pole-kpis">
              <Kpi value={savProjects.length} label="Projets" color="#FDB823" />
              <Kpi value={savEtapes} label={'\u00c9tapes'} color="#00ab63" />
              <Kpi value={savDelayed} label="Retard" color="#E05C5C" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
