import { useMemo, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilterContext } from '../../context/FilterContext'
import NeonDot from '../../components/NeonDot'
import { TAMATAVE_LIVE, DIEGO_LIVE, MAJUNGA_LIVE, TULEAR_LIVE } from '../../data/site_data'
import { ENR_SITES } from '../../data/enr_site_data'
import { ENR_PROJECTS_DATA } from '../../data/enr_projects_data'
import { HFO_PROJECTS } from '../../data/hfo_projects'

// Merge live data for overview
const LIVE_SITES = {
  tamatave: TAMATAVE_LIVE,
  diego: DIEGO_LIVE,
  majunga: MAJUNGA_LIVE,
  tulear: TULEAR_LIVE,
}

const STATIC_SITES = {
  antsirabe: { name: 'Antsirabe', status: 'reconstruction', mw: 0, contrat: 7.5, groupes: [], kpi: {} },
  fihaonana: { name: 'Fihaonana', status: 'construction', mw: 0, contrat: 0, groupes: [], kpi: {} },
}

const ALL_SITES = { ...LIVE_SITES, ...STATIC_SITES }
const SITE_ORDER = ['tamatave', 'tulear', 'diego', 'majunga', 'antsirabe', 'fihaonana']

function getKpiForSite(site, filter) {
  if (!site || !site.kpi) return {}
  const map = { 'J-1': '24h', 'M': 'month', 'Q': 'quarter', 'A': 'year' }
  const key = map[filter] || 'month'
  return site.kpi[key] || site.kpi['month'] || {}
}

export default function EnergyOverview() {
  const navigate = useNavigate()
  const { currentFilter } = useContext(FilterContext)

  // HFO aggregates
  const hfo = useMemo(() => {
    let totalMW = 0, totalContrat = 0, totalProd = 0, totalMoteurs = 0, totalArret = 0
    SITE_ORDER.forEach(id => {
      const s = ALL_SITES[id]
      if (!s || s.status === 'construction' || s.status === 'reconstruction') return
      totalMW += s.mw || 0
      totalContrat += s.contrat || 0
      if (s.groupes) {
        totalMoteurs += s.groupes.length
        s.groupes.forEach(g => { if (g.statut !== 'ok') totalArret++ })
      }
      const k = getKpiForSite(s, currentFilter)
      totalProd += k.prod || 0
    })
    const pct = totalContrat > 0 ? ((totalMW / totalContrat) * 100) : 0
    const activeSites = SITE_ORDER.filter(id => {
      const s = ALL_SITES[id]
      return s && s.status !== 'construction' && s.status !== 'reconstruction'
    })
    return { totalMW, totalContrat, pct, totalProd, totalMoteurs, totalArret, activeSites, projectCount: HFO_PROJECTS?.total || 0 }
  }, [currentFilter])

  // ENR aggregates
  const enr = useMemo(() => {
    const sites = ENR_SITES || []
    const projects = ENR_PROJECTS_DATA?.projects || []
    let totalCapMw = 0, totalProdKwh = 0
    sites.forEach(s => {
      totalCapMw += s.capacityMw
      // Use latest month data for quick overview
      if (s.monthly && s.monthly.length > 0) {
        const latestMonth = s.monthly[s.monthly.length - 1]
        totalProdKwh += latestMonth.totalProdKwh
      }
    })
    let totalMwcPipeline = 0, totalCapex = 0
    projects.forEach(p => {
      totalMwcPipeline += p.pvMw || 0
      totalCapex += p.capexM || 0
    })
    return { totalCapMw, totalProdKwh, sites, projectCount: projects.length, totalMwcPipeline, totalCapex }
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ═══ HFO Column ═══ */}
      <div
        onClick={() => navigate('/energy/hfo')}
        className="glass-card p-6 cursor-pointer hover:-translate-y-1 transition-transform group"
        style={{ background: 'rgba(138,146,171,0.04)', borderColor: 'rgba(138,146,171,0.15)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(138,146,171,0.15)] flex items-center justify-center text-base">
              ⚡
            </div>
            <div>
              <h2 className="text-base font-bold">HFO</h2>
              <div className="text-[9px] text-[var(--text-dim)] uppercase tracking-wider">Centrales thermiques</div>
            </div>
          </div>
          <span className="text-[var(--text-dim)] group-hover:text-white transition-colors text-lg">→</span>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Puissance */}
          <div className="text-center">
            <div className="text-[8px] font-bold tracking-widest uppercase text-[var(--text-dim)] mb-1">
              Puissance dispo
            </div>
            <div className="text-3xl font-extrabold" style={{ color: hfo.pct >= 100 ? '#00ab63' : '#E05C5C' }}>
              {hfo.totalMW.toFixed(1)}
              <span className="text-xs font-normal text-[var(--text-muted)] ml-1">/ {hfo.totalContrat.toFixed(0)} MW</span>
            </div>
            <div className="text-[10px] font-bold mt-0.5" style={{ color: hfo.pct >= 100 ? '#00ab63' : '#E05C5C' }}>
              {hfo.pct.toFixed(0)}% du contrat
            </div>
          </div>

          {/* Moteurs */}
          <div className="text-center">
            <div className="text-[8px] font-bold tracking-widest uppercase text-[var(--text-dim)] mb-1">
              Moteurs a l'arret
            </div>
            <div className="text-3xl font-extrabold" style={{ color: hfo.totalArret === 0 ? '#00ab63' : '#E05C5C' }}>
              {hfo.totalArret}
              <span className="text-xs font-normal text-[var(--text-muted)] ml-1">/ {hfo.totalMoteurs}</span>
            </div>
          </div>
        </div>

        {/* Production */}
        <div className="text-center mb-5">
          <div className="text-[8px] font-bold tracking-widest uppercase text-[var(--text-dim)] mb-1">
            Production
          </div>
          <div className="text-2xl font-extrabold text-white/90">
            {Math.round(hfo.totalProd).toLocaleString()}
            <span className="text-xs font-normal text-[var(--text-muted)] ml-1">MWh</span>
          </div>
        </div>

        {/* Mini site list */}
        <div className="space-y-1.5">
          {SITE_ORDER.map(id => {
            const s = ALL_SITES[id]
            if (!s) return null
            const isSpecial = s.status === 'construction' || s.status === 'reconstruction'
            const isOk = !isSpecial && s.contrat > 0 && (s.mw / s.contrat * 100) >= 100
            return (
              <div key={id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <NeonDot status={isSpecial ? (s.status === 'reconstruction' ? 'ko' : 'ok') : isOk ? 'ok' : 'ko'} size={6} />
                  <span className="text-[11px] font-semibold text-white/70">{s.name}</span>
                </div>
                <span className="text-[10px] text-[var(--text-dim)]">
                  {isSpecial
                    ? (s.status === 'reconstruction' ? 'Reparation' : 'Construction')
                    : `${parseFloat(s.mw).toFixed(1)} / ${s.contrat} MW`
                  }
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-4 text-[9px] text-[var(--text-dim)]">
          {hfo.projectCount} projets HFO en cours
        </div>
      </div>

      {/* ═══ ENR Column ═══ */}
      <div
        onClick={() => navigate('/energy/enr')}
        className="glass-card p-6 cursor-pointer hover:-translate-y-1 transition-transform group"
        style={{ background: 'rgba(0,171,99,0.04)', borderColor: 'rgba(0,171,99,0.15)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(0,171,99,0.15)] flex items-center justify-center text-base">
              ☀
            </div>
            <div>
              <h2 className="text-base font-bold text-[#00ab63]">ENR</h2>
              <div className="text-[9px] text-[var(--text-dim)] uppercase tracking-wider">Energies renouvelables</div>
            </div>
          </div>
          <span className="text-[var(--text-dim)] group-hover:text-[#00ab63] transition-colors text-lg">→</span>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Capacite */}
          <div className="text-center">
            <div className="text-[8px] font-bold tracking-widest uppercase text-[rgba(0,171,99,0.5)] mb-1">
              Capacite installee
            </div>
            <div className="text-3xl font-extrabold text-[#00ab63]">
              {enr.totalCapMw.toFixed(1)}
              <span className="text-xs font-normal text-[rgba(0,171,99,0.5)] ml-1">MWc</span>
            </div>
            <div className="text-[10px] text-[rgba(0,171,99,0.4)] mt-0.5">
              {enr.sites.length} centrales
            </div>
          </div>

          {/* Pipeline */}
          <div className="text-center">
            <div className="text-[8px] font-bold tracking-widest uppercase text-[rgba(0,171,99,0.5)] mb-1">
              Pipeline projets
            </div>
            <div className="text-3xl font-extrabold text-[#00ab63]">
              {enr.totalMwcPipeline.toFixed(1)}
              <span className="text-xs font-normal text-[rgba(0,171,99,0.5)] ml-1">MWc</span>
            </div>
            <div className="text-[10px] text-[rgba(0,171,99,0.4)] mt-0.5">
              {enr.projectCount} projets · {enr.totalCapex.toFixed(1)} M$
            </div>
          </div>
        </div>

        {/* Production site list */}
        <div className="mb-5">
          <div className="text-[8px] font-bold tracking-widest uppercase text-[rgba(0,171,99,0.5)] mb-3">
            Sites de production
          </div>
          <div className="space-y-2">
            {enr.sites.map((s, i) => {
              const col = ['#00ab63', '#5aafaf', '#4a8fe7'][i % 3]
              const latestMonth = s.monthly && s.monthly.length > 0 ? s.monthly[s.monthly.length - 1] : null
              return (
                <div
                  key={s.code || i}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg"
                  style={{ background: `${col}0d` }}
                >
                  <div className="flex items-center gap-2">
                    <NeonDot status="ok" size={6} />
                    <span className="text-[11px] font-semibold text-white/80">{s.name}</span>
                    <span className="text-[9px] text-white/30">{s.capacityMw} MWc</span>
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: col }}>
                    {latestMonth ? (latestMonth.totalProdKwh / 1000).toFixed(0) + ' MWh' : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="text-[9px] text-[rgba(0,171,99,0.4)]">
          {enr.projectCount} projets ENR dans le pipeline
        </div>
      </div>
    </div>
  )
}
