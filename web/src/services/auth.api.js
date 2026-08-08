import apiClient from './apiClient';

export const login = (email, password) => apiClient.post('/api/users/login', { email, password });
export const register = (userData) => apiClient.post('/api/users/register', userData);
export const getCurrentUser = () => apiClient.get('/api/users/me');
export const requestPasswordReset = (email) => apiClient.post('/api/users/forgot-password', { email });
export const resetPassword = (newPassword) => apiClient.post('/api/users/reset-password', { newPassword });
