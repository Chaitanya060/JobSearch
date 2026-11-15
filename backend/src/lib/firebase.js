// Real Firebase ID token verification (spec §6) — signature + claims, not decode-only.
// Uses Google's X.509 certs for the Secure Token service, cached per Cache-Control.
import { decodeProtectedHeader, importX509, jwtVerify } from 'jose'

const CERT_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'

let cache = { certs: null, expiresAt: 0 }

async function fetchGoogleCerts() {
  const now = Date.now()
  if (cache.certs && now < cache.expiresAt) return cache.certs
  const res = await fetch(CERT_URL)
  if (!res.ok) throw new Error('Could not fetch Firebase signing certificates')
  const certs = await res.json()
  // Respect max-age so we don't refetch on every request (spec §6.8).
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 3600)
  cache = { certs, expiresAt: now + maxAge * 1000 }
  return certs
}

export class TokenError extends Error {}

/**
 * Verify a Firebase ID token. Throws TokenError on any invalid condition.
 * @param token  the raw JWT (no "Bearer " prefix)
 * @param projectId  exact Firebase project id
 * @param deps.getCerts  override cert source (for tests); returns { kid: pemString }
 * @returns { uid, email, name, picture, claims }
 */
export async function verifyFirebaseToken(token, projectId, deps = {}) {
  if (!token || typeof token !== 'string') throw new TokenError('Missing token')
  if (!projectId) throw new TokenError('Server auth not configured')

  let header
  try {
    header = decodeProtectedHeader(token)
  } catch {
    throw new TokenError('Malformed token')
  }
  if (header.alg !== 'RS256') throw new TokenError('Unexpected token algorithm')

  const certs = await (deps.getCerts || fetchGoogleCerts)()
  const pem = certs?.[header.kid]
  if (!pem) throw new TokenError('Unknown signing key')

  let publicKey
  try {
    publicKey = await importX509(pem, 'RS256')
  } catch {
    throw new TokenError('Invalid signing certificate')
  }

  let payload
  try {
    ;({ payload } = await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    }))
  } catch {
    throw new TokenError('Token verification failed')
  }

  if (!payload.sub) throw new TokenError('Token missing subject')
  if (!payload.auth_time) throw new TokenError('Token missing auth_time')

  return {
    uid: payload.sub,
    email: payload.email || null,
    name: payload.name || null,
    picture: payload.picture || null,
    claims: payload,
  }
}
