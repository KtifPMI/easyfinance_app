/**
 * Клиент для backend-proxy (см. /server), который безопасно подписывает
 * запросы к EasyFinance API (app_id/secret_key хранятся только на proxy,
 * никогда в мобильном приложении).
 *
 * ВАЖНО: при тестировании через Expo Go на физическом телефоне
 * `localhost` указывает на сам телефон, а не на ваш компьютер.
 * Замените PROXY_URL на адрес компьютера в локальной сети, например
 * "http://192.168.1.50:4000", либо задайте переменную окружения
 * EXPO_PUBLIC_PROXY_URL перед запуском `npx expo start`.
 */
export const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL || 'http://localhost:4000';

export const delay = (ms = 300) => new Promise((res) => setTimeout(res, ms));

export class ApiError extends Error {
  status?: number;
  details?: unknown;
  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let authToken: string | null = null;
let authUid: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function setUid(uid: string | null) {
  authUid = uid;
}

export function getUid() {
  return authUid;
}

export function isDemoMode() {
  return authToken === 'demo-token';
}

/**
 * Вызов метода EasyFinance API через backend-proxy.
 * `method` — имя метода API, например "accounts.get", "operations.post".
 */
export async function efCall<T = any>(
  method: string,
  options: {
    httpMethod?: 'GET' | 'POST';
    params?: Record<string, string | number | undefined>;
    body?: unknown;
    accessToken?: string;
    uid?: string;
  } = {}
): Promise<T> {
  const access_token = options.accessToken ?? authToken;
  const uid = options.uid ?? authUid;

  if (!access_token) {
    throw new ApiError('Нет access_token: пользователь не авторизован', 401);
  }

  const res = await fetch(`${PROXY_URL}/api/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method,
      httpMethod: options.httpMethod || 'GET',
      access_token,
      uid: uid || undefined,
      params: options.params || {},
      body: options.body,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(
      data?.message || data?.error || `Ошибка запроса ${method}`,
      res.status,
      data?.details
    );
  }

  return data?.response?.response_data as T;
}
