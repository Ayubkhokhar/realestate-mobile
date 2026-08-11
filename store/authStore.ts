import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'agent';
  agency_name?: string;
  status: 'active' | 'pending' | 'restricted';
  permission: 'full' | 'view_only' | 'restricted';
  avatar?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setAuth: (token, user) => {
    AsyncStorage.setItem('token', token).catch(() => {});
    AsyncStorage.setItem('user', JSON.stringify(user)).catch(() => {});
    set({ token, user, isAuthenticated: true });
  },

  clearAuth: () => {
    AsyncStorage.removeItem('token').catch(() => {});
    AsyncStorage.removeItem('user').catch(() => {});
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateUser: (partial) => {
    set((state) => {
      const updated = state.user ? { ...state.user, ...partial } : null;
      if (updated) {
        AsyncStorage.setItem('user', JSON.stringify(updated)).catch(() => {});
      }
      return { user: updated };
    });
  },

  loadAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userRaw = await AsyncStorage.getItem('user');
      if (token && userRaw) {
        set({ token, user: JSON.parse(userRaw), isAuthenticated: true });
      }
    } catch (e) {}
  }
}));
