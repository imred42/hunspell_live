// config.js

const API_URLS = {
  prod: 'https://your-production-api.com',
  dev: 'http://localhost:8000'
};

export const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_BASE_URL_PROD || API_URLS.prod)
  : (import.meta.env.VITE_BASE_URL_DEV || API_URLS.dev);

export const apiRequest = (endpoint, options = {}) => 
  fetch(`${API_BASE_URL}${endpoint}`, options);