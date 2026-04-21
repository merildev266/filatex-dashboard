import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import GroupeFilatexLogo from './GroupeFilatexLogo'
import ThemeToggle from './ThemeToggle'
import { prefetchAllPages } from '../App'

const MOTIF_BASE = import.meta.env.BASE_URL + 'logos'

export default function Login() {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, refreshData } = useAuth()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const motifSrc = theme === 'dark' ? `${MOTIF_BASE}/motif-dark.svg` : `${MOTIF_BASE}/motif-light.svg`

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username.trim()) { setError('Identifiant requis'); return }
    setLoading(true)
    setError('')
    const result = await login(username.trim().toLowerCase(), pin)
    setLoading(false)
    if (!result.success) {
      setError(result.error)
      setPin('')
      return
    }
    // Trigger data refresh from Excel in background (non-blocking)
    refreshData(result.token)
    prefetchAllPages()
    navigate('/')
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-dark flex items-center justify-center overflow-hidden">
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          width: '100%', height: '100%',
          backgroundImage: `url(${motifSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 1,
        }} />
      </div>
      <div className="relative z-10 flex flex-col items-center w-[88%] max-w-[400px] login-layout">
        <div className="flex flex-col items-center login-logo-block">
          <GroupeFilatexLogo style={{ width: '420px', maxWidth: '85vw', height: 'auto' }} />
          <div
            className="login-label uppercase mt-2"
            style={{ fontFamily: "'Aeonik', sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: '0.35em' }}
          >
            Dashboard
          </div>
        </div>

        <form onSubmit={handleLogin} className="w-full text-center login-form-block">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Identifiant"
            autoFocus
            autoComplete="username"
            className="login-card w-full rounded-2xl px-5 py-4 text-[var(--text)] text-base text-center outline-none
                       transition-colors mb-3"
          />
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Code PIN"
            autoComplete="current-password"
            className="login-card w-full rounded-2xl px-5 py-4 text-[var(--text)] text-base text-center outline-none
                       tracking-[0.5em] transition-colors mb-4"
            style={{ fontFamily: "'Aeonik', sans-serif" }}
          />
          <button
            type="submit"
            disabled={loading}
            className="login-card w-full rounded-2xl px-5 py-4 text-[var(--text)] text-sm uppercase tracking-wider
                       transition-colors cursor-pointer disabled:opacity-50"
            style={{ fontFamily: "'Aeonik', sans-serif", letterSpacing: '0.2em' }}
          >
            {loading ? 'Connexion...' : 'Acceder'}
          </button>
          {error && (
            <div className="mt-4 text-[#ff5a5a] text-sm">{error}</div>
          )}
          <div
            className="mt-5 text-[10px] text-[rgba(255,255,255,0.4)]"
            style={{ fontFamily: "'Aeonik', sans-serif", letterSpacing: '0.15em', textTransform: 'uppercase' }}
          >
            Premiere connexion ? Demandez un lien d'activation a votre administrateur.
          </div>
        </form>
      </div>
      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 100 }}>
        <ThemeToggle />
      </div>
    </div>
  )
}
