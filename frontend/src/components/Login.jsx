import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import GroupeFilatexLogo from './GroupeFilatexLogo'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (login(password)) {
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
          <GroupeFilatexLogo style={{width:'280px',maxWidth:'80vw',height:'auto'}} />
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
