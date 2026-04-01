import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import GroupeFilatexLogo from './GroupeFilatexLogo'
import { prefetchAllPages } from '../App'

export default function Login() {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // PIN setup flow
  const [showSetPin, setShowSetPin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const { login, setPin: submitPin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)

    try {
      const result = await login(username, pin)
      if (result.success) {
        if (result.must_set_pin) {
          setShowSetPin(true)
          setPin('')
        } else {
          prefetchAllPages()
          navigate('/')
        }
      } else {
        setError(result.error)
        setPin('')
      }
    } catch {
      setError('Erreur de connexion')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPin = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')

    if (newPin !== confirmPin) {
      setError('Les codes PIN ne correspondent pas')
      return
    }
    if (!/^\d{4}$|^\d{6}$/.test(newPin)) {
      setError('Le code PIN doit contenir 4 ou 6 chiffres')
      return
    }

    setLoading(true)
    try {
      const result = await submitPin(newPin, confirmPin)
      if (result.success) {
        prefetchAllPages()
        navigate('/')
      } else {
        setError(result.error)
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  // --- Set PIN screen ---
  if (showSetPin) {
    return (
      <div className="fixed inset-0 z-[99999] bg-dark flex items-center justify-center">
        <form onSubmit={handleSetPin} className="w-[90%] max-w-[360px] text-center">
          <div className="flex justify-center mb-2">
            <GroupeFilatexLogo style={{ width: '280px', maxWidth: '80vw', height: 'auto' }} />
          </div>
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4">
            Dashboard
          </div>
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#5e4c9f22] border border-[#5e4c9f44] flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}>
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 className="text-base font-semibold text-[var(--text)] mb-1">
              Definir votre code PIN
            </h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Choisissez un code a 4 ou 6 chiffres pour securiser votre compte
            </p>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Code PIN"
              autoFocus
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl
                         px-4 py-3 text-[var(--text)] text-lg text-center tracking-[0.5em] outline-none
                         focus:border-[var(--card-border)] transition-colors mb-3"
            />
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Confirmer le code PIN"
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl
                         px-4 py-3 text-[var(--text)] text-lg text-center tracking-[0.5em] outline-none
                         focus:border-[var(--card-border)] transition-colors mb-1"
            />
            <div className="text-[10px] text-[var(--text-dim)] mt-1">
              {newPin.length === 4 || newPin.length === 6 ? `${newPin.length} chiffres` : '4 ou 6 chiffres'}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || newPin.length < 4}
            className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-xl
                       px-4 py-3 text-[var(--text)] text-sm font-semibold uppercase tracking-wider
                       hover:bg-[var(--inner-card-hover)] transition-colors cursor-pointer
                       disabled:opacity-50 disabled:cursor-wait"
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

  // --- Login screen ---
  return (
    <div className="fixed inset-0 z-[99999] bg-dark flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-[90%] max-w-[360px] text-center">
        <div className="flex justify-center mb-2">
          <GroupeFilatexLogo style={{ width: '280px', maxWidth: '80vw', height: 'auto' }} />
        </div>
        <div className="text-xs text-[var(--text-muted)] uppercase tracking-[0.3em] mb-8">
          Dashboard
        </div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="Identifiant (prenom.nom)"
          autoFocus
          autoComplete="username"
          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl
                     px-4 py-3 text-[var(--text)] text-base text-center outline-none
                     focus:border-[var(--card-border)] transition-colors mb-3"
        />
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Code PIN"
          autoComplete="current-password"
          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl
                     px-4 py-3 text-[var(--text)] text-lg text-center tracking-[0.5em] outline-none
                     focus:border-[var(--card-border)] transition-colors mb-4"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-xl
                     px-4 py-3 text-[var(--text)] text-sm font-semibold uppercase tracking-wider
                     hover:bg-[var(--inner-card-hover)] transition-colors cursor-pointer
                     disabled:opacity-50 disabled:cursor-wait"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        {error && (
          <div className="mt-4 text-[#ff5a5a] text-sm">{error}</div>
        )}
      </form>
    </div>
  )
}
