import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

function env(name) {
  const v = import.meta.env?.[name]
  return v === undefined || v === null || v === '' ? undefined : v
}

// Prefer env vars, but keep safe fallbacks so the app runs
// without additional setup in this repo.
const firebaseConfig = {
  apiKey: env('VITE_FIREBASE_API_KEY') ?? 'AIzaSyAUKbxteYzMd0FV3T6QcZprqVKPomA7Hs0',
  authDomain: env('VITE_FIREBASE_AUTH_DOMAIN') ?? 'shareocar-ae5c1.firebaseapp.com',
  projectId: env('VITE_FIREBASE_PROJECT_ID') ?? 'shareocar-ae5c1',
  storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET') ?? 'shareocar-ae5c1.firebasestorage.app',
  messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID') ?? '163324725891',
  appId: env('VITE_FIREBASE_APP_ID') ?? '1:163324725891:web:434f866a6a3bde863469b6',
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
