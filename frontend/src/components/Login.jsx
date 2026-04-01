import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import GroupeFilatexLogo from './GroupeFilatexLogo'
import { prefetchAllPages } from '../App'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (login(password)) {
      prefetchAllPages()
      navigate('/')
    } else {
      setError('Mot de passe incorrect')
      setPassword('')
    }
  }

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
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          autoFocus
          autoComplete="current-password"
          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl
                     px-4 py-3 text-[var(--text)] text-base text-center outline-none
                     focus:border-[var(--card-border)] transition-colors mb-4"
        />
        <button
          type="submit"
          className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-xl
                     px-4 py-3 text-[var(--text)] text-sm font-semibold uppercase tracking-wider
                     hover:bg-[var(--inner-card-hover)] transition-colors cursor-pointer"
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
