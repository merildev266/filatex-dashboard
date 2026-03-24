import { useNavigate } from 'react-router-dom'
import { REPORTING_ENR } from '../../data/reporting_data'
import { HFO_PROJECTS } from '../../data/hfo_projects'
import { invProjects } from '../../data/investments_data'

// SVG Icons
function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#00ab63" strokeWidth="2" className="w-6 h-6">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}
function IconSun() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#00ab63" strokeWidth="2" className="w-6 h-6">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}
function IconMotor() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#00ab63" strokeWidth="1.5" className="w-6 h-6">
      <rect x="3" y="8" width="18" height="10" rx="2" />
      <line x1="7" y1="8" x2="7" y2="5" /><line x1="12" y1="8" x2="12" y2="5" /><line x1="17" y1="8" x2="17" y2="5" />
      <circle cx="8" cy="13" r="2" /><circle cx="16" cy="13" r="2" />
      <line x1="10" y1="13" x2="14" y2="13" />
    </svg>
  )
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#f37056" strokeWidth="2" className="w-6 h-6">
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  )
}
function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#FDB823" strokeWidth="1.5" className="w-6 h-6">
      <path d="M2 20h20M5 20V10l7-7 7 7v10M9 20v-6h6v6" />
    </svg>
  )
}

function PoleKpi({ value, label, color }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] text-[var(--text-muted)]">{label}</div>
    </div>
  )
}

function PoleCard({ icon, title, subtitle, color, kpis, onClick, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]
        rounded-xl p-4 text-center transition-all duration-200
        ${disabled ? 'opacity-40 cursor-default' : 'cursor-pointer hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.05)]'}
      `}
    >
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-sm font-bold mb-1" style={{ color }}>{title}</div>
      <div className="text-[10px] text-[var(--text-muted)] mb-3">{subtitle}</div>
      {kpis && (
        <div className="flex justify-center gap-4">
          {kpis}
        </div>
      )}
    </div>
  )
}

export default function ReportingHub() {
  const navigate = useNavigate()

  // ENR KPIs
  const enrPs = REPORTING_ENR?.projects || []
  const enrTotal = enrPs.length
  const enrOnTrack = enrPs.filter(p => p.glissement <= 0).length
  const enrDelayed = enrPs.filter(p => p.glissement > 0).length
  const enrAvgProg = enrTotal > 0 ? Math.round(enrPs.reduce((s, p) => s + (p.avancement || 0), 0) / enrTotal) : 0

  // HFO KPIs
  const hfoTotal = HFO_PROJECTS?.total || 0
  const hfoOverhauls = HFO_PROJECTS?.overhauls || 0
  const hfoEnCours = HFO_PROJECTS?.enCours || 0

  // Investments KPIs
  const invTotal = invProjects?.length || 0
  const invExt = invProjects?.filter(p => p.type === 'externe').length || 0
  const invInt = invProjects?.filter(p => p.type === 'interne').length || 0

  return (
    <div className="max-w-5xl mx-auto">
      {/* 3-column grid: Energy / Investments / Properties */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

        {/* COLUMN 1: ENERGY */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-center text-[#00ab63]">Energy</h3>
          {/* HFO + LFO side by side */}
          <div className="grid grid-cols-2 gap-3">
            <PoleCard
              icon={<IconBolt />}
              title="HFO"
              subtitle={`${hfoTotal} projets`}
              color="#00ab63"
              onClick={() => navigate('/reporting/hfo')}
              kpis={<>
                <PoleKpi value={hfoTotal} label="Projets" color="#00ab63" />
                <PoleKpi value={hfoOverhauls} label="Overhauls" color="#5aafaf" />
                <PoleKpi value={hfoEnCours} label="En cours" color="#FDB823" />
              </>}
            />
            <PoleCard
              icon={<IconMotor />}
              title="LFO"
              subtitle="40 moteurs"
              color="#00ab63"
              onClick={() => navigate('/reporting/lfo')}
              kpis={<>
                <PoleKpi value={40} label="Moteurs" color="#00ab63" />
              </>}
            />
          </div>
          {/* ENR */}
          <PoleCard
            icon={<IconSun />}
            title="EnR"
            subtitle={`${enrTotal} projets`}
            color="#00ab63"
            onClick={() => navigate('/reporting/enr')}
            kpis={<>
              <PoleKpi value={enrTotal} label="Projets" color="#00ab63" />
              <PoleKpi value={enrOnTrack} label="On track" color="#5aafaf" />
              <PoleKpi value={enrDelayed} label="Retard" color="#E05C5C" />
              <PoleKpi value={`${enrAvgProg}%`} label="Avg" color="#FDB823" />
            </>}
          />
        </div>

        {/* COLUMN 2: INVESTMENTS */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-center text-[#f37056]">Investments</h3>
          <PoleCard
            icon={<IconChart />}
            title="Ventures"
            subtitle={`${invTotal} projets`}
            color="#f37056"
            onClick={() => navigate('/reporting/investments')}
            kpis={<>
              <PoleKpi value={invTotal} label="Projets" color="#f37056" />
              <PoleKpi value={invExt} label="Externe" color="#5aafaf" />
              <PoleKpi value={invInt} label="Interne" color="#FDB823" />
            </>}
          />
        </div>

        {/* COLUMN 3: PROPERTIES */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-center text-[#FDB823]">Properties</h3>
          {/* Foncier + Suivis de permis (disabled) */}
          <div className="grid grid-cols-2 gap-3">
            <PoleCard
              title="Foncier"
              subtitle="Bientot disponible"
              color="#FDB823"
              icon={<span />}
              disabled
            />
            <PoleCard
              title="Suivis de permis"
              subtitle="Bientot disponible"
              color="#FDB823"
              icon={<span />}
              disabled
            />
          </div>
          {/* Dev + Tvx */}
          <div className="grid grid-cols-2 gap-3">
            <PoleCard
              icon={<IconBuilding />}
              title="Dev"
              subtitle="Nouveaux projets"
              color="#FDB823"
              onClick={() => navigate('/reporting/properties?sub=dev')}
            />
            <PoleCard
              icon={<IconBuilding />}
              title="Travaux"
              subtitle="Suivi chantiers"
              color="#FDB823"
              onClick={() => navigate('/reporting/properties?sub=tvx')}
            />
          </div>
          {/* Commercial + SAV */}
          <div className="grid grid-cols-2 gap-3">
            <PoleCard
              icon={<IconBuilding />}
              title="Commercial"
              subtitle="Objectifs 2026"
              color="#FDB823"
              onClick={() => navigate('/reporting/properties?sub=com')}
            />
            <PoleCard
              icon={<IconBuilding />}
              title="SAV"
              subtitle="Service apres-vente"
              color="#FDB823"
              onClick={() => navigate('/reporting/properties?sub=sav')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
