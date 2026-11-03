import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken } from '../lib/api';
import type { User } from '../types';

interface Auth {
  user: User | null; ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}
const Ctx = createContext<Auth | null>(null);
export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error('AuthProvider missing'); return c; };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!getToken());
  useEffect(() => {
    if (!getToken()) return;
    api.get<User>('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setReady(true));
  }, []);
  const done = (r: { token: string; user: User }) => { setToken(r.token); setUser(r.user); };
  return (
    <Ctx.Provider value={{
      user, ready,
      login: async (email, password) => done(await api.post('/auth/login', { email, password })),
      register: async (name, email, password) => done(await api.post('/auth/register', { name, email, password })),
      logout: () => { setToken(null); setUser(null); },
    }}>{children}</Ctx.Provider>
  );
}
