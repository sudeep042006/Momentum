import apiClient from './apiClient';

export const authApi = {
  login: (email, password) => apiClient.post('/api/users/login', { email, password }),
  register: (name, email, password) => apiClient.post('/api/users/register', { name, email, password }),
  getMe: () => apiClient.get('/api/users/me'),
  getProfile: () => apiClient.get('/api/users/profile'),
  updateProfile: (data) => {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return apiClient.post('/api/users/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return apiClient.post('/api/users/profile', data);
  },
  forgotPassword: (email) => apiClient.post('/api/users/forgot-password', { email }),
  resetPassword: (newPassword) => apiClient.post('/api/users/reset-password', { newPassword }),
  searchUsers: (query) => apiClient.get(`/api/users/search?q=${encodeURIComponent(query)}`),
  getPublicProfile: (username) => apiClient.get(`/api/users/public/${username}`),
  followUser: (username) => apiClient.post(`/api/users/${username}/follow`),
  unfollowUser: (username) => apiClient.post(`/api/users/${username}/unfollow`),
};
