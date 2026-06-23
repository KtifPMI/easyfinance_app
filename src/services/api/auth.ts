import { apiCall, setAuth, clearAuth } from './client'

interface EfUser {
  id: string
  name: string
  login: string
  mail: string
  currency_default?: string
}

export interface LoginResult {
  token: string
  uid: string
  users: EfUser[]
}

export const authApi = {
  async login(login: string, password: string): Promise<{ uid: string }> {
    const result = await apiCall<LoginResult>('users.get', { email: login, password })
    if (!result?.token) throw new Error('API ответ: ' + JSON.stringify(result).slice(0, 300))
    setAuth(result.token, result.uid)
    return { uid: result.uid }
  },

  async logout(): Promise<void> {
    clearAuth()
  },

  async checkAuth(): Promise<boolean> {
    try {
      await apiCall('users.get', {})
      return true
    } catch {
      clearAuth()
      return false
    }
  },
}
