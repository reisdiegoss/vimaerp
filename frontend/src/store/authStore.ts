import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  nome: string;
  email: string;
  tenant_id: string;
  is_admin?: boolean;
  dashboard_layout?: any;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  updateLayout: (layout: any) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      setAuth: (token, user) => set({ token, user }),

      updateLayout: (layout) => set((state) => ({ 
        user: state.user ? { ...state.user, dashboard_layout: layout } : null 
      })),

      logout: () => {
        set({ token: null, user: null });
        sessionStorage.removeItem('active_filial_id'); // Limpa o ID da filial atual também
      },

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'vimaerp-auth', // localStorage por padrão
    }
  )
);
