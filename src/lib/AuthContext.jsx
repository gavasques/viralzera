import React, { createContext, useState, useContext, useEffect } from 'react';
import { neon } from '@/api/neonClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoadingAuth(false);
        return;
      }

      const currentUser = await neon.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password) => {
    const response = await neon.auth.login(email, password);
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const register = async (email, password, name) => {
    const response = await neon.auth.register(email, password, name);
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const logout = () => {
    neon.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      login,
      register,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
