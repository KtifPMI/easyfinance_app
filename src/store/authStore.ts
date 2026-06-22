import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { authApi } from '../services/api';
import { setAuthToken, setUid } from '../services/api/client';
import { mockUser } from '../services/api/mockData';
import { User } from '../types';

const TOKEN_KEY = 'easyfinance_token';
const UID_KEY = 'easyfinance_uid';
const USER_KEY = 'easyfinance_user';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  init: () => Promise<void>;
  /** Возвращает URL, который нужно открыть в браузере (expo-web-browser). */
  startLogin: () => Promise<string>;
  /** Завершает вход после получения `code` из редиректа браузера. */
  completeLogin: (code: string) => Promise<void>;
  /** Вход в демо-режим с тестовыми данными (без API). */
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitializing: true,
  error: null,

  init: async () => {
    try {
      const [token, uid, userJson] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(UID_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      if (token && uid && userJson) {
        setAuthToken(token);
        setUid(uid);
        set({ token, user: JSON.parse(userJson) });
      }
    } finally {
      set({ isInitializing: false });
    }
  },

  startLogin: async () => {
    set({ error: null });
    return authApi.getAuthorizeUrl();
  },

  completeLogin: async (code: string) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = await authApi.exchangeCode(code);
      setAuthToken(accessToken);

      const { uid, ...user } = await authApi.getProfile(accessToken);
      setUid(uid);

      await AsyncStorage.setItem(TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(UID_KEY, uid);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      set({ user, token: accessToken, isLoading: false });
    } catch (e: any) {
      set({ error: e.message || 'Ошибка входа', isLoading: false });
      throw e;
    }
  },

  loginDemo: async () => {
    setAuthToken('demo-token');
    setUid('demo-uid');
    const user = { ...mockUser };
    await AsyncStorage.setItem(TOKEN_KEY, 'demo-token');
    await AsyncStorage.setItem(UID_KEY, 'demo-uid');
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, token: 'demo-token' });
  },

  logout: async () => {
    setAuthToken(null);
    setUid(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, UID_KEY, USER_KEY]);
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));
