import apiClient from './apiClient';

export const scheduleApi = {
  getSchedule: () => apiClient.get('/api/schedules'),
  updateSchedule: (data) => apiClient.put('/api/schedules', data),
  generateTemplate: () => apiClient.post('/api/schedules/generate'),
  syncToday: (date) => apiClient.post('/api/schedules/sync', { date }),
};
