import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor to attach the Bearer token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('verix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const login = async (username, password) => {
  // FastAPI OAuth2 expects form-data for /token
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await apiClient.post('/token', formData);
  return response.data;
};

export const scanProject = async (path) => {
  const response = await apiClient.post('/scan', { path });
  return response.data;
};

export const getScanResults = async (scanId) => {
  const response = await apiClient.get(`/results/${scanId}`);
  return response.data;
};

export const getGlobalStats = async () => {
  const response = await apiClient.get('/stats');
  return response.data;
};

export const getReportMetadata = async (scanId) => {
  const response = await apiClient.get(`/report-metadata?scan_id=${scanId}`);
  return response.data;
};
