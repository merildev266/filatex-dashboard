import { useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { pole: 'home', path: '/', label: 'Accueil' },
  { pole: 'energy', path: '/energy', label: 'Energy' },
  { pole: 'investments', path: '/investments', label: 'Invest.' },
  { pole: 'properties', path: '/properties', label: 'Properties' },
  { pole: 'capex', path: '/capex', label: 'CAPEX' },
  { pole: 'csi', path: '/csi', label: 'CSI' },
  { pole: 'reporting', path: '/reporting', label: 'Reporting' },
]

const POLE_COLORS = {
  home: 'rgba(255,255,255,0.7)',
  energy: '#00ab63',
  investments: '#f37056',
  properties: '#FDB823',
  capex: '#5e4c9f',
  csi: '#0096c7',
  reporting: '#5aafaf',
}

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const activePole = NAV_ITEMS.find(
    (item) => item.path !== '/' && location.pathname.startsWith(item.path)
  )?.pole || 'home'

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 z-[900]
                    bg-[rgba(8,11,24,0.92)] backdrop-blur-[16px]
                    border-t border-[rgba(255,255,255,0.06)]
                    flex justify-around items-center">
      {NAV_ITEMS.map((item) => {
        const isActive = activePole === item.pole
        const color = isActive ? POLE_COLORS[item.pole] : 'rgba(255,255,255,0.25)'
        return (
          <button
            key={item.pole}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-[3px] bg-transparent border-none
                       cursor-pointer relative py-1 px-2"
            style={{ color }}
          >
            <span className="text-[8px] font-bold uppercase tracking-[0.1em]">
              {item.label}
            </span>
            {isActive && (
              <span
                className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
