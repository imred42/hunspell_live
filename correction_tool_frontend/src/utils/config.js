const getApiBaseUrl = () => {
    if (import.meta.env.PROD) {
        return import.meta.env.VITE_BASE_URL_PROD || 'https://your-production-api.com';
    }
    return import.meta.env.VITE_BASE_URL_DEV || 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();