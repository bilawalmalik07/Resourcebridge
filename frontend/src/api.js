import axios from 'axios';

// FIX: Added fallback to localhost so the app doesn't silently break
// when VITE_API_URL is not set in a .env file during local development
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// Automatically inject JWT token into every request if present in localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;