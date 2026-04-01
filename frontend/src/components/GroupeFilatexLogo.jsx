import { useThemedLogo } from '../hooks/useThemedLogo'

/* ── Groupe Filatex logo — switches between dark/light SVG ── */
export default function GroupeFilatexLogo({ className = 'logo-groupe', style }) {
  const src = useThemedLogo('filatex')
  return (
    <img
      src={src}
      alt="Groupe Filatex"
      className={className}
      style={{ height: 120, ...style }}
      draggable={false}
    />
  )
}
