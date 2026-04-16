import { useState, useMemo, useEffect } from 'react'
import { useFilters } from '../../hooks/useFilters'
import { usePageTitle } from '../../context/PageTitleContext'
import HfoSite from './HfoSite'
import HfoVestopCard from './HfoVestopCard'
import HfoKpiGrid from './HfoKpiGrid'
import PuissanceHebdoChart from './PuissanceHebdoChart'
import ProductionChart from './ProductionChart'
import GeneratorChart from './GeneratorChart'
import { TAMATAVE_LIVE, DIEGO_LIVE, MAJUNGA_LIVE, TULEAR_LIVE, ANTSIRABE_LIVE, FIHAONANA_LIVE, HFO_GLOBAL } from '../../data/site_data'
import { HFO_PROJECTS } from '../../data/hfo_projects'
import { ENR_SITES } from '../../data/enr_site_data'
import { MOIS_FR, getKpiForSite } from '../../utils/hfoHelpers'
import { getFilteredEnrSite } from '../../utils/enrHelpers'

// Map HFO site IDs to ENR site codes
const ENR_MAP = { tamatave: 'TMM', diego: 'DIE', majunga: 'MJN' }

/** Aggregate puissanceHebdo across multiple sites (weeks must be aligned). */
function aggregatePuissanceHebdo(sites) {
  const first = sites.find(s => s?.puissanceHebdo?.weeks?.length)
  if (!first) return null
  const weeks = first.puissanceHebdo.weeks
  const n = weeks.length
  const sum = (field, useNull = false) => {
    const out = new Array(n).fill(useNull ? null : 0)
    sites.forEach(s => {
      const arr = s?.puissanceHebdo?.[field]
      if (!arr) return
      for (let i = 0; i < n; i++) {
        const v = arr[i]
        if (v == null) continue
        if (out[i] == null) out[i] = 0
        out[i] += +v
      }
    })
    return out
  }
  return {
    weeks,
    enelec:   sum('enelec'),
    vestop:   sum('vestop'),
    contrat:  sum('contrat'),
    peakLoad: sum('peakLoad', true),
  }
}

// Default site data (same structure as energy.js siteData)
// We merge live data from site_data.js exports
const SITE_ORDER = ['tamatave', 'diego', 'tulear', 'majunga', 'antsirabe', 'fihaonana']
const NAVIGABLE_SITES = ['tamatave', 'tulear', 'diego', 'majunga', 'antsirabe']

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
    name: 'Antsirabe', status: 'warn', mw: 0, contrat: 7.5,
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
    antsirabe: ANTSIRABE_LIVE,
    fihaonana: FIHAONANA_LIVE,
  }
  for (const [key, live] of Object.entries(liveMap)) {
    if (live && sites[key]) {
      sites[key] = { ...sites[key], ...live }
    }
  }
  return sites
}

// Format generator ID: "ADG1" -> "ADG 1"
function fmtGId(id) {
  return id ? id.replace(/(\D+)(\d+)/, '$1 $2') : id
}

/**
 * VESTOP engines do not follow the ADG/MDG/BDG naming scheme — the DG wants to
 * see them referenced by manufacturer (DEUTZ, MAN, Rolls Royce) in every view
 * (VESTOP detail, Tamatave, Majunga). For non-VESTOP engines we fall back to
 * `fmtGId`. The engine object is expected to carry `provider` and `model`
 * (which is the concatenated "Make Model" produced by generate_hfo_data.py).
 */
function fmtEngineName(g) {
  if (!g) return ''
  const provider = (g.provider || '').toLowerCase()
  if (provider === 'vestop') {
    const m = (g.model || '').toUpperCase()
    if (m.includes('DEUTZ') || m.includes('DUETZ')) return 'DEUTZ'
    if (m.includes('MAN')) return 'MAN'
    if (m.startsWith('RR') || m.includes('ROLLS')) return 'Rolls Royce'
  }
  return fmtGId(g.id)
}

export default function HfoDetail() {
  const { currentFilter, setFilter, selectedMonthIndex, selectedQuarter, selectedYear } = useFilters()
  const { setPageTitle, setBackOverride } = usePageTitle()
  const [selectedSite, setSelectedSite] = useState(null)
  const [projectFilter, setProjectFilter] = useState(null) // { type: 'site'|'cat', key: string }

  // Update banner title + back button based on current view
  useEffect(() => {
    if (selectedSite === 'vestop') {
      setPageTitle('VESTOP')
      setBackOverride({ label: 'HFO', onClick: () => setSelectedSite(null) })
    } else if (selectedSite) {
      setPageTitle(selectedSite.charAt(0).toUpperCase() + selectedSite.slice(1))
      setBackOverride({ label: 'HFO', onClick: () => setSelectedSite(null) })
    } else {
      setPageTitle(null)
      setBackOverride(null)
    }
    return () => { setPageTitle(null); setBackOverride(null) }
  }, [selectedSite, setPageTitle, setBackOverride])

  const siteData = useMemo(() => buildSiteData(), [])

  // Compute total production across active sites for share calculation
  const { activeSites } = useMemo(() => {
    const active = []
    SITE_ORDER.forEach(id => {
      const s = siteData[id]
      if (s.status === 'construction' || s.status === 'reconstruction') return
      const k = getKpiForSite(s, currentFilter, selectedMonthIndex, selectedQuarter)
      active.push({ id, site: s, kpi: k })
    })
    return { activeSites: active }
  }, [siteData, currentFilter, selectedMonthIndex, selectedQuarter])

  // Consolidated KPIs — aggregated across all active sites
  const consolidated = useMemo(() => {
    const kpis = activeSites.map(a => a.kpi)
    const tProd = kpis.reduce((s, k) => s + (k.prod || 0), 0)
    const tContratEnelec = activeSites.reduce((s, a) => s + (a.site.contracts?.enelec || 0), 0)
    // VESTOP: use global authoritative total from HFO_GLOBAL (23.5 MW)
    const globalSumVestop = activeSites.reduce((s, a) => s + (a.site.contracts?.vestop || 0), 0)
    const tContratVestop = HFO_GLOBAL?.vestopTotalContract ?? globalSumVestop
    // Per-provider dispo — iterate groupes and filter by provider
    let tDispoEnelec = 0
    let tDispoVestop = 0
    activeSites.forEach(a => {
      for (const g of (a.site.groupes || [])) {
        if (g.statut !== 'ok' || g.availableMw == null) continue
        const v = +g.availableMw
        if (Number.isNaN(v)) continue
        const prov = (g.provider || '').toLowerCase()
        if (prov === 'enelec') tDispoEnelec += v
        else if (prov === 'vestop') tDispoVestop += v
      }
    })
    tDispoEnelec = Math.round(tDispoEnelec * 10) / 10
    tDispoVestop = Math.round(tDispoVestop * 10) / 10
    // Peak load = max across sites (using latest weekly peak)
    const tPeak = activeSites.reduce((m, a) => {
      const p = a.site.peakLoadLatest
      return p != null && p > m ? p : m
    }, 0)
    // Weighted SFOC / SLOC
    let sfocW = 0, slocW = 0, prodSum = 0
    kpis.forEach(k => {
      if (k && k.prod) {
        prodSum += k.prod
        if (k.sfoc) sfocW += k.sfoc * k.prod
        if (k.sloc) slocW += k.sloc * k.prod
      }
    })
    const avgSfoc = prodSum > 0 ? sfocW / prodSum : null
    const avgSloc = prodSum > 0 ? slocW / prodSum : null
    // Blackouts — sum of month stats across sites if available
    let tBlackouts = null
    activeSites.forEach(a => {
      const bs = a.site.blackoutStats
      if (bs && bs.count != null) {
        tBlackouts = (tBlackouts || 0) + bs.count
      }
    })
    // Running vs total engines
    let tRunning = 0, tEngines = 0
    activeSites.forEach(a => {
      const gs = a.site.groupes || []
      tEngines += gs.length
      tRunning += gs.filter(g => g.statut === 'ok').length
    })
    return {
      tProd, tContratEnelec, tContratVestop, tDispoEnelec, tDispoVestop, tPeak,
      avgSfoc, avgSloc, tBlackouts, tRunning, tEngines,
    }
  }, [activeSites])

  // Aggregated puissance hebdo across all active sites
  const consolidatedHebdo = useMemo(
    () => aggregatePuissanceHebdo(activeSites.map(a => a.site)),
    [activeSites]
  )

  // Aggregated monthly production (month_1..month_12)
  const consolidatedMonths = useMemo(() => {
    const months = new Array(12).fill(null).map(() => ({ prod: 0, prodObj: 0 }))
    activeSites.forEach(a => {
      const kpi = a.site.kpi || {}
      for (let m = 1; m <= 12; m++) {
        const k = kpi[`month_${m}`]
        if (!k) continue
        months[m - 1].prod += k.prod || 0
        months[m - 1].prodObj += k.prodObj || 0
      }
    })
    return months
  }, [activeSites])

  const periodLabel = currentFilter === 'A' ? String(selectedYear)
    : currentFilter === 'Q' ? `Q${selectedQuarter} ${selectedYear}`
    : `${MOIS_FR[selectedMonthIndex]} ${selectedYear}`

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

  // Special case : VESTOP virtual site — dedicated detail panel
  if (selectedSite === 'vestop') {
    return (
      <VestopDetailPanel
        siteData={siteData}
        totalContract={HFO_GLOBAL?.vestopTotalContract || 0}
        onClose={() => setSelectedSite(null)}
      />
    )
  }

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
      {/* Consolidated KPIs — unified grid */}
      <HfoKpiGrid
        variant="hfo"
        contratEnelec={consolidated.tContratEnelec}
        contratVestop={consolidated.tContratVestop}
        dispoEnelec={consolidated.tDispoEnelec}
        dispoVestop={consolidated.tDispoVestop}
        running={consolidated.tRunning}
        totalEngines={consolidated.tEngines}
        production={consolidated.tProd || null}
        productionSub={periodLabel}
        sfoc={consolidated.avgSfoc}
        sloc={consolidated.avgSloc}
        blackouts={consolidated.tBlackouts}
        blackoutsSub={periodLabel}
      />

      {/* Sites grid — ordre : Tamatave, Diego, Tulear, Majunga, Antsirabe, Vestop, Fihaonana */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8 items-stretch">
        {['tamatave', 'diego', 'tulear', 'majunga', 'antsirabe'].map(id => {
          const site = siteData[id]
          const kpi = getKpiForSite(site, currentFilter, selectedMonthIndex, selectedQuarter)
          const enrCode = ENR_MAP[id]
          const enrSite = enrCode && (ENR_SITES || []).find(s => s.code === enrCode)
          const enrProd = enrSite ? getFilteredEnrSite(enrSite, currentFilter, selectedMonthIndex, selectedQuarter, selectedYear).prodKwh / 1000 : null
          return (
            <HfoSite
              key={id}
              site={site}
              kpi={kpi}
              enrProd={enrProd}
              onClick={() => setSelectedSite(id)}
            />
          )
        })}
        <HfoVestopCard
          siteData={siteData}
          totalContract={HFO_GLOBAL?.vestopTotalContract || 0}
          onClick={() => setSelectedSite('vestop')}
        />
        {['fihaonana'].map(id => {
          const site = siteData[id]
          const kpi = getKpiForSite(site, currentFilter, selectedMonthIndex, selectedQuarter)
          return (
            <HfoSite
              key={id}
              site={site}
              kpi={kpi}
              enrProd={null}
              onClick={() => setSelectedSite(id)}
            />
          )
        })}
      </div>

      {/* Projects removed — they are now in /energy/hfo-projets */}
    </div>
  )
}


/**
 * VestopDetailPanel — Virtual "VESTOP" detail page
 *
 * Shows every VESTOP generator hosted across the HFO sites
 * (Tamatave, Majunga, Antsirabe, Fihaonana) with its site affectation
 * and only its puissance disponible (per DG request).
 */
function VestopDetailPanel({ siteData, totalContract = 0, onClose }) {
  const VESTOP_SITES = ['tamatave', 'majunga', 'antsirabe', 'fihaonana']

  // Collect every VESTOP engine across the VESTOP-hosting sites
  const vestopEngines = useMemo(() => {
    const out = []
    VESTOP_SITES.forEach(siteId => {
      const s = siteData[siteId]
      if (!s || !Array.isArray(s.groupes)) return
      s.groupes.forEach(g => {
        if ((g.provider || '').toLowerCase() !== 'vestop') return
        out.push({ ...g, siteId, siteName: s.name || siteId })
      })
    })
    return out
  }, [siteData])

  // Totals (dispo only — per DG request)
  const totals = useMemo(() => {
    let dispo = 0
    let running = 0
    vestopEngines.forEach(g => {
      if (g.statut === 'ok' && g.availableMw != null) {
        const v = +g.availableMw
        if (!Number.isNaN(v)) dispo += v
      }
      if (g.statut === 'ok') running += 1
    })
    return {
      dispo: Math.round(dispo * 10) / 10,
      running,
      total: vestopEngines.length,
    }
  }, [vestopEngines])

  const pct = totalContract > 0 ? Math.round((totals.dispo / totalContract) * 100) : 0
  const colorFor = (p) => p == null ? '#8a92ab'
    : p >= 100 ? 'var(--energy)'
    : p >= 80 ? '#f0a030'
    : 'var(--red)'
  const headColor = colorFor(totalContract > 0 ? pct : null)

  // Group engines by site for the "affectation" view
  const bySite = useMemo(() => {
    const map = new Map()
    vestopEngines.forEach(g => {
      if (!map.has(g.siteId)) map.set(g.siteId, { siteName: g.siteName, engines: [] })
      map.get(g.siteId).engines.push(g)
    })
    return Array.from(map.entries()).map(([siteId, v]) => ({ siteId, ...v }))
  }, [vestopEngines])

  return (
    <div className="site-detail-panel">
      {/* Header: back button + VESTOP title */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text)] text-lg bg-transparent border-none cursor-pointer"
        >
          &#8592;
        </button>
        <h2 className="text-base uppercase tracking-wider" style={{ color: '#5aafaf' }}>VESTOP</h2>
        <span className="text-[11px] text-[var(--text-muted)]">
          — Parc mutualisé sur {bySite.length} site{bySite.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Top KPI strip — uniquement puissance disponible */}
      <div className="hfo-kpi-grid mb-6">
        <div className="hfo-kpi-section">
          <div className="hfo-kpi-section-label">Puissance disponible</div>
          <div className="hfo-kpi-cards n-1">
            <div className="hfo-kpi-card" style={{ borderColor: 'rgba(90,175,175,0.28)' }}>
              <div className="hfo-kpi-label" style={{ color: 'rgba(90,175,175,0.7)' }}>VESTOP</div>
              <div className="hfo-kpi-provider-row">
                <div className="hfo-kpi-prov-col">
                  <div className="hfo-kpi-value-sm" style={{ color: headColor }}>
                    {totals.dispo.toFixed(1)}
                    <span className="hfo-kpi-unit">MW</span>
                  </div>
                  <div className="hfo-kpi-sub">Disponible</div>
                </div>
                <div className="hfo-kpi-prov-pct" style={{ color: headColor }}>
                  {totalContract > 0 ? `${pct}%` : '—'}
                </div>
                <div className="hfo-kpi-prov-col">
                  <div className="hfo-kpi-value-sm">
                    {totalContract.toFixed(1)}
                    <span className="hfo-kpi-unit">MW</span>
                  </div>
                  <div className="hfo-kpi-sub">Contrat</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generateurs VESTOP — groupés par site d'affectation */}
      <div className="text-[9px] tracking-widest uppercase text-[var(--text-dim)] mb-3">
        Generateurs VESTOP ({vestopEngines.length}) — {totals.running} en marche
      </div>

      {bySite.length === 0 && (
        <div className="text-[12px] text-[var(--text-muted)] italic">
          Aucun generateur VESTOP operationnel pour le moment.
        </div>
      )}

      {bySite.map(group => (
        <div key={group.siteId} className="mb-6">
          {/* Site affectation header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#5aafaf' }} />
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              Affectation · {group.siteName}
            </span>
            <span className="text-[9px] text-[var(--text-dim)]">
              ({group.engines.length} moteur{group.engines.length > 1 ? 's' : ''})
            </span>
          </div>

          {/* Engine cards — only "puissance disponible" */}
          <div className="gen-cards-row">
            {group.engines.map((g, gi) => {
              const isContra = g.contradictory === true
              const dotColor = isContra ? '#7b5fbf'
                : g.statut === 'ok' ? 'var(--energy)'
                : g.statut === 'warn' ? '#f0a030'
                : 'var(--red)'
              const statusLabel = isContra ? 'A verifier'
                : g.statut === 'ok' ? 'En marche'
                : g.statut === 'warn' ? 'Maintenance'
                : 'Arret'
              const daysLabel = (g.jourArret > 0 && !isContra) ? ` · ${g.jourArret}j` : ''
              const available = (g.statut === 'ok' && g.availableMw != null)
                ? parseFloat(g.availableMw).toFixed(1)
                : null
              const displayName = fmtEngineName(g)

              return (
                <div key={`${group.siteId}-${g.id}-${gi}`} className="gen-card-wrapper">
                  {/* Generator ID with status dot */}
                  <div className="gen-card-title" style={{ color: isContra ? '#7b5fbf' : 'var(--text)' }}>
                    <span
                      className="gen-status-dot"
                      style={{
                        backgroundColor: dotColor,
                        boxShadow: `0 0 4px ${dotColor}, 0 0 8px ${dotColor}`,
                      }}
                    />
                    {displayName}
                  </div>
                  {/* Card body — uniquement puissance disponible */}
                  <div
                    className="s1-card gen-card-body"
                    style={{ borderColor: 'rgba(90,175,175,0.22)' }}
                  >
                    <div className="text-[7px] uppercase tracking-[0.15em] text-[var(--text-dim)] mb-1">
                      Puissance disponible
                    </div>
                    <div className="text-[18px] leading-none" style={{ color: available != null ? 'var(--energy)' : 'var(--text-dim)' }}>
                      {available != null ? available : '—'}
                      <span className="text-[9px] text-[var(--text-muted)] font-normal ml-0.5">MW</span>
                    </div>
                    <div className="text-[8px] mt-1.5" style={{ color: dotColor }}>
                      {statusLabel}{daysLabel}
                    </div>
                    <div className="text-[7px] mt-1.5 uppercase tracking-wider" style={{ color: '#5aafaf' }}>
                      {group.siteName}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}


/** Full site detail panel — replaces main view when a site is selected */
function SiteDetailPanel({ siteId, siteData, currentFilter, setFilter, onClose, onNavigate }) {
  const { selectedMonthIndex, selectedQuarter, selectedYear } = useFilters()
  const { setPageTitle } = usePageTitle()
  const [selectedGenerator, setSelectedGenerator] = useState(null)
  const s = siteData[siteId]

  // Site KPIs for unified grid
  const sKpi = useMemo(() => getKpiForSite(s, currentFilter, selectedMonthIndex, selectedQuarter), [s, currentFilter, selectedMonthIndex, selectedQuarter])
  const sRunning = useMemo(() => (s.groupes || []).filter(g => g.statut === 'ok').length, [s])
  const sTotal = (s.groupes || []).length
  // Per-provider dispo for site-level HfoKpiGrid
  const sDispo = useMemo(() => {
    let enelec = 0, vestop = 0
    for (const g of (s.groupes || [])) {
      if (g.statut !== 'ok' || g.availableMw == null) continue
      const v = +g.availableMw
      if (Number.isNaN(v)) continue
      const prov = (g.provider || '').toLowerCase()
      if (prov === 'enelec') enelec += v
      else if (prov === 'vestop') vestop += v
    }
    return {
      enelec: Math.round(enelec * 10) / 10,
      vestop: Math.round(vestop * 10) / 10,
    }
  }, [s])
  const sBlackouts = (s.blackoutStats && s.blackoutStats.count != null) ? s.blackoutStats.count : null
  const sPeriodLabel = currentFilter === 'A' ? String(selectedYear)
    : currentFilter === 'Q' ? `Q${selectedQuarter} ${selectedYear}`
    : `${MOIS_FR[selectedMonthIndex]} ${selectedYear}`
  // Puissance chart:
  //   A           → weekly (52 weeks)
  //   Q           → weekly filtered to 3 months of quarter
  //   M / J-1     → DAILY for selected month (from per-DG dailyMaxLoad)
  const sPuissanceHebdo = useMemo(() => {
    const ph = s.puissanceHebdo
    if (!ph || !Array.isArray(ph.weeks) || ph.weeks.length === 0) return { data: ph, isDaily: false }

    // Daily mode — only reliable for the latest month stored in site data
    if (currentFilter === 'M' || currentFilter === 'J-1') {
      const targetMonth = (selectedMonthIndex || 0) + 1
      const latestMonth = s.latestMonth || null
      const year = selectedYear || 2026
      if (latestMonth === targetMonth) {
        const daysInMonth = new Date(year, targetMonth, 0).getDate()
        const enelecDaily = new Array(daysInMonth).fill(0)
        const vestopDaily = new Array(daysInMonth).fill(0)
        // Realized days — sum per-DG dailyMaxLoad
        for (const g of (s.groupes || [])) {
          const dml = g.dailyMaxLoad || []
          const prov = (g.provider || '').toLowerCase()
          for (let d = 0; d < daysInMonth && d < dml.length; d++) {
            const mw = (+dml[d] || 0) / 1000
            if (prov === 'vestop') vestopDaily[d] += mw
            else enelecDaily[d] += mw
          }
        }
        // Forecast days — for days after the site's latest recorded date,
        // reuse the weekly planned values from puissanceHebdo for that week.
        // Week-of-month = ceil(day / 7), matching the existing "YYYY-MM-S{k}" keys.
        const weekByKey = new Map()
        ph.weeks.forEach((w, i) => weekByKey.set(w, i))
        // Cutoff = last day with realized data for this site in the selected month
        let lastRealizedDay = 0
        const latestDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.latestDate || '')
        if (latestDateMatch) {
          const ly = +latestDateMatch[1], lm = +latestDateMatch[2], ld = +latestDateMatch[3]
          if (ly === year && lm === targetMonth) lastRealizedDay = ld
        }
        const mm = String(targetMonth).padStart(2, '0')
        for (let d = 1; d <= daysInMonth; d++) {
          if (d <= lastRealizedDay) continue  // within realized window — keep what we have (even if 0)
          const wkIdx = weekByKey.get(`${year}-${mm}-S${Math.ceil(d / 7)}`)
          if (wkIdx == null) continue
          enelecDaily[d - 1] = +ph.enelec?.[wkIdx] || 0
          vestopDaily[d - 1] = +ph.vestop?.[wkIdx] || 0
        }
        // Contract reference: pull the most recent non-zero weekly contrat for this month
        let contratRef = 0
        for (let i = ph.weeks.length - 1; i >= 0; i--) {
          const m = /^\d{4}-(\d{2})/.exec(ph.weeks[i] || '')
          if (m && parseInt(m[1], 10) === targetMonth) {
            const c = +ph.contrat?.[i] || 0
            if (c > contratRef) contratRef = c
          }
        }
        const peakRef = +s.peakLoadLatest || 0
        const labels = []
        const contratArr = new Array(daysInMonth).fill(contratRef)
        const peakArr = new Array(daysInMonth).fill(peakRef)
        for (let d = 1; d <= daysInMonth; d++) labels.push(String(d))
        return {
          data: {
            weeks: labels,
            enelec: enelecDaily,
            vestop: vestopDaily,
            contrat: contratArr,
            peakLoad: peakArr,
            monthLabel: `${MOIS_FR[targetMonth - 1]} ${year}`,
            monthNum: targetMonth,
            year,
            lastRealizedDay,
          },
          isDaily: true,
        }
      }
      // Fallback: filter weekly data to that month
      const keepIdx = []
      ph.weeks.forEach((w, i) => {
        const m = /^\d{4}-(\d{2})/.exec(w || '')
        if (m && parseInt(m[1], 10) === targetMonth) keepIdx.push(i)
      })
      const pick = (arr) => Array.isArray(arr) ? keepIdx.map(i => arr[i]) : arr
      return {
        data: keepIdx.length === 0 ? ph : {
          ...ph,
          weeks:    pick(ph.weeks),
          enelec:   pick(ph.enelec),
          vestop:   pick(ph.vestop),
          contrat:  pick(ph.contrat),
          peakLoad: pick(ph.peakLoad),
        },
        isDaily: false,
      }
    }

    if (currentFilter === 'Q') {
      const q = selectedQuarter || 1
      const targetMonths = new Set()
      for (let m = (q - 1) * 3 + 1; m <= q * 3; m++) targetMonths.add(m)
      const keepIdx = []
      ph.weeks.forEach((w, i) => {
        const m = /^\d{4}-(\d{2})/.exec(w || '')
        if (m && targetMonths.has(parseInt(m[1], 10))) keepIdx.push(i)
      })
      const pick = (arr) => Array.isArray(arr) ? keepIdx.map(i => arr[i]) : arr
      return {
        data: keepIdx.length === 0 ? ph : {
          ...ph,
          weeks:    pick(ph.weeks),
          enelec:   pick(ph.enelec),
          vestop:   pick(ph.vestop),
          contrat:  pick(ph.contrat),
          peakLoad: pick(ph.peakLoad),
        },
        isDaily: false,
      }
    }

    return { data: ph, isDaily: false }
  }, [s, currentFilter, selectedMonthIndex, selectedQuarter, selectedYear])

  // Build chart data based on current filter:
  //   A           → 12 monthly bars
  //   Q           → 3 monthly bars (selected quarter)
  //   M / J-1     → daily bars for the selected month (from dailyTrend)
  const sChart = useMemo(() => {
    const kpi = s.kpi || {}
    const isDaily = currentFilter === 'M' || currentFilter === 'J-1'

    if (isDaily) {
      const mIdx = selectedMonthIndex || 0
      const daysInMonth = new Date(selectedYear || 2026, mIdx + 1, 0).getDate()
      // Index dailyTrend by date for O(1) lookup
      const trend = Array.isArray(s.dailyTrend) ? s.dailyTrend : []
      const byDate = new Map()
      trend.forEach(t => {
        if (t && t.date) byDate.set(t.date, t)
      })
      // No prévisionnel on production chart (user request)
      const data = []
      const labels = []
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${selectedYear || 2026}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const row = byDate.get(dateStr)
        const prod = row ? +(row.net_mwh || row.gross_mwh || 0) : 0
        data.push({ prod, prodObj: 0 })
        labels.push(String(d))
      }
      return {
        months: data,
        labels,
        isDaily: true,
        title: `Production journalière — ${s.name} — ${MOIS_FR[mIdx]} ${selectedYear || 2026}`,
      }
    }

    const months = new Array(12).fill(null).map(() => ({ prod: 0, prodObj: 0 }))
    for (let m = 1; m <= 12; m++) {
      const k = kpi[`month_${m}`]
      if (!k) continue
      months[m - 1].prod = k.prod || 0
      // prodObj intentionally left 0 — no prévisionnel on production chart
    }

    if (currentFilter === 'Q') {
      const q = selectedQuarter || 1
      const start = (q - 1) * 3
      const slice = months.slice(start, start + 3)
      const labels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'].slice(start, start + 3)
      return {
        months: slice,
        labels,
        isDaily: false,
        title: `Production mensuelle — ${s.name} — Q${q} ${selectedYear || 2026}`,
      }
    }

    return {
      months,
      labels: undefined,
      isDaily: false,
      title: `Production mensuelle — ${s.name}`,
    }
  }, [s, currentFilter, selectedMonthIndex, selectedQuarter, selectedYear])

  // Update banner + back button when generator is selected
  const { setBackOverride } = usePageTitle()
  useEffect(() => {
    const siteName = siteId.charAt(0).toUpperCase() + siteId.slice(1)
    if (selectedGenerator != null) {
      const g = (s.groupes || [])[selectedGenerator]
      setPageTitle(`${siteName} — ${g ? fmtEngineName(g) : ''}`)
      setBackOverride({ label: siteName, onClick: () => setSelectedGenerator(null) })
    } else {
      setPageTitle(siteName)
      // Restore "HFO" back button when returning from generator detail
      setBackOverride({ label: 'HFO', onClick: () => onClose() })
    }
  }, [selectedGenerator, siteId, s, setPageTitle, setBackOverride])

  // If a generator is selected, show its detail panel
  // selectedGenerator is now an index (not id) to handle Majunga's duplicate "Vestop" ids
  const selGen = selectedGenerator != null ? (s.groupes || [])[selectedGenerator] : null
  if (selGen) {
    return (
      <GeneratorDetailPanel
        siteId={siteId}
        siteData={siteData}
        generator={selGen}
        generatorIndex={selectedGenerator}
        onClose={() => setSelectedGenerator(null)}
        onNavigateGen={(gIdx) => setSelectedGenerator(gIdx)}
      />
    )
  }

  const isConstruction = s.status === 'construction' || s.status === 'reconstruction'

  return (
    <div className="site-detail-panel">
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
          {/* Unified site KPI grid */}
          <HfoKpiGrid
            variant="site"
            contratEnelec={s.contracts?.enelec || 0}
            contratVestop={s.contracts?.vestop || 0}
            dispoEnelec={sDispo.enelec}
            dispoVestop={sDispo.vestop}
            running={sRunning}
            totalEngines={sTotal}
            production={sKpi?.prod || null}
            productionSub={sPeriodLabel}
            sfoc={sKpi?.sfoc}
            sloc={sKpi?.sloc}
            blackouts={sBlackouts}
            blackoutsSub={sPeriodLabel}
          />

          {/* Charts — puissance hebdo + production mensuelle */}
          {sPuissanceHebdo.data && sPuissanceHebdo.data.weeks?.length > 0 && (
            <PuissanceHebdoChart
              data={sPuissanceHebdo.data}
              isDaily={sPuissanceHebdo.isDaily}
              title={`Puissance disponible ${sPuissanceHebdo.isDaily ? 'journalière' : 'hebdomadaire'} — ${s.name}${currentFilter === 'M' || currentFilter === 'J-1' ? ` — ${MOIS_FR[selectedMonthIndex || 0]} ${selectedYear || 2026}` : currentFilter === 'Q' ? ` — Q${selectedQuarter} ${selectedYear || 2026}` : ''}`}
            />
          )}
          <ProductionChart
            months={sChart.months}
            labels={sChart.labels}
            isDaily={sChart.isDaily}
            title={sChart.title}
          />

          {/* Section 2 — Generateurs */}
          {s.groupes && s.groupes.length > 0 && (
            <>
              <div className="text-[9px] tracking-widest uppercase text-[var(--text-dim)] mb-3">
                Generateurs ({s.groupes.length})
              </div>
              <div className="gen-cards-row">
                {s.groupes.map((g, gi) => {
                  const isContra = g.contradictory === true
                  const dotColor = isContra ? '#7b5fbf' : g.statut === 'ok' ? 'var(--energy)' : g.statut === 'warn' ? '#f0a030' : 'var(--red)'
                  const statusLabel = isContra ? 'A verifier' : g.statut === 'ok' ? 'En marche' : g.statut === 'warn' ? 'Maintenance' : 'Arret'
                  const daysLabel = (g.jourArret > 0 && !isContra) ? ` · ${g.jourArret}j` : ''

                  const nominal = g.nominal != null ? parseFloat(g.nominal).toFixed(1) : parseFloat(g.mw || 0).toFixed(1)
                  const attendu = g.attendu != null ? parseFloat(g.attendu).toFixed(1) : null
                  const available = g.availableMw != null ? parseFloat(g.availableMw).toFixed(1) : null
                  const displayName = fmtEngineName(g)

                  return (
                    <div key={`${g.id}-${gi}`} className="gen-card-wrapper">
                      {/* Generator ID with status dot */}
                      <div className="gen-card-title" style={{ color: isContra ? '#7b5fbf' : 'var(--text)' }}>
                        <span
                          className="gen-status-dot"
                          style={{
                            backgroundColor: dotColor,
                            boxShadow: `0 0 4px ${dotColor}, 0 0 8px ${dotColor}`,
                          }}
                        />
                        {displayName}
                      </div>
                      {/* Card body */}
                      <div
                        className="s1-card gen-card-body"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedGenerator(gi)}
                      >
                        <div className="text-[7px] uppercase tracking-[0.15em] text-[var(--text-dim)] mb-1">Nominal</div>
                        <div className="text-[16px] text-[var(--text)] leading-none">
                          {nominal}<span className="text-[9px] text-[var(--text-muted)] font-normal ml-0.5">MW</span>
                        </div>
                        <div className="text-[8px] mt-1.5" style={{ color: dotColor }}>
                          {statusLabel}{daysLabel}
                        </div>
                        <div className="flex justify-center gap-2 mt-1.5">
                          <div className="text-center">
                            <div className="text-[7px] uppercase tracking-[0.1em] text-[var(--text-dim)]">Attendu</div>
                            <div className="text-[11px] text-[var(--text-muted)]">{attendu != null ? attendu : '—'}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[7px] uppercase tracking-[0.1em] text-[var(--text-dim)]">Dispo</div>
                            <div className="text-[11px]" style={{ color: available != null ? 'var(--energy)' : 'var(--text-dim)' }}>
                              {available != null ? available : '—'}
                            </div>
                          </div>
                        </div>
                        {g.provider && g.provider !== 'enelec' && (
                          <div className="text-[7px] mt-1 uppercase tracking-wider" style={{ color: g.provider === 'vestop' ? '#5aafaf' : '#f0a030' }}>
                            {g.provider}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Section — Planning HEBDO (52 semaines) */}
          {s.planning && s.planning.engines && s.planning.engines.length > 0 && (
            <>
              <div className="text-[9px] tracking-widest uppercase text-[var(--text-dim)] mb-2 mt-6">
                Planning hebdomadaire ({(s.planning.weeks || []).length} semaines)
              </div>
              <div className="rounded-xl overflow-x-auto mb-6" style={{ background: 'rgba(138,146,171,0.06)', border: '1px solid rgba(138,146,171,0.15)' }}>
                <table className="w-full text-[9px] border-collapse" style={{ minWidth: 780 }}>
                  <thead>
                    <tr>
                      <th className="sticky left-0 text-left p-2 text-[var(--text-dim)] uppercase tracking-wider text-[8px]" style={{ background: 'rgba(20,24,40,0.95)' }}>Moteur</th>
                      {(s.planning.weeks || []).map((w, i) => (
                        <th key={i} className="p-0.5 text-[7px] text-[var(--text-dim)] text-center font-normal" style={{ minWidth: 14 }}>
                          {typeof w === 'string' ? w.replace(/^S/, '') : (i + 1)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.planning.engines.map(eng => (
                      <tr key={eng.id} className="border-t border-[rgba(138,146,171,0.1)]">
                        <td className="sticky left-0 p-2 text-[10px] text-[var(--text)] whitespace-nowrap" style={{ background: 'rgba(20,24,40,0.95)' }}>
                          {fmtGId(eng.id)}
                        </td>
                        {(eng.weeks || []).map((status, i) => {
                          const color =
                            status === 'indisponible' ? '#f0a030' :
                            status === 'maintenance'  ? '#4a8fd6' :
                            'transparent'
                          const title =
                            status === 'indisponible' ? `S${i + 1} — Indisponible` :
                            status === 'maintenance'  ? `S${i + 1} — Maintenance` :
                            `S${i + 1}`
                          return (
                            <td key={i} className="p-0.5" title={title}>
                              <div className="h-3 rounded-sm" style={{ background: color, border: status ? 'none' : '1px dashed rgba(138,146,171,0.15)' }} />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-4 text-[9px] text-[var(--text-dim)] -mt-4 mb-6">
                <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#f0a030' }} />Indisponible</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#4a8fd6' }} />Maintenance</span>
              </div>
            </>
          )}

          {/* Section — Overhauls a venir */}
          {s.overhauls && s.overhauls.length > 0 && (
            <>
              <div className="text-[9px] tracking-widest uppercase text-[var(--text-dim)] mb-2 mt-6">
                Overhauls ({s.overhauls.length})
              </div>
              <div className="rounded-xl overflow-x-auto mb-6" style={{ background: 'rgba(138,146,171,0.06)', border: '1px solid rgba(138,146,171,0.15)' }}>
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="text-[var(--text-dim)] uppercase tracking-wider text-[8px]">
                      <th className="text-left p-2">Moteur</th>
                      <th className="text-left p-2">Societe</th>
                      <th className="text-left p-2">Pieces dispo</th>
                      <th className="text-left p-2">OVH prevu</th>
                      <th className="text-left p-2">OVH revise</th>
                      <th className="text-left p-2">Glissement</th>
                      <th className="text-left p-2">Situation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.overhauls.map((o, i) => {
                      const gliss = o.glissementJours
                      const glissColor = gliss == null ? 'var(--text-dim)' : gliss > 0 ? '#E05C5C' : '#00ab63'
                      return (
                        <tr key={i} className="border-t border-[rgba(138,146,171,0.1)]">
                          <td className="p-2 text-[var(--text)]">{fmtGId(o.engine)}</td>
                          <td className="p-2 text-[var(--text-muted)]">{o.society || '—'}</td>
                          <td className="p-2 text-[var(--text-muted)]">
                            {o.piecesDispo != null ? `${Math.round(o.piecesDispo)}` : '—'}
                            {o.piecesEnAttente != null && o.piecesEnAttente > 0 ? ` / ${Math.round(o.piecesEnAttente)} att.` : ''}
                          </td>
                          <td className="p-2 text-[var(--text-muted)]">{o.dateOvhInitDebut || '—'}</td>
                          <td className="p-2 text-[var(--text-muted)]">{o.dateOvhRevuDebut || '—'}</td>
                          <td className="p-2" style={{ color: glissColor }}>
                            {gliss != null ? (gliss > 0 ? `+${Math.round(gliss)}j` : `${Math.round(gliss)}j`) : '—'}
                          </td>
                          <td className="p-2 text-[var(--text-muted)]">{o.situation || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </>
      )}
    </div>
  )
}


/** Generator detail panel — shows key KPIs for a single engine (new contracts model) */
function GeneratorDetailPanel({
  siteId, siteData, generator: g, generatorIndex,
  onClose, onNavigateGen,
}) {
  const s = siteData[siteId]
  const { currentFilter, selectedMonthIndex, selectedQuarter } = useFilters()

  const isContra = g.contradictory === true
  const isKO = g.statut === 'ko' && !isContra

  const statMap = {
    ok:    { label: 'En marche',    bg: 'rgba(0,171,99,0.12)',    color: 'var(--text)' },
    warn:  { label: 'Maintenance',  bg: 'rgba(245,166,35,0.12)',  color: 'var(--text)' },
    ko:    { label: 'Hors service', bg: 'rgba(224,92,92,0.12)',   color: 'var(--text)' },
    check: { label: 'A verifier — Donnees contradictoires', bg: 'rgba(160,90,255,0.12)', color: 'var(--text)' },
  }
  const st = isContra ? statMap.check : (statMap[g.statut] || statMap.ko)

  const lc = isContra ? 'rgba(160,90,255,0.65)' : isKO ? 'rgba(224,92,92,0.65)' : 'rgba(138,146,171,0.65)'

  // ── Power values ──
  const nominal   = g.nominal   != null ? parseFloat(g.nominal).toFixed(1)   : parseFloat(g.mw || 0).toFixed(1)
  const available = g.availableMw != null ? parseFloat(g.availableMw).toFixed(1) : null

  // ── Generator info ──
  const providerLabel = g.provider
    ? g.provider.toUpperCase()
    : null
  const providerColor = g.provider === 'vestop' ? '#5aafaf' : g.provider === 'lfo' ? '#f0a030' : 'var(--energy)'

  // ── Planning HEBDO for this engine (filtered from site.planning.engines) ──
  const planningEngine = (s.planning && s.planning.engines)
    ? s.planning.engines.find(e => e.id === g.id)
    : null
  const planningWeeks = (s.planning && s.planning.weeks) || []

  // ── Overhauls for this engine (filtered from site.overhauls) ──
  const engineOverhauls = (s.overhauls || []).filter(o => o.engine === g.id)

  return (
    <div className="site-detail-panel gd-panel">
      {/* No header needed — site name + generator name are in the banner */}

      {/* Generator nav strip */}
      <div className="gd-gen-nav">
        {s.groupes.map((gr, gi) => {
          const dotColor = gr.contradictory ? '#7b5fbf' : gr.statut === 'ok' ? 'var(--energy)' : gr.statut === 'warn' ? '#f0a030' : 'var(--red)'
          const active = gi === generatorIndex
          return (
            <button
              key={`${gr.id}-${gi}`}
              className={`gd-gen-nav-btn ${active ? 'active' : ''}`}
              onClick={() => onNavigateGen(gi)}
            >
              <span
                className="gen-status-dot"
                style={{
                  backgroundColor: dotColor,
                  boxShadow: `0 0 4px ${dotColor}, 0 0 8px ${dotColor}`,
                }}
              />
              {fmtEngineName(gr)}
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
              {g.condition || 'Panne / Breakdown'}
            </div>
          </div>
        </div>
      )}

      {/* Section — Puissance + Production */}
      <div className="gd-section-title">Puissance & production</div>
      <div className="gd-kpi-grid">
        <div className="gd-kpi-card">
          <div className="gd-kpi-label" style={{ color: lc }}>Puissance nominale</div>
          <div className="gd-kpi-value">
            {nominal}<span className="gd-kpi-unit">MW</span>
          </div>
          <div className="gd-kpi-sub">Plaque moteur</div>
        </div>
        <div className="gd-kpi-card">
          <div className="gd-kpi-label" style={{ color: lc }}>Puissance disponible</div>
          <div className="gd-kpi-value" style={{ color: available != null ? (isKO ? 'var(--red)' : 'var(--energy)') : 'var(--text-dim)' }}>
            {available != null ? available : '—'}<span className="gd-kpi-unit">MW</span>
          </div>
          <div className="gd-kpi-sub">Live — Situation moteurs</div>
        </div>
        {(() => {
          const mp = g.monthlyProd || []
          const totalProd = mp.reduce((s, v) => s + (v || 0), 0) / 1000  // kWh → MWh
          const hasProd = totalProd > 0
          return (
            <div className="gd-kpi-card">
              <div className="gd-kpi-label" style={{ color: lc }}>Production réelle</div>
              <div className={`gd-kpi-value${hasProd ? '' : ' hfo-kpi-na'}`} style={hasProd ? { color: 'var(--energy)' } : undefined}>
                {hasProd ? Math.round(totalProd).toLocaleString('fr-FR') : 'N/A'}
                <span className="gd-kpi-unit">MWh</span>
              </div>
              <div className="gd-kpi-sub">{hasProd ? 'Cumul annuel' : 'Pas de données'}</div>
            </div>
          )
        })()}
      </div>

      {/* Section — Chart Puissance & Production */}
      <GeneratorChart
        generator={g}
        filter={currentFilter}
        monthIndex={selectedMonthIndex}
        quarter={selectedQuarter}
        height={200}
      />

      {/* Section — Informations générateur */}
      <div className="gd-section-title">Informations générateur</div>
      <div className="gd-kpi-grid">
        <div className="gd-kpi-card">
          <div className="gd-kpi-label" style={{ color: lc }}>Modèle</div>
          <div className="gd-kpi-value" style={{ fontSize: 'clamp(13px,1.6vw,18px)' }}>
            {g.model || '—'}
          </div>
          <div className="gd-kpi-sub">Constructeur</div>
        </div>
        <div className="gd-kpi-card">
          <div className="gd-kpi-label" style={{ color: lc }}>Provider</div>
          <div className="gd-kpi-value" style={{ color: providerColor, fontSize: 'clamp(15px,1.8vw,20px)' }}>
            {providerLabel || '—'}
          </div>
          <div className="gd-kpi-sub">Fournisseur</div>
        </div>
        <div className="gd-kpi-card">
          <div className="gd-kpi-label" style={{ color: lc }}>Carburant</div>
          <div className="gd-kpi-value" style={{ fontSize: 'clamp(15px,1.8vw,20px)' }}>
            {g.fuel || '—'}
          </div>
          <div className="gd-kpi-sub">Type</div>
        </div>
        <div className="gd-kpi-card">
          <div className="gd-kpi-label" style={{ color: lc }}>Condition</div>
          <div className="gd-kpi-value" style={{ color: isKO ? 'var(--red)' : g.statut === 'warn' ? '#f0a030' : 'var(--energy)', fontSize: 'clamp(13px,1.5vw,17px)' }}>
            {g.condition || st.label}
          </div>
          <div className="gd-kpi-sub">
            {g.jourArret > 0 ? `${g.jourArret} jours d'arrêt` : 'Etat actuel'}
          </div>
        </div>
      </div>

      {/* Section — Planning HEBDO pour ce moteur */}
      {planningEngine && planningWeeks.length > 0 && (
        <>
          <div className="gd-section-title">Planning hebdomadaire ({planningWeeks.length} semaines)</div>
          <div className="rounded-xl overflow-x-auto mb-6" style={{ background: 'rgba(138,146,171,0.06)', border: '1px solid rgba(138,146,171,0.15)' }}>
            <table className="w-full text-[9px] border-collapse" style={{ minWidth: 780 }}>
              <thead>
                <tr>
                  <th className="sticky left-0 text-left p-2 text-[var(--text-dim)] uppercase tracking-wider text-[8px]" style={{ background: 'rgba(20,24,40,0.95)' }}>Semaine</th>
                  {planningWeeks.map((w, i) => (
                    <th key={i} className="p-0.5 text-[7px] text-[var(--text-dim)] text-center font-normal" style={{ minWidth: 14 }}>
                      {typeof w === 'string' ? w.replace(/^S/, '') : (i + 1)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[rgba(138,146,171,0.1)]">
                  <td className="sticky left-0 p-2 text-[10px] text-[var(--text)] whitespace-nowrap" style={{ background: 'rgba(20,24,40,0.95)' }}>
                    {fmtGId(g.id)}
                  </td>
                  {(planningEngine.weeks || []).map((status, i) => {
                    const color =
                      status === 'indisponible' ? '#f0a030' :
                      status === 'maintenance'  ? '#4a8fd6' :
                      'transparent'
                    const title =
                      status === 'indisponible' ? `S${i + 1} — Indisponible` :
                      status === 'maintenance'  ? `S${i + 1} — Maintenance` :
                      `S${i + 1}`
                    return (
                      <td key={i} className="p-0.5" title={title}>
                        <div className="h-3 rounded-sm" style={{ background: color, border: status ? 'none' : '1px dashed rgba(138,146,171,0.15)' }} />
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 text-[9px] text-[var(--text-dim)] -mt-4 mb-6">
            <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#f0a030' }} />Indisponible</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#4a8fd6' }} />Maintenance</span>
          </div>
        </>
      )}

      {/* Section — Overhauls pour ce moteur */}
      {engineOverhauls.length > 0 && (
        <>
          <div className="gd-section-title">Overhauls ({engineOverhauls.length})</div>
          <div className="rounded-xl overflow-x-auto mb-6" style={{ background: 'rgba(138,146,171,0.06)', border: '1px solid rgba(138,146,171,0.15)' }}>
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="text-[var(--text-dim)] uppercase tracking-wider text-[8px]">
                  <th className="text-left p-2">Societe</th>
                  <th className="text-left p-2">Pieces dispo</th>
                  <th className="text-left p-2">OVH prevu</th>
                  <th className="text-left p-2">OVH revise</th>
                  <th className="text-left p-2">Glissement</th>
                  <th className="text-left p-2">Situation</th>
                </tr>
              </thead>
              <tbody>
                {engineOverhauls.map((o, i) => {
                  const gliss = o.glissementJours
                  const glissColor = gliss == null ? 'var(--text-dim)' : gliss > 0 ? '#E05C5C' : '#00ab63'
                  return (
                    <tr key={i} className="border-t border-[rgba(138,146,171,0.1)]">
                      <td className="p-2 text-[var(--text-muted)]">{o.society || '—'}</td>
                      <td className="p-2 text-[var(--text-muted)]">
                        {o.piecesDispo != null ? `${Math.round(o.piecesDispo)}` : '—'}
                        {o.piecesEnAttente != null && o.piecesEnAttente > 0 ? ` / ${Math.round(o.piecesEnAttente)} att.` : ''}
                      </td>
                      <td className="p-2 text-[var(--text-muted)]">{o.dateOvhInitDebut || '—'}</td>
                      <td className="p-2 text-[var(--text-muted)]">{o.dateOvhRevuDebut || '—'}</td>
                      <td className="p-2" style={{ color: glissColor }}>
                        {gliss != null ? (gliss > 0 ? `+${Math.round(gliss)}j` : `${Math.round(gliss)}j`) : '—'}
                      </td>
                      <td className="p-2 text-[var(--text-muted)]">{o.situation || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
