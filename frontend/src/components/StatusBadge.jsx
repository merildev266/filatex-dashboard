const STATUS_STYLES = {
  termine: { bg: 'rgba(0,171,99,0.15)', color: '#00ab63', label: 'Termine' },
  en_cours: { bg: 'rgba(90,175,175,0.15)', color: '#5aafaf', label: 'En cours' },
  non_demarre: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', label: 'Non demarre' },
  indefini: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', label: 'Indefini' },
  delay: { bg: 'rgba(224,92,92,0.15)', color: '#E05C5C', label: 'En retard' },
}

export default function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.indefini
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}
