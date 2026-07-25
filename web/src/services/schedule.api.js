import api from './apiClient';

export const getSchedules = () => {
  return api.get('/schedules');
};

export const createSchedule = (scheduleData) => {
  return api.post('/schedules', scheduleData);
};

export const updateSchedule = (id, scheduleData) => {
  return api.put(`/schedules/${id}`, scheduleData);
};

export const deleteSchedule = (id) => {
  return api.delete(`/schedules/${id}`);
};
