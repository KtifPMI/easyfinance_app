const SITE_BASE = 'https://easyfinance.ru'

export class ApiError extends Error {
  status?: number
  details?: unknown
  constructor(message: string, status?: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const url = `${SITE_BASE}${path}${path.includes('?') ? '&' : '?'}responseMode=json&_=${Date.now()}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json, text/html, */*' },
    credentials: 'include',
  })
  if (!res.ok) throw new ApiError(`HTTP ${res.status}`, res.status)
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new ApiError('Response is not JSON')
  }
}

export async function apiPost<T = any>(path: string, body: Record<string, string>): Promise<T> {
  const form = new URLSearchParams(body)
  const res = await fetch(`${SITE_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    credentials: 'include',
  })
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new ApiError('Response is not JSON')
  }
}

let _isLoggedIn = false
export function setLoggedIn(v: boolean) { _isLoggedIn = v }
export function isLoggedIn() { return _isLoggedIn }
