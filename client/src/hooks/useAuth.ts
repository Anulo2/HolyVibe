import { create } from "zustand"
import { auth } from "@/lib/auth-client"

type AuthState = {
  session: any | null
  loading: boolean
  checkSession: () => Promise<void>
  signIn: (sessionData: any) => void
  signOut: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  loading: true,
  checkSession: async () => {
    try {
      set({ loading: true })
      const sessionData = await auth.getSession()
      if (sessionData) {
        set({ session: sessionData })
      }
    } catch (error) {
      console.error("Error checking session:", error)
      set({ session: null })
    } finally {
      set({ loading: false })
    }
  },
  signIn: (sessionData: any) => {
    set({ session: sessionData })
  },
  signOut: async () => {
    await auth.signOut()
    set({ session: null })
  },
})) 