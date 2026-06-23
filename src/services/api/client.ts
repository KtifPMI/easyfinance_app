const API_BASE = 'https://api.easyfinance.ru/v2/'
const APP_ID = '7e65ca8e482d55ad7ad31476d7b33dc64a7d0f60'
const APP_SECRET = 'e3df02801d7e7073a0d042f6a040aa043b9fc003'

let _accessToken: string | null = null
let _uid: string | null = null

export function setAuth(token: string, uid: string) {
  _accessToken = token
  _uid = uid
}

export function getAuth() {
  return { accessToken: _accessToken, uid: _uid }
}

export function clearAuth() {
  _accessToken = null
  _uid = null
}

export function isLoggedIn() {
  return !!_accessToken
}

export function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

// ---- MD5 implementation (pure JS) ----
function md5(str: string): string {
  const hex = '0123456789abcdef'
  function toHex(n: number) {
    let h = ''
    for (let i = 0; i < 4; i++) h += hex[(n >> (i * 8 + 4)) & 0xf] + hex[(n >> (i * 8)) & 0xf]
    return h
  }
  function encode(s: string): number[] {
    const out: number[] = []
    for (let i = 0; i < s.length; i++) {
      let c = s.charCodeAt(i)
      if (c < 0x80) { out.push(c) }
      else if (c < 0x800) { out.push(0xc0 | (c >> 6)); out.push(0x80 | (c & 0x3f)) }
      else if (c < 0xd800 || c >= 0xe000) { out.push(0xe0 | (c >> 12)); out.push(0x80 | ((c >> 6) & 0x3f)); out.push(0x80 | (c & 0x3f)) }
      else { i++; c = 0x10000 + (((c & 0x3ff) << 10) | (s.charCodeAt(i) & 0x3ff)); out.push(0xf0 | (c >> 18)); out.push(0x80 | ((c >> 12) & 0x3f)); out.push(0x80 | ((c >> 6) & 0x3f)); out.push(0x80 | (c & 0x3f)) }
    }
    return out
  }
  const bytes = encode(str)
  const words: number[] = []
  const len = bytes.length
  for (let i = 0; i < len; i++) words[i >> 2] = (words[i >> 2] || 0) + (bytes[i] << ((i % 4) * 8))
  words[len >> 2] = (words[len >> 2] || 0) + (0x80 << ((len % 4) * 8))
  words[((len + 8) >> 6) * 16 + 14] = len * 8

  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476
  const S = [[7, 12, 17, 22], [5, 9, 14, 20], [4, 11, 16, 23], [6, 10, 15, 21]]
  const K: number[] = []
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000)

  for (let i = 0; i < words.length; i += 16) {
    const X = words.slice(i, i + 16)
    let A = a, B = b, C = c, D = d
    for (let j = 0; j < 64; j++) {
      let f: number, g: number
      if (j < 16) { f = (B & C) | (~B & D); g = j }
      else if (j < 32) { f = (B & D) | (C & ~D); g = (5 * j + 1) % 16 }
      else if (j < 48) { f = B ^ C ^ D; g = (3 * j + 5) % 16 }
      else { f = C ^ (B | ~D); g = (7 * j) % 16 }
      f = (f + A + K[j] + (X[g] || 0)) >>> 0
      A = D; D = C; C = B; B = (B + ((f << S[Math.floor(j / 16)][j % 4]) | (f >>> (32 - S[Math.floor(j / 16)][j % 4])))) >>> 0
    }
    a = (a + A) >>> 0; b = (b + B) >>> 0; c = (c + C) >>> 0; d = (d + D) >>> 0
  }
  return toHex(a) + toHex(b) + toHex(c) + toHex(d)
}

function computeSignature(params: Record<string, string>, uid: string): string {
  const keys = Object.keys(params).sort()
  const paramStr = keys.map(k => `${k}=${params[k]}`).join('&')
  return md5(APP_SECRET + uid + paramStr)
}

export class ApiError extends Error {
  status?: number
  details?: unknown
  constructor(message: string, status?: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

function unwrapData(data: any): any {
  const rd = data?.response?.response_data
  if (!rd) return null
  if (rd.errors?.length) {
    const err = rd.errors.find((e: any) => e.code !== '' && e.code !== undefined)
    if (err) throw new ApiError(err.text || 'API Error', 400)
  }
  const { errors, ...rest } = rd
  if (Object.keys(rest).length) return rest
  return { success: true }
}

export async function apiCall<T = any>(method: string, requestData: Record<string, any> = {}): Promise<T> {
  const rdStr = JSON.stringify(requestData)
  const params: Record<string, string> = { method, app_id: APP_ID, request_data: rdStr }
  if (_uid) params.uid = _uid
  params.sig = computeSignature(params, _uid || '')

  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')

  const headers: Record<string, string> = {}
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`

  try {
    const res = await fetch(`${API_BASE}?${qs}`, { method: 'GET', headers })
    const data = await res.json()
    console.log('API response:', JSON.stringify(data).slice(0, 500))
    const result = unwrapData(data)
    return result as T
  } catch (err: any) {
    if (err instanceof ApiError) throw err
    throw new ApiError(err.message || 'Network error')
  }
}
