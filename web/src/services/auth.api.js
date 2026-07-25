import apiClient from './apiClient';

export const login = (email, password) => apiClient.post('/api/users/login', { email, password });
export const register = (userData) => apiClient.post('/api/users/register', userData);
export const getCurrentUser = () => apiClient.get('/api/users/me');
