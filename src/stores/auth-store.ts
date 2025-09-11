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

        // Clear JWT token from localStorage and cookies
        if (typeof window !== 'undefined') {
          localStorage.removeItem('workout-app-jwt-token')
          // Clear the cookie by setting it to empty with past expiration
          document.cookie = 'workout-app-jwt-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          // Redirect to home page
          window.location.href = '/'
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
