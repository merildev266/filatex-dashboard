import { useNavigate } from 'react-router-dom'

const ACCENT = '#0096c7'

export default function Csi() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: 'var(--dark, #000000)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: `2px solid ${ACCENT}` }}
      >
        <button
          onClick={() => navigate('/')}
          className="text-white/60 hover:text-white transition-colors text-sm"
        >
          &larr; Accueil
        </button>
        <h1 className="text-lg font-bold" style={{ color: ACCENT }}>
          CSI
        </h1>
      </div>

      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center py-32 px-8 text-center">
        <div
          className="text-5xl font-bold mb-4"
          style={{ color: ACCENT }}
        >
          CSI
        </div>
        <p className="text-white/40 text-lg">
          Coming Soon
        </p>
      </div>
    </div>
  )
}
