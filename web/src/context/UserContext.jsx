import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/auth.api';

const UserContext = createContext();

export function UserProvider({ children }) {
  // Synchronously initialize user from localStorage so there's no delay or flicker
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(!user);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getCurrentUser();
        if (response?.data?.data) {
           setUser(response.data.data);
           localStorage.setItem('user', JSON.stringify(response.data.data));
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (localStorage.getItem('token')) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <UserContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
