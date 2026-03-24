import { Outlet, useNavigate, useLocation } from 'react-router-dom'

export default function Reporting() {
  const navigate = useNavigate()
  const location = useLocation()
  const isRoot = location.pathname === '/reporting'

  return (
    <div className="min-h-[calc(100dvh-56px)]">
      {/* Section header */}
      <div className="sticky top-0 z-50 bg-dark/90 backdrop-blur-sm border-b border-[rgba(90,175,175,0.15)]">
        <div className="h-[3px] bg-[#5aafaf]" />
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => isRoot ? navigate('/') : navigate('/reporting')}
            className="text-[var(--text-muted)] hover:text-white text-base
                       bg-transparent border-none cursor-pointer"
          >
            {'\u2190'}
          </button>
          <h1 className="text-sm font-bold uppercase tracking-wider text-[#5aafaf]">
            Reporting Hebdomadaire
          </h1>
        </div>
      </div>

      {/* Child routes */}
      <div className="p-4 md:p-6">
        <Outlet />
      </div>
    </div>
  )
}
