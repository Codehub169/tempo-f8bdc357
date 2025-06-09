import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true); // For initial auth check and subsequent auth actions
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const validateAndSetUser = useCallback(async () => {
    setIsLoading(true);
    const currentToken = localStorage.getItem('token');
    if (currentToken && authService.isAuthenticated()) {
      try {
        // Optionally, verify token with backend if not done by isAuthenticated or if you want fresh user data
        // const freshUser = await authService.fetchCurrentUser(); 
        // setUser(freshUser);
        setUser(authService.getCurrentUser()); // Assumes getCurrentUser decodes or retrieves valid user
        setToken(currentToken);
      } catch (e) {
        console.error('Token validation failed:', e);
        authService.logout(); // Clear invalid token/user
        setUser(null);
        setToken(null);
      }
    } else {
      authService.logout(); // Ensure clean state if no token or not authenticated
      setUser(null);
      setToken(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    validateAndSetUser();

    const handleStorageChange = (event) => {
      if (event.key === 'token' || event.key === 'user') {
        // Re-validate and set user when localStorage changes in another tab
        validateAndSetUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [validateAndSetUser]);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      setUser(data.user); // Assuming authService.login now also populates localStorage
      setToken(data.token);
      setIsLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      setUser(null);
      setToken(null);
      setIsLoading(false);
      throw err;
    }
  };

  const register = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(email, password);
      // Typically, after registration, the user still needs to log in.
      // No automatic login here to align with common practices.
      setIsLoading(false);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    setError(null);
    navigate('/login', { replace: true });
  };

  const value = {
    user,
    token,
    // isAuthenticated directly based on user and token state, further checks in authService
    isAuthenticated: !!user && !!token && authService.isAuthenticated(), 
    isLoading,
    error,
    login,
    register,
    logout,
    clearError: () => setError(null),
    refreshAuth: validateAndSetUser // Expose a way to refresh auth state if needed
  };

  // Render children only after initial loading is complete to avoid flashes of content
  // Or, you could return a global loading spinner here if isLoading is true.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};