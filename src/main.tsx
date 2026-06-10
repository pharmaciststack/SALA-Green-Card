import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { onAuthChange, getUserProfile, handleRedirectResult } from './services/authService'
import { useAuthStore } from './store/authStore'

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setFirebaseUser, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 8000)

    // Must await redirect result BEFORE subscribing to auth state,
    // so the session cookie is written before onAuthStateChanged fires.
    handleRedirectResult()
      .catch(() => {})
      .finally(() => {
        const unsubscribe = onAuthChange(async (user) => {
          clearTimeout(timeout)
          setFirebaseUser(user)
          if (user) {
            const profile = await getUserProfile(user.uid)
            setProfile(profile)
          } else {
            setProfile(null)
          }
          setLoading(false)
        })
        ;(window as unknown as Record<string, unknown>).__authUnsub = unsubscribe
      })

    return () => {
      clearTimeout(timeout)
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
