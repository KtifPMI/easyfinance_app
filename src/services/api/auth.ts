import { User } from '../../types';
import { ApiError, PROXY_URL, efCall } from './client';

export interface OAuthSession {
  accessToken: string;
  expiresIn: string | null;
  uid: string;
  user: User;
}

interface EfUser {
  id: string;
  name: string;
  login: string;
  mail: string;
  currency_default?: string;
  account_type?: string;
}

function mapUser(u: EfUser): User {
  return {
    id: u.id,
    name: u.name || u.login,
    email: u.mail,
    currency: u.currency_default || '1',
    plan: 'free',
  };
}

/**
 * Реальная авторизация EasyFinance построена на OAuth2 + редиректе на
 * страницу подтверждения доступа (https://easyfinance.ru/my/access-permission).
 * Логин/пароль внутри приложения вводить нельзя — только через системный
 * браузер (expo-web-browser), без WebView.
 */
export const authApi = {
  /** Шаг 1: получить ссылку для входа через браузер. */
  async getAuthorizeUrl(): Promise<string> {
    const res = await fetch(`${PROXY_URL}/oauth/authorize-url`);
    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.message || 'Не удалось получить ссылку авторизации', res.status);
    }
    return data.url as string;
  },

  /** Шаг 5: обменять code, полученный после редиректа, на access_token. */
  async exchangeCode(code: string): Promise<{ accessToken: string; expiresIn: string | null }> {
    const res = await fetch(`${PROXY_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.message || 'Не удалось получить access_token', res.status, data?.details);
    }
    return { accessToken: data.access_token, expiresIn: data.expires_in ?? null };
  },

  /**
   * После получения access_token запрашиваем профиль пользователя
   * (users.get), чтобы узнать его id (uid). uid обязателен для подписи
   * (sig) всех последующих запросов.
   */
  async getProfile(accessToken: string): Promise<User & { uid: string }> {
    const data = await efCall<{ users: EfUser[] }>('users.get', { accessToken });
    const efUser = data.users[0];
    return { ...mapUser(efUser), uid: efUser.id };
  },
};
