import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './context/AuthContext'
import { FilterProvider } from './context/FilterContext'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

const Accueil = lazy(() => import('./pages/Accueil'))
const Energy = lazy(() => import('./pages/energy/Energy'))
const EnergyOverview = lazy(() => import('./pages/energy/EnergyOverview'))
const HfoDetail = lazy(() => import('./pages/energy/HfoDetail'))
const EnrDetail = lazy(() => import('./pages/energy/EnrDetail'))
const Properties = lazy(() => import('./pages/properties/Properties'))
const PropertiesOverview = lazy(() => import('./pages/properties/PropertiesOverview'))
const DevDetail = lazy(() => import('./pages/properties/DevDetail'))
const TvxDetail = lazy(() => import('./pages/properties/TvxDetail'))
const SavDetail = lazy(() => import('./pages/properties/SavDetail'))
const ComDetail = lazy(() => import('./pages/properties/ComDetail'))
const Capex = lazy(() => import('./pages/Capex'))
const Investments = lazy(() => import('./pages/Investments'))

// Loading fallback
const Loading = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-[var(--text-muted)] text-sm">Chargement...</div>
  </div>
)

// Placeholder for sections not yet built
function Placeholder({ name }) {
  return (
    <div className="p-8 text-center">
      <h1 className="text-xl font-bold">{name}</h1>
      <p className="text-[var(--text-muted)] mt-2">En construction...</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FilterProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Accueil />} />
                <Route path="energy" element={<Energy />}>
                  <Route index element={<EnergyOverview />} />
                  <Route path="hfo" element={<HfoDetail />} />
                  <Route path="enr" element={<EnrDetail />} />
                </Route>
                <Route path="properties" element={<Properties />}>
                  <Route index element={<PropertiesOverview />} />
                  <Route path="dev" element={<DevDetail />} />
                  <Route path="tvx" element={<TvxDetail />} />
                  <Route path="sav" element={<SavDetail />} />
                  <Route path="com" element={<ComDetail />} />
                </Route>
                <Route path="capex" element={<Capex />} />
                <Route path="investments" element={<Investments />} />
                <Route path="reporting/*" element={<Placeholder name="Reporting" />} />
                <Route path="csi" element={<Placeholder name="CSI" />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </FilterProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
