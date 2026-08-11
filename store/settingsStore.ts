import { create } from 'zustand';
import { I18nManager } from 'react-native';
import i18n, { RTL_LANGUAGES } from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  theme: 'dark' | 'light' | 'system';
  language: string;
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  apiUrl: string;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setLanguage: (lang: string) => void;
  setBiometric: (val: boolean) => void;
  setNotifications: (val: boolean) => void;
  setApiUrl: (url: string) => void;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'dark',
  language: 'en',
  biometricEnabled: false,
  notificationsEnabled: true,
  apiUrl: 'http://10.233.19.214:5000',

  setTheme: (theme) => {
    AsyncStorage.setItem('theme', theme).catch(() => {});
    set({ theme });
  },

  setLanguage: (lang) => {
    AsyncStorage.setItem('language', lang).catch(() => {});
    i18n.changeLanguage(lang);
    const isRTL = RTL_LANGUAGES.includes(lang);
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      // App will reload on next launch to apply RTL
    }
    set({ language: lang });
  },

  setBiometric: (val) => {
    AsyncStorage.setItem('biometric', String(val)).catch(() => {});
    set({ biometricEnabled: val });
  },

  setNotifications: (val) => {
    AsyncStorage.setItem('notifications', String(val)).catch(() => {});
    set({ notificationsEnabled: val });
  },

  setApiUrl: (url) => {
    AsyncStorage.setItem('apiUrl', url).catch(() => {});
    set({ apiUrl: url });
  },

  loadSettings: async () => {
    try {
      const theme = (await AsyncStorage.getItem('theme')) as 'dark' | 'light' | 'system' | null;
      const lang = await AsyncStorage.getItem('language');
      const bio = await AsyncStorage.getItem('biometric');
      const notif = await AsyncStorage.getItem('notifications');
      const api = await AsyncStorage.getItem('apiUrl');

      if (lang) i18n.changeLanguage(lang);

      set({
        theme: theme ?? 'dark',
        language: lang ?? i18n.language ?? 'en',
        biometricEnabled: bio === 'true',
        notificationsEnabled: notif !== 'false',
        apiUrl: api ?? 'http://10.233.19.214:5000',
      });
    } catch (e) {}
  },
}));
