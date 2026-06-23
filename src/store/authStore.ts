import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { authApi } from '../services/api/auth'
import { setLoggedIn } from '../services/api/client'
import { User } from '../types'

const USER_KEY = 'easyfinance_user'

interface AuthState {
  user: User | null
  isLoading: boolean
  isInitializing: boolean
  error: string | null
  init: () => Promise<void>
  login: (login: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitializing: true,
  error: null,

  init: async () => {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY)
      if (userJson) {
        const user = JSON.parse(userJson)
        setLoggedIn(true)
        set({ user })
      }
      const ok = await authApi.checkAuth()
      if (!ok) {
        await AsyncStorage.removeItem(USER_KEY)
        set({ user: null })
      }
    } finally {
      set({ isInitializing: false })
    }
  },

  login: async (login: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      await authApi.login(login, password)
      const user: User = { id: '1', name: login, email: '', currency: 'RUB', plan: 'free' }
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
      set({ user, isLoading: false })
    } catch (e: any) {
      set({ error: e.message || 'Ошибка входа', isLoading: false })
      throw e
    }
  },

  logout: async () => {
    await authApi.logout()
    await AsyncStorage.removeItem(USER_KEY)
    set({ user: null })
  },

  clearError: () => set({ error: null }),
}))
