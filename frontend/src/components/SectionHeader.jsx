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
    <div className="sticky top-0 z-50 section-banner">
      <div className="flex items-center px-4 py-3" style={{ position: 'relative' }}>
        <div className="nav-back">
          <button
            onClick={handleBack}
            className="section-back-btn text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg
                       bg-transparent cursor-pointer transition-colors"
            style={{ border: `1px solid ${color}4D`, color }}
          >
            {label}
          </button>
        </div>
        <div
          className="section-title-center text-sm font-extrabold tracking-wider uppercase"
          style={{
            color,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ width: 70 }} />
      </div>
      <div style={{ height: 2, background: color, opacity: 0.5 }} />
    </div>
  )
}
