import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    // Clear any previous legacy localStorage tokens to ensure session-only behavior
    try {
      localStorage.removeItem('lanova_token');
    } catch {}
    return sessionStorage.getItem('lanova_token');
  });
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on page refresh (only while browser session is open)
  useEffect(() => {
    async function verifySession() {
      const storedToken = sessionStorage.getItem('lanova_token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const data = await api.get('/api/auth/me');
        setUser(data.user);
        setToken(storedToken);
      } catch (error) {
        console.warn('[AuthContext] Session expired or invalid:', error.message);
        try {
          sessionStorage.removeItem('lanova_token');
          sessionStorage.removeItem('lanova_selected_user_id');
          sessionStorage.removeItem('lanova_mobile_chat_open');
          sessionStorage.removeItem('lanova_users_cache');
        } catch {}
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = async (username, password) => {
    const data = await api.post('/api/auth/login', { username, password });
    sessionStorage.setItem('lanova_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (username, password) => {
    const data = await api.post('/api/auth/register', { username, password });
    return data.user;
  };

  const logout = () => {
    try {
      sessionStorage.removeItem('lanova_token');
      sessionStorage.removeItem('lanova_selected_user_id');
      sessionStorage.removeItem('lanova_mobile_chat_open');
      sessionStorage.removeItem('lanova_users_cache');
      localStorage.removeItem('lanova_token');
    } catch {}
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
