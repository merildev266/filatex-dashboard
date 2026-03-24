import { useState, useMemo, useContext } from 'react'
import { FilterContext } from '../../context/FilterContext'
import FilterBar from '../../components/FilterBar'
import KpiBox from '../../components/KpiBox'
import HfoSite from './HfoSite'
import { TAMATAVE_LIVE, DIEGO_LIVE, MAJUNGA_LIVE, TULEAR_LIVE } from '../../data/site_data'
import { HFO_PROJECTS } from '../../data/hfo_projects'
import { HFO_STATUS_LABELS, HFO_STATUS_COLORS, HFO_CAT_LABELS, formatDateFR } from '../../utils/projects'

// Default site data (same structure as energy.js siteData)
// We merge live data from site_data.js exports
const SITE_ORDER = ['tamatave', 'tulear', 'diego', 'majunga', 'antsirabe', 'fihaonana']
const NAVIGABLE_SITES = ['tamatave', 'tulear', 'diego', 'majunga']

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

// Format generator ID: "ADG1" -> "ADG 1"
function fmtGId(id) {
  return id ? id.replace(/(\D+)(\d+)/, '$1 $2') : id
}

// Generator SFOC calculation (simplified — uses 24h data for now)
function calcGenSfoc(g) {
  const HFO_D = 0.96
  const pKwh = g.energieProd || 0
  const hfoL = g.consoHFO || 0
  if (pKwh > 0 && hfoL > 0) {
    return Math.round((hfoL * HFO_D) / pKwh * 1000 * 10) / 10
  }
  return null
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

  // Consolidated KPIs — matches original renderConsolidated()
  const consolidated = useMemo(() => {
    const kpis = activeSites.map(a => a.kpi)
    const tProd = kpis.reduce((s, k) => s + (k.prod || 0), 0)
    const tMw = parseFloat(activeSites.reduce((s, a) => s + (a.site.mw || 0), 0).toFixed(1))
    // Weighted average SFOC/SLOC by production
    const aSfoc = tProd > 0 ? kpis.reduce((s, k) => s + (k.sfoc || 0) * (k.prod || 0), 0) / tProd : 0
    const aSloc = tProd > 0 ? kpis.reduce((s, k) => s + (k.sloc || 0) * (k.prod || 0), 0) / tProd : 0

    return { tProd, tMw, aSfoc, aSloc }
  }, [activeSites])

  // HFO Projects panel
  const hfp = HFO_PROJECTS

  // Filtered projects list
  const filteredProjects = useMemo(() => {
    if (!projectFilter) return []
    if (projectFilter.type === 'cat') {
      return hfp.projects.filter(p => p.categorie === projectFilter.key.toLowerCase())
    }
    return hfp.projects.filter(p => p.site === projectFilter.key)
  }, [projectFilter, hfp])

  // Site detail panel
  const selectedSiteData = selectedSite ? siteData[selectedSite] : null

  // If a site is selected, show full site detail instead of the main view
  if (selectedSite && selectedSiteData) {
    return (
      <SiteDetailPanel
        siteId={selectedSite}
        siteData={siteData}
        currentFilter={currentFilter}
        setFilter={setFilter}
        onClose={() => setSelectedSite(null)}
        onNavigate={(id) => setSelectedSite(id)}
      />
    )
  }

  return (
    <div>
      {/* Title + Filter bar */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-bold tracking-wide uppercase" style={{ letterSpacing: '0.12em' }}>
          Consolide HFO
        </h2>
        <FilterBar current={currentFilter} onChange={setFilter} />
      </div>

      {/* Consolidated KPIs — 4 s1-card style boxes matching original renderConsolidated */}
      <div className="detail-s1-top grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
        <div className="s1-card">
          <div className="s1-card-label">Production totale</div>
          <div className="s1-card-value">{consolidated.tProd.toFixed(1)}</div>
          <div className="s1-card-unit-line">MWh</div>
        </div>
        <div className="s1-card">
          <div className="s1-card-label">Puissance installee</div>
          <div className="s1-card-value">{consolidated.tMw.toFixed(1)}</div>
          <div className="s1-card-unit-line">MW</div>
        </div>
        <div className="s1-card">
          <div className="s1-card-label">SFOC moyen</div>
          <div className="s1-card-value">{consolidated.aSfoc.toFixed(1)}</div>
          <div className="s1-card-unit-line">g/kWh</div>
        </div>
        <div className="s1-card">
          <div className="s1-card-label">SLOC moyen</div>
          <div className="s1-card-value">{consolidated.aSloc.toFixed(1)}</div>
          <div className="s1-card-unit-line">g/kWh</div>
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

        {/* Filter cards by site */}
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
    </div>
  )
}


/** Full site detail panel — replaces main view when a site is selected */
function SiteDetailPanel({ siteId, siteData, currentFilter, setFilter, onClose, onNavigate }) {
  const s = siteData[siteId]
  const k = getKpiForSite(s, currentFilter)

  const isConstruction = s.status === 'construction' || s.status === 'reconstruction'

  // Fuel stock data
  const fs = s.fuelStock || {}
  const hfoStock = fs.latestHfoStock
  const hfoAuto = fs.hfoAutonomyDays
  const hfoAutoColor = hfoAuto == null ? 'var(--text-dim)' : hfoAuto <= 3 ? 'var(--red)' : hfoAuto <= 10 ? '#f37056' : 'var(--energy)'

  // Station use
  const su = s.stationUse || {}
  const grossMwh = su.totalGrossMwh
  const netMwh = su.totalNetMwh
  const stUsePct = su.avgStationUsePct
  const stUseColor = stUsePct == null ? 'var(--text-dim)' : stUsePct <= 5 ? 'var(--energy)' : stUsePct <= 8 ? '#f37056' : 'var(--red)'

  // Solar
  const sol = s.solar || null
  const solarAvg = sol ? sol.avgDailyKwh : null
  const solarTotal = sol ? sol.totalKwh : null

  // Oil stock
  const oil = s.oilStock || {}
  const oilStock = oil.stock
  const oilAuto = oil.autonomy_days
  const oilAutoColor = oilAuto == null ? 'var(--text-dim)' : oilAuto <= 5 ? 'var(--red)' : oilAuto <= 15 ? '#f37056' : 'var(--energy)'

  // Blackouts
  const bs = s.blackoutStats || {}
  const boCount = bs.count || 0
  const boColor = boCount === 0 ? 'var(--energy)' : boCount <= 10 ? '#f37056' : 'var(--red)'

  return (
    <div className="site-detail-panel">
      {/* Header: back button + site name */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-white text-lg bg-transparent border-none cursor-pointer"
        >
          &#8592;
        </button>
        <h2 className="text-base font-bold uppercase tracking-wider">{s.name}</h2>
        <FilterBar current={currentFilter} onChange={setFilter} />
      </div>

      {/* Site navigation strip */}
      <div className="site-nav-strip">
        {NAVIGABLE_SITES.map(id => (
          <button
            key={id}
            className={`site-nav-btn ${id === siteId ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            {siteData[id].name}
          </button>
        ))}
      </div>

      {/* Banner for construction/reconstruction sites */}
      {isConstruction && (
        <div className="rounded-xl p-6 mb-6 text-center flex flex-col items-center gap-2"
          style={{
            background: s.status === 'reconstruction' ? 'rgba(243,112,86,0.1)' : 'rgba(0,171,99,0.1)',
            border: `1px solid ${s.status === 'reconstruction' ? 'rgba(243,112,86,0.25)' : 'rgba(0,171,99,0.25)'}`,
          }}>
          <span className="text-xl">{s.status === 'reconstruction' ? 'En reparation' : 'En construction'}</span>
          <span className="text-[13px] text-[var(--text-muted)]">
            Les donnees operationnelles seront disponibles des la remise en service.
          </span>
        </div>
      )}

      {!isConstruction && (
        <>
          {/* Section 1 — Donnees generales */}
          <div className="text-[9px] font-bold tracking-widest uppercase text-[var(--text-dim)] mb-2 mt-2">
            Donnees generales
          </div>
          <div className="detail-s1-top grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
            <div className="s1-card">
              <div className="s1-card-label">Contrat</div>
              <div className="s1-card-value">{s.contrat}</div>
              <div className="s1-card-unit-line">MW</div>
            </div>
            <div className="s1-card">
              <div className="s1-card-label">Production</div>
              <div className="s1-card-value">{k.prod != null ? parseFloat(k.prod).toFixed(1) : '—'}</div>
              <div className="s1-card-unit-line">MWh</div>
            </div>
            <div className="s1-card">
              <div className="s1-card-label">SFOC</div>
              <div className="s1-card-value" style={{ color: k.sfoc != null && k.sfoc <= 250 ? 'var(--energy)' : k.sfoc != null ? 'var(--red)' : 'var(--text)' }}>
                {k.sfoc != null ? parseFloat(k.sfoc).toFixed(1) : '—'}
              </div>
              <div className="s1-card-unit-line">g/kWh</div>
            </div>
            <div className="s1-card">
              <div className="s1-card-label">SLOC</div>
              <div className="s1-card-value" style={{ color: k.sloc != null && k.sloc <= 1.0 ? 'var(--energy)' : k.sloc != null ? 'var(--red)' : 'var(--text)' }}>
                {k.sloc != null ? parseFloat(k.sloc).toFixed(2) : '—'}
              </div>
              <div className="s1-card-unit-line">g/kWh</div>
            </div>
          </div>

          {/* Section 1b — KPIs operationnels */}
          <div className="text-[9px] font-bold tracking-widest uppercase text-[var(--text-dim)] mb-2">
            KPIs operationnels
          </div>
          <div className="detail-s1-top grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
            {/* Stock HFO */}
            <div className="s1-card">
              <div className="s1-card-label">Stock HFO</div>
              <div className="s1-card-value" style={{ color: hfoAutoColor }}>
                {hfoStock != null ? Math.round(hfoStock).toLocaleString() : '—'}
              </div>
              <div className="s1-card-unit-line">Litres</div>
              <div className="text-[10px] mt-1" style={{ color: hfoAutoColor }}>
                {hfoAuto != null ? `${hfoAuto.toFixed(1)} jours autonomie` : 'Donnees non dispo'}
              </div>
            </div>
            {/* Conso Station */}
            <div className="s1-card">
              <div className="s1-card-label">Conso Station</div>
              <div className="s1-card-value" style={{ color: stUseColor }}>
                {stUsePct != null ? stUsePct.toFixed(1) : '—'}
              </div>
              <div className="s1-card-unit-line">% auxiliaires</div>
              <div className="text-[9px] text-[var(--text-muted)] mt-1">
                {grossMwh != null ? `Brut ${Math.round(grossMwh).toLocaleString()} / Net ${Math.round(netMwh).toLocaleString()} MWh` : ''}
              </div>
            </div>
            {/* Solaire (conditionally shown) */}
            {sol && (
              <div className="s1-card">
                <div className="s1-card-label">Solaire</div>
                <div className="s1-card-value" style={{ color: 'var(--energy)' }}>
                  {solarAvg != null ? Math.round(solarAvg).toLocaleString() : '—'}
                </div>
                <div className="s1-card-unit-line">kWh/jour moy.</div>
                <div className="text-[9px] text-[var(--text-muted)] mt-1">
                  {solarTotal != null ? `Total ${Math.round(solarTotal).toLocaleString()} kWh` : ''}
                </div>
              </div>
            )}
            {/* Stock Huile */}
            <div className="s1-card">
              <div className="s1-card-label">Stock Huile</div>
              <div className="s1-card-value" style={{ color: oilAutoColor }}>
                {oilStock != null ? Math.round(oilStock).toLocaleString() : '—'}
              </div>
              <div className="s1-card-unit-line">Litres</div>
              <div className="text-[10px] mt-1" style={{ color: oilAutoColor }}>
                {oilAuto != null ? `${oilAuto.toFixed(1)} jours autonomie` : ''}
              </div>
            </div>
          </div>

          {/* Section 2 — Generateurs */}
          {s.groupes && s.groupes.length > 0 && (
            <>
              <div className="text-[9px] font-bold tracking-widest uppercase text-[var(--text-dim)] mb-3">
                Generateurs ({s.groupes.length})
              </div>
              <div className="gen-cards-row">
                {s.groupes.map(g => {
                  const isContra = g.contradictory === true
                  const dotColor = isContra ? '#7b5fbf' : g.statut === 'ok' ? 'var(--energy)' : g.statut === 'warn' ? '#f0a030' : 'var(--red)'
                  const statusLabel = isContra ? 'A verifier' : g.statut === 'ok' ? 'En marche' : g.statut === 'warn' ? 'Maintenance' : 'Arret'
                  const daysLabel = (g.jourArret > 0 && !isContra) ? ` · ${g.jourArret}j` : ''

                  // SFOC per generator
                  const gSfoc = calcGenSfoc(g)
                  const sfocStr = gSfoc != null ? gSfoc.toFixed(0) : '—'
                  const sfocColor = gSfoc != null ? (gSfoc <= 250 ? 'var(--energy)' : 'var(--red)') : 'var(--text-dim)'

                  // SLOC
                  const gSlocVal = g.sloc != null ? parseFloat(g.sloc).toFixed(2) : '—'

                  // Border color
                  const borderColor = isContra ? 'rgba(160,90,255,0.3)'
                    : g.statut === 'ok' ? 'rgba(0,171,99,0.2)'
                    : g.statut === 'warn' ? 'rgba(240,160,48,0.2)'
                    : 'rgba(243,112,86,0.2)'

                  const mw = parseFloat(g.mw).toFixed(1)

                  return (
                    <div key={g.id} className="gen-card-wrapper">
                      {/* Generator ID with status dot */}
                      <div className="gen-card-title" style={{ color: isContra ? '#7b5fbf' : 'var(--text)' }}>
                        <span
                          className="gen-status-dot"
                          style={{
                            backgroundColor: dotColor,
                            boxShadow: `0 0 4px ${dotColor}, 0 0 8px ${dotColor}`,
                          }}
                        />
                        {fmtGId(g.id)}
                      </div>
                      {/* Card body */}
                      <div
                        className="s1-card gen-card-body"
                        style={{ borderColor, cursor: 'pointer' }}
                      >
                        <div className="text-[7px] uppercase tracking-[0.15em] text-[var(--text-dim)] mb-1">Puissance</div>
                        <div className="text-[16px] font-bold text-[var(--text)] leading-none">
                          {mw}<span className="text-[9px] text-[var(--text-muted)] font-normal ml-0.5">MW</span>
                        </div>
                        <div className="text-[8px] font-bold mt-1.5" style={{ color: dotColor }}>
                          {statusLabel}{daysLabel}
                        </div>
                        <div className="flex justify-center gap-2 mt-1.5">
                          <div className="text-center">
                            <div className="text-[7px] uppercase tracking-[0.1em] text-[var(--text-dim)]">SFOC</div>
                            <div className="text-[12px] font-bold" style={{ color: sfocColor }}>{sfocStr}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[7px] uppercase tracking-[0.1em] text-[var(--text-dim)]">SLOC</div>
                            <div className="text-[12px] font-bold text-[var(--text)]">{gSlocVal}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Section 3 — Blackouts */}
          <div className="text-[9px] font-bold tracking-widest uppercase text-[var(--text-dim)] mb-2 mt-6">
            Blackouts
          </div>
          <div className="s1-card mb-6" style={{ maxWidth: 200 }}>
            <div className="s1-card-label">Coupures</div>
            <div className="s1-card-value" style={{ color: boColor }}>{boCount}</div>
            <div className="s1-card-unit-line">blackouts</div>
          </div>

          {/* Section 4 — Fuel Stock detail */}
          <div className="text-[9px] font-bold tracking-widest uppercase text-[var(--text-dim)] mb-2">
            Stock Fuel
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-6">
            <div className="s1-card">
              <div className="s1-card-label">HFO</div>
              <div className="s1-card-value" style={{ color: hfoAutoColor }}>
                {hfoStock != null ? Math.round(hfoStock).toLocaleString() : '—'}
              </div>
              <div className="s1-card-unit-line">Litres</div>
            </div>
            {fs.latestLfoStock != null && (
              <div className="s1-card">
                <div className="s1-card-label">LFO</div>
                <div className="s1-card-value">{Math.round(fs.latestLfoStock).toLocaleString()}</div>
                <div className="s1-card-unit-line">Litres</div>
              </div>
            )}
            <div className="s1-card">
              <div className="s1-card-label">Autonomie HFO</div>
              <div className="s1-card-value" style={{ color: hfoAutoColor }}>
                {hfoAuto != null ? hfoAuto.toFixed(1) : '—'}
              </div>
              <div className="s1-card-unit-line">jours</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
