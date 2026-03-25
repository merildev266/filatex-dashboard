// Client-side WebAuthn helpers for biometric login
// Stores credential in localStorage; challenge is client-side only (no server)

const CRED_KEY = 'filatex_webauthn_cred'
const RP = { name: 'Filatex Dashboard', id: location.hostname }
const USER = { id: new Uint8Array(16), name: 'dg', displayName: 'Directeur General' }

function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}
function b64ToBuf(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}
function randomChallenge() {
  return crypto.getRandomValues(new Uint8Array(32))
}

export function isBiometricAvailable() {
  return !!window.PublicKeyCredential &&
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
}

export async function isBiometricSupported() {
  if (!isBiometricAvailable()) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch { return false }
}

export function hasBiometricCredential() {
  return !!localStorage.getItem(CRED_KEY)
}

export async function registerBiometric() {
  const challenge = randomChallenge()
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: RP,
      user: USER,
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
    }
  })
  // Store credential ID for future authentication
  localStorage.setItem(CRED_KEY, bufToB64(credential.rawId))
  return true
}

export async function authenticateBiometric() {
  const credId = localStorage.getItem(CRED_KEY)
  if (!credId) throw new Error('No credential stored')

  const challenge = randomChallenge()
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: RP.id,
      allowCredentials: [{
        id: b64ToBuf(credId),
        type: 'public-key',
        transports: ['internal'],
      }],
      userVerification: 'required',
      timeout: 60000,
    }
  })
  // If we get here, biometric was verified by the device
  return !!assertion
}

export function removeBiometricCredential() {
  localStorage.removeItem(CRED_KEY)
}
