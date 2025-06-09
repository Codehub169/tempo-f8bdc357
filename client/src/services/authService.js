import api from './api';
import { jwtDecode } from 'jwt-decode';

const API_URL = '/auth';

const login = async (email, password) => {
  try {
    const response = await api.post(`${API_URL}/login`, { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // The login response includes basic user info, which we store.
      // AuthContext will typically call fetchCurrentUser for more details or to verify.
      localStorage.setItem('user', JSON.stringify(response.data.user));
      sessionStorage.removeItem('hasSeenDashboard'); // Reset flag on new login for PrivateRoute logic
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
  sessionStorage.removeItem('hasSeenDashboard'); // Clear the flag on logout for PrivateRoute logic
  // Optionally, call a backend logout endpoint if it exists
  // e.g., api.post(`${API_URL}/logout`);
};

const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  try {
    const decodedToken = jwtDecode(token);
    // Check token expiry
    if (decodedToken.exp * 1000 < Date.now()) {
      console.log("Token expired");
      logout(); // Clear expired token and user data
      return null;
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        // If user data is in localStorage, parse and return it.
        // This is often a subset of full user details, potentially enriched by fetchCurrentUser.
        return JSON.parse(userStr);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        logout(); // Clear corrupted data
        return null;
      }
    }
    // If user string is not in localStorage, but token is valid,
    // return the decoded token. AuthContext might use fetchCurrentUser to get full details.
    return decodedToken; // Contains id, email, iat, exp

  } catch (error) {
    console.error('Invalid token:', error);
    logout(); // Clear invalid token and user data
    return null;
  }
};

const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 > Date.now();
  } catch (error) {
    console.error('Token check failed during isAuthenticated:', error);
    return false;
  }
};

const fetchCurrentUser = async () => {
  try {
    const response = await api.get(`${API_URL}/me`);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    }
    return null; // Should not happen if API is consistent, but good practice
  } catch (error) {
    console.warn('Failed to fetch current user from /me, possibly invalid/expired token:', error.response ? error.response.data : error.message);
    logout(); // Token might be invalid or expired, so log out
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
