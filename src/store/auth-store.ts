import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '@devvai/devv-code-backend';

interface User {
  projectId: string;
  uid: string;
  name: string;
  email: string;
  createdTime: number;
  lastLoginTime: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, code: string) => Promise<User>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      sendOTP: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await auth.sendOTP(email);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to send verification code';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      verifyOTP: async (email: string, code: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await auth.verifyOTP(email, code);
          set({ 
            user: response.user, 
            isAuthenticated: true,
            error: null
          });
          return response.user;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Invalid verification code';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await auth.logout();
          set({ 
            user: null, 
            isAuthenticated: false,
            error: null
          });
        } catch (error) {
          console.error('Logout error:', error);
          // Force logout even if API fails
          set({ 
            user: null, 
            isAuthenticated: false,
            error: null
          });
        } finally {
          set({ isLoading: false });
        }
      },
      
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);