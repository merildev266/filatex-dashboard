import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import GroupeFilatexLogo from './GroupeFilatexLogo'
import {
  isBiometricSupported, hasBiometricCredential,
  registerBiometric, authenticateBiometric
} from '../utils/webauthn'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [bioAvailable, setBioAvailable] = useState(false)
  const [bioRegistered, setBioRegistered] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    isBiometricSupported().then(ok => {
      setBioAvailable(ok)
      setBioRegistered(ok && hasBiometricCredential())
    })
  }, [])

  // Auto-prompt biometric on load if registered
  useEffect(() => {
    if (bioRegistered) handleBiometricLogin()
  }, [bioRegistered])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (login(password)) {
      // If biometric available but not registered, offer to register
      if (bioAvailable && !hasBiometricCredential()) {
        setShowRegister(true)
      } else {
        navigate('/')
      }
    } else {
      setError('Mot de passe incorrect')
      setPassword('')
    }
  }

  const handleBiometricLogin = async () => {
    try {
      setError('')
      const ok = await authenticateBiometric()
      if (ok) {
        // Biometric verified — grant access
        sessionStorage.setItem('dash_auth', '1')
        window.location.reload() // force re-check auth
      }
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        setError('Echec biometrique')
      }
    }
  }

  const handleRegisterBiometric = async () => {
    try {
      await registerBiometric()
      setBioRegistered(true)
      navigate('/')
    } catch {
      navigate('/') // skip if fails, still logged in
    }
  }

  // Biometric registration prompt after successful password login
  if (showRegister) {
    return (
      <div className="fixed inset-0 z-[99999] bg-dark flex items-center justify-center">
        <div className="w-[90%] max-w-[360px] text-center">
          <div className="mb-6">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(0,171,99,0.8)" strokeWidth="1.5" style={{margin:'0 auto'}}>
              <path d="M12 1a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V5a4 4 0 0 0-4-4z"/>
              <circle cx="12" cy="14" r="2"/>
              <path d="M12 16v2"/>
            </svg>
          </div>
          <div className="text-white text-lg font-semibold mb-2">
            Activer la biometrie ?
          </div>
          <div className="text-[var(--text-muted)] text-sm mb-8">
            Connectez-vous avec votre empreinte ou Face ID la prochaine fois
          </div>
          <button
            onClick={handleRegisterBiometric}
            className="w-full bg-[rgba(0,171,99,0.2)] border border-[rgba(0,171,99,0.4)] rounded-xl
                       px-4 py-3 text-[#00ab63] text-sm font-semibold uppercase tracking-wider
                       hover:bg-[rgba(0,171,99,0.3)] transition-colors cursor-pointer mb-3"
          >
            Activer
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-transparent border border-[rgba(58,57,92,0.35)] rounded-xl
                       px-4 py-3 text-[var(--text-muted)] text-sm
                       hover:bg-[rgba(58,57,92,0.2)] transition-colors cursor-pointer"
          >
            Plus tard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-dark flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-[90%] max-w-[360px] text-center">
        <div className="flex justify-center mb-2">
          <GroupeFilatexLogo style={{width:'280px',maxWidth:'80vw',height:'auto'}} />
        </div>
        <div className="text-xs text-[var(--text-muted)] uppercase tracking-[0.3em] mb-8">
          Dashboard
        </div>

        {/* Biometric button — shown if registered */}
        {bioRegistered && (
          <button
            type="button"
            onClick={handleBiometricLogin}
            className="w-full bg-[rgba(0,171,99,0.12)] border border-[rgba(0,171,99,0.3)] rounded-xl
                       px-4 py-4 text-white text-sm font-medium
                       hover:bg-[rgba(0,171,99,0.2)] transition-colors cursor-pointer mb-4
                       flex items-center justify-center gap-3"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ab63" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 12c0-4.97 4.03-9 9-9"/>
              <path d="M7 12c0-2.76 2.24-5 5-5"/>
              <path d="M12 12v4"/>
              <path d="M12 7c2.76 0 5 2.24 5 5 0 1.5-.5 2.8-1.5 3.8"/>
              <path d="M21 12c0 3.5-1.5 6.5-4 8.5"/>
              <path d="M3 12c0 4 2 7.5 5 9"/>
              <path d="M12 3c4.97 0 9 4.03 9 9"/>
            </svg>
            <span>Se connecter avec biometrie</span>
          </button>
        )}

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          autoFocus={!bioRegistered}
          className="w-full bg-[rgba(58,57,92,0.18)] border border-[rgba(58,57,92,0.35)] rounded-xl
                     px-4 py-3 text-white text-base text-center outline-none
                     focus:border-[rgba(58,57,92,0.6)] transition-colors mb-4"
        />
        <button
          type="submit"
          className="w-full bg-[rgba(58,57,92,0.25)] border border-[rgba(58,57,92,0.35)] rounded-xl
                     px-4 py-3 text-white text-sm font-semibold uppercase tracking-wider
                     hover:bg-[rgba(58,57,92,0.4)] transition-colors cursor-pointer"
        >
          Acceder
        </button>
        {error && (
          <div className="mt-4 text-[#ff5a5a] text-sm">{error}</div>
        )}
      </form>
    </div>
  )
}
