import apiClient from './apiClient';

export const badgeApi = {
  getBadges: () => apiClient.get('/api/badges'),
};
