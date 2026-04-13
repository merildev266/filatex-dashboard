import NeonDot from '../../components/NeonDot'

/**
 * HfoVestopCard — Virtual "VESTOP" site card showing the cross-site
 * VESTOP repartition (Tamatave / Majunga / Antsirabe / Fihaonana).
 *
 * Layout (aligné sur les autres cartes HFO) :
 *   Ligne 1 : Puissance — Dispo | % | Contrat (total VESTOP)
 *   Lignes suivantes : chaque ville, nom à gauche, puissance (dispo/contrat MW) à droite.
 *
 * Props:
 *   siteData        — full site data map { tamatave, majunga, ... }
 *   totalContract   — total VESTOP contract (MW) from HFO_GLOBAL.vestopTotalContract
 */
export default function HfoVestopCard({ siteData = {}, totalContract = 0, onClick }) {
  // Sites hosting VESTOP engines (per hfo_config.SITES_WITH_VESTOP)
  const VESTOP_SITES = ['tamatave', 'majunga', 'antsirabe', 'fihaonana']

  // Build per-site VESTOP breakdown from Situation moteurs (groupes)
  const rows = VESTOP_SITES
    .map(id => {
      const s = siteData[id]
      if (!s) return null
      const contrat = (s.contracts?.vestop) || 0
      let dispo = 0
      for (const g of (s.groupes || [])) {
        const prov = (g.provider || '').toLowerCase()
        if (prov === 'vestop' && g.statut === 'ok' && g.availableMw != null) {
          const v = +g.availableMw
          if (!Number.isNaN(v)) dispo += v
        }
      }
      dispo = Math.round(dispo * 10) / 10
      return { id, name: s.name || id, contrat, dispo }
    })
    .filter(r => r && (r.contrat > 0 || r.dispo > 0))

  const totalDispo = Math.round(rows.reduce((a, r) => a + (r.dispo || 0), 0) * 10) / 10
  const totalContrat = totalContract > 0
    ? totalContract
    : rows.reduce((a, r) => a + (r.contrat || 0), 0)
  const pct = totalContrat > 0 ? Math.round((totalDispo / totalContrat) * 100) : 0

  const colorFor = (p) => p == null ? '#8a92ab'
    : p >= 100 ? '#00ab63'
    : p >= 80 ? '#f37056'
    : '#E05C5C'
  const color = colorFor(pct)
  const neonStatus = totalContrat > 0 && pct >= 100 ? 'ok' : 'ko'

  const labelColor = 'rgba(90,175,175,0.7)'
  const borderColor = 'rgba(90,175,175,0.22)'

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Header label above card */}
      <div className="flex items-center justify-center gap-2 h-[26px]">
        <NeonDot status={neonStatus} size={8} />
        <span className="text-xs tracking-wider uppercase" style={{ color: '#5aafaf' }}>VESTOP</span>
      </div>

      {/* Card */}
      <div
        onClick={onClick}
        className={`glass-card p-4 flex-1 flex flex-col ${onClick ? 'clickable-energy' : ''}`}
        style={{ borderColor: 'rgba(90,175,175,0.28)', cursor: onClick ? 'pointer' : 'default' }}
      >
        {/* ═══ Ligne 1 : Puissance — Dispo | % | Contrat ═══ */}
        <div className="pb-2.5 border-b mb-2.5" style={{ borderColor }}>
          <div className="text-[8px] tracking-widest uppercase text-center mb-2" style={{ color: labelColor }}>
            Puissance
          </div>
          <div className="relative grid grid-cols-2 gap-2 items-center">
            {/* Col gauche : Dispo VESTOP total */}
            <div className="text-center">
              <div className="text-lg leading-none" style={{ color }}>
                {totalDispo.toFixed(1)}
                <span className="text-[8px] font-normal text-[var(--text-muted)] ml-0.5">MW</span>
              </div>
              <div className="text-[8px] mt-0.5 tracking-widest uppercase" style={{ color: '#5aafaf' }}>VESTOP</div>
            </div>
            {/* Col droite : Contrat total */}
            <div className="text-center">
              <div className="text-lg leading-none text-[var(--text-muted)]">
                {totalContrat.toFixed(1)}
                <span className="text-[8px] font-normal text-[var(--text-muted)] ml-0.5">MW</span>
              </div>
              <div className="text-[8px] text-[var(--text-dim)] mt-0.5">Contrat</div>
            </div>
            {/* % au milieu — absolument positionné entre les 2 colonnes */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] leading-none px-1" style={{ color }}>
              {totalContrat > 0 ? `${pct}%` : '—'}
            </div>
          </div>
        </div>

        {/* ═══ Lignes 2..N : une ligne par ville, alignée sur les colonnes de la ligne 1 ═══ */}
        <div className="flex-1 flex flex-col justify-around gap-2">
          {rows.map(r => {
            const rPct = r.contrat > 0 ? Math.round((r.dispo / r.contrat) * 100) : 0
            const rColor = colorFor(rPct)
            return (
              <div key={r.id} className="grid grid-cols-2 gap-2 items-center">
                {/* Col gauche (alignée avec Dispo) : nom de la ville */}
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-widest" style={{ color: labelColor }}>
                    {r.name}
                  </div>
                </div>
                {/* Col droite (alignée avec Contrat) : puissance dispo / contrat */}
                <div className="text-center tabular-nums leading-none">
                  <span className="text-base" style={{ color: rColor }}>
                    {r.dispo.toFixed(1)}
                  </span>
                  <span className="text-[9px] text-[var(--text-dim)] mx-1">/</span>
                  <span className="text-base text-[var(--text-muted)]">
                    {r.contrat.toFixed(1)}
                  </span>
                  <span className="text-[8px] font-normal text-[var(--text-muted)] ml-0.5">MW</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
