import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { firebaseUser, profile, loading } = useAuthStore()
  return {
    user: firebaseUser,
    profile,
    loading,
    isAuthenticated: !!firebaseUser,
    isProfileComplete: profile?.isProfileComplete ?? false,
    role: profile?.role ?? null,
  }
}
