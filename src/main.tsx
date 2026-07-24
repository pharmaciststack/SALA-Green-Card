import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { onAuthChange, getUserProfile, handleRedirectResult } from './services/authService'
import { primeSettings, listenSettings } from './services/settingsService'
import { useAuthStore } from './store/authStore'

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setFirebaseUser, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 8000)
    // System-settings reads require auth, so (re)start the listener per signed-in user.
    let unsubSettings: (() => void) | null = null

    // Must await redirect result BEFORE subscribing to auth state,
    // so the session cookie is written before onAuthStateChanged fires.
    handleRedirectResult()
      .catch(() => {})
      .finally(() => {
        const unsubscribe = onAuthChange(async (user) => {
          clearTimeout(timeout)
          setFirebaseUser(user)
          if (user) {
            // Warm the settings cache and keep it live while signed in.
            await primeSettings()
            if (!unsubSettings) unsubSettings = listenSettings(() => {})
            const profile = await getUserProfile(user.uid)
            setProfile(profile)
          } else {
            if (unsubSettings) { unsubSettings(); unsubSettings = null }
            setProfile(null)
          }
          setLoading(false)
        })
        ;(window as unknown as Record<string, unknown>).__authUnsub = unsubscribe
      })

    return () => {
      clearTimeout(timeout)
      if (unsubSettings) unsubSettings()
      const unsub = (window as unknown as Record<string, unknown>).__authUnsub
      if (typeof unsub === 'function') unsub()
    }
  }, [])

  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
)
