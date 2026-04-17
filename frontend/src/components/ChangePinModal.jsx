import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const PIN_RE = /^\d{4}$|^\d{6}$/

export default function ChangePinModal({ onClose }) {
  const { changePin } = useAuth()
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit =
    !submitting &&
    oldPin.length >= 4 &&
    PIN_RE.test(newPin) &&
    newPin === confirmPin &&
    newPin !== oldPin

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!PIN_RE.test(newPin)) {
      setError('Le nouveau PIN doit contenir 4 ou 6 chiffres')
      return
    }
    if (newPin !== confirmPin) {
      setError('Les deux nouveaux PIN ne correspondent pas')
      return
    }
    if (newPin === oldPin) {
      setError("Le nouveau PIN doit etre different de l'ancien")
      return
    }
    setSubmitting(true)
    const res = await changePin(oldPin, newPin, confirmPin)
    setSubmitting(false)
    if (res.success) {
      setSuccess(true)
      setTimeout(onClose, 1500)
    } else {
      setError(res.error || 'Erreur inconnue')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          background: 'var(--card)', border: '1px solid var(--card-border)',
          borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 400, width: '100%',
          color: 'var(--text)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Changer mon code PIN</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, marginBottom: 18 }}>
          4 ou 6 chiffres.
        </p>

        <label style={labelStyle}>
          PIN actuel
          <input
            type="password" inputMode="numeric" pattern="\d*" autoComplete="current-password"
            value={oldPin} onChange={e => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={inputStyle} autoFocus
          />
        </label>

        <label style={labelStyle}>
          Nouveau PIN
          <input
            type="password" inputMode="numeric" pattern="\d*" autoComplete="new-password"
            value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Confirmer le nouveau PIN
          <input
            type="password" inputMode="numeric" pattern="\d*" autoComplete="new-password"
            value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={inputStyle}
          />
        </label>

        {error && (
          <div style={{ color: '#E05C5C', fontSize: 13, marginTop: 10 }}>{error}</div>
        )}
        {success && (
          <div style={{ color: '#00ab63', fontSize: 13, marginTop: 10 }}>PIN modifie avec succes.</div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Annuler</button>
          <button type="submit" disabled={!canSubmit} style={{ ...btnPrimary, opacity: canSubmit ? 1 : 0.5 }}>
            {submitting ? '...' : 'Valider'}
          </button>
        </div>
      </form>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 13, color: 'var(--text-muted)',
  marginBottom: 12, fontWeight: 500,
}
const inputStyle = {
  display: 'block', width: '100%', marginTop: 6,
  padding: '10px 12px', borderRadius: 8,
  border: '1px solid var(--card-border)', background: 'var(--card-bg, rgba(0,0,0,0.2))',
  color: 'var(--text)', fontSize: 16, letterSpacing: '0.3em', textAlign: 'center',
  fontFamily: 'monospace', outline: 'none',
}
const btnBase = {
  padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
  cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.15s',
}
const btnPrimary = { ...btnBase, background: '#00ab63', color: '#fff', borderColor: '#00ab63' }
const btnSecondary = { ...btnBase, background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--card-border)' }
