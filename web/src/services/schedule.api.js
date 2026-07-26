import apiClient from './apiClient';

export const getSchedule = () => apiClient.get('/api/schedules');
export const updateSchedule = (data) => apiClient.put('/api/schedules', data);
export const generateScheduleTemplate = () => apiClient.post('/api/schedules/generate');
export const syncScheduleTasks = () => apiClient.post('/api/schedules/sync');
