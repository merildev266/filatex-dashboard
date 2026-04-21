import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import GroupeFilatexLogo from './GroupeFilatexLogo'
import ThemeToggle from './ThemeToggle'
import { prefetchAllPages } from '../App'

const MOTIF_BASE = import.meta.env.BASE_URL + 'logos'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const PIN_LENGTH = [4, 6]

export default function Activer() {
  const [params] = useSearchParams()
  const initialUsername = (params.get('u') || '').trim().toLowerCase()
  const token = (params.get('token') || '').trim()

  const [username, setUsername] = useState(initialUsername)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { refreshData } = useAuth()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const motifSrc = theme === 'dark' ? `${MOTIF_BASE}/motif-dark.svg` : `${MOTIF_BASE}/motif-light.svg`
  const tokenMissing = useMemo(() => !token, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim()) { setError('Identifiant requis'); return }
    if (!token) { setError("Lien d'activation invalide"); return }
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
    try {
      const res = await fetch(`${API_BASE}/api/auth/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          token,
          pin: newPin,
          pin_confirm: confirmPin,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || "Lien d'activation invalide ou expire")
        setLoading(false)
        return
      }
      // Persist session and navigate home.
      sessionStorage.setItem('dash_token', data.token)
      sessionStorage.setItem('dash_auth', JSON.stringify(data.user))
      refreshData(data.token)
      prefetchAllPages()
      window.location.replace('/filatex-dashboard/')
    } catch {
      setError('Serveur inaccessible, reessayez plus tard.')
      setLoading(false)
    }
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
            Activer mon compte
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full text-center login-form-block">
          {tokenMissing ? (
            <div className="mb-4 p-3 rounded-xl bg-[#E05C5C22] border border-[#E05C5C44] text-[#ff8080] text-xs">
              Lien d'activation incomplet. Contactez votre administrateur pour obtenir un nouveau lien.
            </div>
          ) : (
            <div className="text-sm text-[rgba(255,255,255,0.4)] mb-5" style={{ fontFamily: "'Aeonik', sans-serif" }}>
              Confirmez votre identifiant et choisissez un code PIN (4 ou 6 chiffres)
            </div>
          )}
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Identifiant"
            autoFocus={!initialUsername}
            autoComplete="username"
            disabled={tokenMissing}
            className="login-card w-full rounded-2xl px-5 py-4 text-[var(--text)] text-base text-center outline-none
                       transition-colors mb-3 disabled:opacity-50"
          />
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Nouveau code PIN"
            autoFocus={!!initialUsername}
            disabled={tokenMissing}
            className="login-card w-full rounded-2xl px-5 py-4 text-[var(--text)] text-base text-center outline-none
                       tracking-[0.5em] transition-colors mb-3 disabled:opacity-50"
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
            disabled={tokenMissing}
            className="login-card w-full rounded-2xl px-5 py-4 text-[var(--text)] text-base text-center outline-none
                       tracking-[0.5em] transition-colors mb-4 disabled:opacity-50"
            style={{ fontFamily: "'Aeonik', sans-serif" }}
          />
          <button
            type="submit"
            disabled={loading || tokenMissing}
            className="login-card w-full rounded-2xl px-5 py-4 text-[var(--text)] text-sm uppercase tracking-wider
                       transition-colors cursor-pointer disabled:opacity-50"
            style={{ fontFamily: "'Aeonik', sans-serif", letterSpacing: '0.2em' }}
          >
            {loading ? 'Activation...' : 'Activer'}
          </button>
          {error && (
            <div className="mt-4 text-[#ff5a5a] text-sm">{error}</div>
          )}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-4 text-xs text-[rgba(255,255,255,0.4)] hover:text-[var(--text)] transition-colors cursor-pointer"
            style={{ fontFamily: "'Aeonik', sans-serif", letterSpacing: '0.15em', textTransform: 'uppercase' }}
          >
            ← Retour à la connexion
          </button>
        </form>
      </div>
      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 100 }}>
        <ThemeToggle />
      </div>
    </div>
  )
}
