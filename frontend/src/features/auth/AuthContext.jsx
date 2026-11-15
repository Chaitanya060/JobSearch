import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth, googleProvider, firebaseConfigured } from '../../services/firebase.js'
import { api, setTokenProvider, getAccount } from '../../services/api.js'

const AuthContext = createContext(null)

const DEV_USER = { uid: 'dev-user-uid', email: 'dev.user@example.com', displayName: 'Dev User' }

// Friendly messages for the common Firebase auth error codes.
const ERRORS = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/email-already-in-use': 'An account with that email already exists.',
  'auth/weak-password': 'Please choose a stronger password (at least 6 characters).',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
}
function friendly(err) {
  const msg = ERRORS[err?.code] || 'Something went wrong. Please try again.'
  return Object.assign(new Error(msg), { code: err?.code })
}

export function AuthProvider({ children }) {
  const mockMode = !firebaseConfigured

  // Mock mode: signed-in dev user, onboarding considered complete.
  const [user, setUser] = useState(mockMode ? DEV_USER : null)
  const [loading, setLoading] = useState(!mockMode)
  const [role, setRole] = useState('user')
  // account = { loading, completed, error } — onboarding/profile status from the Worker.
  const [account, setAccount] = useState(
    mockMode ? { loading: false, completed: true, error: null } : { loading: false, completed: null, error: null },
  )

  const loadAccount = useCallback(async () => {
    setAccount({ loading: true, completed: null, error: null })
    try {
      const data = await getAccount()
      setAccount({ loading: false, completed: !!data?.onboardingCompleted, error: null })
    } catch (err) {
      setAccount({ loading: false, completed: null, error: err?.message || 'Could not load your account' })
    }
  }, [])

  // Real Firebase: subscribe to auth state, wire the token provider, load account.
  useEffect(() => {
    if (mockMode) return
    setTokenProvider(() => auth.currentUser?.getIdToken() ?? null)
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setUser(
        fbUser
          ? { uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName, photoURL: fbUser.photoURL }
          : null,
      )
      setLoading(false)
      if (fbUser) loadAccount()
      else setAccount({ loading: false, completed: null, error: null })
    })
    return unsub
  }, [mockMode, loadAccount])

  // ---- auth methods (names kept stable for existing pages) ----
  const signIn = useCallback(
    async (email, password) => {
      if (mockMode) return setUser(DEV_USER), DEV_USER
      try {
        return (await signInWithEmailAndPassword(auth, email, password)).user
      } catch (err) {
        throw friendly(err)
      }
    },
    [mockMode],
  )

  const register = useCallback(
    async (form) => {
      if (mockMode) return setUser(DEV_USER), DEV_USER
      try {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
        if (form.fullName) await updateProfile(cred.user, { displayName: form.fullName })
        return cred.user
      } catch (err) {
        throw friendly(err)
      }
    },
    [mockMode],
  )

  const signInWithGoogle = useCallback(async () => {
    if (mockMode) return setUser(DEV_USER), DEV_USER
    try {
      return (await signInWithPopup(auth, googleProvider)).user
    } catch (err) {
      throw friendly(err)
    }
  }, [mockMode])

  const signOut = useCallback(async () => {
    if (mockMode) return setUser(null)
    await fbSignOut(auth)
  }, [mockMode])

  const resetPassword = useCallback(
    async (email) => {
      if (mockMode) return
      try {
        await sendPasswordResetEmail(auth, email)
      } catch (err) {
        // Keep the UI's neutral success; only surface network-type errors.
        if (err?.code === 'auth/network-request-failed') throw friendly(err)
      }
    },
    [mockMode],
  )

  const getIdToken = useCallback(
    (force = false) => (mockMode ? Promise.resolve(null) : auth.currentUser?.getIdToken(force) ?? Promise.resolve(null)),
    [mockMode],
  )

  const value = {
    user,
    firebaseUid: user?.uid ?? null,
    loading,
    isAuthenticated: !!user,
    mockMode,
    account,
    reloadAccount: loadAccount,
    role,
    isAdmin: role === 'admin',
    // methods
    signIn,
    signInWithEmail: signIn,
    register,
    signUpWithEmail: (email, password) => register({ email, password }),
    signInWithGoogle,
    signOut,
    resetPassword,
    sendPasswordReset: resetPassword,
    getIdToken,
    // dev-only admin preview (mock mode)
    __setRole: setRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
