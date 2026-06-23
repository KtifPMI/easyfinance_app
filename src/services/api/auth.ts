import { apiPost, apiGet, setLoggedIn } from './client'

export const authApi = {
  async login(login: string, password: string): Promise<void> {
    await apiGet('/')
    await apiPost('/login/', {
      login,
      pass: password,
      autoLogin: '1',
      ssl: '1',
    })
    setLoggedIn(true)
  },

  async logout(): Promise<void> {
    try { await apiGet('/login/exit/') } catch {}
    setLoggedIn(false)
  },

  async checkAuth(): Promise<boolean> {
    try {
      const data = await apiGet<any>('/account/listAccounts/')
      const ok = !!(data?.accounts || data?.user_info)
      setLoggedIn(ok)
      return ok
    } catch {
      setLoggedIn(false)
      return false
    }
  },
}
