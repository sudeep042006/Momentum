import axios from 'axios';
import { API_URL } from '@env';

const apiClient = axios.create({
  baseURL: API_URL || 'http://10.0.2.2:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors if needed
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
