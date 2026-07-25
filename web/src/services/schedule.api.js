import api from './apiClient';

export const getSchedules = () => {
  return api.get('/api/schedules');
};

export const createSchedule = (scheduleData) => {
  return api.post('/api/schedules', scheduleData);
};

export const updateSchedule = (id, scheduleData) => {
  return api.put(`/api/schedules/${id}`, scheduleData);
};

export const deleteSchedule = (id) => {
  return api.delete(`/api/schedules/${id}`);
};
