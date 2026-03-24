import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './context/AuthContext'
import { FilterProvider } from './context/FilterContext'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

const Accueil = lazy(() => import('./pages/Accueil'))

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
                <Route path="energy/*" element={<Placeholder name="Energy" />} />
                <Route path="properties/*" element={<Placeholder name="Properties" />} />
                <Route path="capex" element={<Placeholder name="CAPEX" />} />
                <Route path="investments" element={<Placeholder name="Investments" />} />
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
