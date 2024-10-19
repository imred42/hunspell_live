// config.js

/**
 * Get the base URL for API requests based on the current environment.
 * @returns {string} The base URL for API requests.
 */
export const getApiBaseUrl = () => {
    if (import.meta.env.PROD) {
      return import.meta.env.VITE_BASE_URL_PROD || 'https://your-production-api.com';
    }
    return import.meta.env.VITE_BASE_URL_DEV || 'http://localhost:8000';
  };
  
  /**
   * The base URL for API requests.
   */
  export const API_BASE_URL = getApiBaseUrl();
  
  /**
   * Make an API request with the correct base URL.
   * @param {string} endpoint - The API endpoint to request.
   * @param {RequestInit} options - Fetch options for the request.
   * @returns {Promise<Response>} The fetch response.
   */
  export const apiRequest = (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    return fetch(url, options);
  };