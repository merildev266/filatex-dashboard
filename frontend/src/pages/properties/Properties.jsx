import { Outlet, useNavigate, useLocation } from 'react-router-dom'

export default function Properties() {
  const navigate = useNavigate()
  const location = useLocation()
  const isRoot = location.pathname === '/properties'

  return (
    <div className="min-h-[calc(100dvh-56px)]">
      {/* Section header */}
      <div className="sticky top-0 z-50 bg-dark/90 backdrop-blur-sm border-b border-[var(--border)]">
        <div className="h-[3px] bg-[#FDB823]" />
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => isRoot ? navigate('/') : navigate('/properties')}
            className="text-[var(--text-muted)] hover:text-white text-base
                       bg-transparent border-none cursor-pointer"
          >
            &#8592;
          </button>
          <h1 className="text-sm font-bold uppercase tracking-wider text-[#FDB823]">
            Properties
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
