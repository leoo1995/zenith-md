import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GoogleUser {
  email?: string;
  name?: string;
  picture?: string;
}

interface GoogleStoreState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: GoogleUser | null;
  login: (accessToken: string, user?: GoogleUser) => void;
  logout: () => void;
}

export const useGoogleStore = create<GoogleStoreState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      user: null,
      login: (accessToken, user) => set({ isAuthenticated: true, accessToken, user }),
      logout: () => set({ isAuthenticated: false, accessToken: null, user: null }),
    }),
    {
      name: 'google-auth-storage',
    }
  )
);
