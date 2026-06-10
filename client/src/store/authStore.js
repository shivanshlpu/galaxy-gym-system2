import { create } from 'zustand';
import axios from '../lib/axios';

const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('gymosToken'),
  user: null,
  isAuthenticated: !!localStorage.getItem('gymosToken'),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.post('/auth/login', credentials);
      const { token, user } = data.data;
      localStorage.setItem('gymosToken', token);
      set({ token, user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('gymosToken');
    set({ token: null, user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const { data } = await axios.get('/auth/me');
      set({ user: data.data, isAuthenticated: true });
    } catch {
      get().logout();
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
