import axios from 'axios';

const API_URL = '/api'; // Since frontend is served by backend, relative path is fine

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to headers - REMOVED as login is removed
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers['Authorization'] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// Response interceptor (optional, for handling global errors like 401) - REMOVED as login is removed
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       // Handle unauthorized access, e.g., redirect to login
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       // Prevent redirect loops if already on login page or if it's a login attempt
//       if (window.location.pathname !== '/login' && error.config.url !== '/auth/login') {
//         window.location.href = '/login';
//       }
//     }
//     return Promise.reject(error);
//   }
// );

export default api;
