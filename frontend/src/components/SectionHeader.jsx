import { useNavigate } from 'react-router-dom'

/**
 * Standalone sticky header for sections without nested routes.
 * Same design as SectionLayout header.
 */
export default function SectionHeader({ name, color, onBack }) {
  const navigate = useNavigate()
  const handleBack = onBack || (() => navigate('/'))
  const label = onBack ? name : 'Accueil'

  return (
    <div
      className="sticky top-0 z-50 flex items-center px-4 py-3"
      style={{
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${color}22`,
      }}
    >
      <div className="nav-back">
        <button
          onClick={handleBack}
          className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg
                     bg-transparent cursor-pointer transition-colors"
          style={{
            border: `1px solid ${color}4D`,
            color: color,
          }}
        >
          {label}
        </button>
      </div>
      <div
        className="flex-1 text-center text-sm font-extrabold tracking-wider uppercase"
        style={{ color }}
      >
        {name}
      </div>
      <div style={{ width: 70 }} />
    </div>
  )
}
