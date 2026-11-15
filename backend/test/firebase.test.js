import { describe, it, expect } from 'vitest'
import { SignJWT, generateKeyPair } from 'jose'
import { verifyFirebaseToken, TokenError } from '../src/lib/firebase.js'

const PROJECT = 'jobpilot-dev'

describe('verifyFirebaseToken — rejects invalid tokens', () => {
  it('rejects a missing token', async () => {
    await expect(verifyFirebaseToken('', PROJECT)).rejects.toBeInstanceOf(TokenError)
  })

  it('rejects a malformed token', async () => {
    await expect(verifyFirebaseToken('not-a-jwt', PROJECT)).rejects.toBeInstanceOf(TokenError)
  })

  it('rejects a non-RS256 (HS256) token before touching certs', async () => {
    const hs = await new SignJWT({ sub: 'u1' })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(new TextEncoder().encode('shared-secret-shared-secret-123456'))
    await expect(verifyFirebaseToken(hs, PROJECT)).rejects.toThrow(/algorithm/i)
  })

  it('rejects a token whose kid is not in the cert set', async () => {
    const { privateKey } = await generateKeyPair('RS256')
    const rs = await new SignJWT({ sub: 'u1' })
      .setProtectedHeader({ alg: 'RS256', kid: 'unknown-kid' })
      .setIssuer(`https://securetoken.google.com/${PROJECT}`)
      .setAudience(PROJECT)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey)
    // Inject an empty cert set — the kid cannot be resolved.
    await expect(verifyFirebaseToken(rs, PROJECT, { getCerts: async () => ({}) })).rejects.toThrow(
      /signing key/i,
    )
  })

  it('rejects when the server project id is missing', async () => {
    await expect(verifyFirebaseToken('a.b.c', '')).rejects.toBeInstanceOf(TokenError)
  })
})
