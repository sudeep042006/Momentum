import apiClient from './apiClient';

export const notificationApi = {
  getNotifications: () => apiClient.get('/api/notifications'),
  createNotification: (data) => apiClient.post('/api/notifications', data),
  markAsRead: (id) => apiClient.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/api/notifications/read-all'),
  deleteNotification: (id) => apiClient.delete(`/api/notifications/${id}`),
  clearAll: () => apiClient.delete('/api/notifications/clear-all'),
};
