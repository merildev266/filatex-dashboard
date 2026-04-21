import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { SectionCard } from './Parametres'

export default function Historique() {
  const { user, authFetch } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isSuperAdmin = user?.role === 'super_admin'

  useEffect(() => {
    if (!isSuperAdmin) return
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await authFetch('/api/admin/login-history?limit=200')
        if (!res.ok) throw new Error('Erreur serveur')
        setHistory(await res.json())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isSuperAdmin, authFetch])

  if (!isSuperAdmin) {
    return (
      <div className="p-6 text-center text-[var(--text-muted)]">
        Accès réservé au super administrateur.
      </div>
    )
  }

  return (
    <div className="p-4 pb-28 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-lg bg-[var(--card)] border border-[var(--card-border)]
                     flex items-center justify-center text-[var(--text)] hover:bg-[var(--inner-card-hover)]
                     transition-colors cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-xl text-[var(--text)]">Historique de connexion</h1>
      </div>

      <SectionCard title="Toutes les connexions (200 dernières)">
        {error && <div className="text-[#ff5a5a] text-xs mb-3">{error}</div>}
        {loading ? (
          <div className="text-center py-4 text-[var(--text-muted)] text-sm">Chargement...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--card-border)] max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="bg-[var(--inner-card)] border-b border-[var(--card-border)]">
                  <th className="text-left p-3 text-[var(--text-muted)] text-xs">Utilisateur</th>
                  <th className="text-left p-3 text-[var(--text-muted)] text-xs">Date</th>
                  <th className="text-center p-3 text-[var(--text-muted)] text-xs">Résultat</th>
                  <th className="text-left p-3 text-[var(--text-muted)] text-xs">IP</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b border-[var(--card-border)] hover:bg-[var(--inner-card)]">
                    <td className="p-3 text-[var(--text)] font-mono text-xs">{h.username}</td>
                    <td className="p-3 text-[var(--text-muted)] text-xs">
                      {new Date(h.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                        h.success ? 'bg-[#00ab6322] text-[#00ab63]' : 'bg-[#E05C5C22] text-[#E05C5C]'
                      }`}>
                        {h.success ? 'OK' : 'Échec'}
                      </span>
                    </td>
                    <td className="p-3 text-[var(--text-muted)] font-mono text-xs">{h.ip_address || '-'}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-center text-[var(--text-muted)] text-sm">Aucun historique</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
