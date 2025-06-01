import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

const useAuthStore = create(
  persist(
    (set, get) => ({      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,      // Actions
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            loading: false,
            error: null
          });
          return response;
        } catch (error) {
          set({
            error: error.message || 'Login failed',
            loading: false
          });
          throw error;
        }
      },      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const response = await authService.register(userData);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            loading: false,
            error: null
          });
          return response;
        } catch (error) {
          set({
            error: error.message || 'Registration failed',
            loading: false
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },      updateProfile: async (userData) => {
        set({ loading: true, error: null });
        try {
          const response = await authService.updateProfile(userData);
          set({
            user: response.user,
            loading: false,
            error: null
          });
          return response;
        } catch (error) {
          set({
            error: error.message || 'Profile update failed',
            loading: false
          });
          throw error;
        }
      },

      updateUser: async (userData) => {
        set({ loading: true, error: null });
        try {
          const response = await authService.updateProfile(userData);
          set({
            user: response.user || response,
            loading: false,
            error: null
          });
          return response;
        } catch (error) {
          set({
            error: error.message || 'User update failed',
            loading: false
          });
          throw error;
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        set({ loading: true, error: null });
        try {
          await authService.changePassword(currentPassword, newPassword);
          set({ loading: false, error: null });
        } catch (error) {
          set({
            error: error.message || 'Password change failed',
            loading: false
          });
          throw error;
        }
      },

      getCurrentUser: async () => {
        const { token } = get();
        if (!token) return;

        set({ loading: true });
        try {
          const response = await authService.getCurrentUser();
          set({
            user: response.user,
            isAuthenticated: true,
            loading: false
          });
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false
          });
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
