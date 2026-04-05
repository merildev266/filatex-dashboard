import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import GroupeFilatexLogo from './GroupeFilatexLogo'
import ThemeToggle from './ThemeToggle'
import { prefetchAllPages } from '../App'

const MOTIF_BASE = import.meta.env.BASE_URL + 'logos'

const PIN_LENGTH = [4, 6]

export default function Login() {
  const [step, setStep] = useState('login') // login | set_pin
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, setPin: apiSetPin } = useAuth()
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
    if (result.must_set_pin) {
      setStep('set_pin')
      setPin('')
      return
    }
    prefetchAllPages()
    navigate('/')
  }

  const handleSetPin = async (e) => {
    e.preventDefault()
    if (!PIN_LENGTH.includes(newPin.length)) {
      setError('Le code PIN doit contenir 4 ou 6 chiffres')
      return
    }
    if (newPin !== confirmPin) {
      setError('Les codes PIN ne correspondent pas')
      return
    }
    setLoading(true)
    setError('')
    const result = await apiSetPin(newPin, confirmPin)
    setLoading(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    prefetchAllPages()
    navigate('/')
  }

  if (step === 'set_pin') {
    return (
      <div className="fixed inset-0 z-[99999] bg-dark flex items-center justify-center overflow-hidden">
        {/* Motif — identique à l'accueil */}
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
        <div className="relative z-10 flex flex-col items-center justify-between w-[88%] max-w-[400px]" style={{ height: '100vh', paddingTop: '6vh', paddingBottom: '6vh' }}>
          {/* Logo block — top */}
          <div className="flex flex-col items-center">
            <GroupeFilatexLogo style={{ width: '420px', maxWidth: '85vw', height: 'auto' }} />
            <div
              className="login-label uppercase mt-2"
              style={{ fontFamily: "'Aeonik', sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: '0.35em' }}
            >
              Premiere connexion
            </div>
          </div>

          {/* Form block — bottom */}
          <form onSubmit={handleSetPin} className="w-full text-center">
            <div className="text-sm text-[rgba(255,255,255,0.4)] mb-6" style={{ fontFamily: "'Aeonik', sans-serif" }}>
              Definissez votre code PIN (4 ou 6 chiffres)
            </div>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Code PIN"
              autoFocus
              className="login-card w-full rounded-2xl px-5 py-4 text-[var(--text)] text-base text-center outline-none
                         tracking-[0.5em] transition-colors mb-3"
              style={{ fontFamily: "'Aeonik', sans-serif" }}
            />
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Confirmer le PIN"
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
              {loading ? 'Enregistrement...' : 'Valider'}
            </button>
            {error && (
              <div className="mt-4 text-[#ff5a5a] text-sm">{error}</div>
            )}
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-dark flex items-center justify-center overflow-hidden">
      {/* Motif — identique à l'accueil */}
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
      <div className="relative z-10 flex flex-col items-center justify-between w-[88%] max-w-[400px]" style={{ height: '100vh', paddingTop: '6vh', paddingBottom: '6vh' }}>
        {/* Logo block — top */}
        <div className="flex flex-col items-center">
          <GroupeFilatexLogo style={{ width: '420px', maxWidth: '85vw', height: 'auto' }} />
          <div
            className="login-label uppercase mt-2"
            style={{ fontFamily: "'Aeonik', sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: '0.35em' }}
          >
            Dashboard
          </div>
        </div>

        {/* Form block — bottom */}
        <form onSubmit={handleLogin} className="w-full text-center">
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
        </form>
      </div>
      {/* Theme toggle — fixed bottom right like dashboard */}
      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 100 }}>
        <ThemeToggle />
      </div>
    </div>
  )
}
