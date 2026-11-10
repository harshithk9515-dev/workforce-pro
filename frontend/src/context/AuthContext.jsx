import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('wfp_token');
      const cachedUser = localStorage.getItem('wfp_user');
      if (!token) {
        setLoading(false);
        return;
      }
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          // ignore malformed cache
        }
      }
      try {
        const { user: freshUser } = await authApi.getMe();
        setUser(freshUser);
        localStorage.setItem('wfp_user', JSON.stringify(freshUser));
      } catch {
        localStorage.removeItem('wfp_token');
        localStorage.removeItem('wfp_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const persistSession = (sessionUser, token) => {
    localStorage.setItem('wfp_token', token);
    localStorage.setItem('wfp_user', JSON.stringify(sessionUser));
    setUser(sessionUser);
  };

  const login = useCallback(async (credentials) => {
    const { user: loggedInUser, token } = await authApi.login(credentials);
    persistSession(loggedInUser, token);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: newUser, token } = await authApi.register(payload);
    persistSession(newUser, token);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('wfp_token');
    localStorage.removeItem('wfp_user');
    setUser(null);
  }, []);

  const updateUserCache = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('wfp_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUserCache, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
