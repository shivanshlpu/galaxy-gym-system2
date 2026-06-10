import ax from 'axios';

const api = ax.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gymosToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle token refresh & errors
api.interceptors.response.use(
  (response) => {
    // Auto-refresh token if server sends a new one
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      localStorage.setItem('gymosToken', newToken);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gymosToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
