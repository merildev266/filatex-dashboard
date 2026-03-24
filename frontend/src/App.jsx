import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FilterProvider } from './context/FilterContext'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FilterProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <div className="min-h-screen bg-dark text-white flex items-center justify-center">
                  <p className="text-xl">Dashboard — Authenticated</p>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </FilterProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
