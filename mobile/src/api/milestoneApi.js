import apiClient from './apiClient';

export const milestoneApi = {
  getMilestones: () => apiClient.get('/api/milestones'),
  createMilestone: (data) => apiClient.post('/api/milestones', data),
  toggleMilestone: (id) => apiClient.put(`/api/milestones/${id}/toggle`),
  deleteMilestone: (id) => apiClient.delete(`/api/milestones/${id}`),
};
