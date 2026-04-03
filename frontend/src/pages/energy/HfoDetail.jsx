import { useState, useMemo, useEffect } from 'react'
import { useFilters } from '../../hooks/useFilters'
import { usePageTitle } from '../../context/PageTitleContext'
import HfoSite from './HfoSite'
import { TAMATAVE_LIVE, DIEGO_LIVE, MAJUNGA_LIVE, TULEAR_LIVE } from '../../data/site_data'
import { HFO_PROJECTS } from '../../data/hfo_projects'
import { HFO_STATUS_LABELS, HFO_STATUS_COLORS, formatDateFR, MONTH_SHORT } from '../../utils/projects'

function mapFilter(f) {
  return { 'J-1': '24h', 'M': 'month', 'Q': 'quarter', 'A': 'year' }[f] || 'month'
}

function isCurrentMonth(monthIndex) {
  return monthIndex === new Date().getMonth()
}

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

/** Get KPI for a given filter + selected period */
function getKpiForSite(site, filter, selectedMonthIndex, selectedQuarter) {
  if (!site || !site.kpi) return {}
  if (filter === 'J-1') return site.kpi['24h'] || {}
  if (filter === 'A') return site.kpi['year'] || {}
  if (filter === 'M') {
    const monthKey = `month_${selectedMonthIndex + 1}`
    return site.kpi[monthKey] || site.kpi['month'] || {}
  }
  if (filter === 'Q') {
    const startM = (selectedQuarter - 1) * 3
    let prod = 0, prodObj = 0, heures = 0, sfocW = 0, slocW = 0
    for (let m = startM; m < startM + 3; m++) {
      const mk = `month_${m + 1}`
      const k = site.kpi[mk] || {}
      prod += k.prod || 0
      prodObj += k.prodObj || 0
      heures += k.heures || 0
      if (k.sfoc && k.prod) sfocW += k.sfoc * k.prod
      if (k.sloc && k.prod) slocW += k.sloc * k.prod
    }
    return {
      prod, prodObj, heures,
      dispo: prodObj > 0 ? (prod / prodObj * 100) : 0,
      sfoc: prod > 0 ? sfocW / prod : 0,
      sloc: prod > 0 ? slocW / prod : 0,
    }
  }
  return site.kpi['month'] || {}
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
  const { currentFilter, setFilter, selectedMonthIndex, selectedQuarter, selectedYear } = useFilters()
  const { setPageTitle } = usePageTitle()
  const [selectedSite, setSelectedSite] = useState(null)
  const [projectFilter, setProjectFilter] = useState(null) // { type: 'site'|'cat', key: string }

  // Update banner title based on current view
  useEffect(() => {
    if (selectedSite) {
      setPageTitle(selectedSite.charAt(0).toUpperCase() + selectedSite.slice(1))
    } else {
      setPageTitle(null) // fallback to default "HFO"
    }
    return () => setPageTitle(null)
  }, [selectedSite, setPageTitle])

  const siteData = useMemo(() => buildSiteData(), [])

  // Compute total production across active sites for share calculation
  const { totalProdAll, activeSites } = useMemo(() => {
    let total = 0
    const active = []
    SITE_ORDER.forEach(id => {
      const s = siteData[id]
      if (s.status === 'construction' || s.status === 'reconstruction') return
      const k = getKpiForSite(s, currentFilter, selectedMonthIndex, selectedQuarter)
      total += (k && k.prod) || 0
      active.push({ id, site: s, kpi: k })
    })
    return { totalProdAll: total, activeSites: active }
  }, [siteData, currentFilter, selectedMonthIndex, selectedQuarter])

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
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base tracking-wide uppercase" style={{ letterSpacing: '0.12em' }}>
          Consolide HFO
        </h2>
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
          const kpi = getKpiForSite(site, currentFilter, selectedMonthIndex, selectedQuarter)
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

      {/* Projects removed — they are now in /energy/hfo-projets */}
    </div>
  )
}


/** Full site detail panel — replaces main view when a site is selected */
function SiteDetailPanel({ siteId, siteData, currentFilter, setFilter, onClose, onNavigate }) {
  const { selectedMonthIndex, selectedQuarter, selectedYear } = useFilters()
  const { setPageTitle } = usePageTitle()
  const [selectedGenerator, setSelectedGenerator] = useState(null)
  const s = siteData[siteId]

  // Update banner when generator is selected
  useEffect(() => {
    if (selectedGenerator) {
      const siteName = siteId.charAt(0).toUpperCase() + siteId.slice(1)
      setPageTitle(`${siteName} — ${selectedGenerator}`)
    } else {
      const siteName = siteId.charAt(0).toUpperCase() + siteId.slice(1)
      setPageTitle(siteName)
    }
  }, [selectedGenerator, siteId, setPageTitle])
  const k = getKpiForSite(s, currentFilter, selectedMonthIndex, selectedQuarter)

  // If a generator is selected, show its detail panel
  const selGen = selectedGenerator ? s.groupes?.find(g => g.id === selectedGenerator) : null
  if (selGen) {
    return (
      <GeneratorDetailPanel
        siteId={siteId}
        siteData={siteData}
        generator={selGen}
        currentFilter={currentFilter}
        setFilter={setFilter}
        selectedMonthIndex={selectedMonthIndex}
        selectedQuarter={selectedQuarter}
        selectedYear={selectedYear}
        onClose={() => setSelectedGenerator(null)}
        onNavigateGen={(gId) => setSelectedGenerator(gId)}
      />
    )
  }

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
          className="text-[var(--text-muted)] hover:text-[var(--text)] text-lg bg-transparent border-none cursor-pointer"
        >
          &#8592;
        </button>
        <h2 className="text-base uppercase tracking-wider">{s.name}</h2>
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
          <div className="text-[9px] tracking-widest uppercase text-[var(--text-dim)] mb-2 mt-2">
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
          <div className="text-[9px] tracking-widest uppercase text-[var(--text-dim)] mb-2">
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
              <div className="text-[9px] tracking-widest uppercase text-[var(--text-dim)] mb-3">
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
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedGenerator(g.id)}
                      >
                        <div className="text-[7px] uppercase tracking-[0.15em] text-[var(--text-dim)] mb-1">Puissance</div>
                        <div className="text-[16px] text-[var(--text)] leading-none">
                          {mw}<span className="text-[9px] text-[var(--text-muted)] font-normal ml-0.5">MW</span>
                        </div>
                        <div className="text-[8px] mt-1.5" style={{ color: dotColor }}>
                          {statusLabel}{daysLabel}
                        </div>
                        <div className="flex justify-center gap-2 mt-1.5">
                          <div className="text-center">
                            <div className="text-[7px] uppercase tracking-[0.1em] text-[var(--text-dim)]">SFOC</div>
                            <div className="text-[12px]" style={{ color: sfocColor }}>{sfocStr}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[7px] uppercase tracking-[0.1em] text-[var(--text-dim)]">SLOC</div>
                            <div className="text-[12px] text-[var(--text)]">{gSlocVal}</div>
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
          <div className="text-[9px] tracking-widest uppercase text-[var(--text-dim)] mb-2 mt-6">
            Blackouts
          </div>
          <div className="s1-card mb-6" style={{ maxWidth: 200 }}>
            <div className="s1-card-label">Coupures</div>
            <div className="s1-card-value" style={{ color: boColor }}>{boCount}</div>
            <div className="s1-card-unit-line">blackouts</div>
          </div>

          {/* Section 4 — Fuel Stock detail */}
          <div className="text-[9px] tracking-widest uppercase text-[var(--text-dim)] mb-2">
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


/** Generator detail panel — shows full detail for a single generator */
function GeneratorDetailPanel({
  siteId, siteData, generator: g, currentFilter, setFilter,
  selectedMonthIndex, selectedQuarter, selectedYear,
  onClose, onNavigateGen,
}) {
  const s = siteData[siteId]
  const f = mapFilter(currentFilter)

  const isContra = g.contradictory === true
  const isKO = g.statut === 'ko' && !isContra

  // Status mapping — matches original exactly
  const statMap = {
    ok:    { label: 'En marche',    bg: 'rgba(0,171,99,0.12)',    color: 'var(--text)' },
    warn:  { label: 'Maintenance',  bg: 'rgba(245,166,35,0.12)',  color: 'var(--text)' },
    ko:    { label: 'Hors service', bg: 'rgba(224,92,92,0.12)',   color: 'var(--text)' },
    check: { label: 'A verifier — Donnees contradictoires', bg: 'rgba(160,90,255,0.12)', color: 'var(--text)' },
  }
  const st = isContra ? statMap.check : (statMap[g.statut] || statMap.ko)

  // Card border/label/bg colors
  const bc = undefined
  const lc = isContra ? 'rgba(160,90,255,0.65)' : isKO ? 'rgba(224,92,92,0.65)' : 'rgba(138,146,171,0.65)'
  const bg = undefined

  // ── Section 1 — Heures de marche (filter-aware, matches original thresholds) ──
  let s1_hVal, s1_hUnit = 'h', s1_sbSub, s1_hColor, s1_afVal, s1_afSub, s1_apVal, s1_apSub, s1_hLabel

  if (f === '24h') {
    s1_hLabel = 'Marche J-1'
    s1_hVal = parseFloat(g.hToday || 0).toFixed(1)
    s1_sbSub = 'Standby : ' + parseFloat(g.hStandby || 0).toFixed(1) + ' h'
    s1_hColor = parseFloat(g.hToday) > 12 ? 'var(--energy)' : parseFloat(g.hToday) > 0 ? 'var(--orange)' : 'var(--red)'
    s1_afVal = parseFloat(g.arretForce || 0).toFixed(1); s1_afSub = 'Dernieres 24h'
    s1_apVal = parseFloat(g.arretPlanifie || 0).toFixed(1); s1_apSub = 'Dernieres 24h'
  } else if (f === 'month') {
    const _cm = isCurrentMonth(selectedMonthIndex)
    const mLabel = _cm ? 'ce mois' : MONTH_SHORT[selectedMonthIndex]
    s1_hLabel = 'Marche ' + mLabel
    let totalH, totalSb, totalAf, totalAp, jours
    if (_cm) {
      const dh = g.dailyHours || []; totalH = dh.reduce((a, b) => a + b, 0)
      const ds = g.dailyStandby || []; totalSb = ds.reduce((a, b) => a + b, 0)
      const daf = g.dailyArretForce || []; totalAf = daf.reduce((a, b) => a + b, 0)
      const dap = g.dailyArretPlanifie || []; totalAp = dap.reduce((a, b) => a + b, 0)
      jours = dh.filter(v => v > 0).length
    } else {
      const mi = selectedMonthIndex
      totalH = (g.monthlyHours || [])[mi] || 0
      totalSb = (g.monthlyStandby || [])[mi] || 0
      totalAf = (g.monthlyArretForce || [])[mi] || 0
      totalAp = (g.monthlyArretPlanifie || [])[mi] || 0
      jours = totalH > 0 ? Math.round(totalH / 24) : 0
    }
    s1_hVal = totalH.toFixed(1)
    s1_sbSub = jours + ' jours en marche · Standby : ' + totalSb.toFixed(1) + ' h'
    s1_hColor = jours > 20 ? 'var(--energy)' : jours > 0 ? 'var(--orange)' : 'var(--red)'
    s1_afVal = totalAf.toFixed(1); s1_afSub = 'Total arrets forces ' + mLabel
    s1_apVal = totalAp.toFixed(1); s1_apSub = 'Maintenance preventive ' + mLabel
  } else if (f === 'quarter') {
    s1_hLabel = 'Marche Q' + selectedQuarter
    const startM = (selectedQuarter - 1) * 3
    const mh = g.monthlyHours || []
    let totalH = 0, totalAf = 0, totalAp = 0
    for (let mi = startM; mi < startM + 3 && mi < mh.length; mi++) {
      totalH += mh[mi] || 0
      totalAf += (g.monthlyArretForce || [])[mi] || 0
      totalAp += (g.monthlyArretPlanifie || [])[mi] || 0
    }
    const jours = totalH > 0 ? Math.round(totalH / 24) : 0
    s1_hVal = totalH.toFixed(1)
    s1_sbSub = jours + ' jours en marche'
    s1_hColor = jours > 60 ? 'var(--energy)' : jours > 0 ? 'var(--orange)' : 'var(--red)'
    s1_afVal = totalAf.toFixed(1); s1_afSub = 'Total arrets forces Q' + selectedQuarter
    s1_apVal = totalAp.toFixed(1); s1_apSub = 'Maintenance preventive Q' + selectedQuarter
  } else {
    // year
    s1_hLabel = 'Marche ' + selectedYear
    const mh = g.monthlyHours || []; const totalH = mh.reduce((a, b) => a + b, 0)
    const moisActifs = mh.filter(v => v > 0).length
    s1_hVal = totalH.toFixed(1)
    s1_sbSub = moisActifs + ' mois en marche sur 12'
    s1_hColor = moisActifs > 6 ? 'var(--energy)' : moisActifs > 0 ? 'var(--orange)' : 'var(--red)'
    s1_afVal = parseFloat(g.arretForce || 0).toFixed(1); s1_afSub = 'Non planifie (dernieres 24h)'
    s1_apVal = parseFloat(g.arretPlanifie || 0).toFixed(1); s1_apSub = 'Maintenance preventive (dernieres 24h)'
  }

  const kpiRow1 = [
    { label: 'Heures cumulees', value: g.h > 0 ? parseFloat(g.h).toFixed(1) : '0', unit: 'h', sub: 'Total depuis mise en service', color: null },
    { label: s1_hLabel, value: s1_hVal, unit: s1_hUnit, sub: s1_sbSub, color: s1_hColor },
    { label: 'Arret force', value: s1_afVal, unit: 'h', sub: s1_afSub, color: parseFloat(s1_afVal) > 0 ? 'var(--red)' : null },
    { label: 'Arret planifie', value: s1_apVal, unit: 'h', sub: s1_apSub, color: parseFloat(s1_apVal) > 0 ? 'var(--orange)' : null },
  ]

  // ── Section 2 — Production & Energie (chart + KPIs, fully filter-aware) ──

  // Chart data — filter-aware
  let chartData, chartLabels, chartTitle, chartUnit
  if (f === '24h') {
    chartData = g.hourlyLoad || Array(24).fill(0)
    chartLabels = chartData.map((_, i) => i + 'h')
    chartTitle = 'Charge horaire — J-1'
    chartUnit = 'kW'
  } else if (f === 'month') {
    const _cmChart = isCurrentMonth(selectedMonthIndex)
    if (_cmChart) {
      const raw = g.dailyProd || Array(31).fill(0)
      let lastDay = raw.length
      while (lastDay > 0 && raw[lastDay - 1] === 0) lastDay--
      if (lastDay === 0) lastDay = new Date().getDate()
      chartData = raw.slice(0, Math.max(lastDay, 1))
      chartLabels = chartData.map((_, i) => String(i + 1))
    } else {
      const monthTotal = (g.monthlyProd || [])[selectedMonthIndex] || 0
      chartData = [monthTotal]
      chartLabels = [MONTH_SHORT[selectedMonthIndex]]
    }
    const mName = _cmChart ? 'Ce mois' : MONTH_SHORT[selectedMonthIndex]
    chartTitle = 'Production journaliere — ' + mName
    chartUnit = 'kWh'
  } else if (f === 'quarter') {
    const startMC = (selectedQuarter - 1) * 3
    const qMonths = (g.monthlyProd || Array(12).fill(0)).slice(startMC, startMC + 3)
    chartData = qMonths
    chartLabels = [MONTH_SHORT[startMC], MONTH_SHORT[startMC + 1], MONTH_SHORT[startMC + 2]]
    chartTitle = 'Production mensuelle — Q' + selectedQuarter
    chartUnit = 'kWh'
  } else {
    chartData = g.monthlyProd || Array(12).fill(0)
    chartLabels = ['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec']
    chartTitle = 'Production mensuelle — ' + selectedYear
    chartUnit = 'kWh'
  }

  const barCount = chartData.length
  const maxChartVal = Math.max(...chartData, 1)
  const totalChartVal = chartData.reduce((a, b) => a + b, 0)

  // SVG bar chart dimensions
  const W = 960, H = 120, PAD_L = 48, PAD_R = 10, PAD_T = 10, PAD_B = 28
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B
  const barGap = Math.floor(chartW / barCount)
  const barW = Math.max(2, barGap - (barCount > 24 ? 1 : 2))
  const labelFreq = barCount <= 12 ? 1 : barCount <= 24 ? 4 : 5

  const prodColor = isKO ? 'var(--red)' : 'var(--energy)'
  const peakVal = Math.max(...chartData)
  const peakFmt = peakVal >= 1000 ? (peakVal / 1000).toFixed(1) + ' MWh' : peakVal.toFixed(1) + ' ' + chartUnit
  const totalFmt = totalChartVal >= 1000 ? (totalChartVal / 1000).toFixed(1) + ' MWh' : totalChartVal.toFixed(1) + ' ' + chartUnit

  // Production KPIs — fully filter-aware (matches original: energie, charge max, conso LV/MV, heures)
  let prodVal, prodUnit, prodSub, hVal, hUnit2, hSub, hColor
  let loadVal, loadUnit, loadSub, lvmvVal, lvmvUnit, lvmvSub

  if (f === '24h') {
    const dProd = g.energieProd || 0
    prodVal = dProd > 1000 ? (dProd / 1000).toFixed(1) : dProd.toFixed(1)
    prodUnit = dProd > 1000 ? 'MWh' : 'kWh'; prodSub = 'Production J-1'
    hVal = parseFloat(g.hToday || 0).toFixed(1); hUnit2 = 'h'; hSub = 'Heures de marche J-1'
    hColor = parseFloat(g.hToday) > 12 ? 'var(--energy)' : parseFloat(g.hToday) > 0 ? 'var(--orange)' : 'var(--red)'
    loadVal = parseFloat(g.maxLoad || 0).toFixed(1); loadUnit = 'kW'; loadSub = 'Pic de charge J-1'
    lvmvVal = parseFloat(g.consLVMV || 0) > 0 ? parseFloat(g.consLVMV).toFixed(1) : '—'
    lvmvUnit = parseFloat(g.consLVMV || 0) > 0 ? 'kWh' : ''; lvmvSub = 'Services auxiliaires J-1'
  } else if (f === 'month') {
    const _cm2 = isCurrentMonth(selectedMonthIndex)
    const _mLbl = _cm2 ? 'ce mois' : MONTH_SHORT[selectedMonthIndex]
    let mProd, jours
    if (_cm2) {
      const dp = g.dailyProd || []; mProd = dp.reduce((a, b) => a + b, 0)
      jours = dp.filter(v => v > 0).length
    } else {
      mProd = (g.monthlyProd || [])[selectedMonthIndex] || 0
      jours = mProd > 0 ? Math.ceil((g.monthlyHours || [])[selectedMonthIndex] / 24) || 0 : 0
    }
    prodVal = mProd > 1000 ? (mProd / 1000).toFixed(1) : mProd.toFixed(1)
    prodUnit = mProd > 1000 ? 'MWh' : 'kWh'; prodSub = 'Production ' + _mLbl
    hVal = jours; hUnit2 = 'jours'; hSub = 'Jours de production'
    hColor = jours > 20 ? 'var(--energy)' : jours > 0 ? 'var(--orange)' : 'var(--red)'
    let mxLoad
    if (_cm2) { const dml = g.dailyMaxLoad || []; mxLoad = Math.max(...dml, 0) }
    else { mxLoad = (g.monthlyMaxLoad || [])[selectedMonthIndex] || 0 }
    loadVal = mxLoad.toFixed(1); loadUnit = 'kW'; loadSub = 'Pic de charge ' + _mLbl
    let mLvmv
    if (_cm2) { const dlv = g.dailyConsLVMV || []; mLvmv = dlv.reduce((a, b) => a + b, 0) }
    else { mLvmv = (g.monthlyConsLVMV || [])[selectedMonthIndex] || 0 }
    lvmvVal = mLvmv > 0 ? mLvmv.toFixed(1) : '—'; lvmvUnit = mLvmv > 0 ? 'kWh' : ''; lvmvSub = 'Services auxiliaires ' + _mLbl
  } else if (f === 'quarter') {
    const startM = (selectedQuarter - 1) * 3
    let qProd = 0, qJours = 0, qMaxLoad = 0, qLvmv = 0
    for (let mi = startM; mi < startM + 3; mi++) {
      qProd += (g.monthlyProd || [])[mi] || 0
      qJours += ((g.monthlyHours || [])[mi] || 0) > 0 ? Math.ceil((g.monthlyHours || [])[mi] / 24) : 0
      const ml = (g.monthlyMaxLoad || [])[mi] || 0; if (ml > qMaxLoad) qMaxLoad = ml
      qLvmv += (g.monthlyConsLVMV || [])[mi] || 0
    }
    const qLbl = 'Q' + selectedQuarter
    prodVal = qProd > 1000 ? (qProd / 1000).toFixed(1) : qProd.toFixed(1)
    prodUnit = qProd > 1000 ? 'MWh' : 'kWh'; prodSub = 'Production ' + qLbl
    hVal = qJours; hUnit2 = 'jours'; hSub = 'Jours de production'
    hColor = qJours > 60 ? 'var(--energy)' : qJours > 0 ? 'var(--orange)' : 'var(--red)'
    loadVal = qMaxLoad.toFixed(1); loadUnit = 'kW'; loadSub = 'Pic de charge ' + qLbl
    lvmvVal = qLvmv > 0 ? qLvmv.toFixed(1) : '—'; lvmvUnit = qLvmv > 0 ? 'kWh' : ''; lvmvSub = 'Services auxiliaires ' + qLbl
  } else {
    const mp = g.monthlyProd || []; const yProd = mp.reduce((a, b) => a + b, 0)
    const mois = mp.filter(v => v > 0).length
    prodVal = yProd > 1000 ? (yProd / 1000).toFixed(1) : yProd.toFixed(1)
    prodUnit = yProd > 1000 ? 'MWh' : 'kWh'; prodSub = 'Production ' + selectedYear
    hVal = mois; hUnit2 = 'mois'; hSub = 'Mois de production sur 12'
    hColor = mois > 6 ? 'var(--energy)' : mois > 0 ? 'var(--orange)' : 'var(--red)'
    const yml = g.monthlyMaxLoad || []; const mxLoad = Math.max(...yml, 0)
    loadVal = mxLoad.toFixed(1); loadUnit = 'kW'; loadSub = 'Pic de charge ' + selectedYear
    const ylv = g.monthlyConsLVMV || []; const yLvmv = ylv.reduce((a, b) => a + b, 0)
    lvmvVal = yLvmv > 0 ? yLvmv.toFixed(1) : '—'; lvmvUnit = yLvmv > 0 ? 'kWh' : ''; lvmvSub = 'Services auxiliaires ' + selectedYear
  }

  const prodRow = [
    { label: 'Energie produite', value: prodVal, unit: prodUnit, sub: prodSub, color: isKO ? 'var(--red)' : null },
    { label: 'Charge max', value: loadVal, unit: loadUnit, sub: loadSub, color: isKO ? 'var(--red)' : null },
    { label: 'Conso LV/MV', value: lvmvVal, unit: lvmvUnit, sub: lvmvSub, color: null },
    { label: 'Heures de marche', value: hVal, unit: hUnit2, sub: hSub, color: hColor },
  ]

  // ── Section 3 — Combustible (filter-aware) ──
  let fHFO, fLFO, fuelPeriod
  if (f === '24h') {
    fHFO = g.consoHFO || 0
    fLFO = g.consoLFO || 0
    fuelPeriod = 'J-1'
  } else if (f === 'month') {
    const _cm4 = isCurrentMonth(selectedMonthIndex)
    if (_cm4) {
      const dhfo = g.dailyHFO || []; fHFO = dhfo.reduce((a, b) => a + b, 0)
      const dlfo = g.dailyLFO || []; fLFO = dlfo.reduce((a, b) => a + b, 0)
    } else {
      fHFO = (g.monthlyHFO || [])[selectedMonthIndex] || 0
      fLFO = (g.monthlyLFO || [])[selectedMonthIndex] || 0
    }
    fuelPeriod = _cm4 ? 'ce mois' : MONTH_SHORT[selectedMonthIndex]
  } else if (f === 'quarter') {
    const startM = (selectedQuarter - 1) * 3; fHFO = 0; fLFO = 0
    for (let mi = startM; mi < startM + 3; mi++) {
      fHFO += (g.monthlyHFO || [])[mi] || 0
      fLFO += (g.monthlyLFO || [])[mi] || 0
    }
    fuelPeriod = 'Q' + selectedQuarter
  } else {
    const mhfo = g.monthlyHFO || []; fHFO = mhfo.reduce((a, b) => a + b, 0)
    const mlfo = g.monthlyLFO || []; fLFO = mlfo.reduce((a, b) => a + b, 0)
    fuelPeriod = String(selectedYear)
  }

  const fuelMetrics = [
    { label: 'Conso HFO', icon: '\u{1F6E2}\uFE0F', value: fHFO > 0 ? parseFloat(fHFO).toFixed(1) : '\u2014', unit: fHFO > 0 ? 'L' : '', sub: 'Heavy Fuel Oil \u00B7 ' + fuelPeriod },
    { label: 'Conso LFO', icon: '\u26FD', value: fLFO > 0 ? parseFloat(fLFO).toFixed(1) : '0', unit: 'L', sub: 'Light Fuel Oil \u00B7 ' + fuelPeriod },
    { label: 'Temp. Fuel', icon: '\u{1F321}\uFE0F', value: g.fuelOilTemp > 0 ? parseFloat(g.fuelOilTemp).toFixed(1) : '\u2014', unit: g.fuelOilTemp > 0 ? '\u00B0C' : '', sub: 'Temperature fuel oil',
      color: g.fuelOilTemp > 100 ? 'var(--red)' : g.fuelOilTemp > 90 ? 'var(--orange)' : (g.fuelOilTemp > 0 ? 'var(--energy)' : null) },
  ]

  // ── Section 4 — Huile moteur (filter-aware) ──
  let fOilC, fOilT, oilPeriod
  if (f === '24h') {
    fOilC = g.oilConso || 0
    fOilT = g.oilTopUp || 0
    oilPeriod = 'J-1'
  } else if (f === 'month') {
    const _cm5 = isCurrentMonth(selectedMonthIndex)
    if (_cm5) {
      const doc = g.dailyOilConso || []; fOilC = doc.reduce((a, b) => a + b, 0)
      const dot = g.dailyOilTopUp || []; fOilT = dot.reduce((a, b) => a + b, 0)
    } else {
      fOilC = (g.monthlyOilConso || [])[selectedMonthIndex] || 0
      fOilT = (g.monthlyOilTopUp || [])[selectedMonthIndex] || 0
    }
    oilPeriod = _cm5 ? 'ce mois' : MONTH_SHORT[selectedMonthIndex]
  } else if (f === 'quarter') {
    const startM = (selectedQuarter - 1) * 3; fOilC = 0; fOilT = 0
    for (let mi = startM; mi < startM + 3; mi++) {
      fOilC += (g.monthlyOilConso || [])[mi] || 0
      fOilT += (g.monthlyOilTopUp || [])[mi] || 0
    }
    oilPeriod = 'Q' + selectedQuarter
  } else {
    const moc = g.monthlyOilConso || []; fOilC = moc.reduce((a, b) => a + b, 0)
    const mot = g.monthlyOilTopUp || []; fOilT = mot.reduce((a, b) => a + b, 0)
    oilPeriod = String(selectedYear)
  }

  const slocVal = g.sloc != null ? parseFloat(g.sloc).toFixed(2) : '\u2014'
  const slocColor = g.sloc != null ? (parseFloat(g.sloc) <= 1.0 ? 'var(--energy)' : 'var(--red)') : null
  const oilStock = s.oilStock ? s.oilStock.stock : null

  const oilMetrics = [
    { label: 'Conso huile', icon: '\u{1F6E2}\uFE0F', value: fOilC > 0 ? fOilC.toFixed(1) : '\u2014', unit: fOilC > 0 ? 'L' : '', sub: 'Conso \u00B7 ' + oilPeriod },
    { label: 'Top-up huile', icon: '\u2795', value: fOilT > 0 ? parseFloat(fOilT).toFixed(1) : '0', unit: 'L', sub: 'Top-up \u00B7 ' + oilPeriod,
      color: fOilT > 50 ? 'var(--orange)' : null },
    { label: 'SLOC', icon: '\u{1F4CA}', value: slocVal, unit: 'g/kWh', sub: 'Specific Lube Oil Consumption',
      color: slocColor },
    { label: 'Stock huile', icon: '\u{1F4E6}', value: oilStock != null ? parseFloat(oilStock).toFixed(0) : '\u2014', unit: oilStock != null ? 'L' : '', sub: 'Stock site ' + s.name },
  ]

  return (
    <div className="site-detail-panel gd-panel">
      {/* Header: back + generator title */}
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text)] text-lg bg-transparent border-none cursor-pointer"
        >
          &#8592;
        </button>
        <div>
          <h2 className="text-base uppercase tracking-wider m-0">{fmtGId(g.id)}</h2>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {g.model || ''} &middot; {s.name} &middot; {g.mw} MW
          </div>
        </div>
      </div>

      {/* Generator nav strip */}
      <div className="gd-gen-nav">
        {s.groupes.map(gr => {
          const dotColor = gr.contradictory ? '#7b5fbf' : gr.statut === 'ok' ? 'var(--energy)' : gr.statut === 'warn' ? '#f0a030' : 'var(--red)'
          const active = gr.id === g.id
          return (
            <button
              key={gr.id}
              className={`gd-gen-nav-btn ${active ? 'active' : ''}`}
              onClick={() => onNavigateGen(gr.id)}
            >
              <span
                className="gen-status-dot"
                style={{
                  backgroundColor: dotColor,
                  boxShadow: `0 0 4px ${dotColor}, 0 0 8px ${dotColor}`,
                }}
              />
              {fmtGId(gr.id)}
            </button>
          )
        })}
      </div>

      {/* Status badge */}
      <div className="mb-4">
        <span
          className="gd-status-badge"
          style={{
            background: st.bg,
            color: st.color,
            border: `1px solid ${st.color}44`,
          }}
        >
          <span
            className="gen-status-dot"
            style={{
              backgroundColor: st.color,
              width: 8, height: 8, minWidth: 8,
              boxShadow: `0 0 4px ${st.color}`,
            }}
          />
          {st.label}
        </span>
      </div>

      {/* Arret banner (if KO) */}
      {isKO && (
        <div className="gd-arret-banner">
          <div className="gd-arret-days">
            {g.jourArret || '—'}
            <span style={{ fontSize: 20, fontWeight: 400, marginLeft: 4, color: 'var(--text-dim)' }}>j</span>
          </div>
          <div>
            <div className="gd-arret-label">Arret en cours</div>
            <div className="gd-arret-condition">
              {g.condition === 'Maintenance' ? 'Maintenance planifiee' : 'Panne / Breakdown'}
            </div>
            <div className="gd-arret-reason">{g.maint}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 8, fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 4 }}>
              Arret force
            </div>
            <div style={{ fontSize: 22, fontWeight: 400, color: '#e05c5c' }}>
              {parseFloat(g.arretForce || 0).toFixed(1)}
              <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-dim)', marginLeft: 3 }}>h</span>
            </div>
            <div style={{ fontSize: 8, color: 'var(--text-dim)', marginTop: 6 }}>
              Arret planifie : {parseFloat(g.arretPlanifie || 0).toFixed(1)} h
            </div>
          </div>
        </div>
      )}

      {/* Section 1 — Heures de marche & Exploitation */}
      <div className="gd-section-title">Heures de marche & Exploitation</div>
      <div className="gd-kpi-grid">
        {kpiRow1.map((c, i) => (
          <div key={i} className="gd-kpi-card" style={{ background: bg, borderColor: bc }}>
            <div className="gd-kpi-label" style={{ color: lc }}>{c.label}</div>
            <div
              className="gd-kpi-value"
              style={{
                ...(c.color ? { color: c.color } : {}),
                ...(String(c.value).length > 5 ? { fontSize: 20 } : {}),
              }}
            >
              {c.value}
              {c.unit && <span className="gd-kpi-unit">{c.unit}</span>}
            </div>
            <div className="gd-kpi-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Section 2 — Production & Energie */}
      <div className="gd-section-title">Production & Energie</div>

      {/* SVG bar chart */}
      <div className="gd-chart-card">
        <div className="gd-chart-title">
          <span>{chartTitle}</span>
          <span className="gd-chart-peak">
            Pic : <strong style={{ color: prodColor }}>{peakFmt}</strong> &middot; Total : <strong style={{ color: prodColor }}>{totalFmt}</strong>
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
          {/* Grid lines at 25%, 50%, 75%, 100% */}
          {[0.25, 0.5, 0.75, 1.0].map(pct => {
            const y = PAD_T + chartH * (1 - pct)
            const v = Math.round(maxChartVal * pct)
            const lbl = v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v
            return (
              <g key={pct}>
                <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <text x={PAD_L - 4} y={y + 4} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.2)">{lbl}</text>
              </g>
            )
          })}
          {/* Bars */}
          {chartData.map((val, i) => {
            const x = PAD_L + i * barGap
            const barH = val > 0 ? Math.max(2, (val / maxChartVal) * chartH) : 0
            const y = PAD_T + chartH - barH
            const barColor = val === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(174,193,205,0.75)'
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={Math.max(barH, 0)} rx="2" fill={barColor} />
                {val > 0 && <rect x={x} y={y} width={barW} height="2" rx="1" fill="rgba(174,193,205,0.9)" />}
                {i % labelFreq === 0 && (
                  <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)">
                    {chartLabels[i]}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Production KPIs */}
      <div className="gd-kpi-grid">
        {prodRow.map((c, i) => (
          <div key={i} className="gd-kpi-card" style={{ background: bg, borderColor: bc }}>
            <div className="gd-kpi-label" style={{ color: lc }}>{c.label}</div>
            <div
              className="gd-kpi-value"
              style={{
                ...(c.color ? { color: c.color } : {}),
                ...(String(c.value).length > 5 ? { fontSize: 20 } : {}),
              }}
            >
              {c.value}
              {c.unit && <span className="gd-kpi-unit">{c.unit}</span>}
            </div>
            <div className="gd-kpi-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Section 3 — Combustible */}
      <div className="gd-section-title">Combustible</div>
      <div className="gd-metrics-grid">
        {fuelMetrics.map((m, i) => (
          <div key={i} className="gd-metric-card" style={{ background: bg, borderColor: bc }}>
            <div className="gd-metric-top">
              <div className="gd-metric-label" style={{ color: lc }}>{m.label}</div>
              <div className="gd-metric-icon">{m.icon}</div>
            </div>
            <div className="gd-metric-value" style={m.color ? { color: m.color } : {}}>
              {m.value}
              {m.unit && <span className="gd-metric-unit">{m.unit}</span>}
            </div>
            <div className="gd-metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Section 4 — Huile moteur */}
      <div className="gd-section-title">Huile moteur</div>
      <div className="gd-metrics-grid gd-metrics-grid-4">
        {oilMetrics.map((m, i) => (
          <div key={i} className="gd-metric-card" style={{ background: bg, borderColor: bc }}>
            <div className="gd-metric-top">
              <div className="gd-metric-label" style={{ color: lc }}>{m.label}</div>
              <div className="gd-metric-icon">{m.icon}</div>
            </div>
            <div className="gd-metric-value" style={m.color ? { color: m.color } : {}}>
              {m.value}
              {m.unit && <span className="gd-metric-unit">{m.unit}</span>}
            </div>
            <div className="gd-metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
