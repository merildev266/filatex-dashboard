import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import GroupeFilatexLogo from './GroupeFilatexLogo'
import ThemeToggle from './ThemeToggle'
import { prefetchAllPages } from '../App'

const MOTIF_BASE = import.meta.env.BASE_URL + 'logos'
const PIN_LENGTH = [4, 6]

// Reject trivially-guessable PINs on the client so the user gets immediate
// feedback. The backend enforces the same rule — do not rely on this alone.
const WEAK_PIN_BLACKLIST = new Set([
  '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
  '1234', '4321', '0123', '9876', '2580', '0852', '1212', '2121', '1313', '6969',
  '1004', '2000', '1979', '2024', '2025', '2026',
  '000000', '111111', '222222', '333333', '444444', '555555',
  '666666', '777777', '888888', '999999',
  '123456', '654321', '012345', '987654', '123123', '121212', '123321', '112233',
])

function isWeakPin(pin) {
  if (WEAK_PIN_BLACKLIST.has(pin)) return true
  if (new Set(pin).size === 1) return true // all same digit
  if (pin.length >= 4) {
    const diffs = new Set()
    for (let i = 0; i < pin.length - 1; i++) diffs.add(pin.charCodeAt(i + 1) - pin.charCodeAt(i))
    if (diffs.size === 1 && (diffs.has(1) || diffs.has(-1))) return true
  }
  return false
}

export default function Login() {
  const [step, setStep] = useState('login') // login | change-pin
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, changePin, refreshData } = useAuth()
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
    if (result.must_change_pin) {
      // Keep `pin` in state — it's the current PIN we'll send as `old_pin` below.
      setStep('change-pin')
      setError('')
      return
    }
    refreshData(result.token)
    prefetchAllPages()
    navigate('/')
  }

  const handleChangePin = async (e) => {
    e.preventDefault()
    if (!PIN_LENGTH.includes(newPin.length)) {
      setError('Le code PIN doit contenir 4 ou 6 chiffres')
      return
    }
    if (newPin !== confirmPin) {
      setError('Les codes PIN ne correspondent pas')
      return
    }
    if (isWeakPin(newPin)) {
      setError('Ce code PIN est trop facile a deviner. Evitez les chiffres identiques (0000), sequences (1234) et codes communs.')
      return
    }
    if (newPin === pin) {
      setError('Le nouveau code PIN doit etre different de l\'actuel')
      return
    }
    setLoading(true)
    setError('')
    const result = await changePin(pin, newPin, confirmPin)
    setLoading(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    refreshData()
    prefetchAllPages()
    navigate('/')
  }

  const isChangePinStep = step === 'change-pin'

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
            {isChangePinStep ? 'Premiere connexion' : 'Dashboard'}
          </div>
        </div>

        {isChangePinStep ? (
          <form onSubmit={handleChangePin} className="w-full text-center login-form-block">
            <div className="text-sm mb-5" style={{ fontFamily: "'Aeonik', sans-serif", color: 'var(--text-muted)' }}>
              Choisissez votre code PIN (4 ou 6 chiffres).<br />
              Eviter les chiffres identiques et les sequences.
            </div>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Nouveau code PIN"
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
        ) : (
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
          </form>
        )}
      </div>
      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 100 }}>
        <ThemeToggle />
      </div>
    </div>
  )
}
