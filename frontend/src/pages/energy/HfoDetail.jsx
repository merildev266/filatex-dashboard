import { useState, useMemo, useContext } from 'react'
import { FilterContext } from '../../context/FilterContext'
import FilterBar from '../../components/FilterBar'
import SlidePanel from '../../components/SlidePanel'
import KpiBox from '../../components/KpiBox'
import HfoSite from './HfoSite'
import { TAMATAVE_LIVE, DIEGO_LIVE, MAJUNGA_LIVE, TULEAR_LIVE } from '../../data/site_data'
import { HFO_PROJECTS } from '../../data/hfo_projects'
import { HFO_STATUS_LABELS, HFO_STATUS_COLORS, HFO_CAT_LABELS, formatDateFR } from '../../utils/projects'

// Default site data (same structure as energy.js siteData)
// We merge live data from site_data.js exports
const SITE_ORDER = ['tamatave', 'tulear', 'diego', 'majunga', 'antsirabe', 'fihaonana']

const DEFAULT_SITES = {
  tamatave: {
    name: 'Tamatave', status: 'ko', mw: 0, contrat: 32,
    groupes: [], kpi: { '24h': {}, month: {}, year: {} },
  },
  tulear: {
    name: 'Tulear', status: 'warn', mw: 15, contrat: 9.9,
    groupes: [], kpi: { '24h': {}, month: {}, year: {} },
  },
  diego: {
    name: 'Diego', status: 'warn', mw: 9.6, contrat: 18.5,
    groupes: [], kpi: { '24h': {}, month: {}, year: {} },
  },
  majunga: {
    name: 'Majunga', status: 'ok', mw: 20, contrat: 16.3,
    groupes: [], kpi: { '24h': {}, month: {}, year: {} },
  },
  antsirabe: {
    name: 'Antsirabe', status: 'reconstruction', mw: 0, contrat: 7.5,
    groupes: [], kpi: {},
  },
  fihaonana: {
    name: 'Fihaonana', status: 'construction', mw: 0, contrat: 0,
    groupes: [], kpi: {},
  },
}

// Merge live data
function buildSiteData() {
  const sites = { ...DEFAULT_SITES }
  const liveMap = {
    tamatave: TAMATAVE_LIVE,
    diego: DIEGO_LIVE,
    majunga: MAJUNGA_LIVE,
    tulear: TULEAR_LIVE,
  }
  for (const [key, live] of Object.entries(liveMap)) {
    if (live && sites[key]) {
      sites[key] = { ...sites[key], ...live }
    }
  }
  return sites
}

// Get KPI for a given filter
function getKpiForSite(site, filter) {
  if (!site || !site.kpi) return {}
  const filterMap = { 'J-1': '24h', 'M': 'month', 'Q': 'quarter', 'A': 'year' }
  const key = filterMap[filter] || 'month'
  if (key === 'quarter') {
    // Aggregate quarter from monthly data
    return site.kpi['month'] || {}
  }
  return site.kpi[key] || site.kpi['month'] || {}
}

export default function HfoDetail() {
  const { currentFilter, setFilter } = useContext(FilterContext)
  const [selectedSite, setSelectedSite] = useState(null)
  const [projectFilter, setProjectFilter] = useState(null) // { type: 'site'|'cat', key: string }

  const siteData = useMemo(() => buildSiteData(), [])

  // Compute total production across active sites for share calculation
  const { totalProdAll, activeSites } = useMemo(() => {
    let total = 0
    const active = []
    SITE_ORDER.forEach(id => {
      const s = siteData[id]
      if (s.status === 'construction' || s.status === 'reconstruction') return
      const k = getKpiForSite(s, currentFilter)
      total += (k && k.prod) || 0
      active.push({ id, site: s, kpi: k })
    })
    return { totalProdAll: total, activeSites: active }
  }, [siteData, currentFilter])

  // Consolidated KPIs
  const consolidated = useMemo(() => {
    let totalMW = 0, totalContrat = 0, totalProd = 0, totalProdObj = 0
    let totalArret = 0, totalMoteurs = 0
    let sfocWeighted = 0, slocWeighted = 0

    activeSites.forEach(({ site, kpi }) => {
      totalMW += site.mw || 0
      totalContrat += site.contrat || 0
      totalMoteurs += site.groupes ? site.groupes.length : 0
      if (site.groupes) {
        site.groupes.forEach(g => {
          if (g.statut !== 'ok') totalArret++
        })
      }
      totalProd += kpi.prod || 0
      totalProdObj += kpi.prodObj || 0
      if (kpi.sfoc && kpi.prod) sfocWeighted += kpi.sfoc * kpi.prod
      if (kpi.sloc && kpi.prod) slocWeighted += kpi.sloc * kpi.prod
    })

    const pct = totalContrat > 0 ? ((totalMW / totalContrat) * 100) : 0
    const prodDelta = totalProdObj > 0 ? (((totalProd / totalProdObj) - 1) * 100) : null
    const avgSfoc = totalProd > 0 ? sfocWeighted / totalProd : 0
    const avgSloc = totalProd > 0 ? slocWeighted / totalProd : 0

    return {
      totalMW, totalContrat, pct, totalProd, totalProdObj, prodDelta,
      totalArret, totalMoteurs, avgSfoc, avgSloc,
    }
  }, [activeSites])

  // HFO Projects panel
  const hfp = HFO_PROJECTS

  // Filtered projects list
  const filteredProjects = useMemo(() => {
    if (!projectFilter) return []
    if (projectFilter.type === 'cat') {
      return hfp.projects.filter(p => p.categorie === 'overhaul')
    }
    return hfp.projects.filter(p => p.site === projectFilter.key)
  }, [projectFilter, hfp])

  // Site detail panel
  const selectedSiteData = selectedSite ? siteData[selectedSite] : null

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-bold">HFO — Centrales Thermiques</h2>
        <FilterBar current={currentFilter} onChange={setFilter} />
      </div>

      {/* Consolidated KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="glass-card p-4 text-center">
          <div className="text-[8px] font-bold tracking-widest uppercase text-[var(--text-dim)] mb-2">
            Puissance / Contrat
          </div>
          <div className="text-2xl font-extrabold" style={{ color: consolidated.pct >= 100 ? '#00ab63' : '#E05C5C' }}>
            {consolidated.totalMW.toFixed(1)}
            <span className="text-xs font-normal text-[var(--text-muted)] ml-1">/ {consolidated.totalContrat.toFixed(0)} MW</span>
          </div>
          <div className="text-[10px] font-bold mt-1" style={{ color: consolidated.pct >= 100 ? '#00ab63' : '#E05C5C' }}>
            {consolidated.pct.toFixed(1)}%
          </div>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="text-[8px] font-bold tracking-widest uppercase text-[var(--text-dim)] mb-2">
            Moteurs a l'arret
          </div>
          <div className="text-2xl font-extrabold" style={{ color: consolidated.totalArret === 0 ? '#00ab63' : '#E05C5C' }}>
            {consolidated.totalArret}
            <span className="text-xs font-normal text-[var(--text-muted)] ml-1">/ {consolidated.totalMoteurs}</span>
          </div>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="text-[8px] font-bold tracking-widest uppercase text-[var(--text-dim)] mb-2">
            Production
          </div>
          <div className="text-xl font-extrabold text-white/90">
            {Math.round(consolidated.totalProd).toLocaleString()}
            <span className="text-[10px] font-normal text-[var(--text-muted)] ml-1">MWh</span>
          </div>
          <div className="text-[10px] font-bold mt-1" style={{
            color: consolidated.prodDelta === null ? 'rgba(255,255,255,0.3)'
              : consolidated.prodDelta >= 0 ? '#00ab63' : '#E05C5C'
          }}>
            {consolidated.prodDelta !== null
              ? `${consolidated.prodDelta > 0 ? '+' : ''}${consolidated.prodDelta.toFixed(1)}% vs prevu`
              : '—'}
          </div>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="text-[8px] font-bold tracking-widest uppercase text-[var(--text-dim)] mb-2">
            SFOC / SLOC
          </div>
          <div className="flex justify-center gap-4">
            <div>
              <div className="text-lg font-extrabold" style={{ color: consolidated.avgSfoc > 0 && consolidated.avgSfoc <= 250 ? '#00ab63' : consolidated.avgSfoc > 250 ? '#E05C5C' : 'rgba(255,255,255,0.3)' }}>
                {consolidated.avgSfoc > 0 ? consolidated.avgSfoc.toFixed(1) : '—'}
              </div>
              <div className="text-[8px] text-[var(--text-dim)]">g/kWh</div>
            </div>
            <div>
              <div className="text-lg font-extrabold" style={{ color: consolidated.avgSloc > 0 && consolidated.avgSloc <= 1.0 ? '#00ab63' : consolidated.avgSloc > 1.0 ? '#E05C5C' : 'rgba(255,255,255,0.3)' }}>
                {consolidated.avgSloc > 0 ? consolidated.avgSloc.toFixed(2) : '—'}
              </div>
              <div className="text-[8px] text-[var(--text-dim)]">g/kWh</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sites grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {SITE_ORDER.map(id => {
          const site = siteData[id]
          const kpi = getKpiForSite(site, currentFilter)
          const share = totalProdAll > 0 ? ((kpi.prod || 0) / totalProdAll * 100) : 0
          return (
            <HfoSite
              key={id}
              site={site}
              kpi={kpi}
              prodShare={share}
              onClick={() => setSelectedSite(id)}
            />
          )
        })}
      </div>

      {/* HFO Projects section */}
      <div className="mt-8">
        <h3 className="text-base font-bold mb-4">Projets HFO — {hfp.total} projets</h3>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="glass-card p-3">
            <KpiBox value={hfp.total} label="Total projets" color="rgba(255,255,255,0.9)" />
          </div>
          <div className="glass-card p-3">
            <KpiBox value={hfp.overhauls} label="Overhauls" color="rgba(255,255,255,0.9)" />
          </div>
          <div className="glass-card p-3">
            <KpiBox value={hfp.enCours} label="En cours" color="#FDB823" />
          </div>
          <div className="glass-card p-3">
            <KpiBox value={`${hfp.urgents}`} label="Urgents" color="#f37056" />
          </div>
        </div>

        {/* Filter cards */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-2 mb-4">
          {[
            { key: 'OVERHAUL', label: 'Overhauls', type: 'cat', total: hfp.overhauls },
            ...hfp.sites.filter(s => s !== 'VESTOP' && s !== 'AUTRE').map(s => ({
              key: s, label: s.charAt(0) + s.slice(1).toLowerCase(), type: 'site',
              total: hfp.bySite[s]?.total || 0,
            })),
            { key: 'VESTOP', label: 'Vestop', type: 'site', total: hfp.bySite['VESTOP']?.total || 0 },
            { key: 'AUTRE', label: 'Autre', type: 'site', total: hfp.bySite['AUTRE']?.total || 0 },
          ].map(card => (
            <button
              key={card.key}
              onClick={() => setProjectFilter(projectFilter?.key === card.key ? null : { type: card.type, key: card.key })}
              className={`rounded-xl p-3 text-center cursor-pointer transition-all border
                ${projectFilter?.key === card.key
                  ? 'border-[#00ab63] bg-[rgba(0,171,99,0.08)]'
                  : 'border-[rgba(138,146,171,0.15)] bg-[rgba(138,146,171,0.05)] hover:border-[rgba(138,146,171,0.5)]'
                }`}
            >
              <div className="text-[10px] font-bold text-white/70 mb-1">{card.label}</div>
              <div className="text-xl font-extrabold text-white/90">{card.total}</div>
            </button>
          ))}
        </div>

        {/* Filtered project list */}
        {projectFilter && filteredProjects.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-bold tracking-widest uppercase text-[rgba(0,171,99,0.6)] border-b border-[rgba(0,171,99,0.15)] pb-2 mb-3">
              {projectFilter.type === 'cat'
                ? `Overhauls — ${filteredProjects.length} projets`
                : `${projectFilter.key.charAt(0)}${projectFilter.key.slice(1).toLowerCase()} — ${filteredProjects.length} projets`}
            </div>
            {filteredProjects.map((p, i) => {
              const sCol = HFO_STATUS_COLORS[p.status] || 'rgba(138,146,171,0.5)'
              const sLabel = HFO_STATUS_LABELS[p.status] || p.status
              const cLabel = HFO_CAT_LABELS[p.categorie] || p.categorie
              return (
                <div
                  key={i}
                  className="glass-card p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white/85 truncate">{p.projet}</div>
                    <div className="text-[9px] text-white/35 mt-0.5">
                      {cLabel}{p.moteur ? ` · ${p.moteur}` : ''}{p.resp ? ` · ${p.resp}` : ''}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[9px] font-bold tracking-wider uppercase" style={{ color: sCol }}>
                      {sLabel}
                    </div>
                    {p.dayToGo != null && p.dayToGo > 0 && (
                      <div className="text-sm font-extrabold text-white/70 mt-0.5">
                        {p.dayToGo} <span className="text-[9px] font-normal text-white/30">jours</span>
                      </div>
                    )}
                    {p.dlRevu && (
                      <div className="text-[8px] text-white/25 mt-0.5">DL: {formatDateFR(p.dlRevu)}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Site detail slide panel */}
      <SlidePanel
        isOpen={!!selectedSite}
        onClose={() => setSelectedSite(null)}
        title={selectedSiteData?.name || ''}
      >
        {selectedSiteData && (
          <SiteDetail site={selectedSiteData} kpi={getKpiForSite(selectedSiteData, currentFilter)} />
        )}
      </SlidePanel>
    </div>
  )
}

/** Site detail panel content */
function SiteDetail({ site, kpi }) {
  const s = site
  const k = kpi || {}

  return (
    <div>
      {/* Status overview */}
      <div className="mb-6">
        <div className="text-xs text-[var(--text-muted)] mb-1">
          {s.latestDate ? `Donnees du ${formatDateFR(s.latestDate)}` : ''}
        </div>
        <div className="text-2xl font-extrabold">
          {parseFloat(s.mw).toFixed(1)} <span className="text-sm text-[var(--text-muted)]">/ {s.contrat} MW</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card p-3">
          <KpiBox value={k.prod ? Math.round(k.prod).toLocaleString() + ' MWh' : '—'} label="Production" color="#00ab63" size="sm" />
        </div>
        <div className="glass-card p-3">
          <KpiBox value={k.sfoc ? k.sfoc.toFixed(1) : '—'} label="SFOC (g/kWh)" color={k.sfoc && k.sfoc <= 250 ? '#00ab63' : '#E05C5C'} size="sm" />
        </div>
        <div className="glass-card p-3">
          <KpiBox value={k.sloc ? k.sloc.toFixed(2) : '—'} label="SLOC (g/kWh)" color={k.sloc && k.sloc <= 1.0 ? '#00ab63' : '#E05C5C'} size="sm" />
        </div>
      </div>

      {/* Moteurs list */}
      {s.groupes && s.groupes.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Moteurs ({s.groupes.length})
          </h3>
          <div className="space-y-2">
            {s.groupes.map(g => {
              const statusColor = g.statut === 'ok' ? '#00ab63' : g.statut === 'warn' ? '#f37056' : '#E05C5C'
              return (
                <div key={g.id} className="glass-card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: statusColor }}
                    />
                    <div>
                      <div className="text-xs font-bold">{g.id}</div>
                      <div className="text-[9px] text-[var(--text-dim)]">{g.model} · {g.mw} MW</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-bold uppercase" style={{ color: statusColor }}>
                      {g.condition || g.statut}
                    </div>
                    {g.energieProd > 0 && (
                      <div className="text-[10px] text-white/60 mt-0.5">
                        {Math.round(g.energieProd).toLocaleString()} kWh
                      </div>
                    )}
                    {g.maint && (
                      <div className="text-[8px] text-[var(--text-dim)] mt-0.5 max-w-[150px] truncate">
                        {g.maint}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
