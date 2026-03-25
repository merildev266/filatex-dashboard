import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  return (
    <div className={`min-h-screen bg-dark ${isHome ? '' : 'pb-14'}`}>
      <Outlet />
      <BottomNav />
    </div>
  )
}
