// Firebase initialization. Real auth activates only when the VITE_FIREBASE_*
// web config is present; otherwise the app runs on mock auth (see AuthContext).
// Firebase web config is browser-safe — but it is NOT authorization. Never put
// an Admin service-account key here.
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
}

export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.authDomain)

let auth = null
let googleProvider = null

if (firebaseConfigured) {
  const app = initializeApp(config)
  auth = getAuth(app)
  googleProvider = new GoogleAuthProvider()
  // Keep the session across reloads.
  setPersistence(auth, browserLocalPersistence).catch(() => {})
}

export { auth, googleProvider }
