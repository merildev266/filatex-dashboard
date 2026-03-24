import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-dark pb-14">
      <Outlet />
      <BottomNav />
    </div>
  )
}
