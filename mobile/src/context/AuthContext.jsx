import React, { createContext, useContext, useState, useEffect } from 'react';
import { cacheManager } from '../storage/cacheManager';
import { authApi } from '../api/authApi';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const cachedUser = await cacheManager.getUser();
        const cachedToken = await cacheManager.getToken();
        const cachedRefreshToken = await cacheManager.getRefreshToken();

        // If user data and at least one token exists, keep user logged in immediately
        if (cachedUser && (cachedToken || cachedRefreshToken)) {
          setUser(cachedUser);

          // Silently refresh profile in the background without blocking UI
          authApi
            .getMe()
            .then((res) => {
              if (res.data?.data) {
                const freshUser = res.data.data;
                setUser(freshUser);
                cacheManager.setUser(freshUser);
              }
            })
            .catch((err) => {
              // Only clear if server explicitly told us the refresh token is dead
              if (err.response?.status === 401 && !cachedRefreshToken) {
                cacheManager.clearAuth();
                setUser(null);
              }
            });
        }
      } catch (e) {
        console.error('Error during auth bootstrap:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const session = res.data?.data?.session;
    const userData = res.data?.data?.user;

    if (session?.access_token) {
      await cacheManager.setToken(session.access_token);
      if (session.refresh_token) {
        await cacheManager.setRefreshToken(session.refresh_token);
      }
      await cacheManager.setUser(userData);
      setUser(userData);
      return res.data;
    }
    throw new Error('Login failed: Token not returned');
  };

  const register = async (name, email, password) => {
    const res = await authApi.register(name, email, password);
    const session = res.data?.data?.session;
    const userData = res.data?.data?.user;

    if (session?.access_token) {
      await cacheManager.setToken(session.access_token);
      if (session.refresh_token) {
        await cacheManager.setRefreshToken(session.refresh_token);
      }
      await cacheManager.setUser(userData);
      setUser(userData);
    }
    return res.data;
  };

  const logout = async () => {
    await cacheManager.clearAuth();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.data?.data) {
        setUser(res.data.data);
        await cacheManager.setUser(res.data.data);
      }
    } catch (e) {
      console.warn('Failed to refresh user profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
