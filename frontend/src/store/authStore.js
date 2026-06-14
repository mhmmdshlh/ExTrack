import { create } from 'zustand';
import { login as loginApi, register as registerApi } from '../services/authService.js';

function safeParseUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const useAuthStore = create((set) => ({
  user: safeParseUser(),
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await loginApi(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Login failed',
        loading: false,
      });
      return false;
    }
  },

  register: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await registerApi(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Registration failed',
        loading: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
