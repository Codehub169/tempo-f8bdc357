import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Default user for when login is removed
const defaultUser = {
  email: 'user@example.com',
  name: 'Admin User',
  id: 'default-user-id'
};

export const AuthProvider = ({ children }) => {
  // Simulate an authenticated state with a default user
  const [user, setUser] = useState(defaultUser);
  const [token, setToken] = useState('fake-super-token'); // Placeholder token, not actively used for auth
  const [isLoading, setIsLoading] = useState(false); // No complex auth check needed initially
  const [error, setError] = useState(null);

  // Simulate initial loading for a brief moment if desired, or remove if not needed
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setUser(defaultUser);
        setToken('fake-super-token');
        setIsLoading(false);
    }, 100); // Simulate a quick load
    return () => clearTimeout(timer);
  }, []);

  const login = async (email, password) => {
    // Mock login, not actually authenticating
    console.warn('Login function called, but authentication is disabled.');
    setIsLoading(true);
    setUser(defaultUser);
    setToken('fake-super-token');
    setIsLoading(false);
    setError(null);
    return { user: defaultUser, token: 'fake-super-token' };
  };

  const register = async (email, password) => {
    console.warn('Register function called, but authentication is disabled.');
    setError('Registration is disabled.');
    return { message: 'Registration is disabled.' };
  };

  const logout = () => {
    console.warn('Logout function called, but authentication is disabled.');
    // No actual logout action as user is always 'logged in' with default
    // If navigation is desired, it can be handled by the component calling logout
    setUser(defaultUser); // Reset to default user, though it's already the default
    setToken('fake-super-token');
    setError(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: true, // Always true as login is removed
    isLoading,
    error,
    login, // Kept for compatibility if called, but does nothing significant
    register, // Kept for compatibility
    logout, // Kept for compatibility, e.g. if Sidebar still calls it before its own removal of the button
    clearError: () => setError(null),
    refreshAuth: () => { // Does nothing as auth is static
        setIsLoading(true);
        setUser(defaultUser);
        setToken('fake-super-token');
        setIsLoading(false);
    }
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
