import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Parametres() {
  const { user, updateDisplayName, changePin } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="p-4 pb-28 max-w-3xl mx-auto">
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
        <h1 className="text-xl text-[var(--text)]">Paramètres</h1>
      </div>

      <SectionCard title="Mon compte">
        <DisplayNameForm
          currentName={user?.display_name || ''}
          onUpdate={updateDisplayName}
        />
        <div className="h-px bg-[var(--card-border)] my-5" />
        <ChangePinForm onChange={changePin} />
      </SectionCard>
    </div>
  )
}

export function SectionCard({ title, children }) {
  return (
    <div
      className="mb-5 p-5 md:p-6"
      style={{
        background: '#000000',
        border: '1px solid var(--card-border)',
        borderRadius: 20,
        boxShadow: '0 8px 60px rgba(58,57,92,0.12), 0 4px 24px rgba(58,57,92,0.08), inset 0 1px 0 rgba(58,57,92,0.15)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <h2
        className="mb-5"
        style={{
          fontSize: 10,
          fontWeight: 400,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

function DisplayNameForm({ currentName, onUpdate }) {
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setMsg({ type: 'error', text: 'Le nom d\'affichage ne peut pas être vide' })
      return
    }
    if (trimmed === currentName) return
    setSaving(true)
    setMsg(null)
    const res = await onUpdate(trimmed)
    setSaving(false)
    if (res.success) setMsg({ type: 'ok', text: 'Nom d\'affichage mis à jour' })
    else setMsg({ type: 'error', text: res.error || 'Erreur' })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="block text-xs text-[var(--text-muted)] mb-1">Nom d'affichage</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg
                     px-3 py-2 text-[var(--text)] text-sm outline-none focus:border-[var(--card-border)]"
        />
        <button
          type="submit"
          disabled={saving || !name.trim() || name.trim() === currentName}
          className="px-4 py-2 rounded-lg bg-[var(--inner-card)] border border-[var(--card-border)]
                     text-[var(--text)] text-sm hover:bg-[var(--inner-card-hover)]
                     transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? '...' : 'Enregistrer'}
        </button>
      </div>
      {msg && (
        <div className={`mt-2 text-xs ${msg.type === 'ok' ? 'text-[#00ab63]' : 'text-[#ff5a5a]'}`}>
          {msg.text}
        </div>
      )}
    </form>
  )
}

function ChangePinForm({ onChange }) {
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!/^\d{4}$|^\d{6}$/.test(newPin)) {
      setMsg({ type: 'error', text: 'Le nouveau PIN doit contenir 4 ou 6 chiffres' })
      return
    }
    if (newPin !== confirmPin) {
      setMsg({ type: 'error', text: 'Les PIN ne correspondent pas' })
      return
    }
    setSaving(true)
    setMsg(null)
    const res = await onChange(oldPin, newPin, confirmPin)
    setSaving(false)
    if (res.success) {
      setMsg({ type: 'ok', text: 'Code PIN mis à jour' })
      setOldPin(''); setNewPin(''); setConfirmPin('')
    } else {
      setMsg({ type: 'error', text: res.error || 'Erreur' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">Code PIN actuel</label>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={oldPin}
          onChange={e => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg
                     px-3 py-2 text-[var(--text)] text-sm tracking-widest outline-none focus:border-[var(--card-border)]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Nouveau PIN</label>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg
                       px-3 py-2 text-[var(--text)] text-sm tracking-widest outline-none focus:border-[var(--card-border)]"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Confirmer</label>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg
                       px-3 py-2 text-[var(--text)] text-sm tracking-widest outline-none focus:border-[var(--card-border)]"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !oldPin || !newPin || !confirmPin}
          className="px-4 py-2 rounded-lg bg-[var(--inner-card)] border border-[var(--card-border)]
                     text-[var(--text)] text-sm hover:bg-[var(--inner-card-hover)]
                     transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? '...' : 'Changer le PIN'}
        </button>
        {msg && (
          <span className={`text-xs ${msg.type === 'ok' ? 'text-[#00ab63]' : 'text-[#ff5a5a]'}`}>
            {msg.text}
          </span>
        )}
      </div>
    </form>
  )
}
