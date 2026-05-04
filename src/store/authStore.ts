import { create } from 'zustand'
import { User } from 'firebase/auth'
import { UserProfile } from '../types'

interface AuthState {
  firebaseUser: User | null
  profile: UserProfile | null
  loading: boolean
  setFirebaseUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  profile: null,
  loading: true,
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}))
