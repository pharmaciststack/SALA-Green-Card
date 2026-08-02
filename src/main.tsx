import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { onAuthChange, listenUserProfile, handleRedirectResult } from './services/authService'
import { primeSettings } from './services/settingsService'
import { applyUserGroup } from './services/groupService'
import { useAuthStore } from './store/authStore'

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setFirebaseUser, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 8000)
    let unsubProfile: (() => void) | null = null

    // Must await redirect result BEFORE subscribing to auth state,
    // so the session cookie is written before onAuthStateChanged fires.
    handleRedirectResult()
      .catch(() => {})
      .finally(() => {
        const unsubscribe = onAuthChange(async (user) => {
          clearTimeout(timeout)
          setFirebaseUser(user)

          // Drop any previous user's profile subscription.
          if (unsubProfile) { unsubProfile(); unsubProfile = null }

          if (user) {
            // Load org-wide settings (holidays + defaults) once.
            await primeSettings()
            // Subscribe live to this user's profile so role/group changes in
            // Firestore reflect immediately without a page refresh.
            unsubProfile = listenUserProfile(user.uid, async (profile) => {
              await applyUserGroup(profile?.groupId)
              setProfile(profile)
              setLoading(false)
            })
          } else {
            setProfile(null)
            setLoading(false)
          }
        })
        ;(window as unknown as Record<string, unknown>).__authUnsub = unsubscribe
      })

    return () => {
      clearTimeout(timeout)
      if (unsubProfile) unsubProfile()
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
