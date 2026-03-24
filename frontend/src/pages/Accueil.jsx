import { useNavigate } from 'react-router-dom'

const SECTIONS = [
  { pole: 'energy', label: 'Energy', color: '#00ab63', path: '/energy' },
  { pole: 'investments', label: 'Investments', color: '#f37056', path: '/investments' },
  { pole: 'properties', label: 'Properties', color: '#FDB823', path: '/properties' },
  { pole: 'capex', label: 'CAPEX', color: '#5e4c9f', path: '/capex' },
  { pole: 'csi', label: 'CSI', color: '#0096c7', path: '/csi' },
  { pole: 'reporting', label: 'Reporting', color: '#5aafaf', path: '/reporting' },
]

export default function Accueil() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[calc(100dvh-56px)] flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-wide">Groupe Filatex</h1>
        <div className="w-12 h-px bg-[var(--border)] mx-auto my-3" />
        <div className="text-[9px] uppercase tracking-[0.4em] text-[var(--text-muted)]">
          PMO Dashboard
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-[720px]">
        {SECTIONS.map((section) => {
          const r = parseInt(section.color.slice(1, 3), 16)
          const g = parseInt(section.color.slice(3, 5), 16)
          const b = parseInt(section.color.slice(5, 7), 16)
          return (
            <button
              key={section.pole}
              onClick={() => navigate(section.path)}
              className="glass-card p-8 text-center relative overflow-hidden group
                         cursor-pointer border-none transition-transform
                         hover:-translate-y-2.5 active:-translate-y-1 active:scale-[0.99]"
              style={{ background: `rgba(${r},${g},${b},0.06)` }}
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-b"
                style={{ backgroundColor: section.color }}
              />
              <div className="text-sm font-bold uppercase tracking-wider" style={{ color: section.color }}>
                {section.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center opacity-20">
        <div className="text-[11px] italic">Ceci n'est pas un Dashboard.</div>
        <div className="text-[6px] uppercase tracking-wider mt-1">Made by PMO with ♥</div>
      </div>
    </div>
  )
}
