import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import GroupeFilatexLogo from './GroupeFilatexLogo'
import { prefetchAllPages } from '../App'

const MOTIF_SRC = import.meta.env.BASE_URL + 'logos/motif-dark.svg'

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
      <div className="fixed inset-0 z-[99999] bg-[#000] flex items-center justify-center overflow-hidden">
        {/* Scrolling motif background */}
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: '-50%', left: '-50%',
            width: '200%', height: '200%',
            backgroundImage: `url(${MOTIF_SRC})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 1,
            animation: 'loginMotifScroll 80s linear infinite',
          }} />
        </div>
        <form onSubmit={handleSetPin} className="w-[88%] max-w-[400px] text-center relative z-10">
          <div className="flex justify-center mb-2">
            <GroupeFilatexLogo style={{ width: '280px', maxWidth: '80vw', height: 'auto' }} />
          </div>
          <div
            className="text-[rgba(255,255,255,0.45)] uppercase mb-6"
            style={{ fontFamily: "'Aeonik', sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: '0.35em' }}
          >
            Premiere connexion
          </div>
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
            className="w-full rounded-2xl px-5 py-4 text-[var(--text)] text-base text-center outline-none
                       tracking-[0.5em] transition-colors mb-3"
            style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'Aeonik', sans-serif" }}
          />
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Confirmer le PIN"
            className="w-full rounded-2xl px-5 py-4 text-[var(--text)] text-base text-center outline-none
                       tracking-[0.5em] transition-colors mb-4"
            style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'Aeonik', sans-serif" }}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl px-5 py-4 text-[var(--text)] text-sm uppercase tracking-wider
                       transition-colors cursor-pointer disabled:opacity-50"
            style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Aeonik', sans-serif", letterSpacing: '0.2em' }}
          >
            {loading ? 'Enregistrement...' : 'Valider'}
          </button>
          {error && (
            <div className="mt-4 text-[#ff5a5a] text-sm">{error}</div>
          )}
        </form>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-[#000] flex items-center justify-center overflow-hidden">
      {/* Scrolling motif background */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-50%', left: '-50%',
          width: '200%', height: '200%',
          backgroundImage: `url(${MOTIF_SRC})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 1,
          animation: 'loginMotifScroll 80s linear infinite',
        }} />
      </div>
      <form onSubmit={handleLogin} className="w-[88%] max-w-[400px] text-center relative z-10">
        <div className="flex justify-center mb-2">
          <GroupeFilatexLogo style={{ width: '280px', maxWidth: '80vw', height: 'auto' }} />
        </div>
        <div
          className="text-[rgba(255,255,255,0.45)] uppercase mb-10"
          style={{ fontFamily: "'Aeonik', sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: '0.35em' }}
        >
          Dashboard
        </div>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Identifiant"
          autoFocus
          autoComplete="username"
          className="w-full rounded-2xl px-5 py-4 text-[var(--text)] text-base text-center outline-none
                     transition-colors mb-3"
          style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'Aeonik', sans-serif" }}
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
          className="w-full rounded-2xl px-5 py-4 text-[var(--text)] text-base text-center outline-none
                     tracking-[0.5em] transition-colors mb-4"
          style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'Aeonik', sans-serif" }}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl px-5 py-4 text-[var(--text)] text-sm uppercase tracking-wider
                     transition-colors cursor-pointer disabled:opacity-50"
          style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Aeonik', sans-serif", letterSpacing: '0.2em' }}
        >
          {loading ? 'Connexion...' : 'Acceder'}
        </button>
        {error && (
          <div className="mt-4 text-[#ff5a5a] text-sm">{error}</div>
        )}
      </form>
    </div>
  )
}
