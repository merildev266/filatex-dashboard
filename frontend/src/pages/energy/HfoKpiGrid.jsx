/**
 * HfoKpiGrid — Unified KPI grid used at every HFO level
 * (Accueil HFO / Accueil Site / Accueil Générateur).
 *
 * Displays the standard set of KPIs the DG wants to see everywhere:
 *   - Puissance : 2 cartes provider (ENELEC, VESTOP) avec Contrat VS Disponible
 *   - Production réelle (from per-site monthly xlsx via site.kpi)
 *   - SFOC / SLOC (from per-site monthly xlsx — Tamatave first)
 *   - Blackouts (from per-site monthly xlsx via site.blackoutStats)
 *   - Moteurs en marche / à l'arrêt
 *
 * Props:
 *   contratEnelec   number     — Contrat ENELEC en MW
 *   contratVestop   number     — Contrat VESTOP en MW
 *   dispoEnelec     number     — Disponible ENELEC en MW (sum availableMw ENELEC)
 *   dispoVestop     number     — Disponible VESTOP en MW (sum availableMw VESTOP)
 *   running         number     — nombre de moteurs en marche
 *   totalEngines    number     — nombre total de moteurs
 *   production      number|null — Production réelle (MWh) pour la période
 *   productionSub   string     — libellé période (ex: "Avril 2026")
 *   sfoc            number|null — g/kWh
 *   sloc            number|null — g/kWh
 *   blackouts       number|null — nombre de blackouts pour la période
 *   blackoutsSub    string     — libellé période
 *   variant         'hfo'|'site'|'generator'
 *   siteScope       boolean    — true si les KPIs prod/sfoc/sloc/blackout
 *                                viennent du SITE (utilisé au niveau Générateur)
 */
export default function HfoKpiGrid({
  contratEnelec = 0,
  contratVestop = 0,
  dispoEnelec = 0,
  dispoVestop = 0,
  running = 0,
  totalEngines = 0,
  production = null,
  productionSub = 'Mois courant',
  sfoc = null,
  sloc = null,
  blackouts = null,
  blackoutsSub = 'Mois courant',
  variant = 'hfo',
  siteScope = false,
}) {
  const arret = Math.max(0, (totalEngines || 0) - (running || 0))

  // Color rule for Dispo vs Contrat per provider
  const pctEnelec = contratEnelec > 0 ? (dispoEnelec / contratEnelec) * 100 : 0
  const pctVestop = contratVestop > 0 ? (dispoVestop / contratVestop) * 100 : 0
  const colorFor = (pct) => pct >= 100 ? 'var(--energy)' : pct >= 80 ? '#f0a030' : 'var(--red)'
  const colorEnelec = colorFor(pctEnelec)
  const colorVestop = colorFor(pctVestop)
  const arretColor = arret === 0 ? 'var(--energy)' : arret <= 2 ? '#f0a030' : 'var(--red)'

  const hasEnelec = contratEnelec > 0
  const hasVestop = contratVestop > 0
  const nCards = (hasEnelec ? 1 : 0) + (hasVestop ? 1 : 0)

  // Format helpers
  const fmt = (v, digits = 1) => (v == null || Number.isNaN(+v)) ? null : parseFloat(v).toFixed(digits)
  const fmtInt = (v) => (v == null || Number.isNaN(+v)) ? null : Math.round(v).toString()

  const prodStr  = fmtInt(production)
  const sfocStr  = fmt(sfoc, 0)
  const slocStr  = fmt(sloc, 2)
  const boStr    = blackouts != null ? String(blackouts) : null

  const siteTag = siteScope ? ' (site)' : ''

  return (
    <div className="hfo-kpi-grid">
      {/* ── Row 1: Puissance — 2 cartes ENELEC / VESTOP (Contrat VS Disponible) ── */}
      <div className="hfo-kpi-section">
        <div className="hfo-kpi-section-label">Puissance</div>
        <div className={`hfo-kpi-cards ${nCards === 2 ? 'n-2' : 'n-1'}`}>
          {hasEnelec && (
            <div className="hfo-kpi-card">
              <div className="hfo-kpi-label">ENELEC</div>
              <div className="hfo-kpi-provider-row">
                <div className="hfo-kpi-prov-col">
                  <div className="hfo-kpi-value-sm" style={{ color: colorEnelec }}>
                    {(dispoEnelec || 0).toFixed(1)}
                    <span className="hfo-kpi-unit">MW</span>
                  </div>
                  <div className="hfo-kpi-sub">Disponible</div>
                </div>
                <div className="hfo-kpi-prov-pct" style={{ color: colorEnelec }}>
                  {pctEnelec.toFixed(0)}%
                </div>
                <div className="hfo-kpi-prov-col">
                  <div className="hfo-kpi-value-sm">
                    {contratEnelec.toFixed(1)}
                    <span className="hfo-kpi-unit">MW</span>
                  </div>
                  <div className="hfo-kpi-sub">Contrat</div>
                </div>
              </div>
            </div>
          )}
          {hasVestop && (
            <div className="hfo-kpi-card">
              <div className="hfo-kpi-label">VESTOP</div>
              <div className="hfo-kpi-provider-row">
                <div className="hfo-kpi-prov-col">
                  <div className="hfo-kpi-value-sm" style={{ color: colorVestop }}>
                    {(dispoVestop || 0).toFixed(1)}
                    <span className="hfo-kpi-unit">MW</span>
                  </div>
                  <div className="hfo-kpi-sub">Disponible</div>
                </div>
                <div className="hfo-kpi-prov-pct" style={{ color: colorVestop }}>
                  {pctVestop.toFixed(0)}%
                </div>
                <div className="hfo-kpi-prov-col">
                  <div className="hfo-kpi-value-sm">
                    {contratVestop.toFixed(1)}
                    <span className="hfo-kpi-unit">MW</span>
                  </div>
                  <div className="hfo-kpi-sub">Contrat</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Production + SFOC/SLOC + Blackouts + Moteurs ── */}
      <div className="hfo-kpi-section">
        <div className="hfo-kpi-section-label">Production & exploitation</div>
        <div className="hfo-kpi-cards n-5">
          <div className="hfo-kpi-card">
            <div className="hfo-kpi-label">Production réelle</div>
            {prodStr != null ? (
              <>
                <div className="hfo-kpi-value">
                  {prodStr}<span className="hfo-kpi-unit">MWh</span>
                </div>
                <div className="hfo-kpi-sub">{productionSub}{siteTag}</div>
              </>
            ) : (
              <>
                <div className="hfo-kpi-value hfo-kpi-na">
                  N/A<span className="hfo-kpi-unit">MWh</span>
                </div>
                <div className="hfo-kpi-sub">Données à venir</div>
              </>
            )}
          </div>
          <div className="hfo-kpi-card">
            <div className="hfo-kpi-label">SFOC</div>
            {sfocStr != null ? (
              <>
                <div className="hfo-kpi-value">
                  {sfocStr}<span className="hfo-kpi-unit">g/kWh</span>
                </div>
                <div className="hfo-kpi-sub">{productionSub}{siteTag}</div>
              </>
            ) : (
              <>
                <div className="hfo-kpi-value hfo-kpi-na">
                  N/A<span className="hfo-kpi-unit">g/kWh</span>
                </div>
                <div className="hfo-kpi-sub">Données à venir</div>
              </>
            )}
          </div>
          <div className="hfo-kpi-card">
            <div className="hfo-kpi-label">SLOC</div>
            {slocStr != null ? (
              <>
                <div className="hfo-kpi-value">
                  {slocStr}<span className="hfo-kpi-unit">g/kWh</span>
                </div>
                <div className="hfo-kpi-sub">{productionSub}{siteTag}</div>
              </>
            ) : (
              <>
                <div className="hfo-kpi-value hfo-kpi-na">
                  N/A<span className="hfo-kpi-unit">g/kWh</span>
                </div>
                <div className="hfo-kpi-sub">Données à venir</div>
              </>
            )}
          </div>
          <div className="hfo-kpi-card">
            <div className="hfo-kpi-label">Blackouts</div>
            {boStr != null ? (
              <>
                <div className="hfo-kpi-value" style={{ color: blackouts === 0 ? 'var(--energy)' : blackouts <= 2 ? '#f0a030' : 'var(--red)' }}>
                  {boStr}
                </div>
                <div className="hfo-kpi-sub">{blackoutsSub}{siteTag}</div>
              </>
            ) : (
              <>
                <div className="hfo-kpi-value hfo-kpi-na">N/A</div>
                <div className="hfo-kpi-sub">Données à venir</div>
              </>
            )}
          </div>
          <div className="hfo-kpi-card">
            <div className="hfo-kpi-label">Moteurs</div>
            <div className="hfo-kpi-value">
              <span style={{ color: 'var(--energy)' }}>{running}</span>
              <span className="hfo-kpi-sep"> / </span>
              <span style={{ color: arretColor }}>{arret}</span>
            </div>
            <div className="hfo-kpi-sub">Marche / Arrêt ({totalEngines})</div>
          </div>
        </div>
      </div>
    </div>
  )
}
