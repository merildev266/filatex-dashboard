import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const TABS = [
  { id: 'users', label: 'Utilisateurs' },
  { id: 'history', label: 'Historique' },
  { id: 'locked', label: 'Verrouilles' },
]

const ROLES = [
  { value: 'pmo', label: 'PMO' },
  { value: 'directeur', label: 'Directeur' },
  { value: 'manager', label: 'Manager' },
]

const SECTION_OPTIONS = [
  '*', 'energy', 'properties', 'capex', 'investments', 'reporting', 'csi',
]

export default function Admin() {
  const { user, authFetch } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)

  const isPmo = user?.role === 'pmo'

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch('/api/admin/users')
      if (!res.ok) throw new Error('Erreur serveur')
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      setError(err.message === 'Session expiree' ? 'Session expiree' : 'Impossible de charger les utilisateurs. Le serveur est-il lance ?')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch('/api/admin/history')
      if (!res.ok) throw new Error('Erreur serveur')
      const data = await res.json()
      setHistory(data)
    } catch (err) {
      setError(err.message === 'Session expiree' ? 'Session expiree' : 'Impossible de charger l\'historique. Le serveur est-il lance ?')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    if (!isPmo) return
    if (tab === 'users' || tab === 'locked') fetchUsers()
    if (tab === 'history') fetchHistory()
  }, [tab, isPmo, fetchUsers, fetchHistory])

  const handleToggleActive = async (userId) => {
    try {
      const u = users.find(u => u.id === userId)
      await authFetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !u.active }),
      })
      fetchUsers()
    } catch { /* ignore */ }
  }

  const handleUnlock = async (userId) => {
    try {
      await authFetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: false }),
      })
      fetchUsers()
    } catch { /* ignore */ }
  }

  if (!isPmo) {
    return (
      <div className="p-6 text-center text-[var(--text-muted)]">
        Acces reserve au PMO.
      </div>
    )
  }

  const lockedUsers = users.filter(u => u.locked)

  return (
    <div className="p-4 pb-28 max-w-5xl mx-auto">
      {/* Header */}
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
        <h1 className="text-xl font-semibold text-[var(--text)]">Administration</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer
              ${tab === t.id
                ? 'bg-[var(--inner-card)] text-[var(--text)] border border-[var(--card-border)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
          >
            {t.label}
            {t.id === 'locked' && lockedUsers.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E05C5C] text-white text-xs">
                {lockedUsers.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[#E05C5C22] border border-[#E05C5C44] text-[#ff5a5a] text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-[var(--text-muted)] text-sm">Chargement...</div>
      )}

      {/* Users tab */}
      {tab === 'users' && !loading && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setEditUser(null); setShowModal(true) }}
              className="px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--card-border)]
                         text-[var(--text)] text-sm font-medium hover:bg-[var(--inner-card-hover)]
                         transition-colors cursor-pointer"
            >
              + Nouvel utilisateur
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--card)] border-b border-[var(--card-border)]">
                  <th className="text-left p-3 text-[var(--text-muted)] font-medium">Utilisateur</th>
                  <th className="text-left p-3 text-[var(--text-muted)] font-medium">Nom</th>
                  <th className="text-left p-3 text-[var(--text-muted)] font-medium">Role</th>
                  <th className="text-left p-3 text-[var(--text-muted)] font-medium">Sections</th>
                  <th className="text-center p-3 text-[var(--text-muted)] font-medium">Actif</th>
                  <th className="text-center p-3 text-[var(--text-muted)] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-[var(--card-border)] hover:bg-[var(--card)]">
                    <td className="p-3 text-[var(--text)]">{u.username}</td>
                    <td className="p-3 text-[var(--text)]">{u.display_name}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        u.role === 'pmo' ? 'bg-[#5e4c9f33] text-[#a78bfa]' :
                        u.role === 'directeur' ? 'bg-[#00ab6322] text-[#00ab63]' :
                        'bg-[#426ab322] text-[#7ba4e0]'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-[var(--text-muted)] text-xs">
                      {u.sections?.includes('*') ? 'Toutes' : u.sections?.join(', ')}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${u.active ? 'bg-[#00ab63]' : 'bg-[#E05C5C]'}`} />
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setEditUser(u); setShowModal(true) }}
                          className="px-2 py-1 rounded bg-[var(--inner-card)] text-[var(--text-muted)]
                                     text-xs hover:text-[var(--text)] transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleToggleActive(u.id)}
                          className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                            u.active
                              ? 'bg-[#E05C5C22] text-[#E05C5C] hover:bg-[#E05C5C33]'
                              : 'bg-[#00ab6322] text-[#00ab63] hover:bg-[#00ab6333]'
                          }`}
                        >
                          {u.active ? 'Desactiver' : 'Activer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* History tab */}
      {tab === 'history' && !loading && (
        <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--card)] border-b border-[var(--card-border)]">
                <th className="text-left p-3 text-[var(--text-muted)] font-medium">Utilisateur</th>
                <th className="text-left p-3 text-[var(--text-muted)] font-medium">Date</th>
                <th className="text-center p-3 text-[var(--text-muted)] font-medium">Resultat</th>
                <th className="text-left p-3 text-[var(--text-muted)] font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-b border-[var(--card-border)] hover:bg-[var(--card)]">
                  <td className="p-3 text-[var(--text)]">{h.username}</td>
                  <td className="p-3 text-[var(--text-muted)]">
                    {new Date(h.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      h.success ? 'bg-[#00ab6322] text-[#00ab63]' : 'bg-[#E05C5C22] text-[#E05C5C]'
                    }`}>
                      {h.success ? 'OK' : 'Echec'}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--text-muted)] text-xs font-mono">{h.ip_address || '-'}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-[var(--text-muted)]">Aucun historique</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Locked tab */}
      {tab === 'locked' && !loading && (
        <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--card)] border-b border-[var(--card-border)]">
                <th className="text-left p-3 text-[var(--text-muted)] font-medium">Utilisateur</th>
                <th className="text-left p-3 text-[var(--text-muted)] font-medium">Nom</th>
                <th className="text-left p-3 text-[var(--text-muted)] font-medium">Tentatives</th>
                <th className="text-center p-3 text-[var(--text-muted)] font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {lockedUsers.map(u => (
                <tr key={u.id} className="border-b border-[var(--card-border)] hover:bg-[var(--card)]">
                  <td className="p-3 text-[var(--text)]">{u.username}</td>
                  <td className="p-3 text-[var(--text)]">{u.display_name}</td>
                  <td className="p-3 text-[#E05C5C]">{u.failed_attempts}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleUnlock(u.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#00ab6322] text-[#00ab63] text-xs
                                 font-medium hover:bg-[#00ab6333] transition-colors cursor-pointer"
                    >
                      Deverrouiller
                    </button>
                  </td>
                </tr>
              ))}
              {lockedUsers.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-[var(--text-muted)]">Aucun compte verrouille</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal create / edit */}
      {showModal && (
        <UserModal
          user={editUser}
          authFetch={authFetch}
          onClose={() => { setShowModal(false); setEditUser(null) }}
          onSaved={() => { setShowModal(false); setEditUser(null); fetchUsers() }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* User create/edit modal                                              */
/* ------------------------------------------------------------------ */

function UserModal({ user: editUser, authFetch, onClose, onSaved }) {
  const isEdit = !!editUser
  const [form, setForm] = useState({
    username: editUser?.username || '',
    password: '',
    display_name: editUser?.display_name || '',
    role: editUser?.role || 'manager',
    sections: editUser?.sections || ['*'],
    active: editUser?.active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const toggleSection = (sec) => {
    setForm(f => {
      const has = f.sections.includes(sec)
      if (sec === '*') return { ...f, sections: has ? [] : ['*'] }
      let next = has ? f.sections.filter(s => s !== sec) : [...f.sections.filter(s => s !== '*'), sec]
      return { ...f, sections: next }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.display_name) {
      setError('Champs obligatoires')
      return
    }
    if (!isEdit && !form.password) {
      setError('Mot de passe requis')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = { ...form }
      if (isEdit && !body.password) delete body.password

      const url = isEdit ? `/api/admin/users/${editUser.id}` : '/api/admin/users'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur serveur')
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-[90%] max-w-md bg-[var(--dark)] border border-[var(--card-border)] rounded-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
          {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Username */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Identifiant</label>
            <input
              type="text"
              value={form.username}
              onChange={e => update('username', e.target.value)}
              disabled={isEdit}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg
                         px-3 py-2 text-[var(--text)] text-sm outline-none focus:border-[var(--card-border)]
                         disabled:opacity-50"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Mot de passe {isEdit && '(laisser vide pour ne pas changer)'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg
                         px-3 py-2 text-[var(--text)] text-sm outline-none focus:border-[var(--card-border)]"
            />
          </div>

          {/* Display name */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Nom affiche</label>
            <input
              type="text"
              value={form.display_name}
              onChange={e => update('display_name', e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg
                         px-3 py-2 text-[var(--text)] text-sm outline-none focus:border-[var(--card-border)]"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => update('role', e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg
                         px-3 py-2 text-[var(--text)] text-sm outline-none focus:border-[var(--card-border)]"
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Sections */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Sections</label>
            <div className="flex flex-wrap gap-2">
              {SECTION_OPTIONS.map(sec => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => toggleSection(sec)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    form.sections.includes(sec)
                      ? 'bg-[var(--inner-card)] border-[var(--card-border)] text-[var(--text)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {sec === '*' ? 'Toutes' : sec}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-[#ff5a5a] text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-[var(--card)] border border-[var(--card-border)]
                         text-[var(--text-muted)] text-sm hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-xl bg-[var(--inner-card)] border border-[var(--card-border)]
                         text-[var(--text)] text-sm font-medium hover:bg-[var(--inner-card-hover)]
                         transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Creer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
