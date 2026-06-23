import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { authApi } from '../services/api/auth'
import { setAuth, clearAuth, getAuth } from '../services/api/client'
import { User } from '../types'

const TOKEN_KEY = 'ef_access_token'
const UID_KEY = 'ef_uid'
const USER_KEY = 'ef_user'

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
      const [token, uid, userJson] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(UID_KEY),
        AsyncStorage.getItem(USER_KEY),
      ])
      if (token && uid) {
        setAuth(token, uid)
      }
      if (userJson) {
        set({ user: JSON.parse(userJson) })
      }
    } finally {
      set({ isInitializing: false })
    }
  },

  login: async (login: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const { uid } = await authApi.login(login, password)
      const { accessToken } = getAuth()
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, accessToken!),
        AsyncStorage.setItem(UID_KEY, uid),
      ])
      const user: User = { id: uid, name: login, email: login, currency: 'RUB', plan: 'free' }
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
      set({ user, isLoading: false })
    } catch (e: any) {
      set({ error: e.message || 'Ошибка входа', isLoading: false })
      throw e
    }
  },

  logout: async () => {
    await authApi.logout()
    await AsyncStorage.multiRemove([TOKEN_KEY, UID_KEY, USER_KEY])
    set({ user: null })
  },

  clearError: () => set({ error: null }),
}))
