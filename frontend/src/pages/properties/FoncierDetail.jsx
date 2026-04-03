const CLR = '#FDB823'

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="unified-card text-center p-5">
      <div className="text-[9px] font-bold tracking-[0.3em] uppercase mb-2"
        style={{ color: 'var(--text-dim)' }}>{label}</div>
      <div className="text-[28px] font-extrabold" style={{ color: color || '#fff' }}>{value}</div>
      <div className="text-[10px] mt-1" style={{ color: 'var(--text-dim)' }}>{sub}</div>
    </div>
  )
}

export default function FoncierDetail() {
  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      <div className="text-[9px] font-bold tracking-[0.4em] uppercase mb-[18px]"
        style={{ color: 'var(--text-dim)' }}>
        Vue consolid&eacute;e &middot; Acquisitions terrain
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <KpiCard label="Terrains acquis" value={'—'} sub="Total portefeuille" color={CLR} />
        <KpiCard label="Surface totale" value={'— m²'} sub="Cumul acquisitions" />
        <KpiCard label="Budget foncier" value={'— M$'} sub="Engagé / planifié" color={CLR} />
        <KpiCard label="En cours d'acquisition" value={'—'} sub="Négociation / signature" color={CLR} />
      </div>

      {/* Placeholders */}
      <div className="unified-card text-center p-10 mb-6"
        style={{ border: '1px dashed rgba(253,184,35,0.15)', color: 'var(--text-dim)', fontSize: 13 }}>
        Liste des terrains &mdash; Donn&eacute;es &agrave; int&eacute;grer
      </div>
      <div className="unified-card text-center p-10 min-h-[200px] flex items-center justify-center"
        style={{ border: '1px dashed rgba(253,184,35,0.15)', color: 'var(--text-dim)', fontSize: 13 }}>
        Carte / r&eacute;partition g&eacute;ographique &mdash; Espace r&eacute;serv&eacute;
      </div>
    </div>
  )
}
