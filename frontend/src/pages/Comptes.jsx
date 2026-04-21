import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { SectionCard } from './Parametres'

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  utilisateur: 'Utilisateur',
}

const ROLE_BADGE = {
  super_admin: 'bg-[#f3705633] text-[#f37056]',
  admin: 'bg-[#5e4c9f33] text-[#a78bfa]',
  utilisateur: 'bg-[#426ab322] text-[#7ba4e0]',
}

export default function Comptes() {
  const { user, authFetch } = useAuth()
  const navigate = useNavigate()

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isSuperAdmin = user?.role === 'super_admin'

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmReset, setConfirmReset] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch('/api/admin/users')
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Erreur serveur')
      setUsers(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    if (!isAdmin) return
    fetchUsers()
  }, [isAdmin, fetchUsers])

  const toggleActive = async (userId) => {
    try {
      const res = await authFetch(`/api/admin/users/${userId}/toggle-active`, { method: 'PUT' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Erreur')
      }
      fetchUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  const unlockUser = async (userId) => {
    try {
      const res = await authFetch(`/api/admin/users/${userId}/unlock`, { method: 'PUT' })
      if (!res.ok) throw new Error('Erreur')
      fetchUsers()
    } catch {
      setError('Impossible de déverrouiller')
    }
  }

  const resetPin = async (userId) => {
    try {
      const res = await authFetch(`/api/admin/users/${userId}/reset-pin`, { method: 'PUT' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Erreur')
      }
      setConfirmReset(null)
      fetchUsers()
    } catch (err) {
      setError(err.message)
      setConfirmReset(null)
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-[var(--text-muted)]">
        Accès réservé aux administrateurs.
      </div>
    )
  }

  // Admin voit les utilisateurs ; super_admin voit aussi les admins (pas soi, pas les autres super_admin)
  const filtered = users.filter(u => {
    if (u.username === user.username) return false
    if (u.role === 'super_admin') return false
    if (!isSuperAdmin && u.role !== 'utilisateur') return false
    return true
  })

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
        <h1 className="text-xl text-[var(--text)]">Gérer les comptes</h1>
      </div>

      <SectionCard title={isSuperAdmin ? 'Comptes utilisateurs et admins' : 'Comptes utilisateurs'}>
        {error && (
          <div className="mb-3 p-2 rounded-lg bg-[#E05C5C22] border border-[#E05C5C44] text-[#ff5a5a] text-xs">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center py-4 text-[var(--text-muted)] text-sm">Chargement...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--inner-card)] border-b border-[var(--card-border)]">
                  <th className="text-left p-3 text-[var(--text-muted)] text-xs">Nom</th>
                  <th className="text-left p-3 text-[var(--text-muted)] text-xs">Identifiant</th>
                  <th className="text-left p-3 text-[var(--text-muted)] text-xs">Rôle</th>
                  <th className="text-center p-3 text-[var(--text-muted)] text-xs">PIN</th>
                  <th className="text-center p-3 text-[var(--text-muted)] text-xs">Verrouillé</th>
                  <th className="text-center p-3 text-[var(--text-muted)] text-xs">Actif</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-[var(--card-border)] hover:bg-[var(--inner-card)]">
                    <td className="p-3 text-[var(--text)]">{u.display_name}</td>
                    <td className="p-3 text-[var(--text-muted)] font-mono text-xs">{u.username}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${ROLE_BADGE[u.role]}`}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {u.must_change_pin ? (
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-xs bg-[#FDB82322] text-[#FDB823]"
                            title="L'utilisateur se connecte avec 0000 puis choisit son PIN"
                          >
                            PIN = 0000
                          </span>
                          <button
                            onClick={() => setConfirmReset(u)}
                            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                            title="Remettre le PIN à 0000"
                          >
                            Réinitialiser
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmReset(u)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md
                                     bg-[#FDB82322] border border-[#FDB82344] text-[#FDB823] text-xs
                                     hover:bg-[#FDB82333] transition-colors cursor-pointer"
                          title="Réinitialiser le PIN à 0000 — l'utilisateur devra le changer à la prochaine connexion"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12}}>
                            <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                          </svg>
                          Réinitialiser
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {u.locked ? (
                        <button
                          onClick={() => unlockUser(u.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md
                                     bg-[#E05C5C22] border border-[#E05C5C44] text-[#E05C5C] text-xs
                                     hover:bg-[#E05C5C33] transition-colors cursor-pointer"
                          title="Déverrouiller"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12}}>
                            <rect x="3" y="11" width="18" height="11" rx="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          Déverrouiller
                        </button>
                      ) : (
                        <span className="text-[var(--text-dim)] text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleActive(u.id)}
                        className="relative w-10 h-5 rounded-full cursor-pointer transition-colors mx-auto block"
                        style={{ background: u.active ? '#00ab63' : 'rgba(224,92,92,0.4)' }}
                        title={u.active ? 'Actif — cliquer pour bloquer' : 'Bloqué — cliquer pour débloquer'}
                      >
                        <div
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                          style={{ left: u.active ? 'calc(100% - 18px)' : '2px' }}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center text-[var(--text-muted)] text-sm">Aucun compte à gérer</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {confirmReset && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60" onClick={() => setConfirmReset(null)}>
          <div
            className="w-[90%] max-w-sm bg-[var(--dark)] border border-[var(--card-border)] rounded-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-[#FDB82318] border border-[#FDB82333] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#FDB823" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}>
                  <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                </svg>
              </div>
            </div>
            <h3 className="text-center text-lg text-[var(--text)] mb-2">Réinitialiser le PIN ?</h3>
            <div className="mb-5 text-center text-sm text-[var(--text-muted)]">
              Le PIN de <span className="text-[var(--text)]">{confirmReset.display_name}</span> sera remis à <span className="text-[var(--text)] font-mono">0000</span>.
              L'utilisateur devra choisir un nouveau PIN à sa prochaine connexion.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReset(null)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)]
                           text-[var(--text-muted)] text-sm hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => resetPin(confirmReset.id)}
                className="flex-1 py-2.5 rounded-xl bg-[#FDB82322] border border-[#FDB82344]
                           text-[#FDB823] text-sm hover:bg-[#FDB82333] transition-colors cursor-pointer"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
