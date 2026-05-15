import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        // Guardar token en cookie con expiración (ej: 1 día)
        Cookies.set('auth_token', token, { expires: 1, path: '/' });
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        Cookies.remove('auth_token', { path: '/' });
        set({ user: null, token: null, isAuthenticated: false });
        // Redirigir usando window ya que estamos fuera de un componente React
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },
    }),
    {
      name: 'auth-storage', // Almacenará la data del usuario en localstorage para hidratación rápida
    }
  )
);
