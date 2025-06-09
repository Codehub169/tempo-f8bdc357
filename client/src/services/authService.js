import api from './api';
import { jwtDecode } from 'jwt-decode'; // Corrected import

const API_URL = '/auth';

const login = async (email, password) => {
  try {
    const response = await api.post(`${API_URL}/login`, { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Decode token to get user info if needed, or rely on a /me endpoint
      // For now, let's assume the login response includes basic user info
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Login failed');
  }
};

const register = async (email, password) => {
  try {
    const response = await api.post(`${API_URL}/register`, { email, password });
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Registration failed');
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Optionally, could also call a backend logout endpoint if it exists
  // e.g., api.post(`${API_URL}/logout`);
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      logout(); // Clear corrupted data
      return null;
    }
  }
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      // Check token expiry
      if (decoded.exp * 1000 < Date.now()) {
        console.log("Token expired");
        logout();
        return null;
      }
      // Potentially fetch user details from a /me endpoint if not in localStorage
      // For now, if user is not in localStorage but token is, this means partial state
      // It's better to rely on a /me endpoint or ensure user is always stored with token.
      // For this implementation, we assume if user is not in localStorage, they need to re-login or /me is called elsewhere.
      return decoded; // Contains id, email, iat, exp
    } catch (error) {
      console.error('Invalid token:', error);
      logout(); // Clear invalid token
      return null;
    }
  }
  return null;
};

const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 > Date.now();
  } catch (error) {
    return false;
  }
};

// Optional: if you have a /me endpoint to verify token and get fresh user data
const fetchCurrentUser = async () => {
  try {
    const response = await api.get(`${API_URL}/me`);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    }
  } catch (error) {
    console.warn('Failed to fetch current user from /me, possibly old token:', error);
    logout(); // Token might be invalid or expired
    return null;
  }
};


const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  isAuthenticated,
  fetchCurrentUser
};

export default authService;
