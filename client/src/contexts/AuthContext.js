import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService'; // Updated import

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Initialize with null, validateAndSetUser will populate
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // For initial auth check and subsequent auth actions
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const validateAndSetUser = useCallback(async () => {
    setIsLoading(true);
    const currentToken = localStorage.getItem('token');
    if (currentToken && authService.isAuthenticated()) { // isAuthenticated checks token validity & expiry
      try {
        // Fetch fresh user data to ensure it's up-to-date and token is truly valid on backend
        const freshUser = await authService.fetchCurrentUser(); 
        if (freshUser) {
          setUser(freshUser);
          setToken(currentToken);
        } else { // Token might be valid locally but not on backend / user deleted etc.
          authService.logout(); 
          setUser(null);
          setToken(null);
        }
      } catch (e) {
        console.error('Token validation/user fetch failed:', e);
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
      setUser(data.user); // authService.login populates localStorage
      setToken(data.token);
      setIsLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      setUser(null);
      setToken(null);
      setIsLoading(false);
      throw err; // Re-throw for component-level handling if needed
    }
  };

  const register = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(email, password);
      setIsLoading(false);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      throw err; // Re-throw for component-level handling
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
    isAuthenticated: !!user && !!token && authService.isAuthenticated(), 
    isLoading,
    error,
    login,
    register,
    logout,
    clearError: () => setError(null),
    refreshAuth: validateAndSetUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
