import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const TABS = [
  { id: 'users', label: 'Utilisateurs' },
  { id: 'history', label: 'Historique' },
]

const ALL_ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'utilisateur', label: 'Utilisateur' },
]

const SECTIONS = [
  { id: '*', label: 'Toutes', parent: null },
  { id: 'energy', label: 'Energy', parent: null },
  { id: 'energy.hfo', label: 'HFO', parent: 'energy' },
  { id: 'energy.enr', label: 'EnR', parent: 'energy' },
  { id: 'properties', label: 'Properties', parent: null },
  { id: 'capex', label: 'CAPEX', parent: null },
  { id: 'capex.hfo', label: 'HFO', parent: 'capex' },
  { id: 'capex.enr', label: 'EnR', parent: 'capex' },
  { id: 'capex.properties', label: 'Properties', parent: 'capex' },
  { id: 'capex.investments', label: 'Investments', parent: 'capex' },
  { id: 'investments', label: 'Investments', parent: null },
  { id: 'reporting', label: 'Reporting', parent: null },
  { id: 'reporting.hfo', label: 'HFO (+ LFO)', parent: 'reporting' },
  { id: 'reporting.enr', label: 'EnR', parent: 'reporting' },
  { id: 'reporting.properties', label: 'Properties', parent: 'reporting' },
  { id: 'reporting.investments', label: 'Investments', parent: 'reporting' },
  { id: 'csi', label: 'CSI', parent: null },
]

const ROLE_LABELS = { super_admin: 'Super Admin', admin: 'Admin', utilisateur: 'Utilisateur' }
const ROLE_COLORS = {
  super_admin: 'bg-[#9f4c4c33] text-[#fa8b8b]',
  admin: 'bg-[#5e4c9f33] text-[#a78bfa]',
  utilisateur: 'bg-[#426ab322] text-[#7ba4e0]',
}

export default function Admin() {
  const { user, authFetch, isAdmin, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('users')
  const DEMO_USERS = [
    { id: 0, username: 'pmo', display_name: 'PMO Admin', first_name: '', last_name: '', email: '', role: 'super_admin', sections: ['*'], active: true, locked: false, failed_attempts: 0, pin_set: true },
    { id: 901, username: 'jean.rakoto', display_name: 'Jean Rakoto', first_name: 'Jean', last_name: 'Rakoto', email: 'j.rakoto@filatex.mg', role: 'utilisateur', sections: ['energy', 'energy.hfo', 'energy.enr', 'reporting', 'reporting.hfo', 'reporting.enr'], active: true, locked: false, failed_attempts: 0, pin_set: true },
    { id: 902, username: 'marie.rabe', display_name: 'Marie Rabe', first_name: 'Marie', last_name: 'Rabe', email: 'm.rabe@filatex.mg', role: 'utilisateur', sections: ['properties', 'investments', 'capex', 'capex.properties', 'capex.investments'], active: true, locked: true, failed_attempts: 5, pin_set: true },
  ]
  const [users, setUsers] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [lockedPopup, setLockedPopup] = useState(null)

  const canAdmin = isAdmin()
  const canSuperAdmin = isSuperAdmin()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch('/api/admin/users')
      if (!res.ok) throw new Error('Erreur serveur')
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      setUsers(DEMO_USERS)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch('/api/admin/login-history')
      if (!res.ok) throw new Error('Erreur serveur')
      const data = await res.json()
      setHistory(data)
    } catch (err) {
      setHistory([
        { username: 'pmo', timestamp: new Date().toISOString(), success: true, ip_address: '192.168.1.10' },
        { username: 'jean.rakoto', timestamp: new Date(Date.now() - 3600000).toISOString(), success: true, ip_address: '192.168.1.25' },
        { username: 'marie.rabe', timestamp: new Date(Date.now() - 7200000).toISOString(), success: false, ip_address: '192.168.1.42' },
      ])
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    if (!canAdmin) return
    if (tab === 'users') fetchUsers()
    if (tab === 'history') fetchHistory()
  }, [tab, canAdmin, fetchUsers, fetchHistory])

  const handleToggleActive = async (userId) => {
    try {
      await authFetch(`/api/admin/users/${userId}/toggle-active`, { method: 'PUT' })
      fetchUsers()
    } catch {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !u.active } : u))
    }
  }

  const handleUnlock = async (userId) => {
    try {
      await authFetch(`/api/admin/users/${userId}/unlock`, { method: 'PUT' })
      fetchUsers()
    } catch {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, locked: false, failed_attempts: 0 } : u))
    }
  }

  const handleResetPin = async (userId) => {
    try {
      await authFetch(`/api/admin/users/${userId}/reset-pin`, { method: 'PUT' })
      fetchUsers()
    } catch {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, pin_set: false } : u))
    }
  }

  if (!canAdmin) {
    return (
      <div className="p-6 text-center text-[var(--text-muted)]">
        Acces reserve aux administrateurs.
      </div>
    )
  }

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
                  <th className="text-left p-3 text-[var(--text-muted)] font-medium">Identifiant</th>
                  <th className="text-left p-3 text-[var(--text-muted)] font-medium">Nom</th>
                  <th className="text-left p-3 text-[var(--text-muted)] font-medium">Email</th>
                  <th className="text-left p-3 text-[var(--text-muted)] font-medium">Role</th>
                  <th className="text-left p-3 text-[var(--text-muted)] font-medium">Sections</th>
                  <th className="text-center p-3 text-[var(--text-muted)] font-medium">PIN</th>
                  <th className="text-center p-3 text-[var(--text-muted)] font-medium">Statut</th>
                  <th className="text-center p-3 text-[var(--text-muted)] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-[var(--card-border)] hover:bg-[var(--card)]">
                    <td className="p-3 text-[var(--text)] font-mono text-xs">{u.username}</td>
                    <td className="p-3 text-[var(--text)]">{u.display_name}</td>
                    <td className="p-3 text-[var(--text-muted)] text-xs">{u.email || '-'}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[u.role] || ROLE_COLORS.utilisateur}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="p-3 text-[var(--text-muted)] text-xs">
                      {u.sections?.includes('*') ? 'Toutes' : u.sections?.join(', ')}
                    </td>
                    <td className="p-3 text-center">
                      {u.pin_set ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-[#00ab6322] text-[#00ab63]">Defini</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-[#f5a62322] text-[#f5a623]">En attente</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${u.active ? 'bg-[#00ab63]' : 'bg-[#E05C5C]'}`} />
                        {u.locked && (
                          <button
                            onClick={() => setLockedPopup(u)}
                            title="Compte verrouille — cliquer pour details"
                            className="cursor-pointer hover:scale-110 transition-transform"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="#E05C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
                              <rect x="3" y="11" width="18" height="11" rx="2"/>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => { setEditUser(u); setShowModal(true) }}
                          className="p-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)]
                                     text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        {/* Reset PIN */}
                        {u.pin_set && (
                          <button
                            onClick={() => handleResetPin(u.id)}
                            className="p-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)]
                                       text-[var(--text-muted)] hover:text-[#f5a623] transition-colors cursor-pointer"
                            title="Reinitialiser le PIN"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
                              <path d="M1 4v6h6"/>
                              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                            </svg>
                          </button>
                        )}
                        {/* Toggle active */}
                        <button
                          onClick={() => handleToggleActive(u.id)}
                          className="relative w-10 h-5 rounded-full cursor-pointer transition-colors"
                          style={{ background: u.active ? '#00ab63' : 'rgba(224,92,92,0.4)' }}
                          title={u.active ? 'Actif — cliquer pour desactiver' : 'Inactif — cliquer pour activer'}
                        >
                          <div
                            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                            style={{ left: u.active ? 'calc(100% - 18px)' : '2px' }}
                          />
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

      {/* Locked account popup */}
      {lockedPopup && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60" onClick={() => setLockedPopup(null)}>
          <div
            className="w-[90%] max-w-sm bg-[var(--dark)] border border-[var(--card-border)] rounded-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-[#E05C5C18] border border-[#E05C5C33] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#E05C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>

            <h3 className="text-center text-lg font-semibold text-[var(--text)] mb-2">
              Compte verrouille
            </h3>

            <div className="space-y-2 mb-5">
              <div className="flex justify-between py-2 px-3 rounded-lg bg-[var(--card)]">
                <span className="text-sm text-[var(--text-muted)]">Utilisateur</span>
                <span className="text-sm font-medium text-[var(--text)]">{lockedPopup.display_name}</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-lg bg-[var(--card)]">
                <span className="text-sm text-[var(--text-muted)]">Raison</span>
                <span className="text-sm font-medium text-[#E05C5C]">{lockedPopup.failed_attempts} tentatives echouees</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-lg bg-[var(--card)]">
                <span className="text-sm text-[var(--text-muted)]">Seuil</span>
                <span className="text-sm text-[var(--text)]">5 echecs consecutifs</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setLockedPopup(null)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)]
                           text-[var(--text-muted)] text-sm hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={async () => {
                  await handleUnlock(lockedPopup.id)
                  setLockedPopup(null)
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#00ab6322] border border-[#00ab6344]
                           text-[#00ab63] text-sm font-medium hover:bg-[#00ab6333] transition-colors cursor-pointer"
              >
                Deverrouiller
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal create / edit */}
      {showModal && (
        <UserModal
          user={editUser}
          authFetch={authFetch}
          actorRole={user?.role}
          onClose={() => { setShowModal(false); setEditUser(null) }}
          onSaved={(savedUser) => {
            setShowModal(false); setEditUser(null)
            if (savedUser) {
              setUsers(prev => {
                const exists = prev.find(u => u.id === savedUser.id)
                if (exists) return prev.map(u => u.id === savedUser.id ? { ...u, ...savedUser } : u)
                return [...prev, { ...savedUser, id: Date.now(), active: true, locked: false, failed_attempts: 0, pin_set: false }]
              })
            } else {
              fetchUsers()
            }
          }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* User create/edit modal                                              */
/* ------------------------------------------------------------------ */

function UserModal({ user: editUser, authFetch, actorRole, onClose, onSaved }) {
  const isEdit = !!editUser
  const [form, setForm] = useState({
    first_name: editUser?.first_name || '',
    last_name: editUser?.last_name || '',
    email: editUser?.email || '',
    display_name: editUser?.display_name || '',
    role: editUser?.role || 'utilisateur',
    sections: editUser?.sections || ['*'],
    active: editUser?.active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  // Auto-generate display_name and show login preview
  const generatedUsername = form.first_name && form.last_name
    ? `${form.first_name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '')}.${form.last_name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '')}`
    : ''

  // Auto-fill display_name when creating
  const handleNameChange = (field, value) => {
    const newForm = { ...form, [field]: value }
    if (!isEdit) {
      newForm.display_name = `${field === 'first_name' ? value : form.first_name} ${field === 'last_name' ? value : form.last_name}`.trim()
    }
    setForm(newForm)
  }

  // Roles available based on actor
  const availableRoles = actorRole === 'super_admin'
    ? ALL_ROLES.filter(r => r.value !== 'super_admin')
    : ALL_ROLES.filter(r => r.value === 'utilisateur')

  const toggleSection = (sec) => {
    setForm(f => {
      const has = f.sections.includes(sec)
      if (sec === '*') return { ...f, sections: has ? [] : ['*'] }

      let next = has
        ? f.sections.filter(s => s !== sec)
        : [...f.sections.filter(s => s !== '*'), sec]

      const children = SECTIONS.filter(s => s.parent === sec).map(s => s.id)
      if (!has && children.length > 0) {
        children.forEach(c => { if (!next.includes(c)) next.push(c) })
      }
      if (has && children.length > 0) {
        next = next.filter(s => !children.includes(s))
      }
      const sectionDef = SECTIONS.find(s => s.id === sec)
      if (has && sectionDef?.parent) {
        next = next.filter(s => s !== sectionDef.parent)
      }

      return { ...f, sections: next }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.first_name || !form.last_name || !form.display_name) {
      setError('Prenom, nom et nom affiche sont obligatoires')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = { ...form }
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
      onSaved() // server mode
    } catch (err) {
      if (err.message?.includes('fetch') || err.message?.includes('Failed') || err.message?.includes('NetworkError')) {
        onSaved({ ...form, username: generatedUsername, id: editUser?.id || Date.now() })
        return
      }
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-[90%] max-w-md max-h-[90vh] overflow-y-auto bg-[var(--dark)] border border-[var(--card-border)] rounded-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
          {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* First name + Last name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Prenom</label>
              <input
                type="text"
                value={form.first_name}
                onChange={e => handleNameChange('first_name', e.target.value)}
                disabled={isEdit}
                autoFocus={!isEdit}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg
                           px-3 py-2 text-[var(--text)] text-sm outline-none focus:border-[var(--card-border)]
                           disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Nom</label>
              <input
                type="text"
                value={form.last_name}
                onChange={e => handleNameChange('last_name', e.target.value)}
                disabled={isEdit}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg
                           px-3 py-2 text-[var(--text)] text-sm outline-none focus:border-[var(--card-border)]
                           disabled:opacity-50"
              />
            </div>
          </div>

          {/* Login preview */}
          {!isEdit && generatedUsername && (
            <div className="px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--card-border)]">
              <span className="text-xs text-[var(--text-muted)]">Identifiant : </span>
              <span className="text-xs font-mono text-[var(--text)] font-medium">{generatedUsername}</span>
            </div>
          )}
          {isEdit && (
            <div className="px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--card-border)]">
              <span className="text-xs text-[var(--text-muted)]">Identifiant : </span>
              <span className="text-xs font-mono text-[var(--text)] font-medium">{editUser.username}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Email professionnel</label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="prenom.nom@filatex.mg"
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
              {availableRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Sections — checkboxes */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-2">Sections</label>
            <div className="space-y-1.5 bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3">
              {SECTIONS.filter(s => !s.parent).map(sec => {
                const children = SECTIONS.filter(s => s.parent === sec.id)
                const isActive = form.sections.includes(sec.id)
                const allSelected = form.sections.includes('*')
                const checked = isActive || allSelected
                return (
                  <div key={sec.id}>
                    <label className="flex items-center gap-2.5 py-1 cursor-pointer hover:opacity-80 transition-opacity">
                      <div
                        onClick={(e) => { e.preventDefault(); toggleSection(sec.id) }}
                        className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{
                          borderColor: checked ? 'var(--selected)' : 'var(--card-border)',
                          background: checked ? 'var(--selected)' : 'transparent',
                        }}
                      >
                        {checked && (
                          <svg viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:10,height:10}}>
                            <path d="M2 6l3 3 5-5"/>
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${checked ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                        {sec.label}
                      </span>
                    </label>
                    {children.length > 0 && !allSelected && (isActive || children.some(c => form.sections.includes(c.id))) && (
                      <div className="ml-6 space-y-1 mb-1">
                        {children.map(child => {
                          const childChecked = form.sections.includes(child.id) || allSelected
                          return (
                            <label key={child.id} className="flex items-center gap-2 py-0.5 cursor-pointer hover:opacity-80 transition-opacity">
                              <div
                                onClick={(e) => { e.preventDefault(); toggleSection(child.id) }}
                                className="w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                                style={{
                                  borderColor: childChecked ? 'var(--selected)' : 'var(--card-border)',
                                  background: childChecked ? 'var(--selected)' : 'transparent',
                                }}
                              >
                                {childChecked && (
                                  <svg viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:8,height:8}}>
                                    <path d="M2 6l3 3 5-5"/>
                                  </svg>
                                )}
                              </div>
                              <span className={`text-[11px] ${childChecked ? 'text-[var(--text)]' : 'text-[var(--text-dim)]'}`}>
                                {child.label}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Info: no password needed */}
          {!isEdit && (
            <div className="px-3 py-2 rounded-lg bg-[#426ab312] border border-[#426ab322] text-xs text-[#7ba4e0]">
              L'utilisateur definira son code PIN (4 ou 6 chiffres) lors de sa premiere connexion.
            </div>
          )}

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
