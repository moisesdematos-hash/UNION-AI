import { create } from 'zustand';
import { AUTH_TOKEN_KEY } from '../services/storageService.js';
import { useCanvasStore } from './canvasStore.js';

export interface UserCreditsSummary {
  balance: number;
  totalConsumed: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  avatarUrl?: string;
  authProvider: 'email' | 'google';
  createdAt: number;
  credits?: UserCreditsSummary;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;

  // Modal UI State
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  isAdminDashboardOpen: boolean;

  // Actions
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  openAdminDashboard: () => void;
  closeAdminDashboard: () => void;
  setError: (err: string | null) => void;

  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (data: { email: string; name: string; avatarUrl?: string; credential?: string; googleId?: string }) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUserCredits: (credits: UserCreditsSummary) => void;
}

const LOCAL_STORAGE_USER_KEY = 'union_auth_user';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        return raw ? JSON.parse(raw) : null;
      }
    } catch {
      return null;
    }
    return null;
  })(),
  token: typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null,
  isAuthenticated: Boolean(typeof window !== 'undefined' && localStorage.getItem(AUTH_TOKEN_KEY)),
  isAdmin: (() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed?.role === 'ADMIN';
      }
    } catch {
      return false;
    }
    return false;
  })(),
  isLoading: false,
  error: null,

  isAuthModalOpen: false,
  authModalTab: 'login',
  isAdminDashboardOpen: false,

  openAuthModal: (tab = 'login') => {
    set({ isAuthModalOpen: true, authModalTab: tab, error: null });
  },

  closeAuthModal: () => {
    set({ isAuthModalOpen: false, error: null });
  },

  openAdminDashboard: () => {
    set({ isAdminDashboardOpen: true });
  },

  closeAdminDashboard: () => {
    set({ isAdminDashboardOpen: false });
  },

  setError: (error) => set({ error }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Falha ao autenticar');
      }

      const { user, token } = json.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
      }

      set({
        user,
        token,
        isAuthenticated: true,
        isAdmin: user.role === 'ADMIN',
        isLoading: false,
        isAuthModalOpen: false,
        error: null
      });

      // Synchronize credits
      useCanvasStore.getState().fetchUserCredits();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao realizar login';
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Falha ao criar conta');
      }

      const { user, token } = json.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
      }

      set({
        user,
        token,
        isAuthenticated: true,
        isAdmin: user.role === 'ADMIN',
        isLoading: false,
        isAuthModalOpen: false,
        error: null
      });

      useCanvasStore.getState().fetchUserCredits();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta';
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  loginWithGoogle: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Falha ao autenticar com o Google');
      }

      const { user, token } = json.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
      }

      set({
        user,
        token,
        isAuthenticated: true,
        isAdmin: user.role === 'ADMIN',
        isLoading: false,
        isAuthModalOpen: false,
        error: null
      });

      useCanvasStore.getState().fetchUserCredits();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao autenticar com o Google';
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      isAdminDashboardOpen: false,
      error: null
    });
  },

  checkAuth: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
    if (!token) {
      set({ isAuthenticated: false, user: null, isAdmin: false });
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        // Token invalid or expired
        if (typeof window !== 'undefined') {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        }
        set({ isAuthenticated: false, user: null, token: null, isAdmin: false });
        return;
      }

      const json = await res.json();
      const user = json.data.user;

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
      }

      set({
        user,
        token,
        isAuthenticated: true,
        isAdmin: user.role === 'ADMIN'
      });
    } catch {
      // Offline fallback: keep existing local session if present
    }
  },

  updateUserCredits: (credits) => {
    const user = get().user;
    if (user) {
      const updated = { ...user, credits };
      set({ user: updated });
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updated));
      }
    }
  }
}));
