import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, ProductUser } from '@/types/auth'

const AUTH_STORAGE_KEY = 'workout-app-auth'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      productUser: null,
      isAuthenticated: false,
      isLoading: false,

      setProductUser: (productUser: ProductUser | null) => {
        set({
          productUser,
          isAuthenticated: !!productUser,
          isLoading: false,
        })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      logout: () => {
        set({
          productUser: null,
          isAuthenticated: false,
          isLoading: false,
        })

        // Clear JWT token from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('workout-app-jwt-token')
        }
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        productUser: state.productUser,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
