const CLR = '#5e4c9f'

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="unified-card text-center p-5">
      <div className="text-[9px] font-bold tracking-[0.3em] uppercase mb-2"
        style={{ color: 'var(--text-dim)' }}>{label}</div>
      <div className="text-[28px] font-extrabold" style={{ color: color || 'var(--text)' }}>{value}</div>
      <div className="text-[10px] mt-1" style={{ color: 'var(--text-dim)' }}>{sub}</div>
    </div>
  )
}

export default function RecouvrementDetail() {
  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      <div className="text-[9px] font-bold tracking-[0.4em] uppercase mb-[18px]"
        style={{ color: 'var(--text-dim)' }}>
        Vue consolid&eacute;e &middot; Encaissements & cr&eacute;ances
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <KpiCard label="Encours total" value={'— M$'} sub="Créances clients" color={CLR} />
        <KpiCard label="Taux recouvrement" value={'— %'} sub="Encaissements / CA" />
        <KpiCard label="Impayés" value={'— M$'} sub="En souffrance" color="#e05c5c" />
        <KpiCard label="Délai moyen" value={'— j'} sub="DSO (Days Sales Out.)" color={CLR} />
        <KpiCard label="Recouvrement mois" value={'— M$'} sub="Encaissé ce mois" color="#00ab63" />
      </div>

      {/* Placeholders */}
      <div className="unified-card text-center p-10 mb-6"
        style={{ border: '1px dashed rgba(94,76,159,0.15)', color: 'var(--text-dim)', fontSize: 13 }}>
        Aging report / balance &acirc;g&eacute;e &mdash; Donn&eacute;es &agrave; int&eacute;grer
      </div>
      <div className="unified-card text-center p-10 min-h-[200px] flex items-center justify-center"
        style={{ border: '1px dashed rgba(94,76,159,0.15)', color: 'var(--text-dim)', fontSize: 13 }}>
        &Eacute;volution encours / courbe recouvrement &mdash; Espace r&eacute;serv&eacute;
      </div>
    </div>
  )
}
