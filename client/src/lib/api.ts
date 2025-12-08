// API configuration
// In production, this will use the environment variable
// In development, it defaults to localhost:8000

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

export const getApiUrl = () => API_URL;

export default API_URL;

